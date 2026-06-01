const CACHE_NAME = "cruise-mode-v3";
const APP_FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/style.css",
  "/app.js",
  "/sw.js",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg"
];

// Pre-cache all app files on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

// Wipe old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isFont = url.hostname.includes("fonts.googleapis.com") ||
                 url.hostname.includes("fonts.gstatic.com");

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Always serve from cache immediately if available (fast + offline)
      // Then refresh the cache in the background for non-font files
      if (cached) {
        if (!isFont) {
          fetch(event.request)
            .then((fresh) => {
              if (fresh && fresh.ok) {
                caches.open(CACHE_NAME).then((c) => c.put(event.request, fresh));
              }
            })
            .catch(() => {});
        }
        return cached;
      }
      // Not in cache — fetch, store, and return
      return fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match("/index.html"));
    })
  );
});
