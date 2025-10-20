// Download Headers Test Logic
function initializeDownloadHeadersTest() {
  const fileTypeSelect = document.getElementById('fileType');
  const downloadOptionsSelect = document.getElementById('downloadOptions');
  const contentDispositionSelect = document.getElementById('contentDisposition');
  const testDownloadBtn = document.getElementById('testDownload');
  const testRedirectBtn = document.getElementById('testRedirect');
  const clearResultsBtn = document.getElementById('clearResults');
  const resultsContent = document.getElementById('results-content');
  const currentHeaders = document.getElementById('current-headers');
  
  let testCounter = 0;

  // Test configurations
  const fileConfigs = {
    docx: {
      extension: '.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      content: generateWordContent(),
      description: 'Word Document'
    },
    pdf: {
      extension: '.pdf',
      mimeType: 'application/pdf',
      content: generatePDFContent(),
      description: 'PDF Document'
    },
    txt: {
      extension: '.txt',
      mimeType: 'text/plain',
      content: generateTextContent(),
      description: 'Text File'
    },
    zip: {
      extension: '.zip',
      mimeType: 'application/zip',
      content: generateZipContent(),
      description: 'ZIP Archive'
    }
  };

  // Event listeners
  testDownloadBtn?.addEventListener('click', () => performDownloadTest(false));
  testRedirectBtn?.addEventListener('click', () => performDownloadTest(true));
  clearResultsBtn?.addEventListener('click', clearResults);

  function performDownloadTest(useRedirect = false) {
    testCounter++;
    const timestamp = new Date().toLocaleTimeString();
    
    const fileType = fileTypeSelect.value;
    const downloadOption = downloadOptionsSelect.value;
    const contentDisposition = contentDispositionSelect.value;
    const config = fileConfigs[fileType];
    
    // Log test start
    addResult('info', `Test #${testCounter} started: ${config.description} with X-Download-Options: ${downloadOption}`, timestamp);
    
    // Update headers display
    updateHeadersDisplay(config, downloadOption, contentDisposition);
    
    if (useRedirect) {
      performRedirectDownload(config, downloadOption, contentDisposition, testCounter);
    } else {
      performDirectDownload(config, downloadOption, contentDisposition, testCounter);
    }
  }

  function performDirectDownload(config, downloadOption, contentDisposition, testId) {
    try {
      // Create blob with appropriate content
      const blob = new Blob([config.content], { type: config.mimeType });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `test-${testId}${config.extension}`;
      
      // Simulate headers by adding them to the filename or using a service worker
      // Note: In a real scenario, these headers would be set by the server
      const headerInfo = {
        'Content-Type': config.mimeType,
        'Content-Disposition': getContentDispositionHeader(contentDisposition, link.download),
        'X-Download-Options': downloadOption === 'none' ? 'Not Set' : downloadOption
      };
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      addResult('success', `Download initiated: ${link.download}`, new Date().toLocaleTimeString());
      addResult('info', `Note: This is a client-side simulation. For full testing, use the server endpoints below.`, new Date().toLocaleTimeString());
      
      // Show server-side testing suggestion
      showServerSideOptions(config, downloadOption, contentDisposition, testId);
      
    } catch (error) {
      addResult('error', `Download failed: ${error.message}`, new Date().toLocaleTimeString());
    }
  }

  function performRedirectDownload(config, downloadOption, contentDisposition, testId) {
    // Create a URL that would simulate a redirect scenario
    const params = new URLSearchParams({
      file: config.extension.substring(1), // Remove the dot
      headers: downloadOption,
      disposition: contentDisposition,
      test: testId
    });
    
    // In a real scenario, this would be a server endpoint
    const redirectUrl = `/api/download-test?${params.toString()}`;
    
    addResult('info', `Redirect download would use: ${redirectUrl}`, new Date().toLocaleTimeString());
    addResult('info', `For full testing, implement server endpoint with proper headers`, new Date().toLocaleTimeString());
    
    // Fallback to direct download for demo
    performDirectDownload(config, downloadOption, contentDisposition, testId);
  }

  function showServerSideOptions(config, downloadOption, contentDisposition, testId) {
    const serverCode = generateServerCode(config, downloadOption, contentDisposition, testId);
    addResult('info', `Server implementation needed for full header testing:`, new Date().toLocaleTimeString());
    
    const codeBlock = document.createElement('div');
    codeBlock.style.cssText = 'background: #f5f5f5; padding: 1rem; margin: 0.5rem 0; border-radius: 4px; font-family: monospace; font-size: 0.8em; white-space: pre-wrap; overflow-x: auto;';
    codeBlock.textContent = serverCode;
    
    const lastResult = resultsContent.lastElementChild;
    if (lastResult) {
      lastResult.appendChild(codeBlock);
    }
  }

  function generateServerCode(config, downloadOption, contentDisposition, testId) {
    return `// Node.js/Express endpoint
app.get('/api/download-test', (req, res) => {
  const headers = {
    'Content-Type': '${config.mimeType}',
    'Content-Disposition': '${getContentDispositionHeader(contentDisposition, `test-${testId}${config.extension}`)}',
    ${downloadOption !== 'none' ? `'X-Download-Options': '${downloadOption}',` : '// X-Download-Options not set'}
    'Cache-Control': 'no-cache',
    'Content-Security-Policy': "default-src 'self'"
  };
  
  res.set(headers);
  res.sendFile(path.join(__dirname, 'test-files/sample${config.extension}'));
});

// Test this endpoint by visiting:
// ${window.location.origin}/api/download-test?file=${config.extension.substring(1)}&headers=${downloadOption}&disposition=${contentDisposition}&test=${testId}`;
  }

  function getContentDispositionHeader(disposition, filename) {
    switch (disposition) {
      case 'attachment':
        return 'attachment';
      case 'inline':
        return 'inline';
      case 'attachment-filename':
        return `attachment; filename="${filename}"`;
      default:
        return 'attachment';
    }
  }

  function updateHeadersDisplay(config, downloadOption, contentDisposition) {
    const headers = {
      'Content-Type': config.mimeType,
      'Content-Disposition': getContentDispositionHeader(contentDisposition, `test${config.extension}`),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    if (downloadOption !== 'none') {
      headers['X-Download-Options'] = downloadOption;
    }
    
    const headerText = Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    currentHeaders.textContent = `Response Headers:\n${headerText}`;
  }

  function addResult(type, message, time) {
    const resultDiv = document.createElement('div');
    resultDiv.className = `result-item ${type}`;
    resultDiv.innerHTML = `
      <span class="result-time">${time}</span>
      <div>${message}</div>
    `;
    
    resultsContent.appendChild(resultDiv);
    
    // Scroll to bottom
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearResults() {
    resultsContent.innerHTML = '<div style="font-style: italic; color: #666;">Results cleared. Run a new test to see results here.</div>';
    currentHeaders.textContent = 'Headers will be shown here when you run a test...';
    testCounter = 0;
  }

  // File content generators
  function generateWordContent() {
    // Minimal DOCX structure (this is a simplified version)
    // In practice, you'd want to use a proper DOCX generator or have a real file
    return `This is a test Word document for X-Download-Options header testing.

Content: Test document created at ${new Date().toISOString()}
Purpose: Reproduce download header issues in Chromium browsers
Issue: X-Download-Options: noopen prevents direct opening from download bubble

Instructions:
1. Download this file with X-Download-Options: noopen header
2. Try to open directly from browser download bubble
3. Observe if Word shows "file permissions" error
4. Repeat test without the header to see difference

Technical Details:
- Browser: ${navigator.userAgent}
- Timestamp: ${Date.now()}
- Test Environment: Web Testing Lab`;
  }

  function generatePDFContent() {
    // Minimal PDF structure
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
/Length 85
>>
stream
BT
/F1 12 Tf
100 700 Td
(X-Download-Options Header Test PDF) Tj
0 -20 Td
(Created: ${new Date().toISOString()}) Tj
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
0000000431 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
528
%%EOF`;
  }

  function generateTextContent() {
    return `X-Download-Options Header Test File
===================================

This is a test file for reproducing the X-Download-Options: noopen header issue.

Test Details:
- File Type: Text (.txt)
- Created: ${new Date().toISOString()}
- Browser: ${navigator.userAgent}
- Purpose: Header testing

The Issue:
When the X-Download-Options: noopen header is present, Chromium-based browsers
prevent direct opening of downloaded files from the download bubble. This can
cause "file permissions" errors, especially with Office documents.

Test Steps:
1. Download this file with the problematic header
2. Try opening from download bubble
3. Compare with version without header

Expected Results:
- With header: May show restrictions or warnings
- Without header: Normal opening behavior

For more information about this issue, check the browser console and
network tab to see the actual headers being sent.`;
  }

  function generateZipContent() {
    // Simple ZIP file header (empty ZIP)
    const zipHeader = new Uint8Array([
      0x50, 0x4B, 0x05, 0x06, // End of central directory signature
      0x00, 0x00,             // Number of this disk
      0x00, 0x00,             // Disk where central directory starts
      0x00, 0x00,             // Number of central directory records on this disk
      0x00, 0x00,             // Total number of central directory records
      0x00, 0x00, 0x00, 0x00, // Size of central directory
      0x00, 0x00, 0x00, 0x00, // Offset of central directory
      0x00, 0x00              // ZIP file comment length
    ]);
    return zipHeader;
  }
}

// SPA navigation handler
window.onNavigate_downloadheaders = function() {
  initializeDownloadHeadersTest();
};

// If loaded directly, auto-init
function checkAndInitialize() {
  if (document.getElementById('testDownload')) {
    initializeDownloadHeadersTest();
  }
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndInitialize);
} else {
  checkAndInitialize();
}
