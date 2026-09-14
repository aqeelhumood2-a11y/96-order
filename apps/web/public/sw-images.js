/**
 * Cache-first for images only — same strategy this company's other
 * Drive-image-backed project (maawoon-menu) already uses successfully for
 * the same underlying problem (slow first-party fetches to an external
 * image host). Everything else (HTML, RSC payloads, API/Server Action
 * calls) is left completely untouched: this worker only ever looks at
 * `request.destination === "image"`, so app data is never served stale.
 *
 * Unlike an in-memory "already loaded this page" cache, Cache Storage
 * persists across full page navigations and reloads — the second time a
 * customer sees the same product image (browsing back to the homepage,
 * revisiting a product, seeing it again in a related-products row) it
 * loads instantly from here instead of hitting the external host again.
 */
const CACHE_NAME = "product-images-v1";
const MAX_ENTRIES = 300;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.destination !== "image") return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        if (response.ok) {
          cache.put(event.request, response.clone());
          trimCache(cache);
        }
        return response;
      } catch (error) {
        return cached ?? Response.error();
      }
    }),
  );
});

async function trimCache(cache) {
  const keys = await cache.keys();
  const excess = keys.length - MAX_ENTRIES;
  if (excess > 0) {
    await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
  }
}
