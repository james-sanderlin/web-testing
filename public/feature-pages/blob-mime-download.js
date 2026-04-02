function onNavigate_blob_mime_download() {
  var container = document.getElementById('scenarios');
  var logEl = document.getElementById('log');
  var clearBtn = document.getElementById('clear-log');
  if (!container || !logEl) return;

  // Tiny valid 1x1 red JPEG, base64-encoded
  var JPEG_B64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';

  var scenarios = [
    {
      label: '1. Typed Blob (image/jpeg)',
      desc: 'Baseline: Blob created with correct type. Browser and downstream systems can identify the file.',
      blobType: 'image/jpeg',
      filename: 'test-typed.jpg',
      tag: 'baseline'
    },
    {
      label: '2. MIME-less Blob (no type)',
      desc: 'Simulates SendSafely decryption output: new Blob([buf]) with no type specified. MIME is empty string.',
      blobType: '',
      filename: 'test-no-mime.jpg',
      tag: 'sendsafely-sim'
    },
    {
      label: '3. Generic MIME Blob (application/octet-stream)',
      desc: 'Common fallback for unknown binary data. Extension says .jpg but MIME is generic.',
      blobType: 'application/octet-stream',
      filename: 'test-octet-stream.jpg',
      tag: 'generic-mime'
    },
    {
      label: '4. Wrong MIME Blob (application/pdf)',
      desc: 'Mismatch: MIME says PDF but filename extension is .jpg. Tests whether converters use MIME or extension.',
      blobType: 'application/pdf',
      filename: 'test-wrong-mime.jpg',
      tag: 'mime-mismatch'
    },
    {
      label: '5. Data URL Download',
      desc: 'Baseline: classic data:image/jpeg;base64,... anchor download. MIME is embedded in the URL itself.',
      blobType: null, // special: data URL path
      filename: 'test-data-url.jpg',
      tag: 'data-url'
    }
  ];

  container.innerHTML = '';

  scenarios.forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'scenario-card';

    var info = document.createElement('div');
    info.className = 'info';

    var label = document.createElement('div');
    label.className = 'label';
    label.textContent = s.label;

    var desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = s.desc;

    var meta = document.createElement('div');
    meta.className = 'meta';
    if (s.blobType === null) {
      meta.textContent = 'method: data URL  |  filename: ' + s.filename;
    } else {
      meta.textContent = 'blob type: "' + s.blobType + '"  |  filename: ' + s.filename;
    }

    info.appendChild(label);
    info.appendChild(desc);
    info.appendChild(meta);

    var btn = document.createElement('button');
    btn.textContent = 'Download';

    btn.addEventListener('click', function() {
      var bytes = base64ToArrayBuffer(JPEG_B64);
      var url, blobActualType;

      if (s.blobType === null) {
        // Data URL path
        url = 'data:image/jpeg;base64,' + JPEG_B64;
        blobActualType = 'n/a (data URL)';
      } else {
        var blobOpts = s.blobType ? { type: s.blobType } : undefined;
        var blob = blobOpts ? new Blob([bytes], blobOpts) : new Blob([bytes]);
        blobActualType = blob.type || '(empty — no MIME)';
        url = URL.createObjectURL(blob);
      }

      var a = document.createElement('a');
      a.href = url;
      a.download = s.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (s.blobType !== null) {
        // Revoke after short delay
        setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
      }

      appendLog(s.label, s.filename, blobActualType, url);
    });

    card.appendChild(info);
    card.appendChild(btn);
    container.appendChild(card);
  });

  clearBtn.addEventListener('click', function() {
    logEl.innerHTML = '';
  });

  function appendLog(label, filename, blobType, url) {
    var ts = new Date().toLocaleTimeString();
    var entry = document.createElement('div');
    entry.className = 'log-entry';

    var urlDisplay = url.startsWith('blob:') ? url : (url.length > 60 ? url.slice(0, 60) + '...' : url);

    entry.innerHTML =
      '<span class="log-warn">[' + ts + ']</span> <span class="log-label">' + escHtml(label) + '</span>\n' +
      '  filename : ' + escHtml(filename) + '\n' +
      '  blob.type: <span class="log-ok">' + escHtml(blobType) + '</span>\n' +
      '  url      : ' + escHtml(urlDisplay);

    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function base64ToArrayBuffer(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes.buffer;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
