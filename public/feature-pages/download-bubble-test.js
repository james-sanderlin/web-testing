// ServiceNow Download Test page logic
function initializeDownloadBubbleTestPage() {
    console.log('ServiceNow Download Test page initialized');
    console.log('Ready to test ServiceNow download behavior');
}

// Navigation handler (called when page loads)
function onNavigate_download_bubble_test() {
    initializeDownloadBubbleTestPage();
}

let autoCounter = 0;

// ServiceNow Auto-download test (mimics tearOffAttachment behavior)
function tearOffAutoDownload() {
    autoCounter++;
    const url = "feature-pages/download-popup-auto.html";
    const name = "serviceNowDownload_" + autoCounter;
    
    console.log(`Opening ServiceNow-style auto-download popup: ${name}`);
    const counter = document.getElementById('autoCounter');
    if (counter) counter.textContent = autoCounter;
    
    window.open(url, name, "width=600,height=400,toolbar=no,menubar=no,location=no,scrollbars=yes,resizable=yes");
}

// Reset counter function (for testing)
function resetCounters() {
    autoCounter = 0;
    
    const autoCounterEl = document.getElementById('autoCounter');
    if (autoCounterEl) autoCounterEl.textContent = '0';
    
    console.log('Counter reset');
}

// Export functions for global access
window.tearOffAutoDownload = tearOffAutoDownload;
window.resetCounters = resetCounters;
