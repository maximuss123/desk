const CACHE_NAME = "the-desk-shell-v3";
const SHELL_FILES = [
  "./index.html",
  "./share-target.html",
  "./config.js",
  "./app.js",
  "./share.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// App shell: cache-first. Data requests (sheets, YouTube, proxy) always
// go to the network so the feed is never stale.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const fileName = url.pathname.endsWith("/") ? "index.html" : url.pathname.split("/").pop();
  const isShellRequest = SHELL_FILES.some((f) => f.replace("./", "") === fileName);
  if (!isShellRequest) return; // let the browser handle data fetches normally

  event.respondWith(
    caches.match(fileName).then((cached) => cached || fetch(event.request))
  );
});
