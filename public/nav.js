// nav.js: Navigation and search logic for Browser Test Lab

const STARRED_KEY = 'starred-pages';

function getStarred() {
  try {
    return JSON.parse(localStorage.getItem(STARRED_KEY)) || [];
  } catch { return []; }
}

function setStarred(routes) {
  localStorage.setItem(STARRED_KEY, JSON.stringify(routes));
}

function toggleStar(route) {
  const starred = getStarred();
  const idx = starred.indexOf(route);
  if (idx === -1) {
    starred.push(route);
  } else {
    starred.splice(idx, 1);
  }
  setStarred(starred);
}

export function setupNav(features, navList, search, onNavClick) {
  let filteredFeatures = features;
  let selectedIdx = 0;

  function renderNav(filter = "") {
    navList.innerHTML = "";
    filteredFeatures = features.filter(f => f.name.toLowerCase().includes(filter.toLowerCase()));
    const currentRoute = location.hash || "#/print";
    const starred = getStarred();

    const starredFeatures = filteredFeatures.filter(f => starred.includes(f.route));
    const unstarredFeatures = filteredFeatures.filter(f => !starred.includes(f.route));
    const hasStarred = starredFeatures.length > 0;

    let itemIndex = 0;

    if (hasStarred) {
      starredFeatures.forEach(f => {
        navList.appendChild(createNavItem(f, currentRoute, itemIndex++, true));
      });

      const divider = document.createElement("li");
      divider.className = "nav-section-divider";
      navList.appendChild(divider);
    }

    unstarredFeatures.forEach(f => {
      navList.appendChild(createNavItem(f, currentRoute, itemIndex++, false));
    });

    // If filtering, auto-select first navigable item for keyboard nav
    const items = navList.querySelectorAll('li:not(.nav-section-divider)');
    if (items.length && filter) {
      items.forEach(el => {
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

  function createNavItem(feature, currentRoute, idx, isStarred) {
    const item = document.createElement("li");

    const label = document.createElement("span");
    label.textContent = feature.name;
    label.style.overflow = "hidden";
    label.style.textOverflow = "ellipsis";
    label.style.whiteSpace = "nowrap";
    item.appendChild(label);

    const star = document.createElement("span");
    star.className = "material-icons star-icon" + (isStarred ? " starred" : "");
    star.textContent = isStarred ? "star" : "star_border";
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleStar(feature.route);
      renderNav(search.value);
    });
    item.appendChild(star);

    if (feature.route === currentRoute) {
      item.classList.add('selected');
      item.setAttribute('aria-selected', 'true');
      item.tabIndex = 0;
      selectedIdx = idx;
    } else {
      item.tabIndex = -1;
    }

    item.addEventListener('click', () => {
      onNavClick(feature.route);
    });

    return item;
  }

  search.addEventListener("input", e => {
    renderNav(e.target.value);
  });

  search.addEventListener("keydown", e => {
    const items = navList.querySelectorAll('li:not(.nav-section-divider)');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[selectedIdx]?.classList.remove('selected');
      items[selectedIdx]?.removeAttribute('aria-selected');
      if (items[selectedIdx]) items[selectedIdx].tabIndex = -1;
      selectedIdx = (selectedIdx + 1) % items.length;
      items[selectedIdx].classList.add('selected');
      items[selectedIdx].setAttribute('aria-selected', 'true');
      items[selectedIdx].tabIndex = 0;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[selectedIdx]?.classList.remove('selected');
      items[selectedIdx]?.removeAttribute('aria-selected');
      if (items[selectedIdx]) items[selectedIdx].tabIndex = -1;
      selectedIdx = (selectedIdx - 1 + items.length) % items.length;
      items[selectedIdx].classList.add('selected');
      items[selectedIdx].setAttribute('aria-selected', 'true');
      items[selectedIdx].tabIndex = 0;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[selectedIdx]?.click();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      search.blur();
    }
  });

  // Keyboard shortcut: Cmd+K (Mac) or Ctrl+K (Win/Linux) focuses the search box
  window.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      search.focus();
      search.select && search.select();
    }
  });

  renderNav();
  return { renderNav };
}
