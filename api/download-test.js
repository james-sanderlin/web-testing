// Download Headers Test API
// This simulates the X-Download-Options header issue

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { file = 'docx', headers = 'noopen', disposition = 'attachment', test = '1' } = req.query;
  
  // File configurations
  const fileConfigs = {
    docx: {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: '.docx',
      content: generateWordContent()
    },
    pdf: {
      mimeType: 'application/pdf',
      extension: '.pdf',
      content: generatePDFContent()
    },
    txt: {
      mimeType: 'text/plain',
      extension: '.txt',
      content: generateTextContent()
    },
    zip: {
      mimeType: 'application/zip',
      extension: '.zip',
      content: generateZipContent()
    }
  };

  const config = fileConfigs[file] || fileConfigs.docx;
  const filename = `test-${test}${config.extension}`;

  // Set response headers
  const responseHeaders = {
    'Content-Type': config.mimeType,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  // Set Content-Disposition
  switch (disposition) {
    case 'inline':
      responseHeaders['Content-Disposition'] = 'inline';
      break;
    case 'attachment-filename':
      responseHeaders['Content-Disposition'] = `attachment; filename="${filename}"`;
      break;
    default:
      responseHeaders['Content-Disposition'] = 'attachment';
  }

  // Set X-Download-Options header based on request
  if (headers !== 'none') {
    responseHeaders['X-Download-Options'] = headers;
  }

  // Apply headers
  Object.entries(responseHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Log the test for debugging
  console.log(`Download test: ${filename}, X-Download-Options: ${headers}, Content-Disposition: ${disposition}`);

  // Send the file content
  res.status(200).send(config.content);
}

function generateWordContent() {
  return `X-Download-Options Header Test Document

This is a test Word document created to reproduce the X-Download-Options: noopen header issue.

Created: ${new Date().toISOString()}
Test Purpose: Demonstrate download header behavior in Chromium browsers

The Issue:
When X-Download-Options: noopen is set, browsers may prevent direct opening
of downloaded files from the download bubble, especially Office documents.

Test Instructions:
1. Download this file with X-Download-Options: noopen
2. Try to open directly from browser download bubble
3. Check if you get "file permissions" or similar errors
4. Repeat without the header to compare behavior

Expected Results:
- With X-Download-Options: noopen → May fail to open directly
- Without the header → Should open normally

Browser Information:
This test should be performed in Chromium-based browsers like Chrome, Edge, or similar.

Technical Details:
The X-Download-Options header was originally designed for Internet Explorer to control
how downloaded files are handled, but it can interfere with modern browser behavior.`;
}

function generatePDFContent() {
  return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 150
>>
stream
BT
/F1 12 Tf
50 750 Td
(X-Download-Options Header Test) Tj
0 -20 Td
(Created: ${new Date().toISOString()}) Tj
0 -30 Td
(This PDF tests download header behavior) Tj
0 -20 Td
(in Chromium-based browsers.) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000110 00000 n 
0000000297 00000 n 
0000000498 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
595
%%EOF`;
}

function generateTextContent() {
  return `X-Download-Options Header Test File
Created: ${new Date().toISOString()}

This file tests the X-Download-Options header behavior.

Issue Description:
The X-Download-Options: noopen header can prevent files from opening
directly from the browser download bubble in Chromium-based browsers.

Test Environment:
- Server-side generated file
- Configurable headers
- Multiple file type support

To reproduce the issue:
1. Download with X-Download-Options: noopen
2. Try opening from download bubble
3. Compare with downloads without the header

This affects primarily Office documents (.docx, .xlsx, .pptx) but
may also impact other file types depending on browser behavior.`;
}

function generateZipContent() {
  // Create a minimal ZIP file with a test entry
  const testContent = `Test file inside ZIP
Created: ${new Date().toISOString()}
Purpose: X-Download-Options header testing`;
  
  // This is a simplified ZIP structure - in production you'd use a proper ZIP library
  const zipData = Buffer.from([
    0x50, 0x4B, 0x03, 0x04, // Local file header signature
    0x14, 0x00,             // Version needed to extract
    0x00, 0x00,             // General purpose bit flag
    0x00, 0x00,             // Compression method (stored)
    0x00, 0x00,             // File last modification time
    0x00, 0x00,             // File last modification date
    0x00, 0x00, 0x00, 0x00, // CRC-32
    0x00, 0x00, 0x00, 0x00, // Compressed size
    0x00, 0x00, 0x00, 0x00, // Uncompressed size
    0x08, 0x00,             // File name length
    0x00, 0x00,             // Extra field length
    // File name
    0x74, 0x65, 0x73, 0x74, 0x2E, 0x74, 0x78, 0x74, // "test.txt"
    // Central directory
    0x50, 0x4B, 0x05, 0x06, // End of central directory signature
    0x00, 0x00,             // Number of this disk
    0x00, 0x00,             // Disk where central directory starts
    0x00, 0x00,             // Number of central directory records on this disk
    0x00, 0x00,             // Total number of central directory records
    0x00, 0x00, 0x00, 0x00, // Size of central directory
    0x00, 0x00, 0x00, 0x00, // Offset of central directory
    0x00, 0x00              // ZIP file comment length
  ]);
  
  return zipData;
}
