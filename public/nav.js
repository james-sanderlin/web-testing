// nav.js: primary links + favorites sidebar for Browser Test Lab

import * as starred from './starred.js';

const BROWSE_ROUTE = '#/browse';

const PRIMARY_LINKS = [
  { name: 'Home', route: '#/home', icon: 'home' },
  { name: 'Browse', route: BROWSE_ROUTE, icon: 'grid_view' },
];

export function setupNav(features, primaryList, navList, onNavClick) {
  starred.seedDefaults();

  function currentRoute() {
    return (location.hash || '#/home').split('?')[0];
  }

  function renderNav() {
    const route = currentRoute();

    primaryList.innerHTML = '';
    PRIMARY_LINKS.forEach(link => primaryList.appendChild(createPrimaryItem(link, route)));

    navList.innerHTML = '';
    const starredRoutes = starred.get();
    const starredFeatures = features.filter(f => starredRoutes.includes(f.route));

    if (!starredFeatures.length) {
      const empty = document.createElement('li');
      empty.className = 'nav-empty';
      empty.textContent = 'No favorites yet — star pages from Browse.';
      navList.appendChild(empty);
      return;
    }
    starredFeatures.forEach(f => navList.appendChild(createNavItem(f, route)));
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

    const star = document.createElement('span');
    star.className = 'material-icons star-icon starred';
    star.textContent = 'star';
    star.title = 'Remove from favorites';
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
