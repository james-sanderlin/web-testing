// Browse page: category overview, plus a categorized, filterable catalog

(function() {
  var OVERVIEW = 'overview';
  var ALL = 'all';

  var activeCat = OVERVIEW;
  var filterText = '';

  function categories() {
    return window.CATEGORIES || [];
  }

  function allFeatures() {
    return window.features || [];
  }

  function categoryName(id) {
    var cat = categories().find(function(c) { return c.id === id; });
    return cat ? cat.name : 'Other';
  }

  function countIn(id) {
    return allFeatures().filter(function(f) { return f.category === id; }).length;
  }

  function matches(feature) {
    if (!filterText) return true;
    var haystack = [feature.name, feature.description || '', categoryName(feature.category)]
      .join(' ')
      .toLowerCase();
    return haystack.indexOf(filterText.toLowerCase()) !== -1;
  }

  function setCat(id) {
    activeCat = id;
    var hash = id === OVERVIEW ? '#/browse' : '#/browse?cat=' + id;
    history.replaceState({}, '', location.pathname + location.search + hash);
    render();
  }

  function createCard(feature) {
    var card = document.createElement('a');
    card.className = 'page-card';
    card.href = feature.route;

    var body = document.createElement('div');
    body.className = 'page-card-body';

    var name = document.createElement('div');
    name.className = 'page-card-name';
    name.textContent = feature.name;
    body.appendChild(name);

    if (feature.description) {
      var desc = document.createElement('div');
      desc.className = 'page-card-desc';
      desc.textContent = feature.description;
      body.appendChild(desc);
    }
    card.appendChild(body);

    var isStarred = window.starred.isStarred(feature.route);
    var star = document.createElement('span');
    star.className = 'material-icons star-icon' + (isStarred ? ' starred' : '');
    star.textContent = isStarred ? 'star' : 'star_border';
    star.title = isStarred ? 'Remove from favorites' : 'Add to favorites';
    star.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      window.starred.toggle(feature.route);
      render();
    });
    card.appendChild(star);

    return card;
  }

  function createGrid(items) {
    var grid = document.createElement('div');
    grid.className = 'cat-grid';
    items.forEach(function(f) { grid.appendChild(createCard(f)); });
    return grid;
  }

  function createTile(cat) {
    var tile = document.createElement('a');
    tile.className = 'cat-tile' + (cat.id === activeCat ? ' active' : '');
    tile.href = '#/browse?cat=' + cat.id;
    tile.addEventListener('click', function(e) {
      e.preventDefault();
      setCat(cat.id);
    });

    var icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = cat.icon;
    tile.appendChild(icon);

    var name = document.createElement('span');
    name.textContent = cat.name;
    tile.appendChild(name);

    var count = document.createElement('span');
    count.className = 'cat-tile-count';
    count.textContent = cat.id === ALL ? allFeatures().length : countIn(cat.id);
    tile.appendChild(count);

    return tile;
  }

  function renderTiles() {
    var container = document.getElementById('browse-tiles');
    if (!container) return;
    container.innerHTML = '';
    categories()
      .filter(function(cat) { return countIn(cat.id); })
      .concat([{ id: ALL, name: 'All pages', icon: 'apps' }])
      .forEach(function(cat) { container.appendChild(createTile(cat)); });
  }

  function render() {
    renderTiles();

    var results = document.getElementById('browse-results');
    if (!results) return;
    results.innerHTML = '';

    // An active filter always searches the whole catalog, flattened
    if (filterText) {
      var hits = allFeatures().filter(matches);
      if (!hits.length) {
        results.innerHTML = '<p class="empty-note">No pages match that filter.</p>';
        return;
      }
      results.appendChild(createGrid(hits));
      return;
    }

    if (activeCat === OVERVIEW) return;

    var shown = categories().filter(function(cat) {
      return activeCat === ALL || cat.id === activeCat;
    });

    shown.forEach(function(cat) {
      var items = allFeatures().filter(function(f) { return f.category === cat.id; });
      if (!items.length) return;
      var label = document.createElement('div');
      label.className = 'section-label';
      label.textContent = cat.name;
      results.appendChild(label);
      results.appendChild(createGrid(items));
    });

    if (activeCat === ALL) {
      var known = categories().map(function(c) { return c.id; });
      var other = allFeatures().filter(function(f) { return known.indexOf(f.category) === -1; });
      if (other.length) {
        var label = document.createElement('div');
        label.className = 'section-label';
        label.textContent = 'Other';
        results.appendChild(label);
        results.appendChild(createGrid(other));
      }
    }
  }

  window.onNavigate_browse = function() {
    var params = window.routeParams;
    activeCat = (params && params.get('cat')) || OVERVIEW;
    filterText = '';

    var filter = document.getElementById('browse-filter');
    if (filter) {
      filter.value = '';
      filter.addEventListener('input', function(e) {
        filterText = e.target.value;
        // The filter always searches the whole catalog, so the selection follows it
        if (filterText && activeCat !== ALL) {
          setCat(ALL);
        } else {
          render();
        }
      });
      filter.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          filter.value = '';
          filterText = '';
          render();
        }
      });
      if (window.focusBrowseFilter) {
        window.focusBrowseFilter = false;
        filter.focus();
      }
    }

    render();
  };

  if (document.getElementById('browse-results')) {
    window.onNavigate_browse();
  }
})();
