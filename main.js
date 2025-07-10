import { setupNav } from './nav.js';

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

const nav = setupNav(features, navList, search, (route) => {
  location.hash = route;
  search.value = '';
  nav.renderNav('');
  search.blur();
});

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
      // Dynamically load page-specific JS if it exists
      const jsPath = match.file.replace(/\.html$/, '.js');
      fetch(jsPath, { method: 'HEAD' })
        .then(r => {
          if (r.ok) {
            const script = document.createElement('script');
            script.src = jsPath;
            script.type = 'module';
            document.body.appendChild(script);
          }
        });
    })
    .catch(err => {
      content.innerHTML = `<p>Error loading page: ${err}</p>`;
    });
}

window.addEventListener("hashchange", () => {
  loadPage();
  nav.renderNav(search.value);
});
window.addEventListener("load", loadPage);
