// starred.js: favorites state shared by the sidebar and the browse page

import { DEFAULT_STARRED } from './features.js';

const STARRED_KEY = 'starred-pages';
const INITIALIZED_KEY = 'starred-pages-initialized';

const listeners = [];

export function get() {
  try {
    return JSON.parse(localStorage.getItem(STARRED_KEY)) || [];
  } catch { return []; }
}

function set(routes) {
  localStorage.setItem(STARRED_KEY, JSON.stringify(routes));
  listeners.forEach(fn => fn(routes));
}

export function isStarred(route) {
  return get().indexOf(route) !== -1;
}

export function toggle(route) {
  const starred = get();
  const idx = starred.indexOf(route);
  if (idx === -1) {
    starred.push(route);
  } else {
    starred.splice(idx, 1);
  }
  set(starred);
}

export function onChange(fn) {
  listeners.push(fn);
}

// Seed favorites for first-time users without re-seeding after they unstar.
export function seedDefaults() {
  if (localStorage.getItem(INITIALIZED_KEY)) return;
  if (localStorage.getItem(STARRED_KEY) === null) {
    localStorage.setItem(STARRED_KEY, JSON.stringify(DEFAULT_STARRED));
  }
  localStorage.setItem(INITIALIZED_KEY, '1');
}
