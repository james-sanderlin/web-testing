function onNavigate_cookie_test() {
  var nameInput = document.getElementById('cookie-name');
  var valueInput = document.getElementById('cookie-value');
  var expirySelect = document.getElementById('cookie-expiry');
  var setBtn = document.getElementById('cookie-set-btn');
  var clearAllBtn = document.getElementById('cookie-clear-all-btn');
  var refreshBtn = document.getElementById('cookie-refresh-btn');
  var cookieList = document.getElementById('cookie-list');

  if (!setBtn || !cookieList) return;

  // Track expiry metadata for cookies set through our UI
  var EXPIRY_KEY = 'cookie-expiry-meta';

  function getExpiryMeta() {
    try { return JSON.parse(localStorage.getItem(EXPIRY_KEY)) || {}; } catch { return {}; }
  }

  function setExpiryMeta(meta) {
    localStorage.setItem(EXPIRY_KEY, JSON.stringify(meta));
  }

  function formatExpiry(expiresAt) {
    var now = Date.now();
    var diff = expiresAt - now;
    if (diff <= 0) return 'expired';
    if (diff < 60000) return Math.ceil(diff / 1000) + 's remaining';
    if (diff < 3600000) return Math.ceil(diff / 60000) + 'm remaining';
    if (diff < 86400000) return Math.ceil(diff / 3600000) + 'h remaining';
    return new Date(expiresAt).toLocaleDateString();
  }

  function renderCookies() {
    var raw = document.cookie;
    if (!raw) {
      cookieList.innerHTML = '<span style="color:#999;">No cookies set.</span>';
      return;
    }
    var meta = getExpiryMeta();
    var pairs = raw.split('; ');
    cookieList.innerHTML = pairs.map(function(pair) {
      var parts = pair.split('=');
      var name = decodeURIComponent(parts[0]);
      var value = decodeURIComponent(parts.slice(1).join('='));
      var expiryHtml = '';
      if (meta[name]) {
        var label = meta[name] === 'session' ? 'session' : formatExpiry(meta[name]);
        var color = label === 'expired' ? '#c62828' : '#888';
        expiryHtml = '<div style="font-size:0.75rem;color:' + color + ';">' + label + '</div>';
      }
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.35rem 0;border-bottom:1px solid #eee;">' +
        '<div><strong>' + name + '</strong> = ' + value + expiryHtml + '</div>' +
        '<button data-cookie="' + name + '" class="cookie-delete-btn" style="' +
          'background:none;border:none;cursor:pointer;color:#c62828;padding:0.2rem;' +
          'display:inline-flex;align-items:center;">' +
          '<span class="material-icons" style="font-size:1rem;">close</span>' +
        '</button>' +
      '</div>';
    }).join('');

    cookieList.querySelectorAll('.cookie-delete-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var cookieName = this.getAttribute('data-cookie');
        document.cookie = encodeURIComponent(cookieName) + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        var m = getExpiryMeta();
        delete m[cookieName];
        setExpiryMeta(m);
        renderCookies();
      });
    });
  }

  function flashRefresh() {
    cookieList.style.opacity = '0.4';
    setTimeout(function() {
      cookieList.style.opacity = '1';
    }, 150);
  }

  function onEnterKey(e) {
    if (e.key === 'Enter') setBtn.click();
  }
  nameInput.addEventListener('keydown', onEnterKey);
  valueInput.addEventListener('keydown', onEnterKey);

  setBtn.addEventListener('click', function() {
    var name = nameInput.value.trim();
    var value = valueInput.value;
    if (!name) return;

    var cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + '; path=/';
    var expiry = expirySelect.value;
    var meta = getExpiryMeta();
    if (expiry !== 'session') {
      var date = new Date();
      date.setTime(date.getTime() + parseInt(expiry, 10) * 1000);
      cookie += '; expires=' + date.toUTCString();
      meta[name] = date.getTime();
    } else {
      meta[name] = 'session';
    }
    document.cookie = cookie;
    setExpiryMeta(meta);
    nameInput.value = '';
    valueInput.value = '';
    renderCookies();
  });

  clearAllBtn.addEventListener('click', function() {
    var pairs = document.cookie.split('; ');
    pairs.forEach(function(pair) {
      var name = pair.split('=')[0];
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    });
    setExpiryMeta({});
    renderCookies();
  });

  refreshBtn.addEventListener('click', function() {
    flashRefresh();
    setTimeout(renderCookies, 150);
  });

  cookieList.style.transition = 'opacity 0.15s';
  renderCookies();
}
