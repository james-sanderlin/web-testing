// Home page logic: show recently accessed pages from localStorage
import { features } from '../features.js';

(function() {
  const recentKey = 'recent-pages';
  const recentLinks = document.getElementById('recent-links');

  function getRecent() {
    try {
      return JSON.parse(localStorage.getItem(recentKey)) || [];
    } catch {
      return [];
    }
  }

  function renderRecent() {
    console.log('Rendering recent links');
    const recent = getRecent();
    recentLinks.innerHTML = '';
    if (!recent.length) {
      recentLinks.innerHTML = '<div style="color:#888;">No recent pages yet.</div>';
      return;
    }
    recent.forEach(route => {
      const feature = features.find(f => f.route === route);
      if (feature) {
        // Create a Material-style button (md-filled-button)
        const btn = document.createElement('button');
        btn.className = 'recent-material-btn';
        btn.textContent = feature.name;
        btn.onclick = () => { location.hash = feature.route; };
        btn.setAttribute('aria-label', `Go to ${feature.name}`);
        recentLinks.appendChild(btn);
      }
    });
  }

  window.renderRecentLinks = renderRecent;
  window.featurePageHandlers = window.featurePageHandlers || {};
  window.featurePageHandlers['#/home'] = renderRecent;
  renderRecent();
})();
