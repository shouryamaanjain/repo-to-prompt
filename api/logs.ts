import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

// Serverless function handler for getting repository processing logs
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const logs = await storage.getRecentLogs(10);
    return res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return res.status(500).json({ message: "Failed to fetch logs" });
  }
}