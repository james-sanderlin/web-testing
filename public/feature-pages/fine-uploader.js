// Fine Uploader Test page logic

let uploadCount = 0;
let successCount = 0;
let failCount = 0;
let fineUploader = null;

function initializeFineUploaderPage() {
    console.log('Fine Uploader Test page initialized');
    
    // Check if Fine Uploader library is loaded
    if (typeof qq === 'undefined') {
        console.error('Fine Uploader library not loaded!');
        logUpload('ERROR: Fine Uploader library failed to load');
        return;
    }
    
    logUpload('Fine Uploader library loaded successfully');
    
    // Initialize Fine Uploader
    fineUploader = new qq.FineUploader({
        element: document.getElementById('fine-uploader-gallery'),
        template: 'qq-template-gallery',
        request: {
            // Use your upload API endpoint
            endpoint: '/api/upload'
        },
        validation: {
            allowedExtensions: [], // Allow all file types
            sizeLimit: 50 * 1024 * 1024, // 50 MB
            itemLimit: 10
        },
        retry: {
            enableAuto: false
        },
        deleteFile: {
            enabled: false
        },
        callbacks: {
            onSubmit: function(id, name) {
                uploadCount++;
                updateCounts();
                logUpload(`📤 File submitted: ${name} (ID: ${id})`);
                console.log('Fine Uploader - onSubmit:', {id, name});
            },
            onComplete: function(id, name, response, xhr) {
                if (response.success) {
                    successCount++;
                    logUpload(`✅ Upload successful: ${name}`);
                    console.log('Fine Uploader - onComplete (success):', {id, name, response});
                } else {
                    failCount++;
                    logUpload(`❌ Upload failed: ${name}`);
                    console.log('Fine Uploader - onComplete (failed):', {id, name, response});
                }
                updateCounts();
            },
            onError: function(id, name, errorReason, xhr) {
                failCount++;
                updateCounts();
                logUpload(`❌ Upload error: ${name} - ${errorReason}`);
                console.error('Fine Uploader - onError:', {id, name, errorReason, xhr});
            },
            onUpload: function(id, name) {
                logUpload(`⬆️ Uploading: ${name}`);
                console.log('Fine Uploader - onUpload:', {id, name});
            },
            onCancel: function(id, name) {
                logUpload(`🚫 Upload cancelled: ${name}`);
                console.log('Fine Uploader - onCancel:', {id, name});
            },
            onValidateBatch: function(fileOrBlobData) {
                logUpload(`🔍 Validating batch of ${fileOrBlobData.length} file(s)`);
                console.log('Fine Uploader - onValidateBatch:', fileOrBlobData);
            },
            onDropProcessing: function(isProcessing, files, dropTarget) {
                logUpload(`🎯 Drop processing: ${isProcessing ? 'started' : 'completed'} (${files.length} files)`);
                console.log('Fine Uploader - onDropProcessing:', {isProcessing, files: files.length, dropTarget});
            },
            onStatusChange: function(id, oldStatus, newStatus) {
                console.log('Fine Uploader - onStatusChange:', {id, oldStatus, newStatus});
            }
        },
        // Drag and Drop configuration
        dragAndDrop: {
            extraDropzones: [],
            hideDropzones: false,
            disableDefaultDropzone: false
        },
        // Debug mode
        debug: true
    });
    
    logUpload('Fine Uploader initialized - ready for drag & drop and click uploads');
    
    // Add event listeners for debugging drag events
    setupDragEventListeners();
}

function setupDragEventListeners() {
    const dropArea = document.querySelector('.qq-upload-drop-area');
    if (!dropArea) {
        console.warn('Drop area not found for event listeners');
        return;
    }
    
    // Debounce timer for dragover events
    let dragoverTimer = null;
    let lastDragoverLog = 0;
    const DRAGOVER_DEBOUNCE_MS = 500;
    
    // Monitor all drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, function(e) {
            // Debounce dragover events
            if (eventName === 'dragover') {
                const now = Date.now();
                if (now - lastDragoverLog < DRAGOVER_DEBOUNCE_MS) {
                    return;
                }
                lastDragoverLog = now;
            }
            
            console.log(`Drag Event [${eventName}]:`, {
                type: e.type,
                dataTransfer: e.dataTransfer,
                files: e.dataTransfer?.files?.length || 0,
                target: e.target.className
            });
            
            if (eventName === 'drop') {
                logUpload(`🎯 Drop event detected with ${e.dataTransfer?.files?.length || 0} files`);
            }
        }, false);
    });
    
    // Monitor document-level drag events (in case extension interferes)
    let lastDocDragoverLog = 0;
    document.addEventListener('dragover', function(e) {
        const now = Date.now();
        if (now - lastDocDragoverLog < DRAGOVER_DEBOUNCE_MS) {
            return;
        }
        lastDocDragoverLog = now;
        
        console.log('Document dragover event:', {
            defaultPrevented: e.defaultPrevented,
            dataTransfer: !!e.dataTransfer
        });
    }, false);
    
    document.addEventListener('drop', function(e) {
        console.log('Document drop event:', {
            defaultPrevented: e.defaultPrevented,
            files: e.dataTransfer?.files?.length || 0
        });
    }, false);
    
    logUpload('Drag event listeners attached for debugging');
}

function updateCounts() {
    const uploadCountEl = document.getElementById('upload-count');
    const successCountEl = document.getElementById('success-count');
    const failCountEl = document.getElementById('fail-count');
    
    if (uploadCountEl) uploadCountEl.textContent = uploadCount;
    if (successCountEl) successCountEl.textContent = successCount;
    if (failCountEl) failCountEl.textContent = failCount;
}

function logUpload(message) {
    const log = document.getElementById('upload-log');
    if (!log) return;
    
    const timestamp = new Date().toLocaleTimeString();
    log.innerHTML += `[${timestamp}] ${message}<br>`;
    log.scrollTop = log.scrollHeight;
}

function resetCounts() {
    uploadCount = 0;
    successCount = 0;
    failCount = 0;
    updateCounts();
    
    const log = document.getElementById('upload-log');
    if (log) {
        log.innerHTML = '<strong>Upload Log:</strong><br>';
    }
    
    console.log('Counts and log reset');
    logUpload('Stats reset');
}

// Navigation handler
function onNavigate_fine_uploader() {
    console.log('onNavigate_fine_uploader called');
    
    // Wait for Fine Uploader library to load
    const checkLibrary = setInterval(function() {
        if (typeof qq !== 'undefined') {
            clearInterval(checkLibrary);
            initializeFineUploaderPage();
        }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(function() {
        clearInterval(checkLibrary);
        if (typeof qq === 'undefined') {
            console.error('Fine Uploader library failed to load after 5 seconds');
            logUpload('ERROR: Failed to load Fine Uploader library');
        }
    }, 5000);
}

// Export functions for global access
window.resetCounts = resetCounts;
window.fineUploader = function() { return fineUploader; };
