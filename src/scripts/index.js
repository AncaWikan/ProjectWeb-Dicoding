// CSS imports
import "../styles/styles.css";
import App from "./pages/app.js";
import api from "./data/api.js";

// Initialize app
const app = new App({ content: document.getElementById("main-content") });

// Skip-to-content focus helper (ensure there's an anchor in HTML)
const skipLink = document.querySelector(".skip-to-content");
if (skipLink)
  skipLink.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("main-content")?.focus();
  });

// NAV auth control helpers
function updateAuthNav() {
  const token = localStorage.getItem("token");
  document.querySelectorAll(".nav-list a").forEach((a) => {
    const href = (a.getAttribute("href") || "").trim();
    if (href === "#/login" || href.endsWith("/login")) {
      if (token) {
        a.textContent = "Logout";
        a.dataset.auth = "logout";
        a.setAttribute("href", "#/");
      } else {
        a.textContent = "Login";
        delete a.dataset.auth;
        a.setAttribute("href", "#/login");
      }
    }
  });

  // show/hide push toggle based on feature detection
  const pushToggle = document.getElementById("push-toggle");
  if (pushToggle)
    pushToggle.style.display =
      "serviceWorker" in navigator && "PushManager" in window
        ? "inline-block"
        : "none";
}

// delegated logout & push toggle handler
document.addEventListener("click", async (e) => {
  const logoutEl = e.target.closest('[data-auth="logout"]');
  if (logoutEl) {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    updateAuthNav();
    // navigate home and force app rerender to avoid duplicate page nodes
    window.location.hash = "#/";
    if (typeof app.renderCurrentRoute === "function") app.renderCurrentRoute();
    return;
  }

  const pushToggle = e.target.closest("#push-toggle");
  if (pushToggle) {
    e.preventDefault();
    if (!("serviceWorker" in navigator) || !("PushManager" in window))
      return alert("Push not supported in this browser");
    if (pushToggle.dataset.enabled === "1") {
      // unsubscribe
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await api.unsubscribePush(sub); // optional endpoint to inform server
      }
      pushToggle.dataset.enabled = "0";
      pushToggle.textContent = "Enable Notifications";
    } else {
      // subscribe
      try {
        const reg = await navigator.serviceWorker.ready;
        const key = window.CONFIG?.VAPID_PUBLIC_KEY || null;
        if (!key) return alert("VAPID public key not configured in CONFIG");
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
        await api.savePushSubscription(sub); // save to backend so server can push
        pushToggle.dataset.enabled = "1";
        pushToggle.textContent = "Disable Notifications";
      } catch (err) {
        console.error("Push subscribe failed", err);
        alert("Gagal mendaftar notifikasi: " + err.message);
      }
    }
    return;
  }
});

// helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
  return out;
}

// make available to pages
window.updateAuthNav = updateAuthNav;

// register service worker + basic install prompt handling
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      console.log("SW registered", reg);
    })
    .catch(console.error);
}

// initial UI state
updateAuthNav();

// Toggle navigation drawer on mobile
const drawerButton = document.getElementById("drawer-button");
const navigationDrawer = document.getElementById("navigation-drawer");

if (drawerButton && navigationDrawer) {
  drawerButton.addEventListener("click", () => {
    navigationDrawer.classList.toggle("active");
  });

  // Close drawer when link is clicked
  document.querySelectorAll(".nav-list a").forEach((link) => {
    link.addEventListener("click", () => {
      navigationDrawer.classList.remove("active");
    });
  });
}
