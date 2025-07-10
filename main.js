import { features } from './features.js';
import { setupNav } from './nav.js';

const navList = document.getElementById('nav-links');
const search = document.getElementById('search');
const content = document.getElementById('content');

function addRecent(route) {
  if (route === '#/home') return;
  const key = 'recent-pages';
  let recent = [];
  try {
    recent = JSON.parse(localStorage.getItem(key)) || [];
  } catch {}
  // Remove if already present, then add to front
  recent = recent.filter(r => r !== route);
  recent.unshift(route);
  // Limit to 5
  if (recent.length > 5) recent = recent.slice(0, 5);
  localStorage.setItem(key, JSON.stringify(recent));
}

const nav = setupNav(features, navList, search, (route) => {
  location.hash = route;
  search.value = '';
  nav.renderNav('');
  search.blur();
  addRecent(route);
});

function loadPage() {
  const route = location.hash || "#/home";
  const match = features.find(f => f.route === route);
  if (!match) {
    content.innerHTML = "<h2>Page not found</h2>";
    return;
  }

  // Track recent page on navigation (for direct hash changes/bookmarks)
  if (route !== '#/home') addRecent(route);

  fetch(match.file)
    .then(res => res.text())
    .then(html => {
      content.innerHTML = html;
      // Remove any previously loaded feature page script
      const prevScript = document.getElementById('feature-page-script');
      if (prevScript) prevScript.remove();
      // Dynamically load page-specific JS if it exists
      const jsPath = match.file.replace(/\.html$/, '.js');
      fetch(jsPath, { method: 'HEAD' })
        .then(r => {
          if (r.ok) {
            const script = document.createElement('script');
            script.src = jsPath;
            script.type = 'module';
            script.id = 'feature-page-script';
            script.onload = null;
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
