import express from "express";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // For index route, redirect to appropriate API handler based on path
  if (req.url?.startsWith('/api/process-repository')) {
    return (await import('./process-repository')).default(req, res);
  } else if (req.url?.startsWith('/api/logs')) {
    return (await import('./logs')).default(req, res);
  }
  
  // Fallback response
  return res.status(200).json({ 
    message: "GitHub Condenser API is running",
    endpoints: ["/api/process-repository", "/api/logs"]
  });
}