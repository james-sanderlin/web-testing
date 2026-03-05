# Browser Test Lab

A vanilla JS single-page app for testing browser features. Uses hash-based routing, Material Design 3 web components, and localStorage for state.

## Project Structure

```
public/
  index.html          # App shell (header, nav sidebar, content area)
  main.js             # Routing, page loading, recent pages tracking
  nav.js              # Sidebar rendering, search, keyboard nav, starring
  features.js         # Centralized feature registry (array of {name, route, file})
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

Add an entry to the array, maintaining **alphabetical order by name**:

```js
{ name: "My New Page", route: "#/my-page", file: "feature-pages/my-page.html" },
```

- `name`: Display name in sidebar. Do NOT include "Test" or "Demo" — the whole app is for testing.
- `route`: Hash route (must start with `#/`)
- `file`: Path to HTML file relative to `public/`

### Common Mistakes to Avoid

- Using `import`/`export` in page JS files (they're regular scripts, not modules)
- Forgetting to convert hyphens to underscores in the handler name
- Wrapping the HTML in `<html>`/`<body>` tags (it's a fragment injected into `#content`)
- Not inserting the features.js entry in alphabetical order
- Creating the handler as a module export instead of a global function/window property

## Running Locally

```
npm start
```

Starts Express server on http://localhost:3000.

## Key Architectural Notes

- **Routing**: Hash-based (`#/route`). `main.js` listens to `hashchange`, fetches the HTML fragment, injects it, then lazy-loads the JS.
- **Home page**: Not in `features.js`. Handled specially in `main.js` as a standalone route. The header title ("Browser Test Lab") links to `#/home`.
- **Sidebar starring**: Stored in `localStorage` key `starred-pages` (array of route strings). Managed in `nav.js`.
- **Recent pages**: Stored in `localStorage` key `recent-pages` (last 5 visited). Displayed on home page.
- **API endpoints**: Express server in `api/index.js` handles upload and download routes.
