const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Serve static files for the main application with proper MIME types
app.use(express.static('.', {
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    } else if (path.endsWith('.mjs')) {
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
  
  // Construct file path - support both assets/ and pdfs/ directories
  let filePath;
  if (filename.endsWith('.pdf')) {
    filePath = path.join('pdfs', filename);
  } else {
    filePath = path.join('assets', filename);
  }
  
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
  const ext = path.extname(filename).toLowerCase();
  const defaultMimeTypes = {
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.tiff': 'image/tiff',
    '.avif': 'image/avif',
    '.jxl': 'image/jxl',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.xbm': 'image/x-xbitmap',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mpg': 'video/mpeg',
    '.mpeg': 'video/mpeg',
    '.zip': 'application/zip',
    '.eml': 'message/rfc822',
    '.m4a': 'audio/mp4',
    '.wma': 'audio/x-ms-wma',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.xlsb': 'application/vnd.ms-excel.sheet.binary.macroEnabled.12'
  };

  let contentType = mimeType || defaultMimeTypes[ext] || 'application/octet-stream';
  
  if (mimeType) {
    console.log(`⚠️ MIME Type Override: Using ${mimeType} instead of ${defaultMimeTypes[ext]}`);
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Express server running - can set real HTTP headers',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from current directory`);
  console.log(`🔗 API endpoints available at /api/download-test and /api/health`);
  console.log(`\n🧪 Now you can test real X-Download-Options headers!`);
});
