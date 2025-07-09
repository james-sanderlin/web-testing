const features = [
  { name: "Print", route: "#/print", file: "feature-pages/print.html" },
  { name: "LocalStorage", route: "#/localstorage", file: "feature-pages/localstorage.html" },
  { name: "Download", route: "#/download", file: "feature-pages/download.html" },
];

const navList = document.getElementById('nav-links');
const search = document.getElementById('search');
const content = document.getElementById('content');

let filteredFeatures = features;
let selectedIdx = 0;

function renderNav(filter = "") {
  navList.innerHTML = "";
  filteredFeatures = features.filter(f => f.name.toLowerCase().includes(filter.toLowerCase()));
  filteredFeatures.forEach((f, i) => {
    const item = document.createElement("md-list-item");
    item.innerHTML = `<a href="${f.route}">${f.name}</a>`;
    item.tabIndex = 0;
    if (i === 0) {
      item.classList.add('selected');
      item.setAttribute('aria-selected', 'true');
    }
    item.addEventListener('click', () => {
      location.hash = f.route;
      search.value = '';
      renderNav('');
      search.blur();
    });
    navList.appendChild(item);
  });
  selectedIdx = 0;
}

search.addEventListener("input", e => {
  renderNav(e.target.value);
});

search.addEventListener("keydown", e => {
  const items = navList.querySelectorAll('md-list-item');
  if (!items.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    items[selectedIdx]?.classList.remove('selected');
    items[selectedIdx]?.removeAttribute('aria-selected');
    selectedIdx = (selectedIdx + 1) % items.length;
    items[selectedIdx].classList.add('selected');
    items[selectedIdx].setAttribute('aria-selected', 'true');
    items[selectedIdx].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    items[selectedIdx]?.classList.remove('selected');
    items[selectedIdx]?.removeAttribute('aria-selected');
    selectedIdx = (selectedIdx - 1 + items.length) % items.length;
    items[selectedIdx].classList.add('selected');
    items[selectedIdx].setAttribute('aria-selected', 'true');
    items[selectedIdx].scrollIntoView({ block: 'nearest' });
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
    })
    .catch(err => {
      content.innerHTML = `<p>Error loading page: ${err}</p>`;
    });
}

window.addEventListener("hashchange", loadPage);
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
