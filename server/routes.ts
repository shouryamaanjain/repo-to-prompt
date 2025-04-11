import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRepositoryLogSchema, gitHubUrlSchema } from "@shared/schema";
import { z } from "zod";
import axios from 'axios';
import * as cheerio from 'cheerio';

// Define user agent to avoid being blocked
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// Configure axios with headers
const axiosInstance = axios.create({
  headers: {
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml',
  },
  timeout: 30000,
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
    let allContent = '';
    let fileCount = 0;
    let lineCount = 0;

    // Get the file structure first
    const fileTree = await getRepositoryFileStructure(owner, repo);
    
    // Process each file in the file tree
    for (const filePath of fileTree) {
      try {
        // Skip binary files
        if (isBinaryFile(filePath)) {
          continue;
        }

        // Get file content
        const fileResult = await getFileContent(owner, repo, filePath);
        if (fileResult.content) {
          allContent += fileResult.content;
          fileCount++;
          lineCount += fileResult.lineCount;
        }
      } catch (error) {
        console.error(`Error fetching file ${filePath}:`, error);
        // Continue with other files
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

// Get file structure from repository
async function getRepositoryFileStructure(owner: string, repo: string): Promise<string[]> {
  try {
    // We'll use the recursive tree API endpoint with a depth of 100 to get all files
    const apiUrl = `https://github.com/${owner}/${repo}/find/main`;
    
    console.log(`Fetching repository structure from: ${apiUrl}`);
    const response = await axiosInstance.get(apiUrl);
    
    // Load the HTML response into cheerio
    const $ = cheerio.load(response.data);
    
    // GitHub stores the file tree data in a JS variable we can extract
    const scriptTags = $('script').toArray();
    let fileTree: string[] = [];
    
    // Look for the js-file-line-container elements which contain file paths in the finder
    $('.js-details-container .js-navigation-item').each((_idx, element) => {
      const path = $(element).find('.js-navigation-open').attr('title');
      if (path) {
        fileTree.push(path);
      }
    });
    
    // If we couldn't find files, try another approach
    if (fileTree.length === 0) {
      // Try to scrape from the API response embedded in the page
      const pageText = response.data;
      const treeDataMatch = pageText.match(/data-refined-path="([^"]+)"/g);
      
      if (treeDataMatch) {
        fileTree = treeDataMatch.map((match: string) => {
          const matchResult = match.match(/data-refined-path="([^"]+)"/);
          return matchResult ? matchResult[1] : '';
        }).filter((path: string) => path.length > 0);
      }
    }
    
    console.log(`Found ${fileTree.length} files in repository`);
    
    // If we still can't find files, try the master branch instead of main
    if (fileTree.length === 0) {
      try {
        const masterApiUrl = `https://github.com/${owner}/${repo}/find/master`;
        const masterResponse = await axiosInstance.get(masterApiUrl);
        const $master = cheerio.load(masterResponse.data);
        
        $master('.js-details-container .js-navigation-item').each((_idx, element) => {
          const path = $master(element).find('.js-navigation-open').attr('title');
          if (path) {
            fileTree.push(path);
          }
        });
        
        console.log(`Found ${fileTree.length} files in repository (master branch)`);
      } catch (error) {
        console.error('Error fetching master branch:', error);
      }
    }
    
    return fileTree;
  } catch (error) {
    console.error('Error fetching repository structure:', error);
    throw new Error(`Failed to fetch repository structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to get file content
async function getFileContent(owner: string, repo: string, path: string) {
  try {
    // Build the URL to the raw content
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
    
    console.log(`Fetching file content from: ${rawUrl}`);
    const response = await axiosInstance.get(rawUrl, { 
      responseType: 'text',
      validateStatus: (status) => status < 500 // Accept 404s
    });
    
    // Handle 404 - try master branch instead
    if (response.status === 404) {
      console.log(`File not found in main branch, trying master branch`);
      const masterRawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${path}`;
      const masterResponse = await axiosInstance.get(masterRawUrl, { responseType: 'text' });
      
      if (masterResponse.status === 200) {
        const content = masterResponse.data;
        const lines = content.split('\n');
        
        // Format with file path header
        const formattedContent = `# /${path}\n${content}\n\n`;
        
        return {
          content: formattedContent,
          lineCount: lines.length
        };
      } else {
        throw new Error(`File not found in main or master branch: ${path}`);
      }
    }
    
    const content = response.data;
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
