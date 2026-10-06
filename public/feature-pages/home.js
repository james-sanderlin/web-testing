// Home page: recently accessed pages and category entry points

(function() {
  function renderRecent() {
    var recentLinks = document.getElementById('recent-links');
    if (!recentLinks) return;

    var features = window.features || [];
    var recent = (window.getRecent ? window.getRecent() : [])
      .map(function(route) {
        return features.find(function(f) { return f.route === route; });
      })
      .filter(Boolean);

    recentLinks.innerHTML = '';

    if (!recent.length) {
      recentLinks.innerHTML = '<div class="empty-note">No recent pages yet. Visit other pages to see them here!</div>';
      return;
    }

    recent.forEach(function(feature) {
      var link = document.createElement('a');
      link.className = 'recent-link';
      link.href = feature.route;
      link.textContent = feature.name;
      recentLinks.appendChild(link);
    });
  }

  function renderCategories() {
    var container = document.getElementById('home-categories');
    if (!container) return;

    var features = window.features || [];
    container.innerHTML = '';

    (window.CATEGORIES || []).forEach(function(cat) {
      var count = features.filter(function(f) { return f.category === cat.id; }).length;
      if (!count) return;

      var tile = document.createElement('a');
      tile.className = 'cat-tile';
      tile.href = '#/browse?cat=' + cat.id;

      var icon = document.createElement('span');
      icon.className = 'material-icons';
      icon.textContent = cat.icon;
      tile.appendChild(icon);

      var name = document.createElement('span');
      name.textContent = cat.name;
      tile.appendChild(name);

      var countEl = document.createElement('span');
      countEl.className = 'cat-tile-count';
      countEl.textContent = count;
      tile.appendChild(countEl);

      container.appendChild(tile);
    });

    var browseAll = document.getElementById('home-browse-all');
    if (browseAll) browseAll.textContent = 'Browse all ' + features.length + ' pages →';
  }

  window.onNavigate_home = function() {
    renderRecent();
    renderCategories();
  };

  if (document.getElementById('recent-links')) {
    window.onNavigate_home();
  }
})();
