function onNavigate_download_multiple() {
  var btn = document.getElementById('multi-download-btn');
  if (!btn) return;

  var DELAY_MS = 250;
  var REVOKE_DELAY_MS = 10000;

  function pad(n, width) {
    var s = String(n);
    while (s.length < width) s = '0' + s;
    return s;
  }

  function buildContent(now, index, total, batchId) {
    return 'Dynamic File Generated: ' + now.toISOString() + '\n\n' +
      'File ' + index + ' of ' + total + '\n' +
      'Batch ID: ' + batchId + '\n' +
      'Local Time: ' + now.toLocaleString() + '\n' +
      'Browser: ' + navigator.userAgent + '\n' +
      'Screen Resolution: ' + screen.width + 'x' + screen.height + '\n' +
      'Language: ' + navigator.language + '\n';
  }

  function downloadOne(filename, content) {
    var blob = new Blob([content], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, REVOKE_DELAY_MS);
  }

  btn.onclick = function() {
    var input = document.getElementById('multi-count');
    var results = document.getElementById('multi-results');
    var count = parseInt(input.value, 10);
    if (isNaN(count)) count = 5;
    count = Math.max(2, Math.min(50, count));
    input.value = count;

    var batchStart = new Date();
    var batchId = batchStart.toISOString().replace(/[:.]/g, '-').replace(/Z$/, '');
    var width = Math.max(2, String(count).length);

    results.innerHTML = '';
    btn.disabled = true;

    for (var i = 1; i <= count; i++) {
      (function(index) {
        setTimeout(function() {
          var filename = 'timestamp-' + batchId + '-' + pad(index, width) + '.txt';
          downloadOne(filename, buildContent(new Date(), index, count, batchId));
          var li = document.createElement('li');
          li.textContent = index + '/' + count + ' — ' + filename;
          results.appendChild(li);
          if (index === count) btn.disabled = false;
        }, (index - 1) * DELAY_MS);
      })(i);
    }
  };
}
