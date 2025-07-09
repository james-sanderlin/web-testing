const features = [
  { name: "Print", route: "#/print", file: "feature-pages/print.html" },
  { name: "LocalStorage", route: "#/localstorage", file: "feature-pages/localstorage.html" },
  { name: "Download", route: "#/download", file: "feature-pages/download.html" },
];

const navList = document.getElementById('nav-links');
const search = document.getElementById('search');
const content = document.getElementById('content');

function renderNav(filter = "") {
  navList.innerHTML = "";
  features
    .filter(f => f.name.toLowerCase().includes(filter.toLowerCase()))
    .forEach(f => {
      const item = document.createElement("md-list-item");
      item.innerHTML = `<a href="\${f.route}">\${f.name}</a>`;
      navList.appendChild(item);
    });
}

search.addEventListener("input", e => renderNav(e.target.value));
renderNav();

function loadPage() {
  const route = location.hash || "#/print";
  const match = features.find(f => f.route === route);
  if (!match) {
    content.innerHTML = "<h2>Page not found</h2>";
    return;
  }

  fetch(match.file)
    .then(res => res.text())
    .then(html => {
      content.innerHTML = html;
    })
    .catch(err => {
      content.innerHTML = `<p>Error loading page: \${err}</p>`;
    });
}

window.addEventListener("hashchange", loadPage);
window.addEventListener("load", loadPage);
