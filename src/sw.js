const CACHE_NAME = "story-app-shell-v1";
const API_CACHE = "story-app-api-v1";
const APP_SHELL = ["/", "/index.html", "/bundle.js"];

// Install - cache app shell
self.addEventListener("install", (e) => {
  console.log("[SW] Install event");
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching app shell");
      return cache.addAll(APP_SHELL).catch(() => {
        console.warn(
          "[SW] Some app shell items failed to cache (expected in dev)"
        );
      });
    })
  );
});

// Activate - cleanup old caches
self.addEventListener("activate", (e) => {
  console.log("[SW] Activate event");
  e.waitUntil(clients.claim());
});

// Fetch - cache-first for app shell, network-first for API
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // ignore non-GET requests
  if (e.request.method !== "GET") return;

  if (url.origin === location.origin) {
    // same-origin (app shell) -> cache first, fallback to network
    e.respondWith(
      caches
        .match(e.request)
        .then((r) => {
          if (r) return r;
          return fetch(e.request).then((response) => {
            // optionally cache successful responses
            if (response.status === 200) {
              const cache = caches.open(CACHE_NAME);
              cache.then((c) => c.put(e.request, response.clone()));
            }
            return response;
          });
        })
        .catch(() => {
          // offline fallback
          return new Response("Offline - please check your connection", {
            status: 503,
            statusText: "Service Unavailable",
          });
        })
    );
  } else {
    // remote (API) -> network first, fallback to cache
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // cache successful API responses
          if (response.status === 200) {
            const cache = caches.open(API_CACHE);
            cache.then((c) => c.put(e.request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // fallback to cached API response
          return caches.match(e.request).then((r) => {
            if (r) return r;
            return new Response(JSON.stringify({ error: "Offline" }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            });
          });
        })
    );
  }
});

// Push Notification event - triggered by server push
self.addEventListener("push", (e) => {
  console.log("[SW] Push event received");
  let data = {
    title: "Story App",
    body: "Ada cerita baru untuk dibaca",
    url: "/#/",
    icon: "/public/images/icon-192.png",
    badge: "/public/images/icon-96.png",
  };

  if (e.data) {
    try {
      data = Object.assign(data, e.data.json());
    } catch (err) {
      console.warn("[SW] Failed to parse push data, using text:", err);
      data.body = e.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: { url: data.url || "/#/" },
    actions: [
      { action: "open", title: "Buka Cerita" },
      { action: "close", title: "Tutup" },
    ],
    tag: "story-notification",
    requireInteraction: false,
  };

  e.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event - handle user interaction with notification
self.addEventListener("notificationclick", (e) => {
  console.log("[SW] Notification clicked - action:", e.action);
  e.notification.close();

  const url = e.notification.data?.url || "/#/";

  if (e.action === "close") {
    return;
  }

  e.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // check if window already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      // open new window if not found
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background Sync event - triggered when connection restored
self.addEventListener("sync", (e) => {
  console.log("[SW] Sync event - tag:", e.tag);
  if (e.tag === "sync-outbox") {
    e.waitUntil(syncOutbox());
  }
});

async function syncOutbox() {
  try {
    const db = await openDB();
    const tx = db.transaction("outbox", "readonly");
    const allItems = await tx.objectStore("outbox").getAll();

    console.log("[SW] Syncing", allItems.length, "items from outbox");

    for (const item of allItems) {
      try {
        // reconstruct FormData or send as JSON
        const formData = new FormData();
        formData.append("description", item.description);
        formData.append("lat", item.lat);
        formData.append("lon", item.lon);
        if (item.imageDataUrl) {
          const blob = await fetch(item.imageDataUrl).then((r) => r.blob());
          formData.append("photo", blob, "photo.jpg");
        }

        const token = item.token || ""; // should be stored with outbox item
        const response = await fetch(
          `${item.apiUrl || "https://story-api.dicoding.dev/v1"}/stories`,
          {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          }
        );

        if (response.ok) {
          console.log("[SW] Synced item", item.id);
          // delete from outbox after successful send
          const txDelete = db.transaction("outbox", "readwrite");
          await txDelete.objectStore("outbox").delete(item.id);
        } else {
          console.warn("[SW] Sync item failed with status", response.status);
        }
      } catch (err) {
        console.warn("[SW] Error syncing item", item.id, err);
      }
    }
  } catch (err) {
    console.error("[SW] syncOutbox error:", err);
  }
}

// Utility: open IndexedDB
function openDB(name = "story-app-db", version = 1) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("stories")) {
        db.createObjectStore("stories", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
