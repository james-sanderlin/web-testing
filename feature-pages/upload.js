// Upload page logic
(function() {
  const form = document.getElementById('upload-form');
  const fileInput = document.getElementById('file-input');
  const result = document.getElementById('upload-result');
  if (form && fileInput && result) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const file = fileInput.files[0];
      if (!file) {
        result.textContent = 'Please select a file.';
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        result.innerHTML = `<strong>Server response:</strong><br><pre>${JSON.stringify(data, null, 2)}</pre>`;
      })
      .catch(err => {
        result.textContent = 'Upload failed: ' + err;
      });
    });
  }
})();
