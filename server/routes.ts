import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRepositoryLogSchema, gitHubUrlSchema } from "@shared/schema";
import { Octokit } from "@octokit/rest";
import { z } from "zod";

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || undefined,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Route to process repository
  app.post("/api/process-repository", async (req: Request, res: Response) => {
    try {
      // Validate URL
      const validatedUrl = gitHubUrlSchema.parse(req.body.url);
      
      // Extract owner and repo from URL
      const urlParts = new URL(validatedUrl).pathname.split('/').filter(Boolean);
      const owner = urlParts[0];
      const repo = urlParts[1];
      
      if (!owner || !repo) {
        return res.status(400).json({ message: "Invalid repository URL format" });
      }
      
      // Get repository content recursively
      const result = await getRepositoryContent(owner, repo);
      
      // Log the processing
      await storage.logRepositoryProcessing({
        repositoryUrl: validatedUrl,
        fileCount: result.fileCount,
        lineCount: result.lineCount,
        processedAt: new Date().toISOString(),
        success: true,
        errorMessage: null
      });
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error processing repository:', error);
      
      let errorMessage = "Failed to process repository";
      if (error instanceof z.ZodError) {
        errorMessage = error.errors[0]?.message || "Invalid input";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Log the error
      if (req.body.url) {
        try {
          await storage.logRepositoryProcessing({
            repositoryUrl: req.body.url,
            fileCount: 0,
            lineCount: 0,
            processedAt: new Date().toISOString(),
            success: false,
            errorMessage: errorMessage
          });
        } catch (logError) {
          console.error('Error logging repository processing:', logError);
        }
      }
      
      return res.status(400).json({ message: errorMessage });
    }
  });

  // Route to get recent logs
  app.get("/api/logs", async (_req: Request, res: Response) => {
    try {
      const logs = await storage.getRecentLogs(10);
      return res.status(200).json(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      return res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Function to get repository content recursively
async function getRepositoryContent(owner: string, repo: string, path: string = '') {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    let allContent = '';
    let fileCount = 0;
    let lineCount = 0;

    // If data is an array, it's a directory, otherwise it's a file
    if (Array.isArray(data)) {
      // Process all files and directories
      for (const item of data) {
        if (item.type === 'file') {
          // Skip binary files
          if (isBinaryFile(item.name)) {
            continue;
          }

          try {
            // Get file content
            const fileResult = await getFileContent(owner, repo, item.path);
            if (fileResult.content) {
              allContent += fileResult.content;
              fileCount++;
              lineCount += fileResult.lineCount;
            }
          } catch (error) {
            console.error(`Error fetching file ${item.path}:`, error);
            // Continue with other files
          }
        } else if (item.type === 'dir') {
          // Recursively get directory content
          const dirResult = await getRepositoryContent(owner, repo, item.path);
          allContent += dirResult.content;
          fileCount += dirResult.fileCount;
          lineCount += dirResult.lineCount;
        }
      }
    }

    return {
      content: allContent,
      fileCount,
      lineCount
    };
  } catch (error) {
    console.error('Error fetching repository content:', error);
    throw new Error(`Failed to fetch repository content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to get file content
async function getFileContent(owner: string, repo: string, path: string) {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if (Array.isArray(data) || !('content' in data)) {
      return { content: '', lineCount: 0 };
    }

    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const lines = content.split('\n');
    
    // Format with file path header
    const formattedContent = `# /${path}\n${content}\n\n`;
    
    return {
      content: formattedContent,
      lineCount: lines.length
    };
  } catch (error) {
    console.error(`Error fetching file content for ${path}:`, error);
    throw error;
  }
}

// Function to check if a file is binary
function isBinaryFile(filename: string): boolean {
  const binaryExtensions = [
    // Images
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp',
    // Documents
    '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
    // Archives
    '.zip', '.rar', '.tar', '.gz', '.7z',
    // Audio/Video
    '.mp3', '.mp4', '.wav', '.avi', '.mov', '.flv',
    // Executables
    '.exe', '.dll', '.so', '.dylib',
    // Others
    '.bin', '.dat'
  ];
  
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return binaryExtensions.includes(ext);
}
