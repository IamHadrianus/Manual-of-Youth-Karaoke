// Service worker for offline support.
// NOTE: service workers only register over http/https (or localhost) — browsers block them
// entirely on file:// URLs. That means offline mode can't be tested by just double-clicking
// index.html; the app needs to be served (a local dev server for testing, GitHub Pages for
// real use). index.html's registration call already guards for this and just no-ops on file://.

// Bump this whenever any cached file's *contents* change (not just when you touch this file) —
// it's what forces old cached copies to be replaced instead of served forever from cache.
const CACHE_VERSION = 'final432-v14';
const CACHE_NAME = 'manual-youth-karaoke-' + CACHE_VERSION;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './audio/vocals.mp3',
  './audio/bgm.mp3',
  './assets/andy-logo.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-512-maskable.png',
  './assets/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// Cache-first: once a file is cached, it's served instantly offline. Anything not precached
// (shouldn't normally happen) is fetched from the network and cached for next time; if the
// network is unavailable too, the request just fails naturally.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
