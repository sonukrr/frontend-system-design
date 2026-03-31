const CACHE = 'mfe-shell-v1';

// MF entry manifests — small files, cache aggressively
const MF_ENTRIES = [
  'http://localhost:3001/assets/remoteEntry.js',
  'http://localhost:3002/assets/remoteEntry.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(MF_ENTRIES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Remove old cache versions
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Always check the latest remote manifest first so shell can pick up
  // new product/cart builds without needing a shell redeploy.
  if (url.pathname.endsWith('remoteEntry.js')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request)) // fallback to cache if offline
    );
    return;
  }

  // Cache-first for MF bundles (content-hashed filenames = safe to cache long-term)
  if (url.pathname.includes('/assets/')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }
});
