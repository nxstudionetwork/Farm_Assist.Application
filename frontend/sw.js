const CACHE_NAME = "farm-assist-v2";
const HTML_ASSETS = [
  "/index.html",
  "/login.html",
  "/signup.html",
  "/onboarding.html",
  "/forgot.html",
  "/farm.html",
  "/seeds.html",
  "/livestock.html",
  "/workers.html",
  "/documents.html",
  "/monitoring.html",
  "/ai.html",
  "/weather.html",
  "/marketplace.html",
  "/market-prices.html",
  "/bookmarks.html",
  "/finance.html",
  "/schemes.html",
  "/community.html",
  "/expert.html",
  "/messages.html",
  "/chat.html",
  "/news.html",
  "/notifications.html",
  "/profile.html",
  "/settings.html",
  "/water.html",
  "/fertilizer.html",
  "/equipment.html",
  "/soil.html",
  "/crop-protection.html",
  "/learning.html",
  "/sustainability.html",
  "/emergency.html",
  "/tools.html",
  "/reports.html",
  "/analytics.html",
  "/command-center.html",
  "/map.html",
  "/more.html",
  "/help.html",
  "/feedback.html",
  "/about.html",
  "/404.html"
];

const STATIC_ASSETS = [
  "assets/css/style.css",
  "assets/js/navigation.js",
  "assets/js/app.js",
  "js/database.js",
  "js/services.js",
  "js/userStore.js",
  "js/script.js",
  "js/workers-page.js"
];

const CDN_ASSETS = [
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
];

const ALL_ASSETS = ["/", ...HTML_ASSETS, ...STATIC_ASSETS, ...CDN_ASSETS];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ALL_ASSETS).catch((err) => {
        console.warn("Some assets failed to cache during install:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event — Cache-first, network fallback
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (e.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
