// plupload.js: SPA-friendly Plupload loader and initializer

function loadPluploadScript(callback) {
  if (window.plupload) {
    callback();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/plupload@3.1.9/js/plupload.full.min.js';
  script.onload = callback;
  document.head.appendChild(script);
}

function initPlupload() {
  if (!window.plupload) {
    console.error('Plupload script not loaded.');
    return;
  }
  const uploader = new plupload.Uploader({
    runtimes: 'html5',
    browse_button: 'pickfiles',
    drop_element: 'filelist',
    url: '/upload', // doesn't need to actually work for repro
    init: {
      PostInit: function () {
        document.getElementById('filelist').innerHTML = '';
        document.getElementById('uploadfiles').onclick = function () {
          uploader.start();
          return false;
        };
      },
      FilesAdded: function (up, files) {
        for (let i = 0; i < files.length; i++) {
          console.log('Added file:', files[i]);
          document.getElementById('filelist').innerHTML +=
            `<div>${files[i].name} (${plupload.formatSize(files[i].size)})</div>`;
        }
      },
      Error: function (up, err) {
        console.error('Plupload Error:', err);
      }
    }
  });
  uploader.init();
}

// SPA: call this when the page is loaded/displayed
window.onNavigate_plupload = function() {
  loadPluploadScript(initPlupload);
};

// If loaded directly, auto-init
if (document.getElementById('filelist')) {
  loadPluploadScript(initPlupload);
}
