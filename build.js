import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Starting build process for Vercel deployment...');

// Step 1: Clean up dist directory
console.log('Cleaning up dist directory...');
fs.emptyDirSync(path.join(__dirname, 'dist'));

// Step 2: Build the frontend with Vite
console.log('Building frontend with Vite...');
execSync('vite build', { stdio: 'inherit' });

// Step 3: Build API functions with esbuild
console.log('Building API functions with esbuild...');
execSync('esbuild api/index.ts api/logs.ts api/process-repository.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/api', { stdio: 'inherit' });

// Step 4: Copy necessary files for serverless functions
console.log('Copying necessary files for serverless functions...');
fs.copySync(path.join(__dirname, 'shared'), path.join(__dirname, 'dist', 'shared'));

// Step 5: Create a vercel-specific index file
console.log('Creating Vercel index file...');
fs.writeFileSync(
  path.join(__dirname, 'dist', '_vercel_index.html'),
  `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="refresh" content="0;url=/" />
    <title>GitHub Condenser</title>
  </head>
  <body>
    Redirecting...
  </body>
</html>`
);

console.log('Build completed successfully!');