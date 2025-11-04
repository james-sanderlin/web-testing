// Download Bubble Test page logic
function initializeDownloadBubbleTestPage() {
    console.log('Download Bubble Test page initialized');
    console.log('Ready to test download popup behavior');
}

// Navigation handler (called when page loads)
function onNavigate_download_bubble_test() {
    initializeDownloadBubbleTestPage();
}

let tearOffWindowID = 0;
let reuseCounter = 0;
let autoCounter = 0;

// Test 1: New window each time
function tearOffDownload() {
    tearOffWindowID++;
    const url = "feature-pages/download-popup.html";
    const name = "tearOff_" + tearOffWindowID;
    
    console.log(`Opening new popup window: ${name}`);
    const counter = document.getElementById('newWindowCounter');
    if (counter) counter.textContent = tearOffWindowID;
    
    window.open(url, name, "width=600,height=400,toolbar=no,menubar=no,location=no,scrollbars=yes,resizable=yes");
}

// Test 2: Reuse same window (this often triggers the bug)
function tearOffDownloadReuse() {
    reuseCounter++;
    const url = "feature-pages/download-popup.html";
    const name = "tearOffReuse"; // constant name - same window reused
    
    console.log(`Opening reused popup window: ${name} (attempt ${reuseCounter})`);
    const counter = document.getElementById('reuseCounter');
    if (counter) counter.textContent = reuseCounter;
    
    window.open(url, name, "width=600,height=400,toolbar=no,menubar=no,location=no,scrollbars=yes,resizable=yes");
}

// Test 3: Auto-download immediately (ServiceNow style)
function tearOffAutoDownload() {
    autoCounter++;
    const url = "feature-pages/download-popup-auto.html";
    const name = "tearOffAuto_" + autoCounter;
    
    console.log(`Opening auto-download popup: ${name}`);
    const counter = document.getElementById('autoCounter');
    if (counter) counter.textContent = autoCounter;
    
    window.open(url, name, "width=600,height=400,toolbar=no,menubar=no,location=no,scrollbars=yes,resizable=yes");
}

// Reset counters function (for testing)
function resetCounters() {
    tearOffWindowID = 0;
    reuseCounter = 0;
    autoCounter = 0;
    
    const newCounter = document.getElementById('newWindowCounter');
    const reuseCounterEl = document.getElementById('reuseCounter');
    const autoCounterEl = document.getElementById('autoCounter');
    
    if (newCounter) newCounter.textContent = '0';
    if (reuseCounterEl) reuseCounterEl.textContent = '0';
    if (autoCounterEl) autoCounterEl.textContent = '0';
    
    console.log('Counters reset');
}

// Export functions for global access (matching your other pages pattern)
window.tearOffDownload = tearOffDownload;
window.tearOffDownloadReuse = tearOffDownloadReuse;
window.tearOffAutoDownload = tearOffAutoDownload;
window.resetCounters = resetCounters;
