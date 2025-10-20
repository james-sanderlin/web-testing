// Download Headers Test Logic - Clean version with network visibility
function initializeDownloadHeadersTest() {
  // Get DOM elements
  const fileTypeSelect = document.getElementById('fileType');
  const downloadOptionsSelect = document.getElementById('downloadOptions');
  const contentDispositionSelect = document.getElementById('contentDisposition');
  const mimeTypeOverrideSelect = document.getElementById('mimeTypeOverride');
  const testDownloadBtn = document.getElementById('testDownload');
  const testRedirectBtn = document.getElementById('testRedirect');
  const clearResultsBtn = document.getElementById('clearResults');
  const resultsContent = document.getElementById('results-content');
  const currentHeaders = document.getElementById('current-headers');
  
  let testCounter = 0;

  // ====== HELPER FUNCTIONS ======

  function addResult(type, message, time) {
    const resultDiv = document.createElement('div');
    resultDiv.className = `result-item ${type}`;
    resultDiv.innerHTML = `
      <span class="result-time">${time}</span>
      <div>${message}</div>
    `;
    
    resultsContent.appendChild(resultDiv);
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearResults() {
    resultsContent.innerHTML = '<div style="font-style: italic; color: #666;">Results cleared. Run a new test to see results here.</div>';
    currentHeaders.textContent = 'Headers will be shown here when you run a test...';
    testCounter = 0;
  }

  function getContentDispositionHeader(disposition, filename) {
    return disposition === 'inline' 
      ? `inline; filename="${filename}"` 
      : `attachment; filename="${filename}"`;
  }

  function updateHeadersDisplay(config, downloadOption, contentDisposition, mimeTypeOverride) {
    const filename = `test-${testCounter}${config.extension}`;
    
    // Apply MIME type override
    let actualMimeType = config.mimeType;
    if (mimeTypeOverride === 'octet-stream') {
      actualMimeType = 'application/octet-stream';
    } else if (mimeTypeOverride === 'plain') {
      actualMimeType = 'text/plain';
    }
    
    const headers = {
      'Content-Type': actualMimeType,
      'Content-Disposition': getContentDispositionHeader(contentDisposition, filename),
      'X-Download-Options': downloadOption === 'none' ? 'Not Set' : downloadOption,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };
    
    const headerText = Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    currentHeaders.textContent = `Response Headers:\n${headerText}`;
  }

  async function checkServerAvailability() {
    try {
      console.log('🔍 Checking server health at /api/health...');
      const response = await fetch('/api/health');
      console.log('📡 Health check response:', response.status, response.statusText);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Server data:', data);
        addResult('success', `✅ Express server detected: ${data.message}`, new Date().toLocaleTimeString());
        return true;
      }
    } catch (error) {
      console.log('❌ Health check failed:', error);
      addResult('warning', `⚠️ Express server not available. Using static file server fallback.`, new Date().toLocaleTimeString());
      addResult('info', `To test real X-Download-Options headers, run: npm run server`, new Date().toLocaleTimeString());
    }
    return false;
  }

  async function performRealServerDownload(config, downloadOption, contentDisposition, testId) {
    const mimeTypeOverride = mimeTypeOverrideSelect.value;
    
    const params = new URLSearchParams({
      file: config.extension.substring(1),
      headers: downloadOption,
      disposition: contentDisposition,
      mimeType: mimeTypeOverride,
      test: testId
    });
    
    const serverUrl = `/api/download-test?${params.toString()}`;
    console.log('🚀 Making download request to:', serverUrl);
    addResult('info', `🔥 Using Express server endpoint: ${serverUrl}`, new Date().toLocaleTimeString());
    
    // Add MIME type warning for problematic configurations
    if (mimeTypeOverride === 'octet-stream') {
      addResult('warning', `⚠️ MIME Type Override: application/octet-stream - This should reproduce the customer issue!`, new Date().toLocaleTimeString());
    } else if (mimeTypeOverride === 'plain') {
      addResult('warning', `⚠️ MIME Type Override: text/plain - Wrong MIME type for testing`, new Date().toLocaleTimeString());
    }

    // Make a HEAD request first to inspect headers (visible in Network tab)
    try {
      addResult('info', `🔍 Inspecting headers first (check Network tab for HEAD request)...`, new Date().toLocaleTimeString());
      
      const headResponse = await fetch(serverUrl, { method: 'HEAD' });
      console.log('📡 HEAD response status:', headResponse.status);
      console.log('📡 HEAD response headers:', [...headResponse.headers.entries()]);
      
      const headersList = [...headResponse.headers.entries()]
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      addResult('success', `📋 Server response headers (from HEAD request):\n${headersList}`, new Date().toLocaleTimeString());
      
    } catch (error) {
      console.error('❌ HEAD request failed:', error);
      addResult('warning', `HEAD request failed: ${error.message}`, new Date().toLocaleTimeString());
    }

    // Now trigger the actual download
    console.log('💾 Triggering actual download...');
    addResult('info', `💾 Starting download: ${serverUrl}`, new Date().toLocaleTimeString());
    
    const link = document.createElement('a');
    link.href = serverUrl;
    link.download = `test-${testId}${config.extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addResult('success', `✅ Real server download with X-Download-Options: ${downloadOption}`, new Date().toLocaleTimeString());
    
    // Special warning for the customer's exact issue
    if (mimeTypeOverride === 'octet-stream' && config.extension === '.docx') {
      addResult('error', `💥 CUSTOMER ISSUE REPRODUCTION: Word document served as application/octet-stream! This should cause the exact issue - Word won't open properly from download bubble.`, new Date().toLocaleTimeString());
      addResult('info', `Expected behavior: Download bubble shows generic file icon, "Open" button may be disabled or launch wrong app, Word shows permission/corruption errors.`, new Date().toLocaleTimeString());
    }
  }

  function performAssetFileDownload(config, downloadOption, contentDisposition, testId) {
    try {
      const assetUrl = 'assets/word-test.docx';
      const filename = `test-${testId}${config.extension}`;
      
      addResult('info', `Downloading real Word document: ${assetUrl}`, new Date().toLocaleTimeString());
      
      const link = document.createElement('a');
      link.href = assetUrl;
      link.download = filename;
      
      const headerNote = `Note: This downloads the real DOCX file, but cannot set custom headers like X-Download-Options: ${downloadOption} due to static file server limitations.`;
      addResult('info', headerNote, new Date().toLocaleTimeString());
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addResult('success', `Real Word document downloaded: ${filename}`, new Date().toLocaleTimeString());
      
    } catch (error) {
      addResult('error', `Asset download failed: ${error.message}`, new Date().toLocaleTimeString());
    }
  }

  function performFallbackDownload(config, downloadOption, contentDisposition, testId) {
    if (config.extension === '.docx') {
      return performAssetFileDownload(config, downloadOption, contentDisposition, testId);
    }
    
    addResult('info', `Since we're using static file server, falling back to client-side download`, new Date().toLocaleTimeString());
    performDirectDownload(config, downloadOption, contentDisposition, testId);
  }

  async function performRedirectDownload(config, downloadOption, contentDisposition, testId) {
    const hasExpressServer = await checkServerAvailability();
    
    if (hasExpressServer) {
      return performRealServerDownload(config, downloadOption, contentDisposition, testId);
    } else {
      return performFallbackDownload(config, downloadOption, contentDisposition, testId);
    }
  }

  function performDirectDownload(config, downloadOption, contentDisposition, testId) {
    try {
      const blob = new Blob([config.content()], { type: config.mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `test-${testId}${config.extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      addResult('success', `Client-side download completed: ${link.download}`, new Date().toLocaleTimeString());
      addResult('info', `Note: Client-side downloads cannot set real HTTP headers. Server test recommended for accurate reproduction.`, new Date().toLocaleTimeString());
      
    } catch (error) {
      addResult('error', `Download failed: ${error.message}`, new Date().toLocaleTimeString());
    }
  }

  // Content generators
  function generateWordContent() {
    return `This is a test Word document for X-Download-Options header testing.

Content: Test document created at ${new Date().toISOString()}
Purpose: Reproduce download header issues in Chromium browsers
Issue: X-Download-Options: noopen prevents direct opening from download bubble

Instructions:
1. Download this file with X-Download-Options: noopen header
2. Try to open directly from browser download bubble
3. Observe any permission errors or restrictions
4. Compare with downloads without the header

Technical Details:
- Browser: ${navigator.userAgent}
- Timestamp: ${Date.now()}

Note: This is a simplified text version. For real testing, use actual DOCX files.`;
  }

  function generatePDFContent() {
    return `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 55>>stream
BT/F1 12 Tf 100 700 Td(X-Download-Options Test PDF)Tj ET
endstream endobj
xref 0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer<</Size 5/Root 1 0 R>>startxref 300 %%EOF`;
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
prevent direct opening of downloaded files from the download bubble.

For more information about this issue, check the browser console and network tab.`;
  }

  function generateZipContent() {
    return new Uint8Array([
      0x50, 0x4B, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
  }

  // ====== MAIN LOGIC ======

  const fileConfigs = {
    docx: {
      extension: '.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      content: () => generateWordContent(),
      description: 'Word Document'
    },
    pdf: {
      extension: '.pdf',
      mimeType: 'application/pdf',
      content: () => generatePDFContent(),
      description: 'PDF Document'
    },
    txt: {
      extension: '.txt',
      mimeType: 'text/plain',
      content: () => generateTextContent(),
      description: 'Text File'
    },
    zip: {
      extension: '.zip',
      mimeType: 'application/zip',
      content: () => generateZipContent(),
      description: 'ZIP Archive'
    }
  };

  function performDownloadTest(useRedirect = false) {
    testCounter++;
    const timestamp = new Date().toLocaleTimeString();
    
    const fileType = fileTypeSelect.value;
    const downloadOption = downloadOptionsSelect.value;
    const contentDisposition = contentDispositionSelect.value;
    const mimeTypeOverride = mimeTypeOverrideSelect.value;
    const config = fileConfigs[fileType];
    
    let testDescription = `${config.description} with X-Download-Options: ${downloadOption}`;
    if (mimeTypeOverride !== 'correct') {
      testDescription += ` and MIME type: ${mimeTypeOverride === 'octet-stream' ? 'application/octet-stream' : 'text/plain'}`;
    }
    
    addResult('info', `Test #${testCounter} started: ${testDescription}`, timestamp);
    updateHeadersDisplay(config, downloadOption, contentDisposition, mimeTypeOverride);
    
    if (useRedirect) {
      performRedirectDownload(config, downloadOption, contentDisposition, testCounter);
    } else {
      performDirectDownload(config, downloadOption, contentDisposition, testCounter);
    }
  }

  // Event listeners
  testDownloadBtn?.addEventListener('click', () => performDownloadTest(false));
  testRedirectBtn?.addEventListener('click', () => performDownloadTest(true));
  clearResultsBtn?.addEventListener('click', clearResults);
}

// Export function for navigation handler
window.onNavigate_download_headers = function() {
  initializeDownloadHeadersTest();
};

// Initialize if DOM is ready
function checkAndInitialize() {
  if (document.getElementById('testDownload')) {
    initializeDownloadHeadersTest();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndInitialize);
} else {
  checkAndInitialize();
}
