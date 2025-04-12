import express from "express";
import { registerRoutes } from "../server/routes";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// This initializes all the routes but doesn't start a server
// This is important for serverless functions
let initialized = false;
async function init() {
  if (!initialized) {
    await registerRoutes(app);
    initialized = true;
  }
}

// Serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await init();
  
  // Pass the request to the Express app
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(undefined);
    });
  });
}