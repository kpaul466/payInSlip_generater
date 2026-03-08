const CACHE_VERSION = 'v5';
const CACHE_NAME = `bank-slip-gen-${CACHE_VERSION}`;
const urlsToCache = [
  './',
  'index.html',
  'offline.html',
  'manifest.json',
  'icon.svg',
  'index.css',
  'SBI_Logo.png',
  'CBI_Logo.png',
  'PNB_Logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Serve navigation requests with index.html (app shell), and cache other GET requests.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // App shell routing: navigation requests should return index.html from cache when offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('offline.html') || caches.match('index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache successful GET responses for future offline use
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const respClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, respClone));
          return networkResponse;
        })
        .catch(() => {
          // Fallback to index.html for navigation-like requests, or try a cached response
          return caches.match(event.request) || caches.match('/index.html');
        });
    })
  );
});

// Allow the page to trigger skipWaiting by posting a message to the SW
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
