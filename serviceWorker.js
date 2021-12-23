const staticCacheName = "static-assets-v0";
const dynamicCacheName = "dynamic-assets-v1";

const assets = [
  "/",
  "/index.html",
  "/js/main.js",
  "/js/scripts.js",
  "/css/styles.css",
  "/assets/favicon.ico",
  "/assets/img/bg-masthead.jpg",
  "offline.html",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css",
  "https://fonts.googleapis.com/css?family=Merriweather+Sans:400,700",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js",
];
// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      console.log("Caching all assets");
      cache.addAll(assets);
    })
  );
});

// Activate event

self.addEventListener("activate", (event) => {
  // console.log("Service worker has been activated");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== staticCacheName && key !== dynamicCacheName)
          .map((key) => caches.delete(key))
      );
    })
  );
});

// intercepting the fetch events

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((cacheResponse) => {
        return (
          cacheResponse ||
          fetch(event.request).then((fetchResponse) => {
            return caches.open(dynamicCacheName).then((cache) => {
              cache.put(event.request.url, fetchResponse.clone());
              return fetchResponse;
            });
          })
        );
      })
      .catch(() => {
        if (event.request.url.indexOf(".html") > -1) {
          return caches.match("/offline.html");
        }
      })
  );
});
