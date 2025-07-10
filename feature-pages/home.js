// Home page logic: show recently accessed pages from localStorage
(function() {
  const recentKey = 'recent-pages';
  const recentLinks = document.getElementById('recent-links');
  const features = [
    { name: "Print", route: "#/print" },
    { name: "Local Storage", route: "#/localstorage" },
    { name: "Download", route: "#/download" },
    { name: "Upload", route: "#/upload" },
    { name: "PDF Demo", route: "#/pdf" },
  ];

  function getRecent() {
    try {
      return JSON.parse(localStorage.getItem(recentKey)) || [];
    } catch {
      return [];
    }
  }

  function renderRecent() {
    const recent = getRecent();
    recentLinks.innerHTML = '';
    if (!recent.length) {
      recentLinks.innerHTML = '<li style="color:#888;">No recent pages yet.</li>';
      return;
    }
    recent.forEach(route => {
      const feature = features.find(f => f.route === route);
      if (feature) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = feature.route;
        a.textContent = feature.name;
        li.appendChild(a);
        recentLinks.appendChild(li);
      }
    });
  }

  renderRecent();
})();
