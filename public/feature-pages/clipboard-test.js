function onNavigate_clipboard_test() {
  var writeInput = document.getElementById('clipboard-write-input');
  var copyBtn = document.getElementById('clipboard-copy-btn');
  var copyHtmlBtn = document.getElementById('clipboard-copy-html-btn');
  var writeStatus = document.getElementById('clipboard-write-status');
  var readBtn = document.getElementById('clipboard-read-btn');
  var readOutput = document.getElementById('clipboard-read-output');
  var pasteZone = document.getElementById('clipboard-paste-zone');

  if (!copyBtn || !readBtn) return;

  function showStatus(el, msg, color) {
    el.style.color = color || '#666';
    el.textContent = msg;
  }

  // Copy plain text
  copyBtn.addEventListener('click', function() {
    var text = writeInput.value;
    if (!text) {
      showStatus(writeStatus, 'Nothing to copy — enter some text first.', '#c62828');
      return;
    }
    navigator.clipboard.writeText(text).then(function() {
      showStatus(writeStatus, 'Copied to clipboard!', '#2e7d32');
    }).catch(function(err) {
      showStatus(writeStatus, 'Failed: ' + err.message, '#c62828');
    });
  });

  // Copy as HTML (using ClipboardItem API)
  copyHtmlBtn.addEventListener('click', function() {
    var text = writeInput.value;
    if (!text) {
      showStatus(writeStatus, 'Nothing to copy — enter some text first.', '#c62828');
      return;
    }
    var html = '<div style="font-weight:bold;color:#1565c0;">' + text.replace(/</g, '&lt;') + '</div>';

    if (typeof ClipboardItem === 'undefined') {
      showStatus(writeStatus, 'ClipboardItem API not supported in this browser.', '#c62828');
      return;
    }

    var item = new ClipboardItem({
      'text/plain': new Blob([text], { type: 'text/plain' }),
      'text/html': new Blob([html], { type: 'text/html' })
    });
    navigator.clipboard.write([item]).then(function() {
      showStatus(writeStatus, 'Copied as HTML + plain text!', '#2e7d32');
    }).catch(function(err) {
      showStatus(writeStatus, 'Failed: ' + err.message, '#c62828');
    });
  });

  // Read clipboard
  readBtn.addEventListener('click', function() {
    navigator.clipboard.read().then(function(items) {
      var lines = [];
      var pending = 0;

      items.forEach(function(item, i) {
        lines.push('ClipboardItem[' + i + '] types: ' + item.types.join(', '));
        item.types.forEach(function(type) {
          pending++;
          item.getType(type).then(function(blob) {
            return blob.text();
          }).then(function(text) {
            var preview = text.length > 500 ? text.substring(0, 500) + '...' : text;
            lines.push('  ' + type + ': ' + preview);
            pending--;
            if (pending === 0) {
              readOutput.textContent = lines.join('\n');
            }
          });
        });
      });

      if (items.length === 0) {
        readOutput.textContent = 'Clipboard is empty.';
      }
    }).catch(function(err) {
      readOutput.textContent = 'Failed to read clipboard: ' + err.message;
    });
  });

  // Paste event listener
  pasteZone.addEventListener('paste', function(e) {
    e.preventDefault();
    var dt = e.clipboardData;
    var lines = ['Paste event captured!', 'Types: ' + Array.from(dt.types).join(', '), ''];

    dt.types.forEach(function(type) {
      var data = dt.getData(type);
      var preview = data.length > 300 ? data.substring(0, 300) + '...' : data;
      lines.push(type + ':');
      lines.push(preview);
      lines.push('');
    });

    if (dt.files.length > 0) {
      lines.push('Files: ' + dt.files.length);
      for (var i = 0; i < dt.files.length; i++) {
        var f = dt.files[i];
        lines.push('  ' + f.name + ' (' + f.type + ', ' + f.size + ' bytes)');
      }
    }

    pasteZone.textContent = lines.join('\n');
  });
}
