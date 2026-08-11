function onNavigate_encrypt_upload() {
  var logEl = document.getElementById('eu-log');
  var wireEl = document.getElementById('eu-wire');
  var wireMetaEl = document.getElementById('eu-wire-meta');
  var responseEl = document.getElementById('eu-response');
  var fileInput = document.getElementById('eu-file');
  var runBtn = document.getElementById('eu-run');
  var resetBtn = document.getElementById('eu-reset');
  var encryptOpts = document.getElementById('eu-encrypt-opts');
  var destUrlInput = document.getElementById('eu-dest-url');
  var fileNameEl = document.getElementById('eu-file-name');
  if (!logEl || !runBtn) return;

  // ---- helpers ---------------------------------------------------------------

  function log(msg, cls) {
    var ts = new Date().toLocaleTimeString();
    var span = document.createElement('span');
    span.className = cls || '';
    span.textContent = '[' + ts + '] ' + msg + '\n';
    logEl.appendChild(span);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function bufToBase64(buf) {
    var bytes = new Uint8Array(buf);
    var binary = '';
    var chunk = 8192;
    for (var i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function toHex(bytes) {
    return Array.prototype.map.call(bytes, function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  // Naive byte-subsequence search — needle is small (a plaintext sample).
  function containsBytes(haystack, needle) {
    if (needle.length === 0 || needle.length > haystack.length) return false;
    var first = needle[0];
    for (var i = 0; i <= haystack.length - needle.length; i++) {
      if (haystack[i] !== first) continue;
      var match = true;
      for (var j = 1; j < needle.length; j++) {
        if (haystack[i + j] !== needle[j]) { match = false; break; }
      }
      if (match) return true;
    }
    return false;
  }

  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function getRadio(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  // Confirm whether the original plaintext survives into the outbound bytes —
  // the "negative content match" a browser agent can do but a proxy cannot.
  function plaintextCheck(plain, wireBytes) {
    var sample = plain.subarray(0, Math.min(64, plain.length));
    var present = containsBytes(wireBytes, sample);
    var line = document.createElement('span');
    line.className = present ? 'log-err' : 'log-ok';
    line.textContent =
      'Plaintext present in outbound body? ' + (present ? 'YES — content is on the wire' :
        'NO — only ciphertext leaves the browser') + '\n';
    wireEl.appendChild(line);
  }

  // ---- crypto paths ----------------------------------------------------------

  async function encryptWebCrypto(plain) {
    var key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    var iv = window.crypto.getRandomValues(new Uint8Array(12));
    var ct = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, plain);
    var rawKey = await window.crypto.subtle.exportKey('raw', key);
    return { ciphertext: new Uint8Array(ct), iv: iv, keyBytes: new Uint8Array(rawKey), algo: 'AES-GCM-256 (Web Crypto)' };
  }

  function encryptXor(plain) {
    // Deliberately NOT Web Crypto — shows where crypto.subtle instrumentation misses.
    var keyBytes = window.crypto.getRandomValues(new Uint8Array(32));
    var iv = window.crypto.getRandomValues(new Uint8Array(12));
    var ct = new Uint8Array(plain.length);
    for (var i = 0; i < plain.length; i++) {
      ct[i] = plain[i] ^ keyBytes[i % keyBytes.length];
    }
    return { ciphertext: ct, iv: iv, keyBytes: keyBytes, algo: 'XOR (custom JS)' };
  }

  // ---- envelope --------------------------------------------------------------

  function buildEnvelope(filename, enc, fields) {
    var payload;
    if (fields === 'obfuscated') {
      payload = {
        d: bufToBase64(enc.ciphertext),
        k: bufToBase64(enc.keyBytes),
        n: bufToBase64(enc.iv),
        t: new Date().toISOString(),
        v: '1'
      };
    } else {
      payload = {
        ciphertext: bufToBase64(enc.ciphertext),
        encryptedKey: bufToBase64(enc.keyBytes),
        iv: bufToBase64(enc.iv),
        timestamp: new Date().toISOString(),
        keyVersion: '1'
      };
    }
    return {
      operationName: 'CreateArgosDocument',
      variables: { input: { filename: filename, payload: payload } }
    };
  }

  function destination() {
    var dest = getRadio('eu-dest');
    if (dest === 'custom') return (destUrlInput.value || '').trim();
    if (dest === 'httpbin') return 'https://httpbin.org/post';
    return '/api/upload';
  }

  // ---- flows -----------------------------------------------------------------

  async function runNormal(file, plain, dest) {
    log('Mode: normal upload — building multipart/form-data body…', 'log-warn');
    var fd = new FormData();
    fd.append('file', file, file.name);

    // Serialize the multipart body so we can inspect exactly what goes on the wire.
    var wireBuf = await new Response(fd).arrayBuffer();
    var wireBytes = new Uint8Array(wireBuf);

    wireMetaEl.textContent =
      'Content-Type: multipart/form-data  |  body: ' + fmtBytes(wireBytes.length) +
      '  |  original file: ' + fmtBytes(plain.length);
    var head = wireBytes.subarray(0, 300);
    wireEl.textContent = 'multipart body (first 300 bytes as text):\n\n' +
      new TextDecoder('utf-8', { fatal: false }).decode(head) + '\n…';
    plaintextCheck(plain, wireBytes);

    log('POST ' + dest + ' …');
    var res = await fetch(dest, { method: 'POST', body: fd });
    return res;
  }

  async function runEncrypt(file, plain, dest) {
    var cryptoMode = getRadio('eu-crypto');
    var fields = getRadio('eu-fields');
    var encoding = getRadio('eu-encoding');

    log('Reading ' + plain.length + ' bytes into memory (file.arrayBuffer)…', 'log-ok');
    log('Encrypting client-side with ' + (cryptoMode === 'xor' ? 'a custom JS XOR routine' : 'Web Crypto AES-GCM') + '…');

    var enc = cryptoMode === 'xor' ? encryptXor(plain) : await encryptWebCrypto(plain);
    log('Encrypted: ' + enc.ciphertext.length + ' bytes ciphertext  |  iv=' + toHex(enc.iv), 'log-ok');
    log('Key exported to bytes (in a real app this would be RSA-wrapped to the server public key, not sent raw).', 'log-dim');

    var res;
    if (encoding === 'raw') {
      // Ciphertext as the raw body; metadata rides in headers.
      var body = enc.ciphertext;
      wireMetaEl.textContent =
        'Content-Type: application/octet-stream  |  body: ' + fmtBytes(body.length) +
        '  |  metadata (iv, key, filename) in X- headers';
      wireEl.textContent =
        'raw ciphertext (first 64 bytes hex):\n\n' + toHex(body.subarray(0, 64)) + ' …';
      plaintextCheck(plain, body);

      log('POST ' + dest + ' (raw ciphertext body)…');
      res = await fetch(dest, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Filename': file.name,
          'X-Iv': bufToBase64(enc.iv),
          'X-Encrypted-Key': bufToBase64(enc.keyBytes),
          'X-Key-Version': '1'
        },
        body: body
      });
    } else {
      // Base64 ciphertext inside a GraphQL-style JSON envelope (the Chainguard shape).
      var envelope = buildEnvelope(file.name, enc, fields);
      var json = JSON.stringify(envelope);
      var wireBytes = new TextEncoder().encode(json);

      wireMetaEl.textContent =
        'Content-Type: application/json  |  body: ' + fmtBytes(wireBytes.length) +
        '  |  original file: ' + fmtBytes(plain.length);
      wireEl.textContent = JSON.stringify(envelope, function (k, v) {
        if (typeof v === 'string' && v.length > 120) return v.slice(0, 120) + '…(' + v.length + ' chars)';
        return v;
      }, 2);
      plaintextCheck(plain, wireBytes);

      log('POST ' + dest + ' (JSON envelope, operationName=CreateArgosDocument)…');
      res = await fetch(dest, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json
      });
    }
    return res;
  }

  async function run() {
    var file = fileInput.files && fileInput.files[0];
    if (!file) { log('Choose a file first.', 'log-err'); return; }

    var dest = destination();
    if (!dest) { log('Enter a destination URL (or switch to Local).', 'log-err'); return; }

    runBtn.disabled = true;
    logEl.innerHTML = '';
    wireEl.innerHTML = '';
    wireMetaEl.textContent = '';
    responseEl.textContent = '';

    log('Selected: "' + file.name + '"  (' + fmtBytes(file.size) + ', type=' + (file.type || 'unknown') + ')', 'log-ok');

    try {
      var buf = await file.arrayBuffer();
      var plain = new Uint8Array(buf);

      var mode = getRadio('eu-mode');
      var res = mode === 'normal'
        ? await runNormal(file, plain, dest)
        : await runEncrypt(file, plain, dest);

      log('Response: HTTP ' + res.status + ' ' + res.statusText, res.ok ? 'log-ok' : 'log-err');
      var text = await res.text();
      responseEl.textContent = text || '(empty response body)';
    } catch (err) {
      log('ERROR: ' + err.message, 'log-err');
      responseEl.textContent = String(err && err.stack ? err.stack : err);
    } finally {
      runBtn.disabled = false;
    }
  }

  // ---- wiring ----------------------------------------------------------------

  function syncModeUi() {
    var mode = getRadio('eu-mode');
    encryptOpts.style.display = mode === 'normal' ? 'none' : 'flex';
    runBtn.querySelector('.material-icons').textContent = mode === 'normal' ? 'cloud_upload' : 'lock';
    runBtn.querySelector('.btn-label').textContent = mode === 'normal' ? 'Upload' : 'Encrypt & upload';
  }

  function syncDestUi() {
    destUrlInput.disabled = getRadio('eu-dest') !== 'custom';
  }

  function syncFileUi() {
    var file = fileInput.files && fileInput.files[0];
    fileNameEl.textContent = file ? file.name : 'Choose a file…';
    fileNameEl.parentNode.classList.toggle('has-file', !!file);
    runBtn.disabled = !file;
  }

  Array.prototype.forEach.call(document.querySelectorAll('input[name="eu-mode"]'), function (el) {
    el.addEventListener('change', syncModeUi);
  });
  Array.prototype.forEach.call(document.querySelectorAll('input[name="eu-dest"]'), function (el) {
    el.addEventListener('change', syncDestUi);
  });
  fileInput.addEventListener('change', syncFileUi);
  runBtn.addEventListener('click', run);
  resetBtn.addEventListener('click', function () {
    fileInput.value = '';
    logEl.innerHTML = '';
    wireEl.innerHTML = '';
    wireMetaEl.textContent = '';
    responseEl.textContent = '';
    syncFileUi();
  });

  syncModeUi();
  syncDestUi();
  syncFileUi();
}
