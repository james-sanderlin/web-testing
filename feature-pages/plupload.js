// plupload.js: SPA-friendly Plupload loader and initializer

function loadPluploadScript(callback) {
  console.log('[Plupload] Checking if plupload is already loaded...');
  if (window.plupload) {
    console.log('[Plupload] plupload already loaded.');
    callback();
    return;
  }
  console.log('[Plupload] Loading plupload script from local vendor directory...');
  const script = document.createElement('script');
  script.src = '/vendor/plupload/js/plupload.dev.js';
  script.onload = function() {
    console.log('[Plupload] plupload script loaded.');
    callback();
  };
  script.onerror = function() {
    console.error('[Plupload] Failed to load plupload script.');
  };
  document.head.appendChild(script);
}

function initPlupload() {
  console.log('[Plupload] initPlupload called.');
  if (!window.plupload) {
    console.error('[Plupload] Plupload script not loaded.');
    return;
  }
  if (!document.getElementById('filelist')) {
    console.error('[Plupload] #filelist element not found in DOM.');
    return;
  }
  if (!document.getElementById('pickfiles')) {
    console.error('[Plupload] #pickfiles element not found in DOM.');
    return;
  }
  if (!document.getElementById('uploadfiles')) {
    console.error('[Plupload] #uploadfiles element not found in DOM.');
    return;
  }
  console.log('[Plupload] Creating new plupload.Uploader...');
  const uploader = new plupload.Uploader({
    runtimes: 'html5',
    browse_button: 'pickfiles',
    drop_element: 'filelist',
    url: '/upload', // doesn't need to actually work for repro
    init: {
      PostInit: function () {
        console.log('[Plupload] PostInit called.');
        document.getElementById('filelist').innerHTML = '';
        document.getElementById('uploadfiles').onclick = function () {
          console.log('[Plupload] Upload button clicked. Starting upload.');
          uploader.start();
          return false;
        };
      },
      FilesAdded: function (up, files) {
        console.log('[Plupload] FilesAdded called.', files);
        for (let i = 0; i < files.length; i++) {
          console.log('[Plupload] Added file:', files[i]);
          document.getElementById('filelist').innerHTML +=
            `<div>${files[i].name} (${plupload.formatSize(files[i].size)})</div>`;
        }
      },
      Error: function (up, err) {
        console.error('[Plupload] Plupload Error:', err);
      }
    }
  });
  uploader.init();
  console.log('[Plupload] uploader.init() called.');
}

// SPA: call this when the page is loaded/displayed
window.onNavigate_plupload = function() {
  console.log('[Plupload] window.onNavigate_plupload called.');
  loadPluploadScript(initPlupload);
};

// If loaded directly, auto-init
if (document.getElementById('filelist')) {
  console.log('[Plupload] Detected #filelist on direct load, initializing.');
  loadPluploadScript(initPlupload);
}
