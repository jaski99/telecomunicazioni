/* Service worker di TLC Studio.
   Precache versionata (tlc-kg-v<contenuto>), offline-first per il guscio.
   precache.js e' generato da web/build.sh e definisce self.__TLK_CACHE_VERSION
   e self.__TLK_PRECACHE. */

// Carica l'elenco delle risorse da precachare (generato da build.sh).
importScripts('./precache.js');

const CACHE_NAME = self.__TLK_CACHE_VERSION || 'tlc-kg-v1';
const PRECACHE = (self.__TLK_PRECACHE || []).map((u) =>
  new URL(u, self.location.href).href
);

const INDEX_URL = new URL('./index.html', self.location.href).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(url).catch((err) => console.warn('[sw] precache saltato:', url, err))
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((rispostaInCache) => {
      if (rispostaInCache) return rispostaInCache;
      return fetch(event.request).catch(() => {
        // offline: per le navigazioni, rimanda al guscio (SPA su hash)
        if (event.request.mode === 'navigate') {
          return caches.match(INDEX_URL);
        }
        return new Response('', { status: 503, statusText: 'offline' });
      });
    })
  );
});
