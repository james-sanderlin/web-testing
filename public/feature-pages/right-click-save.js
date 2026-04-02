function onNavigate_right_click_save() {
  var statusEl = document.getElementById('status');
  var imgContainer = document.getElementById('img-container');
  var dataImg = document.getElementById('data-img');
  var imgMeta = document.getElementById('img-meta');
  if (!statusEl || !dataImg) return;

  statusEl.textContent = 'Fetching /assets/sample.png…';

  fetch('/assets/sample.png')
    .then(function(r) {
      if (!r.ok) throw new Error('fetch failed: ' + r.status);
      return r.arrayBuffer();
    })
    .then(function(buf) {
      var bytes = new Uint8Array(buf);
      var binary = '';
      var chunkSize = 8192;
      for (var i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }
      var b64 = btoa(binary);
      var dataUrl = 'data:image/png;base64,' + b64;

      dataImg.src = dataUrl;
      imgMeta.textContent =
        'src: data:image/png;base64,… (' + dataUrl.length + ' chars)  |  no HTTP origin  |  right-click to save';
      imgContainer.style.display = 'block';
      statusEl.textContent = 'Image loaded as data URL. Right-click → Save Image As… to a Secure Storage folder.';
      statusEl.style.color = '#388e3c';
    })
    .catch(function(err) {
      statusEl.textContent = 'Error: ' + err.message;
      statusEl.style.color = '#c62828';
    });
}
