const CACHE_NAME = "story-app-shell-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles/styles.css",
  "/bundle.js", // adjust if your build output differs
];

// install + cache app shell
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

// activate - cleanup
self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

// fetch - cache-first for app shell, network-first for api
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    // app shell -> cache first
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
  } else {
    // remote (API) -> network first then fallback to cache
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  }
});

// push handler - payload should be JSON or text
self.addEventListener("push", (e) => {
  let data = { title: "New Story", body: "Ada cerita baru", url: "/" };
  if (e.data) {
    try {
      data = e.data.json();
    } catch (err) {
      data.body = e.data.text();
    }
  }
  const options = {
    body: data.body,
    icon: data.icon || "/public/images/icon-192.png",
    badge: data.badge || "/public/images/icon-96.png",
    data: { url: data.url || "/" },
    actions: [{ action: "open", title: "Buka Cerita" }],
  };
  e.waitUntil(self.registration.showNotification(data.title, options));
});

// notificationclick - handle action to navigate to url
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  if (e.action === "open") {
    e.waitUntil(clients.openWindow(url));
  } else {
    e.waitUntil(clients.openWindow(url));
  }
});

// background sync placeholder - send queued stories saved in IndexedDB (key 'outbox')
self.addEventListener("sync", (e) => {
  if (e.tag === "sync-outbox") {
    e.waitUntil(sendOutbox());
  }
});

async function sendOutbox() {
  // simple IndexedDB read: try to open 'stories-outbox' store and POST each item
  try {
    const db = await openDB();
    const tx = db.transaction("outbox", "readonly");
    const store = tx.objectStore("outbox");
    const all = await store.getAll();
    for (const item of all) {
      try {
        // attempt send
        await fetch(item._url || "/stories", {
          method: "POST",
          body: item.formData,
        });
        // if success remove
        const tx2 = db.transaction("outbox", "readwrite");
        tx2.objectStore("outbox").delete(item.id);
        await tx2.complete;
      } catch (err) {
        console.warn("Send outbox item failed", err);
      }
    }
  } catch (err) {
    console.error("sendOutbox error", err);
  }
}

// minimal IndexedDB open util in SW scope
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("story-sw-db", 1);
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      if (!db.objectStoreNames.contains("outbox"))
        db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
