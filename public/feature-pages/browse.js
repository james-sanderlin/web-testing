// Browse page: categorized, filterable catalog of every feature page

(function() {
  var activeCat = 'all';
  var filterText = '';

  function categoryName(id) {
    var cat = (window.CATEGORIES || []).find(function(c) { return c.id === id; });
    return cat ? cat.name : 'Other';
  }

  function matches(feature) {
    if (!filterText) return true;
    var haystack = [feature.name, feature.description || '', categoryName(feature.category)]
      .join(' ')
      .toLowerCase();
    return haystack.indexOf(filterText.toLowerCase()) !== -1;
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

  function renderChips() {
    var chips = document.getElementById('browse-chips');
    if (!chips) return;
    chips.innerHTML = '';

    var features = window.features || [];
    var options = [{ id: 'all', name: 'All (' + features.length + ')' }];
    (window.CATEGORIES || []).forEach(function(cat) {
      var count = features.filter(function(f) { return f.category === cat.id; }).length;
      if (count) options.push({ id: cat.id, name: cat.name + ' (' + count + ')' });
    });

    options.forEach(function(opt) {
      var chip = document.createElement('button');
      chip.className = 'cat-chip' + (opt.id === activeCat ? ' active' : '');
      chip.textContent = opt.name;
      chip.addEventListener('click', function() {
        activeCat = opt.id;
        var hash = opt.id === 'all' ? '#/browse' : '#/browse?cat=' + opt.id;
        history.replaceState({}, '', location.pathname + location.search + hash);
        render();
      });
      chips.appendChild(chip);
    });
  }

  function render() {
    renderChips();

    var results = document.getElementById('browse-results');
    if (!results) return;
    results.innerHTML = '';

    var features = (window.features || []).filter(matches);

    // An active filter flattens the view; otherwise group by category
    if (filterText) {
      if (!features.length) {
        results.innerHTML = '<p class="empty-note">No pages match that filter.</p>';
        return;
      }
      results.appendChild(createGrid(features));
      return;
    }

    var categories = (window.CATEGORIES || []).filter(function(cat) {
      return activeCat === 'all' || cat.id === activeCat;
    });

    categories.forEach(function(cat) {
      var items = features.filter(function(f) { return f.category === cat.id; });
      if (!items.length) return;
      var label = document.createElement('div');
      label.className = 'section-label';
      label.textContent = cat.name;
      results.appendChild(label);
      results.appendChild(createGrid(items));
    });

    var known = (window.CATEGORIES || []).map(function(c) { return c.id; });
    var uncategorized = features.filter(function(f) { return known.indexOf(f.category) === -1; });
    if (uncategorized.length && activeCat === 'all') {
      var label = document.createElement('div');
      label.className = 'section-label';
      label.textContent = 'Other';
      results.appendChild(label);
      results.appendChild(createGrid(uncategorized));
    }
  }

  window.onNavigate_browse = function() {
    var params = window.routeParams;
    var cat = params ? params.get('cat') : null;
    activeCat = cat || 'all';
    filterText = '';

    var filter = document.getElementById('browse-filter');
    if (filter) {
      filter.value = '';
      filter.addEventListener('input', function(e) {
        filterText = e.target.value;
        render();
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
