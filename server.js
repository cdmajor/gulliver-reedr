import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
  '.ico': 'image/x-icon',
};

function serveFile(res, filePath) {
  if (!fs.existsSync(filePath)) return false;
  const ext = path.extname(filePath);
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
  return true;
}

http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // Health check
  if (urlPath === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<a href="/reedr-chrome/">Reedr for Chrome</a> | <a href="/reedr-safari/">Reedr for Safari</a>');
    return;
  }

  // Route /reedr-chrome/* → artifacts/reedr-chrome/public/*
  if (urlPath.startsWith('/reedr-chrome/')) {
    const rel = urlPath.slice('/reedr-chrome/'.length) || 'index.html';
    const filePath = path.join(__dirname, 'artifacts/reedr-chrome/public', rel);
    if (serveFile(res, filePath)) return;
    // SPA fallback
    serveFile(res, path.join(__dirname, 'artifacts/reedr-chrome/public/index.html'));
    return;
  }

  // Route /reedr-safari/* → artifacts/reedr-safari/public/*
  if (urlPath.startsWith('/reedr-safari/')) {
    const rel = urlPath.slice('/reedr-safari/'.length) || 'index.html';
    const filePath = path.join(__dirname, 'artifacts/reedr-safari/public', rel);
    if (serveFile(res, filePath)) return;
    serveFile(res, path.join(__dirname, 'artifacts/reedr-safari/public/index.html'));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
}).listen(PORT, '0.0.0.0', () => console.log(`Reedr server listening on port ${PORT}`));
