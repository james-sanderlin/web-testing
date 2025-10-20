// Download Headers Test Logic
function initializeDownloadHeadersTest() {
  // Get DOM elements
  const fileTypeSelect = document.getElementById('fileType');
  const downloadOptionsSelect = document.getElementById('downloadOptions');
  const contentDispositionSelect = document.getElementById('contentDisposition');
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

  function updateHeadersDisplay(config, downloadOption, contentDisposition) {
    const filename = `test-${testCounter}${config.extension}`;
    const headers = {
      'Content-Type': config.mimeType,
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
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        addResult('success', `✅ Express server detected: ${data.message}`, new Date().toLocaleTimeString());
        return true;
      }
    } catch (error) {
      addResult('warning', `⚠️ Express server not available. Using static file server fallback.`, new Date().toLocaleTimeString());
      addResult('info', `To test real X-Download-Options headers, run: npm run server`, new Date().toLocaleTimeString());
    }
    return false;
  }

  function performRealServerDownload(config, downloadOption, contentDisposition, testId) {
    const params = new URLSearchParams({
      file: config.extension.substring(1),
      headers: downloadOption,
      disposition: contentDisposition,
      test: testId
    });
    
    const serverUrl = `/api/download-test?${params.toString()}`;
    addResult('info', `🔥 Using Express server endpoint: ${serverUrl}`, new Date().toLocaleTimeString());
    
    const link = document.createElement('a');
    link.href = serverUrl;
    link.download = `test-${testId}${config.extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addResult('success', `✅ Real server download with X-Download-Options: ${downloadOption}`, new Date().toLocaleTimeString());
    
    const headerInfo = {
      'Content-Type': config.mimeType,
      'Content-Disposition': getContentDispositionHeader(contentDisposition, link.download),
      'X-Download-Options': downloadOption === 'none' ? 'Not Set' : downloadOption,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };
    
    const headerText = Object.entries(headerInfo)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    addResult('info', `🌐 Real HTTP headers being sent:\n${headerText}`, new Date().toLocaleTimeString());
    
    if (downloadOption === 'noopen') {
      addResult('warning', `🚨 X-Download-Options: noopen header is now active! This should reproduce the customer issue in Chromium browsers.`, new Date().toLocaleTimeString());
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
      
      const headerInfo = {
        'Content-Type': config.mimeType,
        'Content-Disposition': getContentDispositionHeader(contentDisposition, filename),
        'X-Download-Options': downloadOption === 'none' ? 'Not Set' : downloadOption,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      };
      
      const headerText = Object.entries(headerInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      addResult('info', `Headers that would be set on real server:\n${headerText}`, new Date().toLocaleTimeString());
      
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
      
      const headerInfo = {
        'Content-Type': config.mimeType,
        'Content-Disposition': getContentDispositionHeader(contentDisposition, link.download),
        'X-Download-Options': downloadOption === 'none' ? 'Not Set' : downloadOption
      };
      
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
    const config = fileConfigs[fileType];
    
    addResult('info', `Test #${testCounter} started: ${config.description} with X-Download-Options: ${downloadOption}`, timestamp);
    updateHeadersDisplay(config, downloadOption, contentDisposition);
    
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