// Copy a reference tag (e.g. UM-01) to the clipboard on click
window.copyTagId = function(el) {
  var text = el.textContent;
  navigator.clipboard.writeText(text).then(function() {
    el.classList.add('um-copied');
    var popup = document.createElement('span');
    popup.className = 'copy-popup';
    popup.textContent = 'Copied!';
    el.appendChild(popup);
    setTimeout(function() {
      el.classList.remove('um-copied');
      popup.remove();
    }, 1000);
  });
};

function onNavigate_upload_mechanisms() {
  function set(id, msg, status) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('um-ok', 'um-fail');
    if (status) el.classList.add(status === 'ok' ? 'um-ok' : 'um-fail');
  }

  function describeFiles(fileList) {
    var files = Array.from(fileList || []);
    if (!files.length) return null;
    return files.map(function (f) {
      var path = f.webkitRelativePath ? ' @ ' + f.webkitRelativePath : '';
      return f.name + path + ' (' + f.size + ' bytes, ' + (f.type || 'no type') + ')';
    }).join('\n');
  }

  function wireDropzone(zoneId, resultId, onFiles) {
    var zone = document.getElementById(zoneId);
    if (!zone) return;
    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('um-over'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('um-over'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('um-over');
      onFiles(e, resultId);
    });
  }

  // --- 1: native file input ---
  var nativeInput = document.getElementById('um-native-input');
  if (nativeInput) {
    nativeInput.onchange = function () {
      var desc = describeFiles(nativeInput.files);
      if (desc) set('um-native-result', desc, 'ok');
      else set('um-native-result', 'No files selected.', 'fail');
    };
  }

  // --- 2: capture attribute, click or drop onto same input ---
  var captureInput = document.getElementById('um-capture-input');
  if (captureInput) {
    captureInput.onchange = function () {
      var desc = describeFiles(captureInput.files);
      if (desc) set('um-capture-result', desc, 'ok');
      else set('um-capture-result', 'No capture taken.', 'fail');
    };
  }

  // --- 3: directory input ---
  var dirInput = document.getElementById('um-dir-input');
  if (dirInput) {
    dirInput.onchange = function () {
      var desc = describeFiles(dirInput.files);
      if (desc) set('um-dir-result', desc, 'ok');
      else set('um-dir-result', 'No directory selected.', 'fail');
    };
  }

  // --- 4: generic dropzone, dataTransfer.files ---
  wireDropzone('um-dropzone', 'um-dropzone-result', function (e) {
    var desc = describeFiles(e.dataTransfer && e.dataTransfer.files);
    if (desc) set('um-dropzone-result', desc, 'ok');
    else set('um-dropzone-result', 'drop event had no files.', 'fail');
  });

  // --- 5: dataTransfer.items + getAsFile() ---
  wireDropzone('um-items-dropzone', 'um-items-result', function (e) {
    var items = e.dataTransfer && e.dataTransfer.items;
    if (!items || !items.length) {
      set('um-items-result', 'No dataTransfer.items on drop.', 'fail');
      return;
    }
    var files = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        var f = items[i].getAsFile();
        if (f) files.push(f);
      }
    }
    var desc = describeFiles(files);
    if (desc) set('um-items-result', 'Read via items[].getAsFile():\n' + desc, 'ok');
    else set('um-items-result', 'items present but none resolved to a file.', 'fail');
  });

  // --- 6: folder drop via webkitGetAsEntry ---
  function readEntry(entry, out) {
    return new Promise(function (resolve) {
      if (entry.isFile) {
        entry.file(function (file) {
          out.push(entry.fullPath + ' (' + file.size + ' bytes)');
          resolve();
        }, function () { resolve(); });
      } else if (entry.isDirectory) {
        var reader = entry.createReader();
        reader.readEntries(function (entries) {
          Promise.all(entries.map(function (e) { return readEntry(e, out); })).then(resolve);
        }, function () { resolve(); });
      } else {
        resolve();
      }
    });
  }
  wireDropzone('um-folder-dropzone', 'um-folder-result', function (e) {
    var items = e.dataTransfer && e.dataTransfer.items;
    if (!items || !items.length || typeof items[0].webkitGetAsEntry !== 'function') {
      set('um-folder-result', 'webkitGetAsEntry() not available on this drop.', 'fail');
      return;
    }
    var entries = [];
    for (var i = 0; i < items.length; i++) {
      var entry = items[i].webkitGetAsEntry();
      if (entry) entries.push(entry);
    }
    if (!entries.length) {
      set('um-folder-result', 'No FileSystemEntry resolved from drop.', 'fail');
      return;
    }
    var out = [];
    Promise.all(entries.map(function (e) { return readEntry(e, out); })).then(function () {
      set('um-folder-result', out.length ? out.join('\n') : 'Entries resolved but no files found (try dropping a folder).', out.length ? 'ok' : 'fail');
    });
  });

  // --- 7: paste event ---
  var pasteBox = document.getElementById('um-paste-box');
  if (pasteBox) {
    pasteBox.addEventListener('paste', function (e) {
      e.preventDefault();
      var desc = describeFiles(e.clipboardData && e.clipboardData.files);
      if (desc) set('um-paste-result', desc, 'ok');
      else set('um-paste-result', 'Paste had no files (plain text or unsupported clipboard content).', 'fail');
    });
  }

  // --- 8: async clipboard API ---
  var clipboardBtn = document.getElementById('um-clipboard-read');
  if (clipboardBtn) {
    clipboardBtn.onclick = async function () {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        set('um-clipboard-result', 'navigator.clipboard.read() not available.', 'fail');
        return;
      }
      try {
        var items = await navigator.clipboard.read();
        var out = [];
        for (var i = 0; i < items.length; i++) {
          out.push(items[i].types.join(', '));
        }
        set('um-clipboard-result', out.length ? 'ClipboardItem types found:\n' + out.join('\n') : 'Clipboard empty.', out.length ? 'ok' : 'fail');
      } catch (err) {
        set('um-clipboard-result', 'clipboard.read() error: ' + err, 'fail');
      }
    };
  }

  // --- 9: FSA showOpenFilePicker ---
  async function openFsa(multiple) {
    if (typeof window.showOpenFilePicker !== 'function') {
      set('um-fsa-open-result', 'showOpenFilePicker is not available in this browser.', 'fail');
      return;
    }
    try {
      var handles = await window.showOpenFilePicker({ multiple: !!multiple });
      var out = [];
      for (var i = 0; i < handles.length; i++) {
        var file = await handles[i].getFile();
        out.push(file.name + ' (' + file.size + ' bytes)');
      }
      set('um-fsa-open-result', out.length ? out.join('\n') : 'No handles returned.', out.length ? 'ok' : 'fail');
    } catch (err) {
      set('um-fsa-open-result', 'Picker error: ' + err, 'fail');
    }
  }
  var fsaOpenBtn = document.getElementById('um-fsa-open');
  if (fsaOpenBtn) fsaOpenBtn.onclick = function () { openFsa(false); };
  var fsaOpenMultiBtn = document.getElementById('um-fsa-open-multi');
  if (fsaOpenMultiBtn) fsaOpenMultiBtn.onclick = function () { openFsa(true); };

  // --- 10: FSA showDirectoryPicker ---
  var fsaDirBtn = document.getElementById('um-fsa-dir');
  if (fsaDirBtn) {
    fsaDirBtn.onclick = async function () {
      if (typeof window.showDirectoryPicker !== 'function') {
        set('um-fsa-dir-result', 'showDirectoryPicker is not available in this browser.', 'fail');
        return;
      }
      try {
        var dirHandle = await window.showDirectoryPicker();
        var out = [];
        for await (var entry of dirHandle.values()) {
          out.push(entry.kind + ': ' + entry.name);
        }
        set('um-fsa-dir-result', out.length ? out.join('\n') : 'Directory is empty.', out.length ? 'ok' : 'fail');
      } catch (err) {
        set('um-fsa-dir-result', 'Picker error: ' + err, 'fail');
      }
    };
  }

  // --- 11: programmatic File construction ---
  var syntheticBtn = document.getElementById('um-synthetic');
  if (syntheticBtn) {
    syntheticBtn.onclick = function () {
      var file = new File(['synthetic upload contents, no user gesture involved'], 'synthetic.txt', { type: 'text/plain' });
      set('um-synthetic-result', describeFiles([file]) + '\n→ Ready to hand to FormData/fetch just like a user-selected file.', 'ok');
    };
  }
}
