// Service worker used only by the "Service Worker response" card on the
// Download Mechanisms page. Intercepts a single synthetic URL and fabricates
// a response entirely inside the worker, with its own Content-Disposition
// header, so no real network request ever happens.
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);
  if (url.pathname !== '/__dm-sw-download') return;

  var body = 'This file was generated inside a service worker fetch handler.\n' +
    'It never touched the network — the worker synthesized this Response object directly.\n';

  event.respondWith(new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="sw-generated.txt"',
      'X-Served-By': 'service-worker'
    }
  }));
});
