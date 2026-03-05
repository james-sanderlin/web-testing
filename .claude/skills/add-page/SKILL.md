---
name: add-page
description: Add a new feature page to Browser Test Lab. Use when the user wants to create a new page, add a new test page, add a new feature, or scaffold a new browser test.
argument-hint: [page-name]
---

# Add a New Feature Page

You are adding a new page to the Browser Test Lab SPA. Follow these steps exactly.

If the user provided a page name as an argument, use it: `$ARGUMENTS`
Otherwise, ask the user what the page should be called and what it should do.

## Step 1: Determine naming

From the page name, derive:
- **display name**: Title case, used in features.js `name` field and as the `<h2>` in the HTML. Do NOT include "Test" or "Demo" in the name — the whole app is for testing. (e.g., "Cookie", "Clipboard", "Download Headers")
- **page-name**: Lowercase, hyphenated, used for filenames and route (e.g., "cookie-test")
- **handler name**: `onNavigate_` + page-name with hyphens replaced by underscores (e.g., `onNavigate_cookie_test`)

The conversion rule for handler names (from main.js):
```
'onNavigate_' + route.replace('#/', '').replace(/[^a-zA-Z0-9_]/g, '_')
```

## Step 2: Create the HTML file

Create `public/feature-pages/<page-name>.html`:

- This is an **HTML fragment** — NO `<!DOCTYPE>`, `<html>`, `<head>`, or `<body>` tags
- Start with `<h2>Display Name</h2>`
- Add a description paragraph
- Use inline styles or a `<style>` block at the bottom
- Material Icons are available globally: `<span class="material-icons">icon_name</span>`

## Step 3: Create the JS file

Create `public/feature-pages/<page-name>.js`:

**CRITICAL RULES:**
- This is a **regular script**, NOT an ES module. **Do NOT use `import` or `export`.**
- Define the handler as a **global function** (not a module export)
- The handler is called AFTER the HTML is injected into `#content`, so DOM elements are ready
- The script loads once and is cached; on repeat visits only the handler runs again

Use this pattern:
```js
function onNavigate_<handler_name>() {
  // DOM elements are already available
  var myEl = document.getElementById('my-element');
  if (!myEl) return;

  // page logic here
}
```

**Do NOT:**
- Use `import` or `export`
- Use `type="module"` anywhere
- Define the handler as anything other than a plain function declaration or `window.onNavigate_xxx = function() {...}`

## Step 4: Register in features.js

Add an entry to the `features` array in `public/features.js`, maintaining **alphabetical order by name**:

```js
{ name: "Display Name", route: "#/<page-name>", file: "feature-pages/<page-name>.html" },
```

## Step 5: Verify

After creating the files, confirm:
1. The handler function name matches the route with hyphens→underscores conversion
2. The features.js entry is in alphabetical order
3. The HTML file has no document wrapper tags
4. The JS file has no import/export statements
