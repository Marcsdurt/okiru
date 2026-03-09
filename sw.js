const CACHE_NAME = 'okiru-v2';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './css/badges.css',
  './css/expandir.css',
  './css/temporadas.css',
  './css/tutorial.css',
  './js/store.js',
  './js/render.js',
  './js/modal-add.js',
  './js/modal-detalhe.js',
  './js/compartilhar.js',
  './js/busca.js',
  './js/proximas.js',
  './js/settings.js',
  './js/nav.js',
  './js/badges.js',
  './js/tutorial.js',
  './js/temporadas.js',
  './js/expandir.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.hostname.includes('jikan') || url.hostname.includes('api.') ||
      url.hostname.includes('translate.googleapis')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response('{}', { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
