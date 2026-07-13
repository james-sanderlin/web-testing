function onNavigate_download_mechanisms() {
  function set(id, msg, status) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('dm-ok', 'dm-fail');
    if (status) el.classList.add(status === 'ok' ? 'dm-ok' : 'dm-fail');
  }

  function attachmentUrl(test) {
    return '/api/download-test?filename=sample.csv&disposition=attachment&test=' + encodeURIComponent(test);
  }

  // --- 1: static <a download> ---
  var staticAnchor = document.getElementById('dm-static-anchor');
  if (staticAnchor) {
    staticAnchor.addEventListener('click', function () {
      set('dm-static-result', 'Anchor clicked: href=' + staticAnchor.href + ', download="' + staticAnchor.download + '"', 'ok');
    });
  }

  // --- 2: fetch + Blob + createObjectURL ---
  var blobBtn = document.getElementById('dm-blob-btn');
  if (blobBtn) {
    blobBtn.onclick = async function () {
      set('dm-blob-result', 'Fetching...', null);
      try {
        var resp = await fetch('/assets/sample.csv');
        var blob = await resp.blob();
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'blob-sample.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
        set('dm-blob-result', 'Fetched ' + blob.size + ' bytes, created blob URL, clicked synthetic anchor.', 'ok');
      } catch (err) {
        set('dm-blob-result', 'Blob download error: ' + err, 'fail');
      }
    };
  }

  // --- 3: window.location.href navigation ---
  var locationBtn = document.getElementById('dm-location-btn');
  if (locationBtn) {
    locationBtn.onclick = function () {
      var url = attachmentUrl('location-href');
      set('dm-location-result', 'Navigating window.location.href to: ' + url, 'ok');
      window.location.href = url;
    };
  }

  // --- 4: window.open ---
  var openBtn = document.getElementById('dm-open-btn');
  if (openBtn) {
    openBtn.onclick = function () {
      var url = attachmentUrl('window-open');
      var win = window.open(url, '_blank');
      if (win) set('dm-open-result', 'window.open() called for: ' + url, 'ok');
      else set('dm-open-result', 'window.open() returned null (likely blocked by a popup blocker).', 'fail');
    };
  }

  // --- 5: form submission ---
  var form = document.getElementById('dm-form');
  if (form) {
    form.addEventListener('submit', function () {
      set('dm-form-result', 'Form submitted: ' + form.method + ' ' + form.action, 'ok');
    });
  }

  // --- 6: hidden iframe ---
  var iframeBtn = document.getElementById('dm-iframe-btn');
  var hiddenIframe = document.getElementById('dm-hidden-iframe');
  if (iframeBtn && hiddenIframe) {
    iframeBtn.onclick = function () {
      var url = attachmentUrl('hidden-iframe');
      hiddenIframe.src = url;
      set('dm-iframe-result', 'Set hidden iframe.src to: ' + url, 'ok');
    };
  }

  // --- 7: synthetic click on detached anchor ---
  var syntheticBtn = document.getElementById('dm-synthetic-btn');
  if (syntheticBtn) {
    syntheticBtn.onclick = function () {
      var a = document.createElement('a');
      a.href = '/assets/sample.csv';
      a.download = 'synthetic-sample.csv';
      // never appended to the DOM
      a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      set('dm-synthetic-result', 'Dispatched MouseEvent("click") on a detached, never-rendered <a download> element.', 'ok');
    };
  }

  // --- 8: data: URI ---
  var dataAnchor = document.getElementById('dm-data-anchor');
  if (dataAnchor) {
    var content = 'This file was embedded directly in the page as a data: URI.\nNo network request was made.\n';
    dataAnchor.href = 'data:text/plain;base64,' + btoa(content);
    dataAnchor.addEventListener('click', function () {
      set('dm-data-result', 'Anchor clicked with data: URI href (' + content.length + ' chars encoded).', 'ok');
    });
  }

  // --- 9: Content-Disposition toggle ---
  function triggerDisposition(disposition) {
    var url = '/api/download-test?filename=sample.csv&disposition=' + disposition + '&test=disposition-' + disposition;
    window.open(url, '_blank');
    set('dm-disposition-result', 'Requested ' + url + ' — server responded with Content-Disposition: ' + disposition + '; ...', 'ok');
  }
  var dispAttachBtn = document.getElementById('dm-disposition-attachment');
  if (dispAttachBtn) dispAttachBtn.onclick = function () { triggerDisposition('attachment'); };
  var dispInlineBtn = document.getElementById('dm-disposition-inline');
  if (dispInlineBtn) dispInlineBtn.onclick = function () { triggerDisposition('inline'); };

  // --- 10: service worker intercepted response ---
  var SW_URL = '/sw-download-mechanisms.js';
  var SW_FETCH_URL = '/__dm-sw-download?file=sw-generated.txt';

  var swRegisterBtn = document.getElementById('dm-sw-register-btn');
  if (swRegisterBtn) {
    swRegisterBtn.onclick = async function () {
      if (!('serviceWorker' in navigator)) {
        set('dm-sw-result', 'navigator.serviceWorker is not available in this context.', 'fail');
        return;
      }
      try {
        var reg = await navigator.serviceWorker.register(SW_URL);
        await navigator.serviceWorker.ready;
        set('dm-sw-result', 'Service worker registered at scope: ' + reg.scope, 'ok');
      } catch (err) {
        set('dm-sw-result', 'Service worker registration failed: ' + err, 'fail');
      }
    };
  }

  var swDownloadBtn = document.getElementById('dm-sw-download-btn');
  if (swDownloadBtn) {
    swDownloadBtn.onclick = async function () {
      if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
        set('dm-sw-result', 'No active service worker controlling this page yet — click "Register Service Worker" first, then try again.', 'fail');
        return;
      }
      try {
        var resp = await fetch(SW_FETCH_URL);
        var swHeader = resp.headers.get('X-Served-By') || 'unknown';
        var blob = await resp.blob();
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'sw-generated.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
        set('dm-sw-result', 'Response served by: ' + swHeader + ', Content-Disposition: ' + (resp.headers.get('Content-Disposition') || 'none'), 'ok');
      } catch (err) {
        set('dm-sw-result', 'SW-served fetch failed: ' + err, 'fail');
      }
    };
  }
}
