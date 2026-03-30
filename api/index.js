const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());

// Shared MIME type mapping
const defaultMimeTypes = {
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.html': 'text/html',
  '.tiff': 'image/tiff',
  '.avif': 'image/avif',
  '.jxl': 'image/jxl',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp',
  '.xbm': 'image/x-xbitmap',
  '.svg': 'image/svg+xml',
  '.heic': 'image/heic',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mpg': 'video/mpeg',
  '.mpeg': 'video/mpeg',
  '.zip': 'application/zip',
  '.eml': 'message/rfc822',
  '.msg': 'application/vnd.ms-outlook',
  '.exe': 'application/x-msdownload',
  '.csv': 'text/csv',
  '.m4a': 'audio/mp4',
  '.wma': 'audio/x-ms-wma',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xlsb': 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.rdp': 'application/x-rdp'
};

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  return defaultMimeTypes[ext] || 'application/octet-stream';
}

// One-time download token store
const oneTimeTokens = new Map();

// Serve assets directory at /assets
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// Serve static files from public/ directory (works both locally and on Vercel)
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.mjs')) {
      res.set('Content-Type', 'application/javascript');
    }
  }
}));

// API endpoint for download testing with real headers
app.get('/api/download-test', (req, res) => {
  const { filename, headers, disposition, mimeType, test } = req.query;
  
  if (!filename) {
    return res.status(400).json({ error: 'filename parameter is required' });
  }
  
  // Log the download request
  console.log(`📥 Download request received:`, {
    filename,
    headers,
    disposition,
    mimeType,
    test,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Construct file path from assets directory
  const filePath = path.join(__dirname, '..', 'assets', filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    console.error(`   Looking in: ${path.resolve(filePath)}`);
    return res.status(404).json({ 
      error: 'File not found',
      requested: filename,
      path: filePath,
      resolved: path.resolve(filePath)
    });
  }
  
  // Get file info
  const stats = fs.statSync(filePath);
  const downloadFilename = test ? `${path.basename(filename, path.extname(filename))}-${test}${path.extname(filename)}` : filename;
  
  console.log(`✅ File found: ${filePath} (${stats.size} bytes)`);
  
  // Determine Content-Type from file extension or use mimeType override
  const defaultType = getMimeType(filename);
  let contentType = mimeType || defaultType;

  if (mimeType) {
    console.log(`⚠️ MIME Type Override: Using ${mimeType} instead of ${defaultType}`);
  }
  
  // Set Content-Type
  console.log(`🔥 Setting Content-Type: ${contentType} for ${downloadFilename}`);
  res.setHeader('Content-Type', contentType);
  
  // Set Content-Disposition
  const dispositionType = disposition || 'attachment';
  res.setHeader('Content-Disposition', `${dispositionType}; filename="${downloadFilename}"`);

  // Set X-Download-Options header (the key part!)
  if (headers && headers !== 'none') {
    res.setHeader('X-Download-Options', headers);
    console.log(`🔥 Setting X-Download-Options: ${headers} for ${downloadFilename}`);
  } else {
    console.log(`📝 No X-Download-Options header for ${downloadFilename}`);
  }
  
  // Log all response headers being sent
  console.log(`📤 Response headers:`, {
    'Content-Type': res.get('Content-Type'),
    'Content-Disposition': res.get('Content-Disposition'),
    'X-Download-Options': res.get('X-Download-Options') || 'Not Set',
    'Cache-Control': res.get('Cache-Control')
  });
  
  // Set other security headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Log the test for debugging
  console.log(`Download test: ${downloadFilename}`);
  console.log(`Headers: X-Download-Options=${headers || 'none'}, Content-Disposition=${dispositionType}`);
  
  // Send the file
  res.sendFile(path.resolve(filePath));
});

// Generate a one-time download token
app.post('/api/one-time-token', (req, res) => {
  const { file, ttlMs } = req.body;

  if (!file) {
    return res.status(400).json({ error: 'file parameter is required' });
  }

  // Validate file exists in assets
  const filePath = path.join(__dirname, '..', 'assets', file);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found', requested: file });
  }

  const token = crypto.randomUUID();
  const createdAt = Date.now();
  const effectiveTtl = ttlMs || null; // null = no expiration

  oneTimeTokens.set(token, {
    file,
    used: false,
    createdAt,
    ttlMs: effectiveTtl,
    usedAt: null
  });

  console.log(`🔑 One-time token generated: ${token} for ${file} (TTL: ${effectiveTtl ? effectiveTtl + 'ms' : 'none'})`);

  res.json({
    token,
    downloadUrl: `/api/one-time-download/${token}`,
    file,
    ttlMs: effectiveTtl,
    createdAt
  });
});

// Serve a one-time download
app.get('/api/one-time-download/:token', (req, res) => {
  const { token } = req.params;
  const entry = oneTimeTokens.get(token);

  if (!entry) {
    console.log(`❌ One-time download: token not found: ${token}`);
    return res.status(404).json({ error: 'Token not found' });
  }

  if (entry.used) {
    console.log(`🚫 One-time download: token already used: ${token} (used at ${new Date(entry.usedAt).toISOString()})`);
    return res.status(410).json({
      error: 'This download link has already been used',
      usedAt: entry.usedAt
    });
  }

  if (entry.ttlMs && (Date.now() - entry.createdAt > entry.ttlMs)) {
    console.log(`⏰ One-time download: token expired: ${token}`);
    return res.status(410).json({
      error: 'This download link has expired',
      createdAt: entry.createdAt,
      ttlMs: entry.ttlMs
    });
  }

  // Mark as used
  entry.used = true;
  entry.usedAt = Date.now();

  const filePath = path.join(__dirname, '..', 'assets', entry.file);
  const contentType = getMimeType(entry.file);

  console.log(`✅ One-time download: serving ${entry.file} for token ${token}`);

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${entry.file}"`);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.resolve(filePath));
});

// Check token status without consuming it
app.get('/api/one-time-token/:token/status', (req, res) => {
  const { token } = req.params;
  const entry = oneTimeTokens.get(token);

  if (!entry) {
    return res.json({ token, status: 'not_found' });
  }

  const expired = entry.ttlMs ? (Date.now() - entry.createdAt > entry.ttlMs) : false;
  let status = 'available';
  if (entry.used) status = 'consumed';
  else if (expired) status = 'expired';

  res.json({
    token,
    file: entry.file,
    used: entry.used,
    createdAt: entry.createdAt,
    usedAt: entry.usedAt,
    ttlMs: entry.ttlMs,
    expired,
    status
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Express server running - can set real HTTP headers',
    timestamp: new Date().toISOString()
  });
});

// Only start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Express server running on http://localhost:${PORT}`);
    console.log(`📁 Serving static files from current directory`);
    console.log(`🔗 API endpoints available at /api/download-test and /api/health`);
    console.log(`\n🧪 Now you can test real X-Download-Options headers!`);
  });
}

// Export for Vercel
module.exports = app;
