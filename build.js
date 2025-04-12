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

// Step 3: Create API directory structure
console.log('Creating API directory structure...');
fs.ensureDirSync(path.join(__dirname, 'dist', 'api'));

// Step 4: Create shared module for serverless functions
console.log('Creating shared module for serverless functions...');
fs.ensureDirSync(path.join(__dirname, 'dist', 'api', '_shared'));

// Step 5: Copy schema and storage modules directly into the API directory
console.log('Copying schema and storage modules...');
// Copy schema.ts content with import paths fixed
const schemaContent = fs.readFileSync(path.join(__dirname, 'shared', 'schema.ts'), 'utf8');
fs.writeFileSync(
  path.join(__dirname, 'dist', 'api', '_shared', 'schema.js'),
  schemaContent
);

// Copy storage.ts content with import paths fixed
if (fs.existsSync(path.join(__dirname, 'server', 'storage.ts'))) {
  const storageContent = fs.readFileSync(path.join(__dirname, 'server', 'storage.ts'), 'utf8');
  fs.writeFileSync(
    path.join(__dirname, 'dist', 'api', '_shared', 'storage.js'),
    storageContent
  );
}

// Step 6: Build API functions with esbuild, adjusting imports with custom build options
console.log('Building API functions with esbuild...');
// Create temporary modified versions of API files with corrected imports
const apiDir = path.join(__dirname, 'api');
const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.ts'));

apiFiles.forEach(file => {
  const filePath = path.join(apiDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace relative imports with direct imports to the _shared directory
  content = content.replace(
    /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]\.\.\/shared\/schema['"]/g, 
    `import { $1 } from './_shared/schema'`
  );
  
  content = content.replace(
    /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]\.\.\/server\/storage['"]/g, 
    `import { $1 } from './_shared/storage'`
  );
  
  // Write modified file to a temporary location
  const tempFile = path.join(__dirname, 'dist', 'api', `_temp_${file}`);
  fs.writeFileSync(tempFile, content);
});

// Build the modified API files with esbuild
execSync(`esbuild dist/api/_temp_*.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/api --outbase=dist/api --out-extension:.js=.js`, 
  { stdio: 'inherit' });

// Clean up temporary files
fs.readdirSync(path.join(__dirname, 'dist', 'api'))
  .filter(file => file.startsWith('_temp_') && file.endsWith('.ts'))
  .forEach(file => {
    fs.unlinkSync(path.join(__dirname, 'dist', 'api', file));
  });

// Step 7: Create a vercel-specific index file
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

// Step 8: Create direct copies of the API handlers for Vercel to use
console.log('Creating API handlers for Vercel...');
apiFiles.forEach(file => {
  const apiFileContent = `
import handler from './${path.basename(file, '.ts')}';
export default handler;
`;
  const outputFile = path.join(__dirname, 'dist', 'api', file.replace('.ts', '.js'));
  fs.writeFileSync(outputFile, apiFileContent);
});

console.log('Build completed successfully!');