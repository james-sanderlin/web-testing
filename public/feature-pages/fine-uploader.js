function onNavigate_fine_uploader() {
  var logEl = document.getElementById('fu-log');
  var dropZone = document.getElementById('fu-drop-zone');
  var fileList = document.getElementById('fu-file-list');
  var browseBtn = document.getElementById('fu-browse-btn');
  var clearBtn = document.getElementById('fu-clear-log');
  var toggleDebug = document.getElementById('toggle-debug');
  var uploadCountEl = document.getElementById('upload-count');
  var successCountEl = document.getElementById('success-count');
  var failCountEl = document.getElementById('fail-count');

  var uploadCount = 0;
  var successCount = 0;
  var failCount = 0;
  var receivedFiles = [];
  var debugMode = true;

  if (!logEl || !dropZone) return;

  function log(msg, color) {
    var time = new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 });
    var span = document.createElement('span');
    span.style.color = color || '#d4d4d4';
    span.textContent = '[' + time + '] ' + msg + '\n';
    logEl.appendChild(span);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function updateCounts() {
    uploadCountEl.textContent = uploadCount;
    successCountEl.textContent = successCount;
    failCountEl.textContent = failCount;
  }

  function updateFileList() {
    if (!receivedFiles.length) { fileList.innerHTML = ''; return; }
    fileList.innerHTML = '<div style="padding:0.75rem;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:8px;">' +
      '<h4 style="margin:0 0 0.5rem;color:#2e7d32;">Files received by Fine Uploader:</h4>' +
      receivedFiles.map(function(f) {
        var statusColor = f.status === 'success' ? '#4caf50' : f.status === 'error' ? '#c62828' : '#ff9800';
        var statusIcon = f.status === 'success' ? '&#9679;' : f.status === 'error' ? '&#9679;' : '&#9675;';
        return '<div style="padding:0.25rem 0;display:flex;align-items:center;gap:0.5rem;">' +
          '<span style="color:' + statusColor + ';font-size:0.7rem;">' + statusIcon + '</span>' +
          '<span>' + f.name + '</span>' +
          '<span style="color:#888;font-size:0.85rem;">(' + formatSize(f.size) + ')</span>' +
          '<span style="color:' + statusColor + ';font-size:0.8rem;">' + f.status + '</span></div>';
      }).join('') + '</div>';
  }

  // ── Drop zone visual feedback ──
  dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.style.borderColor = '#007cba';
    dropZone.style.background = '#e7f3ff';
  });
  dropZone.addEventListener('dragleave', function() {
    dropZone.style.borderColor = '#ccc';
    dropZone.style.background = '#fafafa';
  });
  dropZone.addEventListener('drop', function() {
    dropZone.style.borderColor = '#ccc';
    dropZone.style.background = '#fafafa';
  });

  // ── Debug toggle ──
  toggleDebug.addEventListener('change', function() {
    debugMode = this.checked;
    if (debugMode) {
      document.getElementById('label-debug-mode').style.background = '#e8f5e9';
      document.getElementById('label-debug-mode').style.borderColor = '#a5d6a7';
      log('Debug mode enabled', '#4caf50');
    } else {
      document.getElementById('label-debug-mode').style.background = '#f5f5f5';
      document.getElementById('label-debug-mode').style.borderColor = '#ddd';
      log('Debug mode disabled', '#888');
    }
  });

  // Set initial debug label style
  document.getElementById('label-debug-mode').style.background = '#e8f5e9';
  document.getElementById('label-debug-mode').style.borderColor = '#a5d6a7';

  // ── Clear button ──
  clearBtn.addEventListener('click', function() {
    logEl.innerHTML = '';
    receivedFiles = [];
    uploadCount = 0;
    successCount = 0;
    failCount = 0;
    updateCounts();
    updateFileList();
    log('Log cleared', '#888');
  });

  // ── Fine Uploader init ──
  function initFineUploader() {
    if (typeof qq === 'undefined') {
      log('ERROR: Fine Uploader library not loaded!', '#f44336');
      return;
    }
    log('Fine Uploader library loaded successfully', '#4caf50');

    var fineUploader = new qq.FineUploader({
      element: document.getElementById('fine-uploader-gallery'),
      template: 'qq-template-gallery',
      request: { endpoint: '/api/upload' },
      validation: {
        allowedExtensions: [],
        sizeLimit: 50 * 1024 * 1024,
        itemLimit: 10,
      },
      retry: { enableAuto: false },
      deleteFile: { enabled: false },
      dragAndDrop: {
        extraDropzones: [dropZone],
        hideDropzones: false,
        disableDefaultDropzone: false,
      },
      debug: debugMode,
      callbacks: {
        onSubmit: function(id, name) {
          uploadCount++;
          updateCounts();
          log('fileSubmitted: ' + name + ' (id=' + id + ')', '#2196f3');
        },
        onUpload: function(id, name) {
          log('uploading: ' + name, '#ff9800');
        },
        onComplete: function(id, name, response) {
          var file = fineUploader.getFile(id);
          var size = file ? file.size : 0;
          if (response.success) {
            successCount++;
            log('uploadComplete: ' + name + ' — success', '#4caf50');
            receivedFiles.push({ name: name, size: size, status: 'success' });
          } else {
            failCount++;
            log('uploadComplete: ' + name + ' — failed', '#f44336');
            receivedFiles.push({ name: name, size: size, status: 'error' });
          }
          updateCounts();
          updateFileList();
        },
        onError: function(id, name, errorReason) {
          failCount++;
          updateCounts();
          log('error: ' + name + ' — ' + errorReason, '#f44336');
        },
        onCancel: function(id, name) {
          log('cancelled: ' + name, '#888');
        },
        onValidateBatch: function(fileOrBlobData) {
          log('validateBatch: ' + fileOrBlobData.length + ' file(s)', '#9e9e9e');
        },
        onDropProcessing: function(isProcessing, files) {
          if (isProcessing) {
            log('dropProcessing: started (' + files.length + ' files)', '#ff9800');
          } else {
            log('dropProcessing: completed', '#4caf50');
          }
        },
        onStatusChange: function(id, oldStatus, newStatus) {
          if (debugMode) {
            log('statusChange: id=' + id + ' ' + oldStatus + ' -> ' + newStatus, '#9e9e9e');
          }
        },
      },
    });

    // Wire browse button to Fine Uploader's file input
    browseBtn.addEventListener('click', function() {
      var input = document.querySelector('.qq-upload-button input[type="file"]');
      if (input) input.click();
    });

    log('Drop zone assigned — ready for files', '#4caf50');
    log('Config: sizeLimit=50MB, itemLimit=10, retryAuto=false', '#888');
  }

  // ── Drag event debugging ──
  var lastDragoverLog = 0;
  dropZone.addEventListener('drop', function(e) {
    log('--- RAW DROP EVENT ---', '#ff9800');
    log('  isTrusted: ' + e.isTrusted, '#ff9800');
    log('  dataTransfer.files: ' + (e.dataTransfer ? e.dataTransfer.files.length : 'N/A'), '#ff9800');
    if (e.dataTransfer) {
      for (var i = 0; i < e.dataTransfer.files.length; i++) {
        var f = e.dataTransfer.files[i];
        log('  file[' + i + ']: ' + f.name + ' (' + formatSize(f.size) + ')', '#ffb74d');
        receivedFiles.push({ name: f.name, size: f.size, status: 'pending' });
      }
      updateFileList();
    }
  }, true);

  // ── Load Fine Uploader ──
  if (typeof qq !== 'undefined') {
    initFineUploader();
  } else {
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/file-uploader/5.16.2/fine-uploader.min.js';
    script.onload = initFineUploader;
    script.onerror = function() { log('ERROR: Failed to load Fine Uploader from CDN', '#f44336'); };
    document.head.appendChild(script);
  }
}
