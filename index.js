// This file helps Vercel identify the entry point for the application
// It redirects to the client build in production
export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).end(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0;url=/client/index.html">
      </head>
      <body>
        <p>Redirecting to the application...</p>
      </body>
    </html>
  `);
}