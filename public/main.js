import { features, CATEGORIES } from './features.js';
import { setupNav } from './nav.js';
import * as starred from './starred.js';

const RECENT_KEY = 'recent-pages';
// Stored deeper than the 5 shown, so filtering out favorites still fills the list
const RECENT_LIMIT = 12;

const primaryList = document.getElementById('nav-primary');
const navList = document.getElementById('nav-links');
const recentList = document.getElementById('nav-recents');
const recentHeading = document.getElementById('recent-heading');
const content = document.getElementById('content');
const homeLink = document.getElementById('home-link');

const HOME_ROUTE = "#/browse";

const standalonePages = [
  { name: "Browse", route: HOME_ROUTE, file: "feature-pages/browse.html" },
];

// Available to page scripts, which are regular scripts and cannot import
window.features = features;
window.CATEGORIES = CATEGORIES;
window.starred = starred;
window.getRecent = getRecent;

homeLink.addEventListener('click', () => {
  location.hash = HOME_ROUTE;
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

const nav = setupNav({
  features, primaryList, navList, recentList, recentHeading, getRecent,
  onNavClick: (route) => {
    location.hash = route;
    addRecent(route);
  },
});

// Page fragments own their own <h2>, so the star is added after injection
function decoratePageHeader(route) {
  const feature = features.find(f => f.route === route);
  const heading = content.querySelector('h2');
  if (!feature || !heading) return;

  const star = document.createElement('span');
  star.className = 'page-star';
  star.setAttribute('role', 'button');
  star.tabIndex = 0;
  star.dataset.route = route;
  star.addEventListener('click', () => starred.toggle(route));
  star.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      starred.toggle(route);
    }
  });
  heading.appendChild(star);
  updatePageStar();
}

function updatePageStar() {
  const star = content.querySelector('.page-star');
  if (!star) return;
  const isStarred = starred.isStarred(star.dataset.route);
  star.classList.toggle('starred', isStarred);
  star.textContent = isStarred ? 'star' : 'star_border';
  star.title = isStarred ? 'Remove from favorites' : 'Add to favorites';
  star.setAttribute('aria-label', star.title);
  star.setAttribute('aria-pressed', String(isStarred));
}

starred.onChange(updatePageStar);

function loadPage(isNavigation = false) {
  // Browse replaced the old home page; keep existing #/home links working
  if ((location.hash || '').split('?')[0] === '#/home') {
    location.replace('#' + location.hash.replace('#/home', HOME_ROUTE.slice(1)));
    return;
  }

  const [route, queryString] = (location.hash || HOME_ROUTE).split('?');
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
      decoratePageHeader(route);
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
window.addEventListener("load", () => {
  loadPage(false); // This is initial load/refresh
  nav.renderNav(); // loadPage just recorded the current page as recent
});
