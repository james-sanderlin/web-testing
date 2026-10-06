// nav.js: primary links, favorites, and recents sidebar for Browser Test Lab

import * as starred from './starred.js';

const BROWSE_ROUTE = '#/browse';
const RECENT_SHOWN = 5;

const PRIMARY_LINKS = [
  { name: 'Browse', route: BROWSE_ROUTE, icon: 'grid_view' },
];

export function setupNav(options) {
  const { features, primaryList, navList, recentList, recentHeading, getRecent, onNavClick } = options;

  starred.seedDefaults();

  // Routes currently shown under Recents, kept in place so navigating within
  // the list doesn't shuffle it under the cursor
  let shownRecents = [];

  function recentRoutes(route) {
    const starredRoutes = starred.get();
    // Favorites already sit in the nav, so recents only covers everything else
    const mru = getRecent().filter(r => !starredRoutes.includes(r));
    const kept = shownRecents.filter(r => mru.includes(r));

    // Arriving somewhere new re-sorts; anything else keeps the existing order
    const order = mru.includes(route) && !kept.includes(route)
      ? mru
      : kept.concat(mru.filter(r => !kept.includes(r)));

    shownRecents = order.slice(0, RECENT_SHOWN);
    return shownRecents;
  }

  function currentRoute() {
    return (location.hash || BROWSE_ROUTE).split('?')[0];
  }

  function renderNav() {
    const route = currentRoute();
    const starredRoutes = starred.get();

    primaryList.innerHTML = '';
    PRIMARY_LINKS.forEach(link => primaryList.appendChild(createPrimaryItem(link, route)));

    navList.innerHTML = '';
    const favorites = features.filter(f => starredRoutes.includes(f.route));
    if (!favorites.length) {
      const empty = document.createElement('li');
      empty.className = 'nav-empty';
      empty.textContent = 'No favorites yet — star pages from Browse.';
      navList.appendChild(empty);
    } else {
      favorites.forEach(f => navList.appendChild(createNavItem(f, route)));
    }

    const recents = recentRoutes(route)
      .map(r => features.find(f => f.route === r))
      .filter(Boolean);

    recentList.innerHTML = '';
    recentHeading.hidden = !recents.length;
    recents.forEach(f => recentList.appendChild(createNavItem(f, route)));
  }

  function markSelected(item, isSelected) {
    if (isSelected) {
      item.classList.add('selected');
      item.setAttribute('aria-selected', 'true');
      item.tabIndex = 0;
    } else {
      item.tabIndex = -1;
    }
  }

  function createPrimaryItem(link, route) {
    const item = document.createElement('li');

    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = link.icon;
    item.appendChild(icon);

    const label = document.createElement('span');
    label.textContent = link.name;
    item.appendChild(label);

    markSelected(item, link.route === route);
    item.addEventListener('click', () => onNavClick(link.route));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onNavClick(link.route);
      }
    });
    return item;
  }

  function createNavItem(feature, route) {
    const item = document.createElement('li');

    const label = document.createElement('span');
    label.textContent = feature.name;
    label.style.overflow = 'hidden';
    label.style.textOverflow = 'ellipsis';
    label.style.whiteSpace = 'nowrap';
    item.appendChild(label);

    const isStarred = starred.isStarred(feature.route);
    const star = document.createElement('span');
    star.className = 'material-icons star-icon' + (isStarred ? ' starred' : '');
    star.textContent = isStarred ? 'star' : 'star_border';
    star.title = isStarred ? 'Remove from favorites' : 'Add to favorites';
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      starred.toggle(feature.route);
    });
    item.appendChild(star);

    markSelected(item, feature.route === route);
    item.addEventListener('click', () => onNavClick(feature.route));
    return item;
  }

  // Cmd+K / Ctrl+K jumps to Browse and focuses its filter
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      window.focusBrowseFilter = true;
      if (currentRoute() === BROWSE_ROUTE) {
        const filter = document.getElementById('browse-filter');
        if (filter) { filter.focus(); filter.select(); }
      } else {
        onNavClick(BROWSE_ROUTE);
      }
    }
  });

  starred.onChange(renderNav);
  renderNav();
  return { renderNav };
}
