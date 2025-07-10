const features = [
  { name: "Print", route: "#/print", file: "feature-pages/print.html" },
  { name: "Local Storage", route: "#/localstorage", file: "feature-pages/localstorage.html" },
  { name: "Download", route: "#/download", file: "feature-pages/download.html" },
  { name: "Upload", route: "#/upload", file: "feature-pages/upload.html" },
  { name: "PDF Demo", route: "#/pdf", file: "feature-pages/pdf.html" },
];

const navList = document.getElementById('nav-links');
const search = document.getElementById('search');
const content = document.getElementById('content');

let filteredFeatures = features;
let selectedIdx = 0;

function renderNav(filter = "") {
  navList.innerHTML = "";
  filteredFeatures = features.filter(f => f.name.toLowerCase().includes(filter.toLowerCase()));
  const currentRoute = location.hash || "#/print";
  filteredFeatures.forEach((f, i) => {
    const item = document.createElement("li");
    item.textContent = f.name;
    // Only the selected item should be tabbable
    if (f.route === currentRoute) {
      item.classList.add('selected');
      item.setAttribute('aria-selected', 'true');
      item.tabIndex = 0;
      selectedIdx = i; // Set selectedIdx to the current route
    } else {
      item.tabIndex = -1;
    }
    item.addEventListener('click', () => {
      location.hash = f.route;
      search.value = '';
      renderNav('');
      search.blur();
    });
    navList.appendChild(item);
  });
  // If filtering, auto-select first for keyboard nav
  const items = navList.querySelectorAll('li');
  if (items.length && filter) {
    items.forEach((el, i) => {
      el.classList.remove('selected');
      el.removeAttribute('aria-selected');
      el.tabIndex = -1;
    });
    items[0].classList.add('selected');
    items[0].setAttribute('aria-selected', 'true');
    items[0].tabIndex = 0;
    selectedIdx = 0;
  }
}

search.addEventListener("input", e => {
  renderNav(e.target.value);
});

search.addEventListener("keydown", e => {
  const items = navList.querySelectorAll('li');
  if (!items.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    items[selectedIdx]?.classList.remove('selected');
    items[selectedIdx]?.removeAttribute('aria-selected');
    selectedIdx = (selectedIdx + 1) % items.length;
    items[selectedIdx].classList.add('selected');
    items[selectedIdx].setAttribute('aria-selected', 'true');
    items[selectedIdx].focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    items[selectedIdx]?.classList.remove('selected');
    items[selectedIdx]?.removeAttribute('aria-selected');
    selectedIdx = (selectedIdx - 1 + items.length) % items.length;
    items[selectedIdx].classList.add('selected');
    items[selectedIdx].setAttribute('aria-selected', 'true');
    items[selectedIdx].focus();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    items[selectedIdx]?.click();
  }
});

renderNav();

function loadPage() {
  const route = location.hash || "#/print";
  const match = features.find(f => f.route === route);
  if (!match) {
    content.innerHTML = "<h2>Page not found</h2>";
    return;
  }

  fetch(match.file)
    .then(res => res.text())
    .then(html => {
      content.innerHTML = html;
      // Attach upload logic if on upload page
      if (route === "#/upload") {
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
      }
    })
    .catch(err => {
      content.innerHTML = `<p>Error loading page: ${err}</p>`;
    });
}

window.addEventListener("hashchange", () => {
  loadPage();
  renderNav(search.value);
});
window.addEventListener("load", loadPage);

// Make downloadBlob globally available for dynamic pages
window.downloadBlob = function() {
  const now = Math.floor(Date.now() / 1000);
  const blob = new Blob([
    `Hello from Material Design!\nCurrent time (seconds): ${now}`
  ], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "material-download.txt";
  a.click();
  URL.revokeObjectURL(url);
};
