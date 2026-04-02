function onNavigate_decrypt_data_url() {
  var statusEl = document.getElementById('status-panel');
  var btnDecrypt = document.getElementById('btn-decrypt');
  var btnDecryptBlob = document.getElementById('btn-decrypt-blob');
  var btnReset = document.getElementById('btn-reset');
  var previewSection = document.getElementById('preview-section');
  var previewImg = document.getElementById('preview-img');
  var previewMeta = document.getElementById('preview-meta');
  if (!statusEl || !btnDecrypt) return;

  var _key = null;
  var _iv = null;
  var _ciphertext = null;

  function log(msg, cls) {
    var ts = new Date().toLocaleTimeString();
    var span = document.createElement('span');
    span.className = cls || '';
    span.textContent = '[' + ts + '] ' + msg + '\n';
    statusEl.appendChild(span);
    statusEl.scrollTop = statusEl.scrollHeight;
  }

  function reset() {
    statusEl.innerHTML = '';
    previewSection.style.display = 'none';
    previewImg.src = '';
    previewMeta.textContent = '';
    btnDecrypt.disabled = true;
    btnDecryptBlob.disabled = true;
    _key = null; _iv = null; _ciphertext = null;
    init();
  }

  function init() {
    log('Fetching /assets/sample.png…');
    fetch('/assets/sample.png')
      .then(function(r) {
        if (!r.ok) throw new Error('fetch failed: ' + r.status);
        return r.arrayBuffer();
      })
      .then(function(buf) {
        log('Fetched image: ' + buf.byteLength + ' bytes', 'log-ok');
        log('Generating AES-GCM 256-bit key + IV…');
        return Promise.all([
          window.crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          ),
          Promise.resolve(buf)
        ]);
      })
      .then(function(results) {
        _key = results[0];
        _iv = window.crypto.getRandomValues(new Uint8Array(12));
        var buf = results[1];
        log('Key generated. IV: ' + Array.from(_iv).map(function(b) { return b.toString(16).padStart(2,'0'); }).join(''), 'log-ok');
        log('Encrypting image bytes with AES-GCM…');
        return window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: _iv },
          _key,
          buf
        );
      })
      .then(function(ciphertext) {
        _ciphertext = ciphertext;
        log('Encrypted: ' + ciphertext.byteLength + ' bytes of ciphertext stored in memory', 'log-ok');
        log('Ready — choose a download method below.', 'log-warn');
        btnDecrypt.disabled = false;
        btnDecryptBlob.disabled = false;
      })
      .catch(function(err) {
        log('ERROR: ' + err.message, 'log-err');
      });
  }

  btnDecrypt.addEventListener('click', function() {
    if (!_key || !_iv || !_ciphertext) return;
    btnDecrypt.disabled = true;
    log('Decrypting ciphertext…');

    window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: _iv },
      _key,
      _ciphertext
    )
    .then(function(plaintext) {
      log('Decrypted: ' + plaintext.byteLength + ' bytes', 'log-ok');

      // Convert ArrayBuffer → base64
      var bytes = new Uint8Array(plaintext);
      var binary = '';
      var chunkSize = 8192;
      for (var i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }
      var b64 = btoa(binary);
      var dataUrl = 'data:image/png;base64,' + b64;

      log('Base64 encoded. Data URL length: ' + dataUrl.length + ' chars', 'log-ok');
      log('Download method: data URL (not blob URL)', 'log-warn');

      // Trigger download
      var a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'decrypted-image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      log('Download triggered via <a href="data:..."> click', 'log-ok');

      // Show preview
      previewImg.src = dataUrl;
      previewMeta.textContent =
        'data URL length: ' + dataUrl.length + ' chars  |  ' +
        'filename: decrypted-image.png  |  MIME in URL: image/png';
      previewSection.style.display = 'block';
    })
    .catch(function(err) {
      log('Decryption ERROR: ' + err.message, 'log-err');
      btnDecrypt.disabled = false;
    });
  });

  btnDecryptBlob.addEventListener('click', function() {
    if (!_key || !_iv || !_ciphertext) return;
    btnDecryptBlob.disabled = true;
    log('Decrypting ciphertext (blob URL path)…');

    window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: _iv },
      _key,
      _ciphertext
    )
    .then(function(plaintext) {
      log('Decrypted: ' + plaintext.byteLength + ' bytes', 'log-ok');

      // new Blob([buf]) with NO type — mirrors SendSafely decryption output
      var blob = new Blob([plaintext]);
      log('Blob created: type="' + (blob.type || '(empty — no MIME)') + '"', 'log-warn');

      var blobUrl = URL.createObjectURL(blob);
      log('Download method: blob URL (not data URL)', 'log-warn');
      log('blob URL: ' + blobUrl, 'log-dim');

      var a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'decrypted-image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 5000);

      log('Download triggered via <a href="blob:..."> click', 'log-ok');

      // Preview: build a data URL just for the img tag
      var bytes = new Uint8Array(plaintext);
      var binary = '';
      var chunkSize = 8192;
      for (var i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }
      var previewUrl = 'data:image/png;base64,' + btoa(binary);
      previewImg.src = previewUrl;
      previewMeta.textContent =
        'download href: blob URL  |  blob.type: "" (empty)  |  filename: decrypted-image.png';
      previewSection.style.display = 'block';
    })
    .catch(function(err) {
      log('Decryption ERROR: ' + err.message, 'log-err');
      btnDecryptBlob.disabled = false;
    });
  });

  btnReset.addEventListener('click', reset);

  init();
}
