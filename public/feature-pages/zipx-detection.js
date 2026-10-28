var ZIPX_OVERRIDES = {
  png: { extension: 'png', mimeType: 'image/png' },
  txt: { extension: 'txt', mimeType: 'text/plain' }
};

var ZIPX_METHOD_CARDS = [
  { method: 12, label: 'BZIP2', note: 'Method 12, BZIP2 compression.' },
  { method: 14, label: 'LZMA', note: 'Method 14, LZMA compression.' },
  { method: 93, label: 'Zstandard', note: 'Method 93, Zstandard compression.' },
  { method: 94, label: 'MP3', note: 'Method 94, MP3 compression.' },
  { method: 95, label: 'XZ', note: 'Method 95, XZ compression.' },
  { method: 96, label: 'JPEG', note: 'Method 96, JPEG compression.' },
  { method: 97, label: 'WavPack', note: 'Method 97, WavPack compression.' },
  { method: 98, label: 'PPMd', note: 'Method 98, PPMd compression.' }
];

var ZIPX_AES_CARD = { method: 99, label: 'AES', note: 'Method 99, WinZip AES encryption. Inner method is PPMd.' };

function zipxGetOverride() {
  var key = localStorage.getItem('zipxOverride');
  return ZIPX_OVERRIDES[key] ? key : '';
}

function zipxFileInfo(method) {
  var key = zipxGetOverride();
  var override = ZIPX_OVERRIDES[key];
  return {
    name: 'zipx-method-' + method + '.' + (override ? override.extension : 'zipx'),
    type: override ? override.mimeType : 'application/zip'
  };
}

function zipxDownload(method) {
  var key = zipxGetOverride();
  var override = ZIPX_OVERRIDES[key];
  var url = '/api/zipx?method=' + encodeURIComponent(method);
  if (override) {
    url += '&extension=' + encodeURIComponent(override.extension);
    url += '&mimeType=' + encodeURIComponent(override.mimeType);
  }
  var a = document.createElement('a');
  a.href = url;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function zipxRenderCard(card) {
  var el = document.createElement('div');
  el.className = 'file-card';
  el.setAttribute('data-type', 'archive');
  el.setAttribute('data-method', card.method);

  var content = document.createElement('div');
  content.className = 'file-content';

  var icon = document.createElement('div');
  icon.className = 'file-icon';
  icon.innerHTML = '<span class="material-icons">' + (card.method === 99 ? 'lock' : 'folder_zip') + '</span>';

  var info = document.createElement('div');
  info.className = 'file-info';
  var title = document.createElement('h3');
  title.textContent = card.label;
  var badge = document.createElement('span');
  badge.className = 'file-meta';
  badge.textContent = 'Method ' + card.method;
  title.appendChild(badge);
  var note = document.createElement('p');
  note.textContent = card.note;
  var result = document.createElement('p');
  result.className = 'zipx-result';
  result.style.marginTop = '0.35rem';
  result.style.fontFamily = 'monospace';
  result.style.fontSize = '0.75rem';

  info.appendChild(title);
  info.appendChild(note);
  info.appendChild(result);
  content.appendChild(icon);
  content.appendChild(info);

  var btn = document.createElement('button');
  btn.className = 'download-btn';
  btn.innerHTML = '<span class="material-icons">download</span> Download';
  btn.addEventListener('click', function () { zipxDownload(card.method); });

  el.appendChild(content);
  el.appendChild(btn);
  return el;
}

function zipxRefresh() {
  var key = zipxGetOverride();
  var override = ZIPX_OVERRIDES[key];

  var radios = document.querySelectorAll('input[name="zipx-override"]');
  for (var i = 0; i < radios.length; i++) {
    radios[i].checked = radios[i].value === key;
  }

  var status = document.getElementById('zipx-override-status');
  var statusValue = document.getElementById('zipx-override-status-value');
  if (override) {
    statusValue.textContent = 'saved as .' + override.extension + ', served as ' + override.mimeType;
    status.style.display = 'block';
  } else {
    status.style.display = 'none';
  }

  var cards = document.querySelectorAll('.file-card[data-method]');
  for (var j = 0; j < cards.length; j++) {
    var info = zipxFileInfo(cards[j].getAttribute('data-method'));
    cards[j].querySelector('.zipx-result').textContent = info.name + ' \u00b7 ' + info.type;
  }
}

function zipxSetOverride(key) {
  if (key && ZIPX_OVERRIDES[key]) {
    localStorage.setItem('zipxOverride', key);
  } else {
    localStorage.removeItem('zipxOverride');
  }
  zipxRefresh();
}

function onNavigate_zipx_detection() {
  var methodGrid = document.getElementById('zipx-method-grid');
  var aesGrid = document.getElementById('zipx-aes-grid');
  if (!methodGrid || !aesGrid) return;

  methodGrid.innerHTML = '';
  aesGrid.innerHTML = '';
  ZIPX_METHOD_CARDS.forEach(function (card) {
    methodGrid.appendChild(zipxRenderCard(card));
  });
  aesGrid.appendChild(zipxRenderCard(ZIPX_AES_CARD));

  var radios = document.querySelectorAll('input[name="zipx-override"]');
  for (var i = 0; i < radios.length; i++) {
    radios[i].addEventListener('change', function (e) {
      zipxSetOverride(e.target.value);
    });
  }

  var clear = document.getElementById('zipx-override-clear');
  if (clear) {
    clear.addEventListener('click', function () { zipxSetOverride(''); });
  }

  zipxRefresh();
}
