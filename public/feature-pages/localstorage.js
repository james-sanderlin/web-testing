function onNavigate_localstorage() {
  var keyInput = document.getElementById('ls-key');
  var valueInput = document.getElementById('ls-value');
  var setBtn = document.getElementById('ls-set-btn');
  var clearAllBtn = document.getElementById('ls-clear-all-btn');
  var refreshBtn = document.getElementById('ls-refresh-btn');
  var lsList = document.getElementById('ls-list');
  var usageEl = document.getElementById('ls-usage');

  if (!setBtn || !lsList) return;

  var APP_KEYS = ['starred-pages', 'recent-pages', 'cookie-expiry-meta', 'mimeOverride'];

  function isAppKey(key) {
    return APP_KEYS.indexOf(key) !== -1;
  }

  function estimateUsage() {
    var total = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      total += key.length + localStorage.getItem(key).length;
    }
    var bytes = total * 2;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  function truncate(str, max) {
    if (str.length <= max) return str;
    return str.substring(0, max) + '...';
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderItems() {
    usageEl.textContent = estimateUsage() + ' (' + localStorage.length + ' items)';

    if (localStorage.length === 0) {
      lsList.innerHTML = '<span style="color:#999;">No items in localStorage.</span>';
      return;
    }

    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    // Sort: user keys first (alphabetical), then app keys
    keys.sort(function(a, b) {
      var aApp = isAppKey(a);
      var bApp = isAppKey(b);
      if (aApp !== bApp) return aApp ? 1 : -1;
      return a.localeCompare(b);
    });

    lsList.innerHTML = keys.map(function(key) {
      var value = localStorage.getItem(key);
      var displayValue = escapeHtml(truncate(value, 120));
      var app = isAppKey(key);
      var sizeLabel = value.length > 100 ? ' <span style="color:#aaa;">(' + value.length + ' chars)</span>' : '';
      var appBadge = app ? ' <span style="font-size:0.65rem;background:#e3f2fd;color:#1565c0;padding:0.1rem 0.35rem;border-radius:3px;vertical-align:middle;">app</span>' : '';
      var opacity = app ? 'opacity:0.6;' : '';
      return '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:0.35rem 0;border-bottom:1px solid #eee;' + opacity + '">' +
        '<div style="flex:1;min-width:0;overflow:hidden;">' +
          '<strong>' + escapeHtml(key) + '</strong>' + appBadge + sizeLabel +
          '<div style="color:#555;word-break:break-all;">' + displayValue + '</div>' +
        '</div>' +
        '<button data-key="' + escapeHtml(key) + '" class="ls-delete-btn" style="' +
          'background:none;border:none;cursor:pointer;color:#c62828;padding:0.2rem;' +
          'display:inline-flex;align-items:center;flex-shrink:0;margin-left:0.5rem;">' +
          '<span class="material-icons" style="font-size:1rem;">close</span>' +
        '</button>' +
      '</div>';
    }).join('');

    lsList.querySelectorAll('.ls-delete-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var key = this.getAttribute('data-key');
        localStorage.removeItem(key);
        renderItems();
      });
    });
  }

  function flashRefresh() {
    lsList.style.opacity = '0.4';
    setTimeout(function() {
      lsList.style.opacity = '1';
    }, 150);
  }

  function onEnterKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setBtn.click();
    }
  }
  keyInput.addEventListener('keydown', onEnterKey);
  valueInput.addEventListener('keydown', onEnterKey);

  setBtn.addEventListener('click', function() {
    var key = keyInput.value.trim();
    var value = valueInput.value;
    if (!key) return;

    localStorage.setItem(key, value);
    keyInput.value = '';
    valueInput.value = '';
    renderItems();
  });

  clearAllBtn.addEventListener('click', function() {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    keys.forEach(function(key) {
      if (!isAppKey(key)) localStorage.removeItem(key);
    });
    renderItems();
  });

  refreshBtn.addEventListener('click', function() {
    flashRefresh();
    setTimeout(renderItems, 150);
  });

  lsList.style.transition = 'opacity 0.15s';
  renderItems();
}
