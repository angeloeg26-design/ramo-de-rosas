// Service worker resistente a fallos: intenta guardar cada archivo por su
// cuenta. Si uno falla (por ejemplo por un nombre mal escrito), los demás
// se guardan igual, en vez de que todo el caché falle de golpe.

const CACHE_NAME = 'ramo-de-rosas-v6';
const APP_SHELL = [
  './ramo-de-rosas.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './song.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled(
        APP_SHELL.map((url) => cache.add(url))
      );
      results.forEach((r, i) => {
        if (r.status === 'rejected'){
          console.warn('[sw] No se pudo guardar en caché:', APP_SHELL[i], r.reason);
        }
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});
