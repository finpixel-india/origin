/**
 * Minimal service worker for ORIGIN.
 * Its main job is to make the app install-eligible in Chrome/Edge (they
 * require a fetch handler). We deliberately do NOT cache app shell here —
 * ORIGIN already works fully offline via localStorage, and the last thing
 * we want is a stale bundle sticking around after a deploy.
 */
const VERSION = "origin-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // wipe any old caches from previous SW versions
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", () => {
  // Pass through to network — required for installability, but no caching.
});
