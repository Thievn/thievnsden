const SHELL = "den-shell-v1";
const PRECACHE = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== SHELL).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

function shellOnly(url) {
  return PRECACHE.includes(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  const accept = request.headers.get("accept") || "";
  const navigate = request.mode === "navigate" || accept.includes("text/html");
  if (navigate) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(SHELL);
          const offline = await cache.match("/offline.html");
          return offline || new Response("You're offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
      })(),
    );
    return;
  }

  if (!shellOnly(url)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL);
      const hit = await cache.match(request);
      if (hit) return hit;
      return fetch(request);
    })(),
  );
});
