// Upload page logic
(function() {
  // Single file upload (existing)
  const form = document.getElementById('upload-form');
  const fileInput = document.getElementById('file-input');
  const result = document.getElementById('upload-result');
  const uploadButton = form?.querySelector('md-filled-button[type="submit"]');
  
  // Initially hide the upload button
  if (uploadButton) {
    uploadButton.style.visibility = 'hidden';
    uploadButton.style.height = '0';
    uploadButton.style.margin = '0';
    uploadButton.style.overflow = 'hidden';
  }
  
  if (form && fileInput && result) {
    // Show/hide upload button based on file selection
    fileInput.addEventListener('change', function() {
      if (uploadButton) {
        if (this.files.length > 0) {
          uploadButton.style.visibility = 'visible';
          uploadButton.style.height = '';
          uploadButton.style.margin = '';
          uploadButton.style.overflow = '';
        } else {
          uploadButton.style.visibility = 'hidden';
          uploadButton.style.height = '0';
          uploadButton.style.margin = '0';
          uploadButton.style.overflow = 'hidden';
        }
      }
    });
    
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

  // Multi-file upload
  const multiForm = document.getElementById('multi-upload-form');
  const multiFileInput = document.getElementById('multi-file-input');
  const multiFileList = document.getElementById('multi-file-list');
  const multiResult = document.getElementById('multi-upload-result');
  const multiUploadButton = multiForm?.querySelector('md-filled-button[type="submit"]');
  
  // Initially hide the multi-upload button
  if (multiUploadButton) {
    multiUploadButton.style.visibility = 'hidden';
    multiUploadButton.style.height = '0';
    multiUploadButton.style.margin = '0';
    multiUploadButton.style.overflow = 'hidden';
  }
  
  if (multiFileInput && multiFileList) {
    multiFileInput.addEventListener('change', function() {
      const files = Array.from(this.files);
      
      // Show/hide upload button based on file selection
      if (multiUploadButton) {
        if (files.length > 0) {
          multiUploadButton.style.visibility = 'visible';
          multiUploadButton.style.height = '';
          multiUploadButton.style.margin = '';
          multiUploadButton.style.overflow = '';
        } else {
          multiUploadButton.style.visibility = 'hidden';
          multiUploadButton.style.height = '0';
          multiUploadButton.style.margin = '0';
          multiUploadButton.style.overflow = 'hidden';
        }
      }
      
      if (files.length === 0) {
        multiFileList.innerHTML = '';
        return;
      }
      
      multiFileList.innerHTML = '<h4>Selected Files:</h4>' + 
        files.map(file => 
          `<div style="padding: 5px; border: 1px solid #ddd; margin: 2px; border-radius: 4px;">
            <strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)
          </div>`
        ).join('');
    });
  }

  // Directory upload
  const directoryForm = document.getElementById('directory-upload-form');
  const directoryFileInput = document.getElementById('directory-file-input');
  const directoryFileList = document.getElementById('directory-file-list');
  const directoryResult = document.getElementById('directory-upload-result');
  const directoryUploadButton = directoryForm?.querySelector('md-filled-button[type="submit"]');
  
  // Initially hide the directory upload button
  if (directoryUploadButton) {
    directoryUploadButton.style.visibility = 'hidden';
    directoryUploadButton.style.height = '0';
    directoryUploadButton.style.margin = '0';
    directoryUploadButton.style.overflow = 'hidden';
  }
  
  if (directoryFileInput && directoryFileList) {
    directoryFileInput.addEventListener('change', function() {
      const files = Array.from(this.files);
      
      // Show/hide upload button based on file selection
      if (directoryUploadButton) {
        if (files.length > 0) {
          directoryUploadButton.style.visibility = 'visible';
          directoryUploadButton.style.height = '';
          directoryUploadButton.style.margin = '';
          directoryUploadButton.style.overflow = '';
        } else {
          directoryUploadButton.style.visibility = 'hidden';
          directoryUploadButton.style.height = '0';
          directoryUploadButton.style.margin = '0';
          directoryUploadButton.style.overflow = 'hidden';
        }
      }
      
      if (files.length === 0) {
        directoryFileList.innerHTML = '';
        return;
      }
      
      // Group files by directory
      const filesByDirectory = {};
      files.forEach(file => {
        const pathParts = file.webkitRelativePath.split('/');
        const directory = pathParts.slice(0, -1).join('/') || 'Root';
        if (!filesByDirectory[directory]) {
          filesByDirectory[directory] = [];
        }
        filesByDirectory[directory].push(file);
      });
      
      let totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      directoryFileList.innerHTML = `
        <h4>Selected Directory Contents:</h4>
        <div style="margin-bottom: 10px; font-weight: bold;">
          Total: ${files.length} files (${(totalSize / 1024).toFixed(1)} KB)
        </div>
      `;
      
      // Display files grouped by directory
      Object.keys(filesByDirectory).sort().forEach(directory => {
        const directoryDiv = document.createElement('div');
        directoryDiv.style.cssText = 'margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;';
        
        const directoryHeader = document.createElement('div');
        directoryHeader.style.cssText = 'font-weight: bold; margin-bottom: 5px; color: #333;';
        directoryHeader.innerHTML = `📁 ${directory} (${filesByDirectory[directory].length} files)`;
        directoryDiv.appendChild(directoryHeader);
        
        filesByDirectory[directory].forEach(file => {
          const fileDiv = document.createElement('div');
          fileDiv.style.cssText = 'padding: 2px 0 2px 20px; font-size: 0.9em; color: #666;';
          fileDiv.innerHTML = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
          directoryDiv.appendChild(fileDiv);
        });
        
        directoryFileList.appendChild(directoryDiv);
      });
    });
  }

  if (directoryForm && directoryFileInput && directoryResult) {
    directoryForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const files = Array.from(directoryFileInput.files);
      if (files.length === 0) {
        directoryResult.textContent = 'Please select a directory.';
        return;
      }
      
      const formData = new FormData();
      files.forEach((file, index) => {
        // Include the relative path in the form data
        formData.append(`file${index}`, file);
        formData.append(`path${index}`, file.webkitRelativePath);
      });
      
      directoryResult.textContent = 'Uploading directory...';
      
      fetch('/api/upload-directory', {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        directoryResult.innerHTML = `<strong>Server response:</strong><br><pre>${JSON.stringify(data, null, 2)}</pre>`;
      })
      .catch(err => {
        directoryResult.textContent = 'Directory upload failed: ' + err;
      });
    });
  }

  // Image only upload
  const imageForm = document.getElementById('image-upload-form');
  const imageFileInput = document.getElementById('image-file-input');
  const imagePreview = document.getElementById('image-preview');
  const imageResult = document.getElementById('image-upload-result');
  const imageUploadButton = imageForm?.querySelector('md-filled-button[type="submit"]');
  
  // Initially hide the image upload button
  if (imageUploadButton) {
    imageUploadButton.style.visibility = 'hidden';
    imageUploadButton.style.height = '0';
    imageUploadButton.style.margin = '0';
    imageUploadButton.style.overflow = 'hidden';
  }
  
  if (imageFileInput && imagePreview) {
    imageFileInput.addEventListener('change', function() {
      const files = Array.from(this.files);
      
      // Show/hide upload button based on file selection
      if (imageUploadButton) {
        if (files.length > 0) {
          imageUploadButton.style.visibility = 'visible';
          imageUploadButton.style.height = '';
          imageUploadButton.style.margin = '';
          imageUploadButton.style.overflow = '';
        } else {
          imageUploadButton.style.visibility = 'hidden';
          imageUploadButton.style.height = '0';
          imageUploadButton.style.margin = '0';
          imageUploadButton.style.overflow = 'hidden';
        }
      }
      
      if (files.length === 0) {
        imagePreview.innerHTML = '';
        return;
      }
      
      imagePreview.innerHTML = '<h4>Image Preview:</h4>';
      
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = function(e) {
            const imageContainer = document.createElement('div');
            imageContainer.style.cssText = 'display: inline-block; margin: 5px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; text-align: center;';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'max-width: 150px; max-height: 150px; object-fit: cover; border-radius: 4px;';
            
            const fileName = document.createElement('div');
            fileName.textContent = file.name;
            fileName.style.cssText = 'margin-top: 5px; font-size: 0.8em; color: #666;';
            
            const fileSize = document.createElement('div');
            fileSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
            fileSize.style.cssText = 'font-size: 0.7em; color: #999;';
            
            imageContainer.appendChild(img);
            imageContainer.appendChild(fileName);
            imageContainer.appendChild(fileSize);
            imagePreview.appendChild(imageContainer);
          };
          reader.readAsDataURL(file);
        }
      });
    });
  }

  if (imageForm && imageFileInput && imageResult) {
    imageForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const files = Array.from(imageFileInput.files);
      if (files.length === 0) {
        imageResult.textContent = 'Please select one or more image files.';
        return;
      }
      
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`image${index}`, file);
      });
      
      imageResult.textContent = 'Uploading images...';
      
      fetch('/api/upload-images', {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        imageResult.innerHTML = `<strong>Server response:</strong><br><pre>${JSON.stringify(data, null, 2)}</pre>`;
      })
      .catch(err => {
        imageResult.textContent = 'Image upload failed: ' + err;
      });
    });
  }

  if (multiForm && multiFileInput && multiResult) {
    multiForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const files = Array.from(multiFileInput.files);
      if (files.length === 0) {
        multiResult.textContent = 'Please select one or more files.';
        return;
      }
      
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      
      multiResult.textContent = 'Uploading...';
      
      fetch('/api/upload-multiple', {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        multiResult.innerHTML = `<strong>Server response:</strong><br><pre>${JSON.stringify(data, null, 2)}</pre>`;
      })
      .catch(err => {
        multiResult.textContent = 'Multi-upload failed: ' + err;
      });
    });
  }

  // File System Access API
  const fsResult = document.getElementById('fs-result');
  
  // Check if File System Access API is supported
  const isFileSystemAccessSupported = 'showOpenFilePicker' in window;
  
  if (!isFileSystemAccessSupported && fsResult) {
    fsResult.innerHTML = '<div style="color: orange;">⚠️ File System Access API not supported in this browser</div>';
  }

  // Open single file
  const fsOpenFile = document.getElementById('fs-open-file');
  if (fsOpenFile && fsResult) {
    fsOpenFile.addEventListener('click', async function() {
      if (!isFileSystemAccessSupported) {
        fsResult.textContent = 'File System Access API not supported';
        return;
      }
      
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [{
            description: 'All files',
            accept: {'*/*': []}
          }]
        });
        
        const file = await fileHandle.getFile();
        fsResult.innerHTML = `<strong>Selected file:</strong><br>
          Name: ${file.name}<br>
          Size: ${(file.size / 1024).toFixed(1)} KB<br>
          Type: ${file.type || 'unknown'}<br>
          Last Modified: ${new Date(file.lastModified).toLocaleString()}`;
      } catch (err) {
        if (err.name !== 'AbortError') {
          fsResult.textContent = 'Error: ' + err.message;
        }
      }
    });
  }

  // Open multiple files
  const fsOpenMultiple = document.getElementById('fs-open-multiple');
  if (fsOpenMultiple && fsResult) {
    fsOpenMultiple.addEventListener('click', async function() {
      if (!isFileSystemAccessSupported) {
        fsResult.textContent = 'File System Access API not supported';
        return;
      }
      
      try {
        const fileHandles = await window.showOpenFilePicker({
          multiple: true,
          types: [{
            description: 'All files',
            accept: {'*/*': []}
          }]
        });
        
        const files = await Promise.all(
          fileHandles.map(handle => handle.getFile())
        );
        
        fsResult.innerHTML = `<strong>Selected ${files.length} files:</strong><br>` +
          files.map(file => 
            `• ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
          ).join('<br>');
      } catch (err) {
        if (err.name !== 'AbortError') {
          fsResult.textContent = 'Error: ' + err.message;
        }
      }
    });
  }

  // Save file
  const fsSaveFile = document.getElementById('fs-save-file');
  if (fsSaveFile && fsResult) {
    fsSaveFile.addEventListener('click', async function() {
      if (!isFileSystemAccessSupported) {
        fsResult.textContent = 'File System Access API not supported';
        return;
      }
      
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: 'test-file.txt',
          types: [{
            description: 'Text files',
            accept: {'text/plain': ['.txt']}
          }]
        });
        
        const writable = await fileHandle.createWritable();
        const content = `Test file created at ${new Date().toISOString()}\n\nThis file was created using the File System Access API.`;
        await writable.write(content);
        await writable.close();
        
        fsResult.innerHTML = `<strong>File saved successfully!</strong><br>
          File: ${fileHandle.name}<br>
          Content: ${content.length} characters`;
      } catch (err) {
        if (err.name !== 'AbortError') {
          fsResult.textContent = 'Error: ' + err.message;
        }
      }
    });
  }
})();
