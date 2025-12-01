// Global MIME override state
let globalMimeOverride = null;

// Download page logic
function initializeDownloadPage() {
  // Search functionality
  const searchInput = document.getElementById('file-search');
  const fileCards = document.querySelectorAll('.file-card');
  
  // Load MIME override from localStorage
  const savedMime = localStorage.getItem('mimeOverride');
  if (savedMime) {
    globalMimeOverride = savedMime;
    updateMimeStatus();
  }
  
  if (searchInput) {
    // Handle URL parameters for deep-linkable searches
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    if (searchTerm) {
      searchInput.value = searchTerm;
      filterFiles(searchTerm);
    }
    
    searchInput.addEventListener('input', function(e) {
      const term = e.target.value;
      filterFiles(term);
      
      // Update URL for deep-linking
      if (term) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('search', term);
        window.history.replaceState({}, '', newUrl);
      } else {
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('search');
        window.history.replaceState({}, '', newUrl);
      }
    });
  }
  
  function filterFiles(searchTerm) {
    const term = searchTerm.toLowerCase();
    fileCards.forEach(card => {
      const filename = card.dataset.filename?.toLowerCase() || '';
      const type = card.dataset.type?.toLowerCase() || '';
      const size = card.dataset.size?.toLowerCase() || '';
      const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const description = card.querySelector('p')?.textContent.toLowerCase() || '';
      
      const matches = filename.includes(term) || 
                     type.includes(term) || 
                     size.includes(term) || 
                     title.includes(term) || 
                     description.includes(term);
      
      card.classList.toggle('hidden', !matches);
    });
  }
}

// SPA navigation handler
window.onNavigate_download = function() {
  initializeDownloadPage();
};

// If loaded directly, auto-init
function checkAndInitialize() {
  if (document.getElementById('file-search')) {
    initializeDownloadPage();
  }
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndInitialize);
} else {
  checkAndInitialize();
}

// Download functions
window.downloadTinyFile = function() {
  const content = "This is a tiny text file for testing downloads.\nIt contains minimal content to stay under 1KB.";
  downloadTextFile(content, "tiny-file.txt");
};

window.downloadLargeFile = function() {
  // Generate approximately 10MB of text
  const baseText = "This is sample text content repeated many times to create a large file for testing downloads. ";
  const repetitions = Math.ceil(10 * 1024 * 1024 / baseText.length);
  const content = baseText.repeat(repetitions);
  downloadTextFile(content, "large-file.txt");
};

window.downloadTimestampFile = function() {
  const now = new Date();
  const content = `Dynamic File Generated: ${now.toISOString()}
  
Local Time: ${now.toLocaleString()}
Unix Timestamp: ${Math.floor(now.getTime() / 1000)}
Browser: ${navigator.userAgent}
Screen Resolution: ${screen.width}x${screen.height}
Language: ${navigator.language}

This file was generated dynamically and contains current system information.
Generated at: ${now.toISOString()}`;
  
  const filename = `timestamp-${now.toISOString().slice(0,19).replace(/[:.]/g, '-')}.txt`;
  downloadTextFile(content, filename);
};

window.downloadSampleImage = function() {
  // Create a simple canvas image
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  
  // Draw a gradient background
  const gradient = ctx.createLinearGradient(0, 0, 400, 300);
  gradient.addColorStop(0, '#007cba');
  gradient.addColorStop(1, '#005a87');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 400, 300);
  
  // Add text
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Sample Download Image', 200, 150);
  ctx.font = '16px Arial';
  ctx.fillText(new Date().toLocaleDateString(), 200, 180);
  
  canvas.toBlob(function(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-image.png';
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
};

window.downloadSampleVideo = function() {
  // Create a simple video blob (this would normally be a real video file)
  // For demo purposes, we'll create a small MP4-like file
  const videoContent = new Uint8Array([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box
    0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
  ]);
  
  const blob = new Blob([videoContent], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample-video.mp4';
  a.click();
  URL.revokeObjectURL(url);
};

window.downloadSamplePDF = function() {
  // Create a simple PDF structure
  const pdfContent = `%PDF-1.4
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
>>
endobj

4 0 obj
<<
/Length 55
>>
stream
BT
/F1 12 Tf
100 700 Td
(Sample PDF Document - ${new Date().toLocaleDateString()}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000214 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
320
%%EOF`;

  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample-document.pdf';
  a.click();
  URL.revokeObjectURL(url);
};

// Legacy function (keeping for compatibility)
window.downloadBlob = function() {
  window.downloadTimestampFile();
};

// Helper function for text file downloads
function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// MIME Override Functions
window.applyMimeOverride = function() {
  const input = document.getElementById('mime-override');
  const mimeType = input.value.trim();
  
  if (mimeType) {
    globalMimeOverride = mimeType;
    localStorage.setItem('mimeOverride', mimeType);
    updateMimeStatus();
    
    // Show confirmation
    alert(`MIME type override set to: ${mimeType}\n\nAll file downloads from API endpoints will now use this MIME type.`);
  } else {
    alert('Please enter a valid MIME type (e.g., image/x-png)');
  }
};

window.clearMimeOverride = function() {
  globalMimeOverride = null;
  localStorage.removeItem('mimeOverride');
  document.getElementById('mime-override').value = '';
  updateMimeStatus();
};

function updateMimeStatus() {
  const statusDiv = document.getElementById('mime-status');
  const statusValue = document.getElementById('mime-status-value');
  const clearBtn = document.getElementById('clear-mime');
  const mimeInput = document.getElementById('mime-override');
  
  if (globalMimeOverride) {
    statusDiv.style.display = 'block';
    statusValue.textContent = globalMimeOverride;
    clearBtn.style.display = 'inline-block';
    if (mimeInput) mimeInput.value = globalMimeOverride;
    
    // Update all API download links to include mimeType parameter
    updateDownloadLinks();
  } else {
    statusDiv.style.display = 'none';
    clearBtn.style.display = 'none';
    updateDownloadLinks();
  }
}

function updateDownloadLinks() {
  // This function updates any programmatic download links that use the API
  // Static <a> tags will need to be manually updated or use onclick handlers
  const apiLinks = document.querySelectorAll('a[href*="/api/download-test"]');
  apiLinks.forEach(link => {
    const url = new URL(link.href, window.location.origin);
    if (globalMimeOverride) {
      url.searchParams.set('mimeType', globalMimeOverride);
    } else {
      url.searchParams.delete('mimeType');
    }
    link.href = url.toString();
  });
}

// Universal download function for API endpoint
window.downloadViaAPI = function(fileType, originalFilename) {
  const url = new URL('/api/download-test', window.location.origin);
  url.searchParams.set('filename', originalFilename); // URLSearchParams handles encoding
  
  // Add MIME override if active
  if (globalMimeOverride) {
    url.searchParams.set('mimeType', globalMimeOverride);
  }
  
  // Create a temporary link and click it
  const a = document.createElement('a');
  a.href = url.toString();
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Helper function to get download URL with MIME override
window.getDownloadUrl = function(baseUrl) {
  if (!globalMimeOverride) return baseUrl;
  
  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set('mimeType', globalMimeOverride);
  return url.toString();
};
