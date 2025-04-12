import express from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { gitHubUrlSchema } from './_shared/schema.js';
import { z } from 'zod';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import simpleGit from 'simple-git';
import { storage } from './_shared/storage.js';

// List of binary file extensions to skip
const BINARY_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.webp', '.tiff', '.svg',
  '.mp3', '.mp4', '.wav', '.avi', '.mov', '.wmv', '.flv', '.ogg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.exe', '.dll', '.so', '.bin', 
  '.dat', '.db', '.sqlite', '.class', '.jar', '.war', '.pyc', '.pyd',
  '.woff', '.woff2', '.ttf', '.eot'
];

// Function to check if a file is likely binary
function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.includes(ext);
}

// Function to get a unique temporary directory
function getTempDir(): string {
  return path.join(os.tmpdir(), `github-repo-extractor-${Date.now()}`);
}

// Function to add metadata header to the output
function addMetadata(url: string, owner: string, repo: string): string {
  const now = new Date().toISOString();
  
  return `${'#'.repeat(80)}
# GITHUB REPOSITORY EXTRACTION
# Repository: ${owner}/${repo}
# Source URL: ${url}
# Extracted on: ${now}
${'#'.repeat(80)}\n\n`;
}

// Function to clone a repository using simple-git
async function cloneRepository(url: string, targetDir: string): Promise<boolean> {
  try {
    console.log(`Cloning repository from ${url}...`);
    
    await simpleGit().clone(url, targetDir, ['--depth=1']); // Shallow clone for speed
    
    console.log(`Repository cloned successfully to ${targetDir}`);
    return true;
  } catch (error) {
    console.error(`Error cloning repository: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Function to process a single file
async function processFile(filePath: string, basePath: string): Promise<{content: string, lineCount: number}> {
  try {
    const stats = await fs.stat(filePath);
    
    // Skip if it's not a regular file
    if (!stats.isFile()) {
      return { content: '', lineCount: 0 };
    }
    
    // Skip .git files/directories
    if (filePath.includes('.git')) {
      return { content: '', lineCount: 0 };
    }
    
    // Get relative path for the file
    const relativePath = path.relative(basePath, filePath).replace(/\\/g, '/');
    
    // Skip binary files
    if (isBinaryFile(filePath)) {
      console.log(`Skipping binary file: ${relativePath}`);
      return { 
        content: `\n\n${'='.repeat(80)}\n${relativePath} [BINARY FILE - CONTENT SKIPPED]\n${'='.repeat(80)}\n\n`,
        lineCount: 1 
      };
    }
    
    // Read file content
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Create header with file path
      const header = `\n\n${'='.repeat(80)}\n${relativePath}\n${'='.repeat(80)}\n\n`;
      
      return { 
        content: header + content,
        lineCount: lines.length
      };
    } catch (error) {
      console.warn(`Could not read file ${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
      return { 
        content: `\n\n${'='.repeat(80)}\n${relativePath} [ERROR READING FILE]\n${'='.repeat(80)}\n\n`,
        lineCount: 1
      };
    }
  } catch (error) {
    console.warn(`Error processing file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    return { content: '', lineCount: 0 };
  }
}

// Function to count files in the repository (for progress tracking)
async function countFiles(dirPath: string): Promise<number> {
  let count = 0;
  
  async function countDir(currentPath: string) {
    const entries = await fs.readdir(currentPath);
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry);
      
      // Skip .git directory
      if (entry === '.git') {
        continue;
      }
      
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        await countDir(fullPath);
      } else if (stats.isFile()) {
        count++;
      }
    }
  }
  
  await countDir(dirPath);
  return count;
}

// Function to process all files in the repository
async function processRepository(repoDir: string): Promise<{content: string, fileCount: number, lineCount: number}> {
  let result = '';
  let processedFiles = 0;
  let totalLines = 0;
  
  // Count total files for progress tracking
  const totalFiles = await countFiles(repoDir);
  console.log(`Found ${totalFiles} files to process`);
  
  // Recursive function to process directories
  async function processDir(dirPath: string) {
    const entries = await fs.readdir(dirPath);
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      
      // Skip .git directory
      if (entry === '.git') {
        continue;
      }
      
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        await processDir(fullPath);
      } else if (stats.isFile()) {
        const { content, lineCount } = await processFile(fullPath, repoDir);
        result += content;
        totalLines += lineCount;
        
        if (content) {
          processedFiles++;
        }
        
        // Log progress
        if (processedFiles % 5 === 0 || processedFiles === totalFiles) {
          const percent = Math.round((processedFiles / totalFiles) * 100);
          console.log(`Processing files... ${processedFiles}/${totalFiles} (${percent}%)`);
        }
      }
    }
  }
  
  await processDir(repoDir);
  console.log('File processing complete!');
  
  return {
    content: result,
    fileCount: processedFiles,
    lineCount: totalLines
  };
}

// Main function to extract repository content
async function extractRepository(url: string, owner: string, repo: string): Promise<{content: string, fileCount: number, lineCount: number}> {
  // Create temporary directory
  const tempDir = getTempDir();
  await fs.ensureDir(tempDir);
  
  try {
    // Clone the repository
    const cloneSuccess = await cloneRepository(url, tempDir);
    if (!cloneSuccess) {
      throw new Error('Failed to clone repository');
    }
    
    // Add metadata header
    let extractedContent = addMetadata(url, owner, repo);
    
    // Process all repository files
    const result = await processRepository(tempDir);
    extractedContent += result.content;
    
    // Clean up
    await fs.remove(tempDir);
    
    return {
      content: extractedContent,
      fileCount: result.fileCount,
      lineCount: result.lineCount
    };
  } catch (error) {
    // Clean up on error
    try {
      await fs.remove(tempDir);
    } catch (cleanupError) {
      console.error(`Error during cleanup: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }
    
    throw error;
  }
}

// Serverless function handler for processing GitHub repositories
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
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
    
    // Process repository using Git clone approach
    console.log(`Starting extraction of ${owner}/${repo} using Git clone approach`);
    const result = await extractRepository(validatedUrl, owner, repo);
    
    // Log processing
    try {
      await storage.logRepositoryProcessing({
        repositoryUrl: validatedUrl,
        fileCount: result.fileCount,
        lineCount: result.lineCount,
        processedAt: new Date().toISOString(),
        success: true,
        errorMessage: null
      });
    } catch (logError) {
      // Continue even if logging fails
      console.error('Error logging repository processing:', logError);
    }
    
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
    if (req.body?.url) {
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
}