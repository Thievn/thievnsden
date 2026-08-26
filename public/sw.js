/* Thievn's Den — minimal service worker for installability */
const CACHE = "den-shell-v2";
const PRECACHE = ["/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  // Network-first for navigations; don't break API/auth
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/") || caches.match(req))
    );
    return;
  }
});
