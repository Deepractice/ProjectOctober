/* eslint-env serviceworker */
// Service Worker for Agent UI PWA
const CACHE_NAME = "claude-ui-v1";
const urlsToCache = ["/", "/index.html", "/manifest.json"];

// Detect if running in development mode
const isDevelopment =
  self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1";

// Install event
self.addEventListener("install", (event) => {
  if (isDevelopment) {
    // In development, skip waiting and don't cache anything
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Fetch event
self.addEventListener("fetch", (event) => {
  // In development, let all requests pass through without caching
  if (isDevelopment) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }
      // Otherwise fetch from network
      return fetch(event.request);
    })
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
