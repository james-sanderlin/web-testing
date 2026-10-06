import { features, CATEGORIES } from './features.js';
import { setupNav } from './nav.js';
import * as starred from './starred.js';

const RECENT_KEY = 'recent-pages';
const RECENT_LIMIT = 5;

const primaryList = document.getElementById('nav-primary');
const navList = document.getElementById('nav-links');
const content = document.getElementById('content');
const homeLink = document.getElementById('home-link');

const standalonePages = [
  { name: "Home", route: "#/home", file: "feature-pages/home.html" },
  { name: "Browse", route: "#/browse", file: "feature-pages/browse.html" },
];

// Available to page scripts, which are regular scripts and cannot import
window.features = features;
window.CATEGORIES = CATEGORIES;
window.starred = starred;
window.getRecent = getRecent;

homeLink.addEventListener('click', () => {
  location.hash = '#/home';
});

function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch { return []; }
}

function addRecent(route) {
  if (standalonePages.some(p => p.route === route)) return;
  let recent = getRecent().filter(r => r !== route);
  recent.unshift(route);
  if (recent.length > RECENT_LIMIT) recent = recent.slice(0, RECENT_LIMIT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}

const nav = setupNav(features, primaryList, navList, (route) => {
  location.hash = route;
  addRecent(route);
});

function loadPage(isNavigation = false) {
  const [route, queryString] = (location.hash || "#/home").split('?');
  const match = features.find(f => f.route === route)
    || standalonePages.find(p => p.route === route);
  if (!match) {
    content.innerHTML = "<h2>Page not found</h2>";
    return;
  }

  window.routeParams = new URLSearchParams(queryString || '');

  // Only clear search parameters when navigating between different pages, not on page load/refresh
  if (isNavigation) {
    const url = new URL(window.location);
    if (url.searchParams.has('search')) {
      url.searchParams.delete('search');
      window.history.replaceState({}, '', url);
    }
  }

  addRecent(route);

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
              // Don't set type='module' since page scripts are regular scripts
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
  loadPage(true); // This is navigation between pages
  nav.renderNav();
});
window.addEventListener("load", () => loadPage(false)); // This is initial load/refresh
