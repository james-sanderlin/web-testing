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

  // Clear any search parameters when navigating to a new page
  const url = new URL(window.location);
  if (url.searchParams.has('search')) {
    url.searchParams.delete('search');
    window.history.replaceState({}, '', url);
  }

  // Track recent page on navigation (for direct hash changes/bookmarks)
  if (route !== '#/home') addRecent(route);

  fetch(match.file)
    .then(res => res.text())
    .then(html => {
      content.innerHTML = html;
      // Only lazy load page-specific JS if it hasn't been loaded yet
      const jsPath = match.file.replace(/\.html$/, '.js');
      const handlerName = 'onNavigate_' + route.replace('#/', '').replace(/[^a-zA-Z0-9_]/g, '_');
      if (!document.querySelector(`script[src="${jsPath}"]`)) {
        fetch(jsPath, { method: 'HEAD' })
          .then(r => {
            if (r.ok) {
              const script = document.createElement('script');
              script.src = jsPath;
              script.type = 'module';
              document.body.appendChild(script);
              script.onload = () => {
                if (window[handlerName]) {
                  window[handlerName]();
                }
              };
            }
          });
      } else if (window[handlerName]) {
        window[handlerName]();
      }
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
