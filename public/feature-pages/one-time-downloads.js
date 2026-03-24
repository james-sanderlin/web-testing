var otdTokenHistory = [];
var otdPollingIntervals = {};

function onNavigate_one_time_downloads() {
  var grid = document.getElementById('otd-grid');
  if (!grid) return;

  // Re-render state for all cards on re-navigation
  var cards = grid.querySelectorAll('.otd-card');
  cards.forEach(function(card) {
    var file = card.getAttribute('data-file');
    var lastToken = otdGetLastToken(file);
    if (lastToken) {
      otdRenderCardWithToken(card, lastToken);
      if (lastToken.status === 'available') {
        otdStartPolling(lastToken.token, card);
      }
    }
  });

  // Generate button per card
  grid.addEventListener('click', function(e) {
    var btn = e.target.closest('.otd-generate-btn');
    if (btn) {
      var card = btn.closest('.otd-card');
      otdGenerate(card);
    }
    var copyBtn = e.target.closest('.otd-copy-btn');
    if (copyBtn) {
      otdCopyLink(copyBtn.getAttribute('data-url'));
    }
    var regenBtn = e.target.closest('.otd-regen-btn');
    if (regenBtn) {
      var card = regenBtn.closest('.otd-card');
      otdGenerate(card);
    }
  });

  // Generate All button
  var generateAllBtn = document.getElementById('otd-generate-all');
  if (generateAllBtn) {
    generateAllBtn.onclick = function() {
      cards.forEach(function(card) {
        otdGenerate(card);
      });
    };
  }

  // Clear history
  var clearBtn = document.getElementById('otd-clear-history');
  if (clearBtn) {
    clearBtn.onclick = function() {
      otdTokenHistory = [];
      otdRenderHistory();
    };
  }

  otdRenderHistory();
}

function otdGetTtl() {
  var sel = document.getElementById('otd-ttl');
  var val = sel ? sel.value : '';
  return val ? parseInt(val, 10) : null;
}

function otdGetLastToken(file) {
  for (var i = otdTokenHistory.length - 1; i >= 0; i--) {
    if (otdTokenHistory[i].file === file) return otdTokenHistory[i];
  }
  return null;
}

function otdGenerate(card) {
  var file = card.getAttribute('data-file');
  var btn = card.querySelector('.otd-generate-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Generating...';
  }

  var ttlMs = otdGetTtl();
  var body = { file: file };
  if (ttlMs) body.ttlMs = ttlMs;

  fetch('/api/one-time-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.error) {
      alert('Error: ' + data.error);
      if (btn) { btn.disabled = false; btn.textContent = 'Generate Link'; }
      return;
    }

    var entry = {
      token: data.token,
      file: data.file,
      downloadUrl: data.downloadUrl,
      ttlMs: data.ttlMs,
      createdAt: data.createdAt,
      status: 'available',
      usedAt: null
    };
    otdTokenHistory.push(entry);

    otdRenderCardWithToken(card, entry);
    otdStartPolling(data.token, card);
    otdRenderHistory();
  })
  .catch(function(err) {
    alert('Request failed: ' + err.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Generate Link'; }
  });
}

function otdRenderCardWithToken(card, entry) {
  var badge = card.querySelector('.otd-badge');
  var btn = card.querySelector('.otd-generate-btn');
  var linkArea = card.querySelector('.otd-link-area');

  // Update badge
  badge.className = 'otd-badge otd-badge-' + entry.status;
  var badgeLabels = { available: 'Available', consumed: 'Consumed', expired: 'Expired' };
  badge.textContent = badgeLabels[entry.status] || entry.status;

  // Update button
  if (entry.status === 'available') {
    if (btn) { btn.style.display = 'none'; }
  } else {
    if (btn) {
      btn.style.display = '';
      btn.disabled = false;
      btn.textContent = 'Regenerate Link';
    }
  }

  // Show link area
  linkArea.style.display = '';
  var fullUrl = window.location.origin + entry.downloadUrl;
  var ttlText = entry.ttlMs ? otdFormatDuration(entry.ttlMs) : 'none';

  if (entry.status === 'available') {
    linkArea.innerHTML =
      '<div class="otd-link-row">' +
        '<a href="' + entry.downloadUrl + '" target="_blank">' + fullUrl + '</a>' +
        '<button class="otd-copy-btn" data-url="' + fullUrl + '" title="Copy link">Copy</button>' +
        '<button class="otd-regen-btn" title="Generate new link">New</button>' +
      '</div>' +
      '<div class="otd-meta">TTL: ' + ttlText + ' &bull; Token: ' + entry.token.substring(0, 8) + '...</div>';
  } else if (entry.status === 'consumed') {
    linkArea.innerHTML =
      '<div class="otd-link-row" style="opacity:0.6">' +
        '<span style="font-size:13px;color:#c62828;flex:1;">Link consumed &mdash; second request will get 410 Gone</span>' +
      '</div>' +
      '<div class="otd-meta">Used at: ' + new Date(entry.usedAt).toLocaleTimeString() + ' &bull; Token: ' + entry.token.substring(0, 8) + '...</div>';
  } else if (entry.status === 'expired') {
    linkArea.innerHTML =
      '<div class="otd-link-row" style="opacity:0.6">' +
        '<span style="font-size:13px;color:#e65100;flex:1;">Link expired</span>' +
      '</div>' +
      '<div class="otd-meta">TTL was: ' + ttlText + ' &bull; Token: ' + entry.token.substring(0, 8) + '...</div>';
  }
}

function otdStartPolling(token, card) {
  // Clear any existing poll for this card
  var file = card.getAttribute('data-file');
  if (otdPollingIntervals[file]) {
    clearInterval(otdPollingIntervals[file]);
  }

  otdPollingIntervals[file] = setInterval(function() {
    fetch('/api/one-time-token/' + token + '/status')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        // Update the history entry
        for (var i = otdTokenHistory.length - 1; i >= 0; i--) {
          if (otdTokenHistory[i].token === token) {
            otdTokenHistory[i].status = data.status;
            otdTokenHistory[i].usedAt = data.usedAt;
            break;
          }
        }

        if (data.status !== 'available') {
          clearInterval(otdPollingIntervals[file]);
          delete otdPollingIntervals[file];
          var entry = otdGetLastToken(file);
          if (entry) otdRenderCardWithToken(card, entry);
          otdRenderHistory();
        }
      })
      .catch(function() {
        // Silently ignore polling errors
      });
  }, 2000);
}

function otdCopyLink(url) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).catch(function() {
      otdFallbackCopy(url);
    });
  } else {
    otdFallbackCopy(url);
  }
}

function otdFallbackCopy(text) {
  var input = document.createElement('input');
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}

function otdFormatDuration(ms) {
  if (ms >= 60000) return (ms / 60000) + ' min';
  return (ms / 1000) + 's';
}

function otdRenderHistory() {
  var tbody = document.getElementById('otd-history-body');
  var emptyMsg = document.getElementById('otd-history-empty');
  var table = document.getElementById('otd-history-table');
  if (!tbody) return;

  if (otdTokenHistory.length === 0) {
    table.style.display = 'none';
    emptyMsg.style.display = '';
    return;
  }

  table.style.display = '';
  emptyMsg.style.display = 'none';

  tbody.innerHTML = '';
  for (var i = otdTokenHistory.length - 1; i >= 0; i--) {
    var e = otdTokenHistory[i];
    var tr = document.createElement('tr');
    var statusClass = 'otd-badge-' + e.status;
    tr.innerHTML =
      '<td><code>' + e.token.substring(0, 12) + '...</code></td>' +
      '<td>' + e.file + '</td>' +
      '<td><span class="otd-badge ' + statusClass + '">' + e.status + '</span></td>' +
      '<td>' + new Date(e.createdAt).toLocaleTimeString() + '</td>' +
      '<td>' + (e.usedAt ? new Date(e.usedAt).toLocaleTimeString() : '-') + '</td>';
    tbody.appendChild(tr);
  }
}
