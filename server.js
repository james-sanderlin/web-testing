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
  const { file, headers, disposition, mimeType, test } = req.query;
  
  // Log the download request
  console.log(`📥 Download request received:`, {
    file,
    headers,
    disposition,
    mimeType,
    test,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Map file types to actual files
  const fileMap = {
    'docx': 'assets/word-test.docx',
    'pdf': 'pdfs/editable-form.pdf',
    'txt': 'assets/test-file.txt'
  };
  
  const filePath = fileMap[file];
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Get file info
  const fileName = `test-${test || Date.now()}.${file}`;
  const stats = fs.statSync(filePath);
  
  // Set headers based on test configuration
  const mimeTypes = {
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'pdf': 'application/pdf',
    'txt': 'text/plain'
  };
  
  // Determine Content-Type based on MIME type override
  let contentType = mimeTypes[file] || 'application/octet-stream';
  
  if (mimeType === 'octet-stream') {
    contentType = 'application/octet-stream';
    console.log(`🚨 MIME Type Override: Using application/octet-stream instead of ${mimeTypes[file]}`);
  } else if (mimeType === 'plain') {
    contentType = 'text/plain';
    console.log(`⚠️ MIME Type Override: Using text/plain instead of ${mimeTypes[file]}`);
  }
  
  // Set Content-Type
  console.log(`🔥 Setting Content-Type: ${contentType} for ${fileName}`);
  res.setHeader('Content-Type', contentType);
  
  // Set Content-Disposition
  const dispositionType = disposition || 'attachment';
  res.setHeader('Content-Disposition', `${dispositionType}; filename="${fileName}"`);
  
  // Set X-Download-Options header (the key part!)
  if (headers && headers !== 'none') {
    res.setHeader('X-Download-Options', headers);
    console.log(`🔥 Setting X-Download-Options: ${headers} for ${fileName}`);
  } else {
    console.log(`📝 No X-Download-Options header for ${fileName}`);
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
  console.log(`Download test: ${fileName}`);
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
