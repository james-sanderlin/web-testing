// Home page logic: show recently accessed pages from localStorage

(function() {
  const recentKey = 'recent-pages';

  function getRecent() {
    try {
      return JSON.parse(localStorage.getItem(recentKey)) || [];
    } catch {
      return [];
    }
  }

  function renderRecent() {
    console.log('Rendering recent links');
    const recentLinks = document.getElementById('recent-links');
    if (!recentLinks) {
      console.log('recent-links element not found');
      return;
    }
    
    // Access features from window since it's available globally from main.js
    const features = window.features || [];
    console.log('Features available:', features.length);
    
    const recent = getRecent();
    console.log('Recent pages:', recent);
    
    recentLinks.innerHTML = '';
    
    if (!recent.length) {
      recentLinks.innerHTML = '<div style="color:#888;">No recent pages yet. Visit other pages to see them here!</div>';
      return;
    }
    
    recent.forEach(route => {
      const feature = features.find(f => f.route === route);
      if (feature) {
        console.log('Creating button for:', feature.name);
        // Create a Material-style button (md-filled-button)
        const btn = document.createElement('button');
        btn.className = 'recent-material-btn';
        btn.textContent = feature.name;
        btn.onclick = () => { 
          console.log('Navigating to:', feature.route);
          location.hash = feature.route; 
        };
        btn.setAttribute('aria-label', `Go to ${feature.name}`);
        recentLinks.appendChild(btn);
      } else {
        console.log('Feature not found for route:', route);
      }
    });
  }

  // Set up navigation handler
  window.onNavigate_home = function() {
    console.log('onNavigate_home called');
    renderRecent();
  };
  
  // Also render immediately if we're already on the home page
  if (document.getElementById('recent-links')) {
    renderRecent();
  }
})();
