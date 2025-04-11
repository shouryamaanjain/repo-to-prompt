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

    console.log(`Getting file structure for ${owner}/${repo}`);
    // Try to determine the default branch
    const determineDefaultBranch = async (): Promise<string> => {
      try {
        const repoUrl = `https://github.com/${owner}/${repo}`;
        const response = await axiosInstance.get(repoUrl, { timeout: 10000 });
        
        if (response.status === 200) {
          const html = response.data;
          if (html.includes('tree/master') || html.includes('"master"')) {
            return 'master';
          } else if (html.includes('tree/main') || html.includes('"main"')) {
            return 'main';
          }
        }
        
        // Try a few branches explicitly
        for (const branch of ['main', 'master', 'develop']) {
          try {
            const branchUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
            const branchResponse = await axiosInstance.head(branchUrl, {
              validateStatus: () => true,
              timeout: 5000
            });
            
            if (branchResponse.status === 200) {
              return branch;
            }
          } catch (err) {
            // Continue to next branch
          }
        }
        
        return 'main'; // Default
      } catch (err) {
        return 'main'; // Default to main if we can't determine
      }
    };
    
    const defaultBranch = await determineDefaultBranch();
    console.log(`Detected default branch: ${defaultBranch}`);
    
    // Get the file structure
    const fileTree = await getRepositoryFileStructure(owner, repo);
    
    // Deduplicate files in case we have duplicates
    const uniqueFiles = [...new Set(fileTree)];
    
    console.log(`Processing ${uniqueFiles.length} files`);
    // Process each file in the file tree
    for (const filePath of uniqueFiles) {
      try {
        // Skip binary files
        if (isBinaryFile(filePath)) {
          console.log(`Skipping binary file: ${filePath}`);
          continue;
        }

        // Get file content with the default branch
        const fileResult = await getFileContent(owner, repo, filePath, defaultBranch);
        if (fileResult.content) {
          allContent += fileResult.content;
          fileCount++;
          lineCount += fileResult.lineCount;
          console.log(`Added file: ${filePath} (${fileResult.lineCount} lines)`);
        }
      } catch (error) {
        console.error(`Error fetching file ${filePath}:`, error);
        // Continue with other files
      }
    }

    // If we didn't get any content at all, add a fallback message
    if (allContent === '') {
      allContent = `# Repository: ${owner}/${repo}\n\nThis repository couldn't be processed completely. Please try again later or try a different repository.\n\n`;
      lineCount = 3;
      fileCount = 1;
    }

    console.log(`Finished processing. Total files: ${fileCount}, Total lines: ${lineCount}`);
    return {
      content: allContent,
      fileCount,
      lineCount
    };
  } catch (error) {
    console.error('Error fetching repository content:', error);
    
    // Instead of failing, return a message
    return {
      content: `# Repository: ${owner}/${repo}\n\nAn error occurred while fetching this repository: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again later or try a different repository.\n\n`,
      fileCount: 1,
      lineCount: 5
    };
  }
}

// Get file structure from repository
async function getRepositoryFileStructure(owner: string, repo: string): Promise<string[]> {
  try {
    // Maintain a map of visited directories to avoid infinite recursion
    const visitedDirectories = new Set<string>();
    // Final list of all files
    const allFiles: string[] = [];
    // Default branch to try first
    let defaultBranch = 'main';
    
    // Function to determine if a path is for a directory
    const isDirectory = (path: string): boolean => {
      return !path.includes('.') || path.endsWith('/');
    };
    
    // Function to get the default branch
    const determineDefaultBranch = async (): Promise<string> => {
      try {
        // Try to access the repository main page to determine the default branch
        const repoUrl = `https://github.com/${owner}/${repo}`;
        const response = await axiosInstance.get(repoUrl, { timeout: 10000 });
        
        // If we can access main branch, use it
        if (response.status === 200) {
          // Try to find the default branch mentioned in the HTML
          // Look for the "default branch" text or the active branch indicator
          const html = response.data;
          if (html.includes('tree/master') || html.includes('"master"')) {
            console.log('Repository appears to use master as the default branch');
            return 'master';
          } else if (html.includes('tree/main') || html.includes('"main"')) {
            console.log('Repository appears to use main as the default branch');
            return 'main';
          }
        }
        
        // Try to access some common branches to determine which one exists
        const branches = ['main', 'master', 'develop', 'development'];
        for (const branch of branches) {
          try {
            const branchUrl = `https://github.com/${owner}/${repo}/tree/${branch}`;
            const branchResponse = await axiosInstance.head(branchUrl, { 
              validateStatus: () => true,
              timeout: 5000 
            });
            
            if (branchResponse.status === 200) {
              console.log(`Found branch: ${branch}`);
              return branch;
            }
          } catch (err) {
            // Continue to next branch
          }
        }
        
        // Default to main if we can't determine
        return 'main';
      } catch (err) {
        console.error('Error determining default branch:', err);
        return 'main'; // Default to main branch
      }
    };
    
    // Recursively process a directory to get all files and subdirectories
    const processDirectory = async (path: string = '', branch: string = defaultBranch, depth: number = 0): Promise<void> => {
      if (depth > 5) {
        console.log(`Maximum recursion depth reached for path: ${path}`);
        return; // Avoid infinite recursion
      }
      
      if (visitedDirectories.has(path)) {
        return; // Skip already visited directories
      }
      
      visitedDirectories.add(path);
      console.log(`Processing directory: ${path || 'root'} on branch ${branch}`);
      
      try {
        const directoryUrl = `https://github.com/${owner}/${repo}/tree/${branch}/${path}`;
        const response = await axiosInstance.get(directoryUrl, { 
          validateStatus: (status) => status < 500,
          timeout: 15000
        });
        
        if (response.status === 200) {
          const $ = cheerio.load(response.data);
          
          // Find all file and directory links
          const fileLinks: {path: string, isDir: boolean}[] = [];
          
          // First collect all links
          $('a[role="row"]').each((_idx, element) => {
            const href = $(element).attr('href');
            
            if (!href) return;
            
            let isDir = false;
            let filePath = '';
            
            // Extract file path and check if it's a directory
            if (href.includes('/blob/')) {
              // This is a file
              const match = href.match(new RegExp(`/${owner}/${repo}/blob/${branch}/(.+)$`));
              if (match && match[1]) {
                filePath = match[1];
              }
            } else if (href.includes('/tree/')) {
              // This is a directory
              const match = href.match(new RegExp(`/${owner}/${repo}/tree/${branch}/(.+)$`));
              if (match && match[1]) {
                filePath = match[1];
                isDir = true;
              }
            }
            
            if (filePath) {
              fileLinks.push({ path: filePath, isDir });
            }
          });
          
          // Additionally, look for js-navigation-item class which contains file rows in GitHub
          $('.js-navigation-item').each((_idx, element) => {
            const $row = $(element);
            const $link = $row.find('.js-navigation-open');
            const href = $link.attr('href');
            const text = $link.text().trim();
            
            if (!href || !text) return;
            
            let isDir = $row.find('[aria-label="Directory"]').length > 0;
            let filePath = '';
            
            if (href.includes('/blob/')) {
              // File
              const match = href.match(new RegExp(`/${owner}/${repo}/blob/${branch}/(.+)$`));
              if (match && match[1]) {
                filePath = match[1];
              }
            } else if (href.includes('/tree/')) {
              // Directory
              const match = href.match(new RegExp(`/${owner}/${repo}/tree/${branch}/(.+)$`));
              if (match && match[1]) {
                filePath = match[1];
                isDir = true;
              }
            }
            
            if (filePath) {
              fileLinks.push({ path: filePath, isDir });
            }
          });
          
          // Now process them asynchronously
          for (const file of fileLinks) {
            if (file.isDir) {
              // Process this directory recursively
              await processDirectory(file.path, branch, depth + 1);
            } else {
              // Add file to our list
              if (!allFiles.includes(file.path) && !isBinaryFile(file.path)) {
                allFiles.push(file.path);
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error processing directory ${path}:`, err);
      }
    };
    
    // Try the GitHub API first to get tree recursively
    try {
      console.log(`Attempting to use GitHub API to fetch repository structure for ${owner}/${repo}`);
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
      
      const response = await axiosInstance.get(apiUrl, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        validateStatus: (status) => status < 500,
        timeout: 15000
      });
      
      if (response.status === 200 && response.data && response.data.tree) {
        console.log('Successfully got repository tree via GitHub API');
        const tree = response.data.tree;
        
        for (const item of tree) {
          if (item.type === 'blob' && item.path && !isBinaryFile(item.path)) {
            allFiles.push(item.path);
          }
        }
        
        console.log(`Found ${allFiles.length} files via GitHub API`);
        
        if (allFiles.length > 0) {
          return allFiles; // Return API results if successful
        }
      }
    } catch (apiError) {
      console.error('Error using GitHub API:', apiError);
      console.log('Falling back to web scraping...');
    }
    
    // Determine the default branch
    defaultBranch = await determineDefaultBranch();
    console.log(`Using ${defaultBranch} as the default branch`);
    
    // Begin processing from root directory
    await processDirectory('', defaultBranch);
    
    console.log(`Found ${allFiles.length} files via web scraping`);
    
    // If we still don't have files, try a few common files directly
    if (allFiles.length === 0) {
      console.log('Trying to fetch common files directly...');
      const commonFiles = [
        'README.md', 'package.json', 'LICENSE', '.gitignore', 
        'index.js', 'index.ts', 'index.html',
        'src/index.js', 'src/index.ts', 'src/App.js', 'src/App.tsx'
      ];
      
      for (const file of commonFiles) {
        try {
          const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${file}`;
          const response = await axiosInstance.head(fileUrl, {
            validateStatus: (status) => status < 500,
            timeout: 5000
          });
          
          if (response.status === 200) {
            allFiles.push(file);
          }
        } catch (err) {
          // Skip this file
        }
      }
    }
    
    // Limit the number of files to prevent overwhelming the server
    const maxFiles = 100;
    if (allFiles.length > maxFiles) {
      console.log(`Limiting to ${maxFiles} files out of ${allFiles.length} total`);
      return allFiles.slice(0, maxFiles);
    }
    
    return allFiles;
  } catch (error) {
    console.error('Error fetching repository structure:', error);
    throw new Error(`Failed to fetch repository structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to get file content
async function getFileContent(owner: string, repo: string, path: string, branch?: string) {
  try {
    // Try to determine the branch for this file
    const branchesToTry = branch ? [branch] : ['main', 'master', 'develop', 'development'];
    
    for (const currentBranch of branchesToTry) {
      try {
        const url = `https://raw.githubusercontent.com/${owner}/${repo}/${currentBranch}/${path}`;
        console.log(`Fetching file content from: ${url}`);
        
        const response = await axiosInstance.get(url, { 
          responseType: 'text',
          validateStatus: (status) => status < 500, // Accept 404s
          timeout: 8000 // 8 second timeout
        });
        
        if (response.status === 200) {
          const content = response.data;
          // Don't include files that appear to be binary data
          if (typeof content !== 'string') {
            console.log(`Skipping binary content for ${path}`);
            return {
              content: `# /${path}\n[Binary file - content not displayed]\n\n`,
              lineCount: 1
            };
          }
          
          const lines = content.split('\n');
          
          // Truncate very large files
          const maxLines = 2000;
          let truncated = false;
          let displayContent = content;
          
          if (lines.length > maxLines) {
            displayContent = lines.slice(0, maxLines).join('\n');
            truncated = true;
          }
          
          // Format with file path header
          let formattedContent = `# /${path}\n${displayContent}\n`;
          
          // Add truncation message if needed
          if (truncated) {
            formattedContent += `\n# File truncated: showing ${maxLines} of ${lines.length} lines\n`;
          }
          
          formattedContent += '\n';
          
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
    // Return empty content rather than throwing
    return {
      content: `# /${path}\n[Error processing file]\n\n`,
      lineCount: 1
    };
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
