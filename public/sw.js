const CACHE_NAME = "survivor-library-v6";
const APP_SHELL_URL = new URL(".", self.registration.scope).pathname;

const PRECACHE_URLS = [
  "",
  "manifest.webmanifest",
  "icons/app-icon-192.png",
  "icons/app-icon-512.png",
  "icons/apple-touch-icon.png",
  "books/book1.md",
  "books/book2.md",
  "books/book3.md",
  "books/book4.md",
  "books/book5.md",
  "books/book6.md",
  "books/book7.md",
  "books/book8.md",
  "covers/book1.png",
  "covers/book2.png",
  "covers/book3.png",
  "covers/book4.png",
  "covers/book5.png",
  "covers/book6.png",
  "covers/book7.png",
  "covers/book8.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        const urls = await resolvePrecacheUrls();
        await cache.addAll(urls);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, APP_SHELL_URL));
    return;
  }

  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.destination === "style" || request.destination === "font") {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    return (await matchCached(cache, request)) || matchCached(cache, fallbackUrl);
  }
}

async function resolvePrecacheUrls() {
  try {
    const response = await fetch(APP_SHELL_URL, { cache: "no-store" });
    const html = await response.text();
    const assetUrls = [...html.matchAll(/(?:href|src)="([^"]*\/assets\/[^"]+)"/g)]
      .map((match) => new URL(match[1], self.registration.scope).pathname);

    const appUrls = PRECACHE_URLS.map((url) => new URL(url, self.registration.scope).pathname);
    return [...new Set([...appUrls, ...assetUrls])];
  } catch {
    return PRECACHE_URLS.map((url) => new URL(url, self.registration.scope).pathname);
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await matchCached(cache, request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const fallback = await matchCached(cache, request);
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await matchCached(cache, request);
  const network = fetch(request).then((response) => {
    if (response.ok || response.type === "opaque") {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || network;
}

async function matchCached(cache, requestOrUrl) {
  const cached = await cache.match(requestOrUrl, {
    ignoreSearch: true,
    ignoreVary: true
  });

  if (cached || typeof requestOrUrl === "string") {
    return cached;
  }

  return cache.match(new URL(requestOrUrl.url).pathname, {
    ignoreSearch: true,
    ignoreVary: true
  });
}
