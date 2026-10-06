# Browser Test Lab

A vanilla JS single-page app for testing browser features. Uses hash-based routing, Material Design 3 web components, and localStorage for state.

## Project Structure

```
public/
  index.html          # App shell (header, nav sidebar, content area)
  main.js             # Routing, page loading, recent pages tracking
  nav.js              # Sidebar rendering, search, keyboard nav, starring
  features.js         # Feature registry ({name, route, file, category, description}) + CATEGORIES
  starred.js          # Favorites state shared by the sidebar and the browse page
  feature-pages/      # Individual page HTML + JS pairs
```

## Adding a New Page

This is the most common task. Follow these steps exactly:

### 1. Create the HTML file: `public/feature-pages/<page-name>.html`

- This is an **HTML fragment**, NOT a full document. No `<!DOCTYPE>`, `<html>`, `<head>`, or `<body>` tags.
- Start with an `<h2>` title.
- Use inline styles or include a `<style>` block at the bottom of the file.
- Material Icons are available globally (e.g., `<span class="material-icons">cloud_upload</span>`).

```html
<h2>My New Page</h2>
<p>Description of what this page tests.</p>

<div id="my-widget">...</div>
```

### 2. Create the JS file: `public/feature-pages/<page-name>.js`

**Critical: the JS handler naming convention.** The route's path segment has all non-alphanumeric characters (including hyphens) replaced with underscores:

```
Route: #/my-page  →  Handler: onNavigate_my_page
Route: #/foo-bar-baz  →  Handler: onNavigate_foo_bar_baz
```

The conversion logic (from main.js):
```js
'onNavigate_' + route.replace('#/', '').replace(/[^a-zA-Z0-9_]/g, '_')
```

**JS file rules:**
- These are **regular scripts**, NOT ES modules. Do not use `import`/`export`.
- Define the handler on `window` so main.js can find it.
- The handler runs AFTER the HTML is already injected into `#content`, so DOM elements are available.
- The script is loaded once and cached. On repeat visits, only the handler function is called again.

**Preferred pattern:**
```js
function onNavigate_my_page() {
  var myWidget = document.getElementById('my-widget');
  if (!myWidget) return;
  // page logic here
}
```

Alternate (also fine):
```js
window.onNavigate_my_page = function() {
  // page logic here
};
```

### 3. Register in `public/features.js`

Add an entry to the array, maintaining **alphabetical order by name**. All five fields are required:

```js
{ name: "My New Page", route: "#/my-page", file: "feature-pages/my-page.html",
  category: "downloads", description: "One line on what this page tests." },
```

- `name`: Display name. Do NOT include "Test" or "Demo" — the whole app is for testing.
- `route`: Hash route (must start with `#/`)
- `file`: Path to HTML file relative to `public/`
- `category`: One of the `CATEGORIES` ids in `features.js` — `downloads`, `uploads`, `files`, `storage`, `security`
- `description`: One short sentence, shown on the Browse page card

New pages are **not** added to the sidebar — they appear on the Browse page under their
category. The sidebar lists favorites only.

### Common Mistakes to Avoid

- Using `import`/`export` in page JS files (they're regular scripts, not modules)
- Forgetting to convert hyphens to underscores in the handler name
- Wrapping the HTML in `<html>`/`<body>` tags (it's a fragment injected into `#content`)
- Not inserting the features.js entry in alphabetical order
- Omitting `category` or `description` from the features.js entry
- Creating the handler as a module export instead of a global function/window property

## Running Locally

```
npm start
```

Starts Express server on http://localhost:3000.

## Key Architectural Notes

- **Routing**: Hash-based (`#/route`). `main.js` listens to `hashchange`, fetches the HTML fragment, injects it, then lazy-loads the JS.
- **Standalone routes**: `#/home` and `#/browse` live in the `standalonePages` array in `main.js`, not in `features.js`, so they never appear in the catalog or get starred. The header title links to `#/home`.
- **Sidebar**: Fixed Home/Browse links at the top (`PRIMARY_LINKS` in `nav.js`), then favorites only. `Cmd/Ctrl+K` jumps to `#/browse` and focuses its filter.
- **Discovery**: `#/browse` is the full categorized, filterable catalog; the home page shows recents plus category tiles linking to `#/browse?cat=<id>`.
- **Query params**: `main.js` splits the hash on `?` for route lookup and exposes `window.routeParams` (a `URLSearchParams`) to page handlers.
- **Globals for page scripts**: `main.js` exposes `window.features`, `window.CATEGORIES`, `window.starred`, and `window.getRecent()` since page scripts cannot `import`.
- **Favorites**: `localStorage` key `starred-pages` (array of routes), managed by `starred.js`. Download and Upload are seeded for first-time users, guarded by the `starred-pages-initialized` key so unstarring sticks.
- **Recent pages**: `localStorage` key `recent-pages` (last 5 visited, standalone routes excluded). Displayed on home page.
- **API endpoints**: Express server in `api/index.js` handles upload and download routes.
