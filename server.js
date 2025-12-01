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
    'txt': 'assets/test-file.txt',
    'png': 'assets/sample.png',
    'apng': 'assets/sample-apng.png',
    'jpg': 'assets/sample.jpg',
    'gif': 'assets/sample.gif',
    'tiff': 'assets/sample.tiff',
    'avif': 'assets/sample.avif',
    'jxl': 'assets/sample.jxl',
    'bmp': 'assets/sample.bmp',
    'webp': 'assets/sample.webp',
    'xbm': 'assets/sample.xbm',
    'mp4': 'assets/sample-video.mp4',
    'webm': 'assets/sample-video.webm',
    'mpg': 'assets/sample-video.mpg',
    'zip': 'assets/hello-world.zip',
    'eml': 'assets/sample-email.eml',
    'exe': 'assets/test-exe.exe',
    'csv': 'assets/hidden-exe.csv',
    'svg': 'assets/hexagon.svg',
    'heic': 'assets/cat.HEIC',
    'mp3': 'assets/test.mp3',
    'wav': 'assets/test.wav',
    'm4a': 'assets/test.m4a',
    'wma': 'assets/test.wma',
    'ogg': 'assets/test.ogg',
    'flac': 'assets/test.flac',
    'xlsb': 'assets/XLSB_TEST.xlsb'
  };
  
  const filePath = fileMap[file];
  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    console.error(`   Looking in: ${path.resolve(filePath || 'undefined')}`);
    console.error(`   Available files:`, Object.keys(fileMap));
    return res.status(404).json({ 
      error: 'File not found',
      requested: file,
      path: filePath,
      resolved: path.resolve(filePath || 'undefined')
    });
  }
  
  // Get file info and extract the original filename
  const originalFilename = path.basename(filePath);
  const fileExtension = path.extname(filePath);
  const baseFilename = path.basename(filePath, fileExtension);
  
  // Use original filename or create timestamped version
  const fileName = test ? `${baseFilename}-${test}${fileExtension}` : originalFilename;
  const stats = fs.statSync(filePath);
  
  console.log(`✅ File found: ${filePath} (${stats.size} bytes)`);
  
  // Set headers based on test configuration
  const mimeTypes = {
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'png': 'image/png',
    'apng': 'image/apng',
    'jpg': 'image/jpeg',
    'gif': 'image/gif',
    'tiff': 'image/tiff',
    'avif': 'image/avif',
    'jxl': 'image/jxl',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'xbm': 'image/x-xbitmap',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mpg': 'video/mpeg',
    'zip': 'application/zip',
    'eml': 'message/rfc822',
    'exe': 'application/x-msdownload',
    'csv': 'text/csv',
    'svg': 'image/svg+xml',
    'heic': 'image/heic',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/mp4',
    'wma': 'audio/x-ms-wma',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'xlsb': 'application/vnd.ms-excel.sheet.binary.macroEnabled.12'
  };
  
  // Determine Content-Type based on MIME type override
  let contentType = mimeTypes[file] || 'application/octet-stream';
  
  // If mimeType query parameter is provided, use it directly as the Content-Type
  if (mimeType) {
    contentType = mimeType;
    console.log(`⚠️ MIME Type Override: Using ${mimeType} instead of ${mimeTypes[file]}`);
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
