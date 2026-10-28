const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Stream-based upload endpoints MUST be defined BEFORE body parsing middleware
// Define upload handler function first
function handleStreamUpload(req, res, messageType) {
  let totalSize = 0;
  const startTime = Date.now();

  // Disable timeout for large uploads
  req.socket.setTimeout(0);
  req.setTimeout(0);

  req.on('data', (chunk) => {
    totalSize += chunk.length;
  });

  req.on('end', () => {
    const duration = (Date.now() - startTime) / 1000;
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    const speedMbps = totalSize > 0 ? ((totalSize / (1024 * 1024)) / duration).toFixed(2) : 0;

    res.json({
      success: true,
      message: `${messageType} uploaded successfully`,
      bytesReceived: totalSize,
      duration: parseFloat(duration.toFixed(2)),
      sizeMB: parseFloat(sizeMB),
      speedMbps: parseFloat(speedMbps),
      timestamp: new Date().toISOString()
    });
  });

  req.on('error', (err) => {
    console.error('Upload error:', err);
    res.status(400).json({
      success: false,
      error: 'Upload failed: ' + err.message
    });
  });
}

// Define upload routes BEFORE middleware
app.post('/api/upload', (req, res) => {
  handleStreamUpload(req, res, 'File');
});

app.post('/api/upload-multiple', (req, res) => {
  handleStreamUpload(req, res, 'Multiple files');
});

app.post('/api/upload-directory', (req, res) => {
  handleStreamUpload(req, res, 'Directory');
});

app.post('/api/upload-images', (req, res) => {
  handleStreamUpload(req, res, 'Images');
});

// NOW apply body parsing middleware for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  '.7z': 'application/x-7z-compressed',
  '.gtar': 'application/x-gtar',
  '.jar': 'application/java-archive',
  '.taz': 'application/x-gtar-compressed',
  '.z': 'application/x-compress',
  '.zipx': 'application/zip',
  '.eml': 'message/rfc822',
  '.msg': 'application/vnd.ms-outlook',
  '.exe': 'application/x-msdownload',
  '.dmg': 'application/x-apple-diskimage',
  '.iso': 'application/x-iso9660-image',
  '.rpm': 'application/x-rpm',
  '.csv': 'text/csv',
  '.m4a': 'audio/mp4',
  '.wma': 'audio/x-ms-wma',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xlsb': 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.rdp': 'application/x-rdp',
  '.rtf': 'application/rtf'
};

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  return defaultMimeTypes[ext] || 'application/octet-stream';
}

function applyExtensionOverride(filename, extension) {
  const ext = String(extension || '').replace(/^\.+/, '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!ext) return filename;
  return path.basename(filename, path.extname(filename)) + '.' + ext;
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
  const { filename, headers, disposition, mimeType, test, extension } = req.query;
  
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
    extension,
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
  const suffixedFilename = test ? `${path.basename(filename, path.extname(filename))}-${test}${path.extname(filename)}` : filename;
  const downloadFilename = applyExtensionOverride(suffixedFilename, extension);

  if (downloadFilename !== suffixedFilename) {
    console.log(`⚠️ Extension Override: Saving ${suffixedFilename} as ${downloadFilename}`);
  }
  
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

// 7-Zip compiled to WebAssembly. No native binary and no disk access, so this
// behaves identically locally and on serverless hosts like Vercel.
const SevenZipWasm = require('7z-wasm/7zz.umd.js');

// Read the .wasm ourselves and hand it to the factory. Emscripten would
// otherwise resolve it relative to its own script, which bundlers get wrong.
const SEVEN_ZIP_WASM = fs.readFileSync(
  path.join(path.dirname(require.resolve('7z-wasm/7zz.umd.js')), '7zz.wasm')
);

// Build a password-protected 7z on every request, so no two downloads are byte-identical.
// The archived text file carries a fresh timestamp, and 7z's AES uses a random salt/IV,
// so even back-to-back requests produce different bytes.
app.get('/api/dynamic-7z', async (req, res) => {
  const password = req.query.password || '1234';
  const now = new Date();
  const stamp = now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const nonce = crypto.randomBytes(4).toString('hex');
  const downloadName = `dynamic-${stamp}-${nonce}.7z`;
  const innerName = `timestamp-${stamp}.txt`;

  const contents = [
    `Dynamic 7z generated: ${now.toISOString()}`,
    `Unix timestamp: ${Math.floor(now.getTime() / 1000)}`,
    `Nonce: ${nonce}`,
    `Password: ${password}`,
    '',
    'This archive is built fresh on every request. The timestamp above and the',
    'random AES salt mean the bytes differ every time, so nothing can cache it.'
  ].join('\n');

  try {
    // A fresh instance per request: Emscripten's in-memory filesystem is
    // stateful and callMain is not safely re-entrant.
    const sevenZip = await SevenZipWasm({
      wasmBinary: SEVEN_ZIP_WASM,
      print: () => {},
      printErr: () => {}
    });

    sevenZip.FS.writeFile(innerName, contents);
    // Arguments are passed as argv, never through a shell, so the
    // user-supplied password cannot be injected.
    const exitCode = sevenZip.callMain(['a', '-t7z', `-p${password}`, '-mx=5', downloadName, innerName]);
    if (exitCode !== 0) {
      throw new Error(`7-Zip exited with code ${exitCode}`);
    }

    const archive = Buffer.from(sevenZip.FS.readFile(downloadName));
    console.log(`✅ Dynamic 7z: ${downloadName} (${archive.length} bytes, password "${password}")`);

    res.setHeader('Content-Type', req.query.mimeType || getMimeType(downloadName));
    res.setHeader('Content-Disposition', `attachment; filename="${applyExtensionOverride(downloadName, req.query.extension)}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // res.end rather than res.send: Express would attach an ETag, which is
    // pointless on a body that is unique per request.
    res.setHeader('Content-Length', archive.length);
    res.end(archive);
  } catch (err) {
    console.error('❌ Dynamic 7z: archive creation failed', err);
    res.status(500).json({ error: 'Failed to create archive', detail: String(err.message || err) });
  }
});

// ZIPX detection archives. Each one is a minimal single-entry zip whose compression
// method field is set to an extended method. The payload is stored uncompressed, so the
// method is detectable from the headers but the archive will not extract.
const ZIPX_METHODS = new Set([12, 14, 93, 94, 95, 96, 97, 98, 99]);

let crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function buildZipx(method) {
  const isAes = method === 99;
  const name = Buffer.from('sample.txt');
  const data = Buffer.from(`ZIPX detection sample, method ${method}`);

  let payload = data;
  let extra = Buffer.alloc(0);
  let crc = crc32(data);
  let flags = 0;
  let versionNeeded = 63;

  if (isAes) {
    // WinZip AES (AE-2): salt, password verifier, data, authentication code.
    payload = Buffer.concat([
      Buffer.alloc(16, 0xA5),
      Buffer.from([0x5A, 0xA5]),
      data,
      Buffer.alloc(10, 0x3C)
    ]);
    extra = Buffer.alloc(11);
    extra.writeUInt16LE(0x9901, 0); // header ID
    extra.writeUInt16LE(7, 2);      // data size
    extra.writeUInt16LE(0x0002, 4); // vendor version (AE-2)
    extra.write('AE', 6, 'ascii');  // vendor ID
    extra.writeUInt8(0x03, 8);      // strength (AES-256)
    extra.writeUInt16LE(98, 9);     // actual compression method (PPMd)
    crc = 0;
    flags = 1;
    versionNeeded = 51;
  }

  const dosTime = 0x6000; // 12:00:00
  const dosDate = 0x5A21; // 2025-01-01

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(versionNeeded, 4);
  local.writeUInt16LE(flags, 6);
  local.writeUInt16LE(method, 8);
  local.writeUInt16LE(dosTime, 10);
  local.writeUInt16LE(dosDate, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(payload.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(extra.length, 28);

  const localPart = Buffer.concat([local, name, extra, payload]);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(63, 4); // version made by
  central.writeUInt16LE(versionNeeded, 6);
  central.writeUInt16LE(flags, 8);
  central.writeUInt16LE(method, 10);
  central.writeUInt16LE(dosTime, 12);
  central.writeUInt16LE(dosDate, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(payload.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt16LE(extra.length, 30);
  central.writeUInt16LE(0, 32); // comment length
  central.writeUInt16LE(0, 34); // disk number start
  central.writeUInt16LE(0, 36); // internal attributes
  central.writeUInt32LE(0, 38); // external attributes
  central.writeUInt32LE(0, 42); // local header offset

  const centralPart = Buffer.concat([central, name, extra]);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(centralPart.length, 12);
  eocd.writeUInt32LE(localPart.length, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([localPart, centralPart, eocd]);
}

app.get('/api/zipx', (req, res) => {
  const method = Number(req.query.method);
  if (!ZIPX_METHODS.has(method)) {
    return res.status(400).json({
      error: 'method must be one of ' + Array.from(ZIPX_METHODS).join(', ')
    });
  }

  const downloadName = `zipx-method-${method}.zipx`;
  const finalName = applyExtensionOverride(downloadName, req.query.extension);
  const archive = buildZipx(method);
  console.log(`✅ ZIPX: ${finalName} (method ${method}, ${archive.length} bytes)`);

  res.setHeader('Content-Type', req.query.mimeType || getMimeType(downloadName));
  res.setHeader('Content-Disposition', `attachment; filename="${finalName}"`);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Length', archive.length);
  res.end(archive);
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

// Stream-based upload endpoints (no buffering, unlimited size)
function handleStreamUpload(req, res, messageType) {
  let totalSize = 0;
  const startTime = Date.now();

  // Disable timeout for large uploads
  req.socket.setTimeout(0);
  req.setTimeout(0);

  req.on('data', (chunk) => {
    totalSize += chunk.length;
  });

  req.on('end', () => {
    const duration = (Date.now() - startTime) / 1000;
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    const speedMbps = totalSize > 0 ? ((totalSize / (1024 * 1024)) / duration).toFixed(2) : 0;

    res.json({
      success: true,
      message: `${messageType} uploaded successfully`,
      bytesReceived: totalSize,
      duration: parseFloat(duration.toFixed(2)),
      sizeMB: parseFloat(sizeMB),
      speedMbps: parseFloat(speedMbps),
      timestamp: new Date().toISOString()
    });
  });

  req.on('error', (err) => {
    console.error('Upload error:', err);
    res.status(400).json({
      success: false,
      error: 'Upload failed: ' + err.message
    });
  });
}

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
