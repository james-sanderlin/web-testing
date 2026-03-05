function onNavigate_drag_timeout() {
  var logEl = document.getElementById('flow-log');
  var dropZone = document.getElementById('flow-drop-zone');
  var fileList = document.getElementById('flow-file-list');
  var lostFileList = document.getElementById('flow-lost-files');
  var dtInspector = document.getElementById('dt-inspector');
  var browseBtn = document.getElementById('flow-browse-btn');
  var clearBtn = document.getElementById('flow-clear-log');
  var toggleKwOverlay = document.getElementById('toggle-kw-overlay');
  var kwOverlayStatus = document.getElementById('kw-overlay-status');
  var kwOverlayState = document.getElementById('kw-overlay-state');

  var lostFiles = [];
  var receivedFiles = [];

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

  function inspectDataTransfer(e) {
    var dt = e.dataTransfer;
    if (!dt) { dtInspector.textContent = 'No dataTransfer on event'; return; }
    var info = {
      isTrusted: e.isTrusted, eventType: e.type,
      'dataTransfer.types': Array.from(dt.types),
      'dataTransfer.files.length': dt.files.length,
      'dataTransfer.items.length': dt.items.length,
      files: [], items: [],
    };
    for (var i = 0; i < dt.files.length; i++) {
      var f = dt.files[i];
      info.files.push({ name: f.name, size: f.size, type: f.type });
    }
    for (var j = 0; j < dt.items.length; j++) {
      var item = dt.items[j];
      var entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
      var asFile = item.getAsFile ? item.getAsFile() : null;
      info.items.push({
        kind: item.kind, type: item.type,
        webkitGetAsEntry: entry ? { name: entry.name } : null,
        getAsFile: asFile ? { name: asFile.name, size: asFile.size } : null,
      });
    }
    dtInspector.textContent = JSON.stringify(info, null, 2);
  }

  // ── Capture-phase drop inspector ──
  dropZone.addEventListener('drop', function(e) {
    log('--- RAW DROP EVENT ---', '#ff9800');
    log('  isTrusted: ' + e.isTrusted, '#ff9800');
    log('  dataTransfer.files: ' + (e.dataTransfer ? e.dataTransfer.files.length : 'N/A'), '#ff9800');
    log('  dataTransfer.items: ' + (e.dataTransfer ? e.dataTransfer.items.length : 'N/A'), '#ff9800');
    if (e.dataTransfer && e.dataTransfer.items) {
      for (var i = 0; i < e.dataTransfer.items.length; i++) {
        var item = e.dataTransfer.items[i];
        var entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        var file = item.getAsFile ? item.getAsFile() : null;
        log('  item[' + i + ']: entry=' + (entry ? entry.name : 'null') +
          ' file=' + (file ? file.name + ' (' + formatSize(file.size) + ')' : 'null'), '#ffb74d');
      }
    }
    inspectDataTransfer(e);
  }, true);

  // ── Flow.js ──
  function initFlow() {
    if (typeof Flow === 'undefined') { log('ERROR: Flow.js not loaded!', '#f44336'); return; }
    log('Flow.js loaded successfully', '#4caf50');

    var flow = new Flow({
      target: '/api/upload', testChunks: false, forceChunkSize: true,
      chunkSize: 1048576, simultaneousUploads: 1,
      maxChunkRetries: 5, chunkRetryInterval: 5000,
      permanentErrors: [404, 413, 415, 500, 501], successStatuses: [200, 201, 202],
    });
    flow.assignDrop(dropZone);
    flow.assignBrowse(browseBtn);
    log('Drop zone assigned — ready for files', '#4caf50');
    log('Config: chunkSize=1MB, simultaneousUploads=1, testChunks=false', '#888');

    dropZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      dropZone.style.borderColor = '#007cba'; dropZone.style.background = '#e7f3ff';
    });
    dropZone.addEventListener('dragleave', function() {
      dropZone.style.borderColor = '#ccc'; dropZone.style.background = '#fafafa';
    });
    dropZone.addEventListener('drop', function() {
      dropZone.style.borderColor = '#ccc'; dropZone.style.background = '#fafafa';
    });

    flow.on('fileAdded', function(file) {
      log('fileAdded: ' + file.name + ' (' + formatSize(file.size) + ')', '#4caf50');
      receivedFiles.push({ name: file.name, size: file.size });
      updateReceivedFileList();
    });
    flow.on('filesAdded', function(files) { log('filesAdded: ' + files.length + ' file(s)', '#4caf50'); });
    flow.on('filesSubmitted', function(files) { log('filesSubmitted: ' + files.length + ' file(s) — upload would start', '#2196f3'); });
    flow.on('fileError', function(file, message) { log('fileError: ' + file.name + ' — ' + message, '#f44336'); updateFileList(flow); });
    flow.on('error', function(message, file) { log('error: ' + message, '#f44336'); });
    flow.on('catchAll', function(eventName) { if (eventName !== 'fileProgress') log('event: ' + eventName, '#9e9e9e'); });
  }

  function updateLostFileList() {
    if (!lostFiles.length) { lostFileList.innerHTML = ''; return; }
    lostFileList.innerHTML = '<div style="padding:0.75rem;background:#fbe9e7;border:1px solid #ef9a9a;border-radius:8px;">' +
      '<h4 style="margin:0 0 0.5rem;color:#c62828;">Files NOT received by Flow.js (lost to overlay timeout):</h4>' +
      lostFiles.map(function(f) {
        return '<div style="padding:0.25rem 0;display:flex;align-items:center;gap:0.5rem;">' +
          '<span style="color:#c62828;font-size:0.7rem;">&#9679;</span>' +
          '<span style="color:#c62828;">' + f.name + '</span>' +
          '<span style="color:#888;font-size:0.85rem;">(' + formatSize(f.size) + ')</span></div>';
      }).join('') + '</div>';
  }

  function addLostFiles(dt) {
    if (!dt) return;
    for (var i = 0; i < dt.files.length; i++) {
      var f = dt.files[i];
      lostFiles.push({ name: f.name, size: f.size });
    }
    updateLostFileList();
  }

  function updateReceivedFileList() {
    if (!receivedFiles.length) { fileList.innerHTML = ''; return; }
    fileList.innerHTML = '<div style="padding:0.75rem;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:8px;">' +
      '<h4 style="margin:0 0 0.5rem;color:#2e7d32;">Files received by Flow.js:</h4>' +
      receivedFiles.map(function(f) {
        return '<div style="padding:0.25rem 0;display:flex;align-items:center;gap:0.5rem;">' +
          '<span style="color:#4caf50;font-size:0.7rem;">&#9679;</span>' +
          '<span>' + f.name + '</span>' +
          '<span style="color:#888;font-size:0.85rem;">(' + formatSize(f.size) + ')</span></div>';
      }).join('') + '</div>';
  }

  // ── Kiteworks overlay simulation ──
  // Reproduces the exact pattern from 3511.517893d9.chunk.js:
  // - Document-level dragenter/dragover listeners set isDragging=true + start 300ms timer
  // - Timer fires () => setIsDragging(false)
  // - When isDragging=false, the invisible overlay dropzone is removed from the DOM
  // - The overlay is what Flow.js's drop listener is attached to
  // - If Island buffers dragover events during scan, timer fires and overlay disappears

  var kwCleanup = null;

  function enableKwOverlay() {
    if (kwCleanup) return;
    log('[kw-overlay] Enabled — 300ms timeout dropzone active', '#e65100');
    kwOverlayStatus.style.display = '';
    document.getElementById('label-kw-overlay').style.background = '#fff3e0';
    document.getElementById('label-kw-overlay').style.borderColor = '#ffb74d';

    var isDragging = false;
    var timeoutRef = null;
    var overlay = null;
    var dropReceived = false;

    function setDragging(val) {
      isDragging = val;
      kwOverlayState.textContent = val ? 'VISIBLE (accepting drops)' : 'idle';
      kwOverlayState.style.color = val ? '#2e7d32' : '#888';

      if (val && !overlay) {
        dropReceived = false;
        overlay = document.createElement('div');
        overlay.id = 'kw-invisible-overlay';
        overlay.style.cssText = 'position:absolute;inset:0;z-index:10;background:rgba(25,118,210,0.08);border:2px solid #1976d2;border-radius:12px;pointer-events:auto;';
        overlay.setAttribute('data-testid', 'invisible-file-dropzone');
        dropZone.style.position = 'relative';
        dropZone.appendChild(overlay);

        overlay.addEventListener('dragenter', function(e) {
          e.preventDefault();
          cancelTimer();
        });
        overlay.addEventListener('dragover', function(e) {
          e.preventDefault();
          cancelTimer();
        });
        overlay.addEventListener('dragleave', function(e) {
          startTimer();
        });
        overlay.addEventListener('drop', function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (!isDragging) {
            log('[kw-overlay] Drop on detached overlay IGNORED (simulates React unmount cleanup)', '#c62828');
            addLostFiles(e.dataTransfer);
            return;
          }
          dropReceived = true;
          log('[kw-overlay] Drop received on overlay — forwarding to Flow.js', '#4caf50');
          setDragging(false);
          var newEvt = new DragEvent('drop', {
            dataTransfer: e.dataTransfer,
            bubbles: true, cancelable: true
          });
          dropZone.dispatchEvent(newEvt);
        });

        log('[kw-overlay] Overlay mounted', '#888');
      } else if (!val && overlay) {
        overlay.remove();
        overlay = null;
        if (dropReceived) {
          log('[kw-overlay] Overlay unmounted (after drop — normal)', '#888');
        } else {
          log('[kw-overlay] OVERLAY UNMOUNTED BY TIMEOUT — drop target gone! Drops will be lost.', '#c62828');
        }
      }
    }

    function startTimer() {
      clearTimeout(timeoutRef);
      timeoutRef = window.setTimeout(function() {
        setDragging(false);
      }, 300);
    }

    function cancelTimer() {
      clearTimeout(timeoutRef);
    }

    function onDocDragenter() {
      setDragging(true);
      startTimer();
    }
    function onDocDragover(e) {
      e.preventDefault();
      setDragging(true);
      startTimer();
    }
    function onDocDragleave() {
      startTimer();
    }

    document.addEventListener('dragenter', onDocDragenter, false);
    document.addEventListener('dragover', onDocDragover, false);
    document.addEventListener('dragleave', onDocDragleave, false);

    kwCleanup = function() {
      document.removeEventListener('dragenter', onDocDragenter, false);
      document.removeEventListener('dragover', onDocDragover, false);
      document.removeEventListener('dragleave', onDocDragleave, false);
      cancelTimer();
      if (overlay) { overlay.remove(); overlay = null; }
      isDragging = false;
      kwCleanup = null;
      kwOverlayStatus.style.display = 'none';
      document.getElementById('label-kw-overlay').style.background = '#f5f5f5';
      document.getElementById('label-kw-overlay').style.borderColor = '#ddd';
      log('[kw-overlay] Disabled', '#888');
    };
  }

  // ── RPA fix: setTimeout hook ──
  var toggleRpaFix = document.getElementById('toggle-rpa-fix');
  var rpaCleanup = null;

  function enableRpaFix() {
    if (rpaCleanup) return;

    var rpaDragging = false;
    var rpaLastDragTime = 0;
    var SAFETY_TIMEOUT_MS = 30000;
    var originalSetTimeout = window.setTimeout;

    function setRpaDragging(val) {
      rpaDragging = val;
      if (val) rpaLastDragTime = Date.now();
    }

    function isRpaDragStillActive() {
      if (!rpaDragging) return false;
      if (Date.now() - rpaLastDragTime > SAFETY_TIMEOUT_MS) {
        log('[rpa-fix] Safety timeout — forcing isDragging=false after 30s', '#f44336');
        rpaDragging = false;
        return false;
      }
      return true;
    }

    function onRpaDragenter() { setRpaDragging(true); }
    function onRpaDragover() { rpaLastDragTime = Date.now(); }
    function onRpaDrop() { setRpaDragging(false); }

    document.addEventListener('dragenter', onRpaDragenter, true);
    document.addEventListener('dragover', onRpaDragover, true);
    document.addEventListener('drop', onRpaDrop, true);

    window.setTimeout = function patchedSetTimeout(callback, delay) {
      var args = Array.prototype.slice.call(arguments, 2);
      var isDragRelated = rpaDragging
        && typeof delay === 'number'
        && delay >= 280 && delay <= 320;

      if (isDragRelated) {
        var wrappedCallback = function() {
          if (isRpaDragStillActive()) {
            log('[rpa-fix] Blocked ' + delay + 'ms timeout — drag still active, rescheduling', '#7b1fa2');
            originalSetTimeout.call(window, wrappedCallback, delay);
          } else {
            callback.apply(undefined, args);
          }
        };
        return originalSetTimeout.call(window, wrappedCallback, delay);
      }
      return originalSetTimeout.apply(this, [callback, delay].concat(args));
    };

    log('[rpa-fix] Enabled — setTimeout hook active', '#7b1fa2');
    document.getElementById('label-rpa-fix').style.background = '#f3e5f9';
    document.getElementById('label-rpa-fix').style.borderColor = '#ce93d8';

    rpaCleanup = function() {
      window.setTimeout = originalSetTimeout;
      document.removeEventListener('dragenter', onRpaDragenter, true);
      document.removeEventListener('dragover', onRpaDragover, true);
      document.removeEventListener('drop', onRpaDrop, true);
      rpaCleanup = null;
      document.getElementById('label-rpa-fix').style.background = '#f5f5f5';
      document.getElementById('label-rpa-fix').style.borderColor = '#ddd';
      log('[rpa-fix] Disabled — setTimeout restored', '#888');
    };
  }

  toggleRpaFix.addEventListener('change', function() {
    if (this.checked) enableRpaFix();
    else if (rpaCleanup) rpaCleanup();
  });

  // ── Toggle handlers ──
  toggleKwOverlay.addEventListener('change', function() {
    if (this.checked) enableKwOverlay();
    else if (kwCleanup) kwCleanup();
  });

  // Enable overlay by default
  toggleKwOverlay.checked = true;
  enableKwOverlay();

  clearBtn.addEventListener('click', function() {
    logEl.innerHTML = '';
    lostFiles = [];
    receivedFiles = [];
    updateLostFileList();
    updateReceivedFileList();
    log('Log cleared', '#888');
  });

  // ── Load Flow.js ──
  if (typeof Flow !== 'undefined') {
    initFlow();
  } else {
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/flow.js/2.9.0/flow.min.js';
    script.onload = initFlow;
    script.onerror = function() { log('ERROR: Failed to load Flow.js from CDN', '#f44336'); };
    document.head.appendChild(script);
  }
}
