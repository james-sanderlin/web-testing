var PD_STORE_KEY = 'pd-logs';
var PD_DRAG_KEY = 'pd-drag-in-progress';

function pdLoadLogs() {
  try { return JSON.parse(sessionStorage.getItem(PD_STORE_KEY)) || {}; } catch (e) { return {}; }
}

function pdSaveLogs(logs) {
  try { sessionStorage.setItem(PD_STORE_KEY, JSON.stringify(logs)); } catch (e) { /* storage unavailable */ }
}

function pdLog(caseId, msg) {
  var logs = pdLoadLogs();
  var line = new Date().toLocaleTimeString() + '  ' + msg;
  (logs[caseId] = logs[caseId] || []).push(line);
  pdSaveLogs(logs);
  var el = caseId === 'global'
    ? document.getElementById('pd-global-log')
    : document.querySelector('.pd-card[data-case="' + caseId + '"] .pd-log');
  if (el) {
    el.textContent += (el.textContent ? '\n' : '') + line;
    el.scrollTop = el.scrollHeight;
  }
}

function pdDescribeFiles(files) {
  return Array.from(files || []).map(function (f) {
    return f.name + ' (' + f.size + ' B, ' + (f.type || 'no type') + ')';
  }).join(', ');
}

function pdDescribeTransfer(dt) {
  if (!dt) return 'no dataTransfer';
  // Reads only types/kinds: touching dt.files or getAsFile() would itself count as the page accessing the file.
  var types = Array.from(dt.types || []).join(', ') || 'none';
  var kinds = Array.from(dt.items || []).filter(function (i) { return i.kind === 'file'; })
    .map(function (i) { return i.type || 'no type'; });
  return 'types=[' + types + ']' + (kinds.length ? ' file items=[' + kinds.join(', ') + ']' : ' no files');
}

function pdFilesFrom(e) {
  var dt = e.clipboardData || e.dataTransfer;
  return dt ? Array.from(dt.files || []) : [];
}

function pdHasFiles(e) {
  var dt = e.clipboardData || e.dataTransfer;
  return !!dt && Array.from(dt.types || []).indexOf('Files') !== -1;
}

function pdBodySize(body) {
  if (body == null) return { bytes: 0, files: [] };
  if (typeof body === 'string') return { bytes: new Blob([body]).size, files: [] };
  if (body instanceof Blob) return { bytes: body.size, files: body instanceof File ? [body.name] : [] };
  if (body instanceof FormData) {
    var bytes = 0, files = [];
    body.forEach(function (v) {
      if (v instanceof File) { bytes += v.size; files.push(v.name); }
      else bytes += new Blob([String(v)]).size;
    });
    return { bytes: bytes, files: files };
  }
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return { bytes: body.byteLength, files: [] };
  return { bytes: -1, files: [] };
}

function pdLogRequest(api, method, url, body) {
  var size = pdBodySize(body);
  var sizeText = size.bytes < 0 ? 'unknown size' : size.bytes + ' B';
  pdLog('global', 'NETWORK ' + api + ' ' + method + ' ' + url + ' body=' + sizeText +
    (size.files.length ? ' files=[' + size.files.join(', ') + ']' : ''));
}

var PD_HELD_THRESHOLD_MS = 150;
var pdTiming = { pasteKeyAt: 0, lastTrustedDragoverAt: 0, refirePulses: 0 };

function pdScanVerdict(type) {
  var since = type === 'paste' ? pdTiming.pasteKeyAt : pdTiming.lastTrustedDragoverAt;
  if (!since || Date.now() - since > 30000) return null;
  var delay = Date.now() - since;
  return { delay: delay, held: delay > PD_HELD_THRESHOLD_MS, pulses: pdTiming.refirePulses };
}

function pdShowScanBadge(card, type, verdict) {
  var badge = card.querySelector('.pd-scan') || card.querySelector('.pd-head').appendChild(document.createElement('span'));
  badge.className = 'pd-scan ' + (verdict.held ? 'pd-scan-held' : 'pd-scan-fast');
  badge.textContent = verdict.held
    ? type + ' held ' + verdict.delay + ' ms (scanned)'
    : type + ' delivered in ' + verdict.delay + ' ms (not held)';
}

function pdInstallGlobalHooks() {
  if (window.__pdHooksInstalled) return;
  window.__pdHooksInstalled = true;

  window.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') pdTiming.pasteKeyAt = Date.now();
  }, true);

  window.addEventListener('dragenter', function (e) {
    if (e.isTrusted && pdHasFiles(e)) pdTiming.refirePulses = 0;
  }, true);

  window.addEventListener('dragover', function (e) {
    if (e.isTrusted) pdTiming.lastTrustedDragoverAt = Date.now();
    else pdTiming.refirePulses += 1;
  }, true);

  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || String(input);
    pdLogRequest('fetch', (init && init.method) || 'GET', url, init && init.body);
    return origFetch.apply(this, arguments);
  };

  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__pdReq = { method: method, url: url };
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    var req = this.__pdReq || { method: '?', url: '?' };
    pdLogRequest('xhr', req.method, req.url, body);
    return origSend.apply(this, arguments);
  };

  if (navigator.sendBeacon) {
    var origBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url, data) {
      pdLogRequest('sendBeacon', 'POST', url, data);
      return origBeacon(url, data);
    };
  }

  function outsideCards(e) {
    return !(e.target instanceof Element && e.target.closest('.pd-card'));
  }

  window.addEventListener('paste', function (e) {
    if (outsideCards(e)) pdLog('global', 'paste outside cards on <' + (e.target.tagName || '?').toLowerCase() + '>: ' + pdDescribeTransfer(e.clipboardData));
  });

  window.addEventListener('dragover', function (e) {
    if (!pdHasFiles(e)) return;
    try { sessionStorage.setItem(PD_DRAG_KEY, String(Date.now())); } catch (err) { /* ignore */ }
    var guard = document.getElementById('pd-guard');
    if (guard && guard.checked && !e.defaultPrevented) e.preventDefault();
  });

  window.addEventListener('drop', function (e) {
    try { sessionStorage.removeItem(PD_DRAG_KEY); } catch (err) { /* ignore */ }
    if (!pdHasFiles(e)) return;
    var guard = document.getElementById('pd-guard');
    if (guard && guard.checked && !e.defaultPrevented) {
      e.preventDefault();
      pdLog('global', 'guard caught an unhandled file drop on <' + (e.target.tagName || '?').toLowerCase() + '>: ' + pdDescribeTransfer(e.dataTransfer));
    } else if (outsideCards(e)) {
      pdLog('global', 'drop outside cards: ' + pdDescribeTransfer(e.dataTransfer));
    }
  });

  window.addEventListener('pagehide', function () {
    var ts = 0;
    try { ts = Number(sessionStorage.getItem(PD_DRAG_KEY)) || 0; } catch (err) { /* ignore */ }
    if (ts && Date.now() - ts < 3000) {
      pdLog('global', 'PAGE UNLOADED right after a file dragover with no drop event — Chrome opened the dropped file itself (no page JS saw it).');
    }
    try { sessionStorage.removeItem(PD_DRAG_KEY); } catch (err) { /* ignore */ }
  });
}

function pdSnapshot(target) {
  if (target.isContentEditable) {
    var imgs = Array.from(target.querySelectorAll('img')).map(function (i) { return i.src.slice(0, 5); });
    return { html: target.innerHTML, imgs: imgs };
  }
  return { value: target.value };
}

function pdDescribeChange(before, after) {
  if ('value' in before) {
    return before.value === after.value ? 'value unchanged' : 'value changed to "' + after.value.slice(0, 60) + '"';
  }
  if (before.html === after.html) return 'DOM unchanged';
  var added = after.imgs.length - before.imgs.length;
  return 'DOM changed' + (added > 0 ? ', ' + added + ' <img> inserted (src ' + after.imgs.slice(-added).join(', ') + '…)' : '');
}

function pdInstrumentCard(card) {
  var caseId = card.dataset.case;
  var target = card.querySelector('.pd-target');
  var dragLogged = false;
  var before = null;

  target.addEventListener('dragenter', function () { target.classList.add('pd-over'); });
  target.addEventListener('dragleave', function () { target.classList.remove('pd-over'); dragLogged = false; });

  card.addEventListener('dragover', function (e) {
    if (dragLogged || !pdHasFiles(e)) return;
    dragLogged = true;
    pdLog(caseId, 'dragover with files — page called preventDefault: ' + (e.defaultPrevented ? 'yes' : 'no'));
  });

  ['paste', 'drop'].forEach(function (type) {
    card.addEventListener(type, function () { before = pdSnapshot(target); }, true);
    card.addEventListener(type, function (e) {
      target.classList.remove('pd-over');
      dragLogged = false;
      var dt = e.clipboardData || e.dataTransfer;
      pdLog(caseId, type + ' fired on <' + e.target.tagName.toLowerCase() + '>: ' + pdDescribeTransfer(dt) +
        ' | page prevented default: ' + (e.defaultPrevented ? 'yes' : 'no'));
      var verdict = pdHasFiles(e) ? pdScanVerdict(type) : null;
      if (verdict) {
        pdShowScanBadge(card, type, verdict);
        pdLog(caseId, 'SCAN CHECK: ' + type + ' arrived ' + verdict.delay + ' ms after ' +
          (type === 'paste' ? 'Cmd/Ctrl+V' : 'the last real dragover') +
          (type === 'drop' ? ', ' + verdict.pulses + ' Island refire pulse(s) seen' : '') +
          (verdict.held ? ' — held for a scan' : ' — not held'));
      }
      var snap = before;
      setTimeout(function () { pdLog(caseId, 'after ' + type + ': ' + pdDescribeChange(snap, pdSnapshot(target))); }, 100);
    });
  });
}

function pdUpload(caseId, formData) {
  return fetch('/api/upload', { method: 'POST', body: formData })
    .then(function (r) { return r.json(); })
    .then(function (json) { pdLog(caseId, 'SENT — server received ' + json.bytesReceived + ' B'); })
    .catch(function (err) { pdLog(caseId, 'upload failed: ' + err.message); });
}

function pdOnFiles(target, handler) {
  ['paste', 'drop'].forEach(function (type) {
    target.addEventListener(type, function (e) {
      var files = pdFilesFrom(e);
      if (!files.length) return;
      e.preventDefault();
      handler(files);
    });
  });
  target.addEventListener('dragover', function (e) { if (pdHasFiles(e)) e.preventDefault(); });
}

function pdReadAsDataUrl(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function () { resolve(reader.result); };
    reader.onerror = function () { reject(reader.error); };
    reader.readAsDataURL(file);
  });
}

function pdWireSwallow(card) {
  var target = card.querySelector('.pd-target');
  target.addEventListener('dragover', function (e) { e.preventDefault(); });
  target.addEventListener('drop', function (e) { e.preventDefault(); });
  target.addEventListener('paste', function (e) { if (pdHasFiles(e)) e.preventDefault(); });
}

function pdWireLocalPreview(card) {
  var caseId = card.dataset.case;
  var preview = card.querySelector('.pd-preview');
  pdOnFiles(card.querySelector('.pd-target'), function (files) {
    preview.innerHTML = '';
    files.forEach(function (file) {
      pdReadAsDataUrl(file).then(function (url) {
        pdLog(caseId, 'read ' + file.name + ' locally (' + file.size + ' B), not sent');
        if (file.type.indexOf('image/') === 0) {
          var img = document.createElement('img');
          img.src = url;
          preview.appendChild(img);
        }
      });
    });
  });
}

function pdWireImmediateUpload(card) {
  var caseId = card.dataset.case;
  pdOnFiles(card.querySelector('.pd-target'), function (files) {
    var fd = new FormData();
    files.forEach(function (f) { fd.append('file', f, f.name); });
    pdLog(caseId, 'uploading ' + pdDescribeFiles(files));
    pdUpload(caseId, fd);
  });
}

function pdWireChatComposer(card) {
  var caseId = card.dataset.case;
  var textarea = card.querySelector('.pd-target');
  var chips = card.querySelector('.pd-attachments');
  var pending = [];

  function render() {
    chips.innerHTML = '';
    pending.forEach(function (file, i) {
      var chip = document.createElement('span');
      chip.className = 'pd-chip';
      chip.textContent = file.name + ' ';
      var remove = document.createElement('button');
      remove.textContent = '×';
      remove.title = 'Remove attachment';
      remove.onclick = function () {
        pending.splice(i, 1);
        pdLog(caseId, 'removed attachment ' + file.name + ' (never sent)');
        render();
      };
      chip.appendChild(remove);
      chips.appendChild(chip);
    });
  }

  pdOnFiles(textarea, function (files) {
    pending = pending.concat(files);
    pdLog(caseId, 'attached ' + pdDescribeFiles(files) + ' — waiting for Send');
    render();
  });

  card.querySelector('.pd-send').onclick = function () {
    if (!pending.length && !textarea.value) return pdLog(caseId, 'nothing to send');
    var fd = new FormData();
    fd.append('message', textarea.value);
    pending.forEach(function (f) { fd.append('file', f, f.name); });
    pdLog(caseId, 'sending message' + (pending.length ? ' with ' + pdDescribeFiles(pending) : ' (no files)'));
    pdUpload(caseId, fd);
    pending = [];
    textarea.value = '';
    render();
  };
}

function pdWireRichEditor(card) {
  var caseId = card.dataset.case;
  var editor = card.querySelector('.pd-target');
  pdOnFiles(editor, function (files) {
    files.filter(function (f) { return f.type.indexOf('image/') === 0; }).forEach(function (file) {
      pdReadAsDataUrl(file).then(function (url) {
        editor.focus();
        document.execCommand('insertImage', false, url);
        pdLog(caseId, 'inlined ' + file.name + ' as base64 <img> (' + url.length + ' chars)');
      });
    });
  });

  card.querySelector('.pd-submit').onclick = function () {
    var html = editor.innerHTML;
    var fd = new FormData();
    fd.append('html', html);
    pdLog(caseId, 'submitting editor HTML as a text field (' + html.length + ' chars, ' +
      editor.querySelectorAll('img[src^="data:"]').length + ' inline images)');
    pdUpload(caseId, fd);
  };
}

function pdDescribeElement(el) {
  if (!el || !el.tagName) return 'none';
  return '<' + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '>';
}

function pdHandleBodyPaste(e) {
  var card = document.querySelector('.pd-card[data-case="PD-10"]');
  var target = e.target;
  if (!card || (target instanceof Element && target.closest('input, textarea, [contenteditable="true"]'))) return;
  var caseId = card.dataset.case;
  var mode = (card.querySelector('input[name="pd10-mode"]:checked') || {}).value;
  pdLog(caseId, 'paste fired on ' + pdDescribeElement(target) + ' (activeElement ' +
    pdDescribeElement(document.activeElement) + '): ' + pdDescribeTransfer(e.clipboardData));
  if (!pdHasFiles(e)) return;
  var verdict = pdScanVerdict('paste');
  if (verdict) pdShowScanBadge(card, 'paste', verdict);
  if (mode === 'ignore') return pdLog(caseId, 'ignored — page never read the file');

  var files = pdFilesFrom(e);
  var preview = card.querySelector('.pd-preview');
  preview.innerHTML = '';
  files.forEach(function (file) {
    pdReadAsDataUrl(file).then(function (url) {
      pdLog(caseId, 'read ' + file.name + ' (' + file.size + ' B) with no input focused');
      if (file.type.indexOf('image/') === 0) {
        var img = document.createElement('img');
        img.src = url;
        preview.appendChild(img);
      }
    });
  });
  if (mode === 'send') {
    var fd = new FormData();
    files.forEach(function (f) { fd.append('file', f, f.name); });
    pdLog(caseId, 'uploading ' + pdDescribeFiles(files));
    pdUpload(caseId, fd);
  }
}

function pdWireBodyPaste(card) {
  card.querySelector('.pd-focus-body').onclick = function () {
    document.activeElement.blur();
    pdLog(card.dataset.case, 'focus is now on ' + pdDescribeElement(document.activeElement) + ' — press Cmd/Ctrl+V');
  };
  if (window.__pdBodyPasteInstalled) return;
  window.__pdBodyPasteInstalled = true;
  window.addEventListener('paste', pdHandleBodyPaste);
}

var PD_BEHAVIORS = {
  'PD-05': pdWireSwallow,
  'PD-06': pdWireLocalPreview,
  'PD-07': pdWireImmediateUpload,
  'PD-08': pdWireChatComposer,
  'PD-09': pdWireRichEditor,
  'PD-10': pdWireBodyPaste,
};

function pdApplyFocus(caseId) {
  var cards = document.querySelectorAll('#pd-grid .pd-card');
  var found = caseId && document.querySelector('#pd-grid .pd-card[data-case="' + caseId + '"]');
  var focused = found ? caseId : null;
  cards.forEach(function (card) {
    card.hidden = !!focused && card.dataset.case !== focused;
    var btn = card.querySelector('.pd-focus');
    if (btn) btn.textContent = focused ? 'Show all' : 'Focus';
  });
  document.getElementById('pd-grid').classList.toggle('pd-focused', !!focused);

  var url = new URL(window.location.href);
  if (focused) url.searchParams.set('case', focused);
  else url.searchParams.delete('case');
  window.history.replaceState(window.history.state, '', url);
}

function pdAddFocusButton(card) {
  if (card.querySelector('.pd-focus')) return;
  var btn = document.createElement('button');
  btn.className = 'pd-focus pd-btn pd-btn-ghost';
  btn.title = 'Show only this case (the URL becomes a shareable link)';
  btn.onclick = function () {
    pdApplyFocus(document.getElementById('pd-grid').classList.contains('pd-focused') ? null : card.dataset.case);
  };
  card.querySelector('.pd-head').appendChild(btn);
}

function onNavigate_paste_drop_targets() {
  var grid = document.getElementById('pd-grid');
  if (!grid) return;

  pdInstallGlobalHooks();

  var logs = pdLoadLogs();
  document.getElementById('pd-global-log').textContent = (logs.global || []).join('\n');

  grid.querySelectorAll('.pd-card').forEach(function (card) {
    var caseId = card.dataset.case;
    card.querySelector('.pd-log').textContent = (logs[caseId] || []).join('\n');
    if (card.querySelector('.pd-target')) pdInstrumentCard(card);
    if (PD_BEHAVIORS[caseId]) PD_BEHAVIORS[caseId](card);
    pdAddFocusButton(card);
  });
  pdApplyFocus(new URLSearchParams(window.location.search).get('case'));

  document.getElementById('pd-clear').onclick = function () {
    pdSaveLogs({});
    document.querySelectorAll('#pd-grid .pd-log, #pd-global-log').forEach(function (el) { el.textContent = ''; });
  };
}
