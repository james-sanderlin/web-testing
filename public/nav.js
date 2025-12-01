// nav.js: Navigation and search logic for Browser Test Lab
export function setupNav(features, navList, search, onNavClick) {
  let filteredFeatures = features;
  let selectedIdx = 0;

  function renderNav(filter = "") {
    navList.innerHTML = "";
    filteredFeatures = features.filter(f => f.name.toLowerCase().includes(filter.toLowerCase()));
    const currentRoute = location.hash || "#/print";
    filteredFeatures.forEach((f, i) => {
      const item = document.createElement("li");
      item.textContent = f.name;
      if (f.route === currentRoute) {
        item.classList.add('selected');
        item.setAttribute('aria-selected', 'true');
        item.tabIndex = 0;
        selectedIdx = i;
      } else {
        item.tabIndex = -1;
      }
      item.addEventListener('click', () => {
        onNavClick(f.route);
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
      items[selectedIdx].tabIndex = -1;
      selectedIdx = (selectedIdx + 1) % items.length;
      items[selectedIdx].classList.add('selected');
      items[selectedIdx].setAttribute('aria-selected', 'true');
      items[selectedIdx].tabIndex = 0;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[selectedIdx]?.classList.remove('selected');
      items[selectedIdx]?.removeAttribute('aria-selected');
      items[selectedIdx].tabIndex = -1;
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
