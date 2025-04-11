import type { Express, Request, Response, NextFunction } from "express";
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
  timeout: 60000,  // 60 seconds timeout
});

// Function to check if a file is binary based on extension
function isBinaryFile(filename: string): boolean {
  const binaryExtensions = [
    // Images
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg',
    // Documents
    '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
    // Archives
    '.zip', '.rar', '.tar', '.gz', '.7z',
    // Audio/Video
    '.mp3', '.mp4', '.wav', '.avi', '.mov', '.flv',
    // Executables
    '.exe', '.dll', '.so', '.dylib',
    // Others
    '.bin', '.dat', '.woff', '.woff2', '.ttf', '.eot'
  ];
  
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return binaryExtensions.includes(ext);
}

// Function to retrieve file content from GitHub
async function getFileContent(owner: string, repo: string, path: string, branch: string) {
  try {
    // All branches to try if specified branch fails
    const branchesToTry = [branch, 'main', 'master', 'develop'];
    
    for (const currentBranch of branchesToTry) {
      try {
        const url = `https://raw.githubusercontent.com/${owner}/${repo}/${currentBranch}/${path}`;
        console.log(`Fetching file content from: ${url}`);
        
        const response = await axiosInstance.get(url, { 
          responseType: 'text',
          validateStatus: (status) => status < 500, // Accept 404s
          timeout: 10000 // 10 second timeout
        });
        
        if (response.status === 200) {
          const content = response.data;
          
          // Skip binary data
          if (typeof content !== 'string') {
            console.log(`Skipping binary content for ${path}`);
            return {
              content: `# /${path}\n[Binary file - content not displayed]\n\n`,
              lineCount: 1
            };
          }
          
          const lines = content.split('\n');
          
          // Format with file path header
          const formattedContent = `# /${path}\n${content}\n\n`;
          
          return {
            content: formattedContent,
            lineCount: lines.length
          };
        }
      } catch (error) {
        console.log(`Error fetching from ${currentBranch} branch: ${error instanceof Error ? error.message : String(error)}`);
        // Continue to next branch
      }
    }
    
    // If we got here, we couldn't get the file from any branch
    return {
      content: `# /${path}\n[File content could not be retrieved]\n\n`,
      lineCount: 1
    };
  } catch (error) {
    console.error(`Error in getFileContent for ${path}:`, error);
    return {
      content: `# /${path}\n[Error processing file]\n\n`,
      lineCount: 1
    };
  }
}

// Function to recursively get repository content
async function getRepositoryContent(owner: string, repo: string): Promise<{content: string, fileCount: number, lineCount: number}> {
  try {
    let allContent = '';
    let fileCount = 0;
    let lineCount = 0;
    
    // Determine default branch
    let defaultBranch = 'main';
    try {
      const repoUrl = `https://github.com/${owner}/${repo}`;
      const response = await axiosInstance.get(repoUrl);
      if (response.data.includes('tree/master')) {
        defaultBranch = 'master';
      }
      console.log(`Using ${defaultBranch} as default branch`);
    } catch (error) {
      console.log(`Failed to detect default branch, using "${defaultBranch}"`);
    }
    
    // Get all files in repository
    const allFiles: string[] = [];
    
    // Try GitHub API first (for both main and master branches)
    for (const branch of ['main', 'master']) {
      try {
        console.log(`Trying GitHub API with branch: ${branch}`);
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        const response = await axiosInstance.get(apiUrl, {
          headers: { 'Accept': 'application/vnd.github.v3+json' },
          timeout: 20000
        });
        
        if (response.status === 200 && response.data?.tree) {
          console.log(`Successfully got tree from GitHub API using ${branch} branch`);
          response.data.tree.forEach((item: any) => {
            if (item.type === 'blob' && item.path && !isBinaryFile(item.path)) {
              allFiles.push(item.path);
            }
          });
          
          if (allFiles.length > 0) {
            console.log(`Found ${allFiles.length} files via GitHub API`);
            break; // Successfully got files, exit loop
          }
        }
      } catch (error) {
        console.error(`Error using GitHub API with branch ${branch}:`, error);
      }
    }
    
    // If GitHub API failed, use web scraping approach
    if (allFiles.length === 0) {
      console.log('GitHub API failed, using web scraping approach');
      try {
        // Get repository structure using web scraping
        await scrapeRepositoryStructure(owner, repo, defaultBranch, allFiles);
        console.log(`Found ${allFiles.length} files via web scraping`);
      } catch (error) {
        console.error('Error during web scraping:', error);
      }
    }
    
    // If we still have no files, try some common files directly
    if (allFiles.length === 0) {
      console.log('Trying common files as last resort');
      const commonFiles = ['README.md', 'package.json', 'LICENSE', '.gitignore'];
      for (const file of commonFiles) {
        try {
          const url = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${file}`;
          const response = await axiosInstance.head(url);
          if (response.status === 200) {
            allFiles.push(file);
          }
        } catch (error) {
          // Skip this file
        }
      }
    }
    
    // Process all files (no limits)
    console.log(`Processing all ${allFiles.length} files (no limits)`);
    
    for (const filePath of allFiles) {
      try {
        // Skip binary files
        if (isBinaryFile(filePath)) {
          console.log(`Skipping binary file: ${filePath}`);
          continue;
        }
        
        // Get file content
        const result = await getFileContent(owner, repo, filePath, defaultBranch);
        
        // Add content to total
        allContent += result.content;
        fileCount++;
        lineCount += result.lineCount;
        
        console.log(`Added file: ${filePath} (${result.lineCount} lines)`);
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
      }
    }
    
    // If we didn't get any content, return error message
    if (allContent === '') {
      allContent = `# Repository: ${owner}/${repo}\n\nNo valid text files could be found in this repository.`;
      lineCount = 3;
    }
    
    console.log(`Finished processing. Total files: ${fileCount}, Total lines: ${lineCount}`);
    
    return {
      content: allContent,
      fileCount,
      lineCount
    };
  } catch (error) {
    console.error('Error processing repository:', error);
    return {
      content: `# Error\n\nFailed to process repository ${owner}/${repo}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      fileCount: 0,
      lineCount: 3
    };
  }
}

// Recursive function to scrape repository structure
async function scrapeRepositoryStructure(
  owner: string, 
  repo: string, 
  branch: string, 
  files: string[], 
  path: string = '', 
  visited = new Set<string>(), 
  depth = 0
): Promise<void> {
  // Limit recursion depth to prevent infinite loops
  if (depth > 20) return;
  
  // Avoid visiting the same directory twice
  const dirKey = `${path}`;
  if (visited.has(dirKey)) return;
  visited.add(dirKey);
  
  try {
    // Construct directory URL
    const dirUrl = path 
      ? `https://github.com/${owner}/${repo}/tree/${branch}/${path}`
      : `https://github.com/${owner}/${repo}/tree/${branch}`;
    
    console.log(`Scraping directory: ${path || 'root'}`);
    
    // Fetch directory page
    const response = await axiosInstance.get(dirUrl);
    const $ = cheerio.load(response.data);
    
    // Find file and directory links
    const dirItems: {path: string, isDir: boolean}[] = [];
    
    // Modern GitHub interface: find rows with role="row"
    $('a[role="row"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      
      // Determine if file or directory
      const isDir = href.includes(`/tree/${branch}/`);
      const isFile = href.includes(`/blob/${branch}/`);
      
      let itemPath = '';
      if (isFile) {
        // Extract file path
        const match = href.match(new RegExp(`/${owner}/${repo}/blob/${branch}/(.+)$`));
        if (match && match[1]) {
          itemPath = match[1];
        }
      } else if (isDir) {
        // Extract directory path
        const match = href.match(new RegExp(`/${owner}/${repo}/tree/${branch}/(.+)$`));
        if (match && match[1]) {
          itemPath = match[1];
        }
      }
      
      if (itemPath) {
        dirItems.push({path: itemPath, isDir});
      }
    });
    
    // Process all files and directories
    for (const item of dirItems) {
      if (item.isDir) {
        // Process subdirectory
        await scrapeRepositoryStructure(owner, repo, branch, files, item.path, visited, depth + 1);
      } else {
        // Add file to list if not binary
        if (!isBinaryFile(item.path) && !files.includes(item.path)) {
          files.push(item.path);
        }
      }
    }
  } catch (error) {
    console.error(`Error scraping directory ${path}:`, error);
  }
}

// Register API routes
export async function registerRoutes(app: Express): Promise<Server> {
  // Route to process a GitHub repository
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
      
      // Process repository
      const result = await getRepositoryContent(owner, repo);
      
      // Log processing
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
      
      // Log error
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

  // Route to get recent processing logs
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