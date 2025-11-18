// CSS imports
import "../styles/styles.css";
import App from "./pages/app.js";
import api from "./data/api.js";
import CONFIG from "./config.js";

// make CONFIG available globally (for sw setup)
window.CONFIG = CONFIG;

// Initialize app
const app = new App({ content: document.getElementById("main-content") });

// Skip-to-content link
const skipLink = document.querySelector(".skip-to-content");
if (skipLink) {
  skipLink.addEventListener("click", (e) => {
    e.preventDefault();
    const main = document.getElementById("main-content");
    if (main) {
      main.tabIndex = -1;
      main.focus();
    }
  });
}

// NAV auth control helpers
function updateAuthNav() {
  const token = localStorage.getItem("token");
  const navList = document.getElementById("nav-list");
  const navDrawer = document.getElementById("navigation-drawer");

  if (!navList || !navDrawer) return;

  // Remove semua auth-related items dari navList (HANYA dari navList, bukan drawer dulu)
  const existingAuthItems = navList.querySelectorAll('[data-auth-item="true"]');
  existingAuthItems.forEach((item) => item.remove());

  // Remove semua auth-related items dari navDrawer
  const existingDrawerAuthItems = navDrawer.querySelectorAll(
    '[data-auth-item="true"]'
  );
  existingDrawerAuthItems.forEach((item) => item.remove());

  // Create new auth item
  if (token) {
    // User is logged in - show logout
    const logoutLi = document.createElement("li");
    logoutLi.setAttribute("data-auth-item", "true");

    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "🚪 Logout";
    logoutBtn.style.cssText = `
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 0;
      font: inherit;
      text-decoration: none;
      width: auto;
    `;
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("notificationEnabled");
      updateAuthNav();
      initNotificationButton();
      window.location.hash = "#/";
    });
    logoutLi.appendChild(logoutBtn);
    navList.appendChild(logoutLi);

    // Same for drawer
    const logoutDrawerLi = document.createElement("li");
    logoutDrawerLi.setAttribute("data-auth-item", "true");
    const logoutDrawerBtn = document.createElement("button");
    logoutDrawerBtn.textContent = "🚪 Logout";
    logoutDrawerBtn.style.cssText = `
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 0;
      font: inherit;
      text-decoration: none;
      width: auto;
    `;
    logoutDrawerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("notificationEnabled");
      navigationDrawer.classList.remove("active");
      updateAuthNav();
      initNotificationButton();
      window.location.hash = "#/";
    });
    logoutDrawerLi.appendChild(logoutDrawerBtn);
    navDrawer.appendChild(logoutDrawerLi);
  } else {
    // User not logged in - show login link
    const loginLi = document.createElement("li");
    loginLi.setAttribute("data-auth-item", "true");

    const loginLink = document.createElement("a");
    loginLink.href = "#/login";
    loginLink.textContent = "🔐 Login";
    loginLi.appendChild(loginLink);
    navList.appendChild(loginLi);

    // Same for drawer
    const loginDrawerLi = document.createElement("li");
    loginDrawerLi.setAttribute("data-auth-item", "true");
    const loginDrawerLink = document.createElement("a");
    loginDrawerLink.href = "#/login";
    loginDrawerLink.textContent = "🔐 Login";
    loginDrawerLink.addEventListener("click", () => {
      navigationDrawer.classList.remove("active");
    });
    loginDrawerLi.appendChild(loginDrawerLink);
    navDrawer.appendChild(loginDrawerLi);
  }
}

// Initialize navbar functionality
function initializeNavbar() {
  const drawerButton = document.getElementById("drawer-button");
  const navigationDrawer = document.getElementById("navigation-drawer");

  if (drawerButton && navigationDrawer) {
    drawerButton.addEventListener("click", () => {
      navigationDrawer.classList.toggle("active");
    });

    // Close drawer when clicking nav links
    navigationDrawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navigationDrawer.classList.remove("active");
      });
    });
  }

  // Update navbar berdasarkan auth status
  updateAuthNav();

  // Initialize notification button
  initNotificationButton();
}

// check if user is subscribed to push and update button state
async function checkPushSubscriptionState(btn) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      btn.textContent = "🔔 Disable Notifications";
      btn.dataset.enabled = "1";
    } else {
      btn.textContent = "🔔 Enable Notifications";
      btn.dataset.enabled = "0";
    }
  } catch (err) {
    console.warn("checkPushSubscriptionState error", err);
  }
}

// delegated click handler for logout, push toggle
document.addEventListener("click", async (e) => {
  const logoutEl = e.target.closest('[data-auth="logout"]');
  if (logoutEl) {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    updateAuthNav();
    window.location.hash = "#/";
    if (typeof app.renderCurrentRoute === "function") {
      await app.renderCurrentRoute();
    }
    // close drawer if open
    const navigationDrawer = document.getElementById("navigation-drawer");
    if (navigationDrawer) navigationDrawer.classList.remove("active");
    return;
  }

  const pushToggle = e.target.closest("#push-toggle, #push-toggle-drawer");
  if (pushToggle) {
    e.preventDefault();
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return alert("Push notifications not supported in this browser");
    }
    await handlePushToggle(pushToggle);
    return;
  }
});

// handle push notification toggle
async function handlePushToggle(btn) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();

    if (sub && btn.dataset.enabled === "1") {
      // unsubscribe
      await sub.unsubscribe();
      try {
        await api.unsubscribePush(sub);
      } catch (err) {
        console.warn("Backend unsubscribe failed", err);
      }
      btn.textContent = "🔔 Enable Notifications";
      btn.dataset.enabled = "0";
      // update both buttons
      updateAuthNav();
      alert("Notifikasi dimatikan");
    } else {
      // subscribe
      const key = CONFIG.VAPID_PUBLIC_KEY;
      if (!key) {
        return alert("VAPID public key not configured");
      }
      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      try {
        await api.savePushSubscription(newSub);
      } catch (err) {
        console.error("Backend subscribe failed", err);
        // still mark as enabled locally
      }
      btn.textContent = "🔔 Disable Notifications";
      btn.dataset.enabled = "1";
      // update both buttons
      updateAuthNav();
      alert(
        "Notifikasi diaktifkan - Anda akan menerima pemberitahuan cerita baru"
      );
    }
  } catch (err) {
    console.error("Push toggle error", err);
    alert("Error: " + err.message);
  }
}

// convert VAPID base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    out[i] = rawData.charCodeAt(i);
  }
  return out;
}

// Initialize notification button
function initNotificationButton() {
  const token = localStorage.getItem("token");
  const notifBtn = document.getElementById("notification-toggle");
  const notifDrawerBtn = document.getElementById("notification-toggle-drawer");

  if (!notifBtn || !notifDrawerBtn) return;

  // Show notification button hanya jika user login
  if (token) {
    notifBtn.style.display = "block";
    notifDrawerBtn.style.display = "block";

    // Check browser support
    const isSupported =
      "serviceWorker" in navigator && "Notification" in window;
    if (!isSupported) {
      notifBtn.textContent = "🔔 Notifikasi tidak didukung";
      notifBtn.disabled = true;
      notifDrawerBtn.textContent = "🔔 Notifikasi tidak didukung";
      notifDrawerBtn.disabled = true;
      return;
    }

    // Request permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    attachNotificationListener(notifBtn, notifDrawerBtn);
    updateNotificationButtonState(notifBtn, notifDrawerBtn);
  } else {
    notifBtn.style.display = "none";
    notifDrawerBtn.style.display = "none";
  }
}

function updateNotificationButtonState(btn, drawerBtn) {
  const isEnabled = localStorage.getItem("notificationEnabled") === "true";
  const permission = Notification.permission;

  if (permission === "granted" && isEnabled) {
    btn.textContent = "🔔 Notifications ON";
    btn.style.background = "rgba(76, 175, 76, 0.3)";
    btn.style.borderColor = "#4caf50";

    drawerBtn.textContent = "🔔 Notifications ON";
    drawerBtn.style.background = "rgba(76, 175, 76, 0.3)";
    drawerBtn.style.borderColor = "#4caf50";
  } else {
    btn.textContent = "🔔 Enable Notifications";
    btn.style.background = "rgba(255,255,255,0.2)";
    btn.style.borderColor = "white";

    drawerBtn.textContent = "🔔 Enable Notifications";
    drawerBtn.style.background = "rgba(255,255,255,0.2)";
    drawerBtn.style.borderColor = "white";
  }
}

function attachNotificationListener(btn, drawerBtn) {
  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isEnabled = localStorage.getItem("notificationEnabled") === "true";

    if (isEnabled) {
      // Disable notifications
      localStorage.setItem("notificationEnabled", "false");
      updateNotificationButtonState(btn, drawerBtn);
      showNotification(
        "Notifikasi Dinonaktifkan",
        "Anda tidak akan menerima notifikasi lagi."
      );
      return;
    }

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      localStorage.setItem("notificationEnabled", "true");
      updateNotificationButtonState(btn, drawerBtn);
      showNotification(
        "Notifikasi Diaktifkan!",
        "Anda sekarang akan menerima notifikasi cerita terbaru."
      );

      // Subscribe to push notifications
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          console.log("[Notification] Service Worker ready");
        } catch (err) {
          console.warn("[Notification] Service Worker ready failed:", err);
        }
      }
    } else if (permission === "denied") {
      alert("Notifikasi ditolak. Silakan aktifkan izin notifikasi di browser.");
    }
  };

  // Remove old listeners
  btn.removeEventListener("click", btn._notificationHandler || handleClick);
  drawerBtn.removeEventListener(
    "click",
    drawerBtn._notificationHandler || handleClick
  );

  // Store reference and add new listeners
  btn._notificationHandler = handleClick;
  drawerBtn._notificationHandler = handleClick;

  btn.addEventListener("click", handleClick);
  drawerBtn.addEventListener("click", handleClick);
}

function showNotification(title, message) {
  if (Notification.permission === "granted") {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body: message,
          icon: "/public/images/icon-96.png",
          badge: "/public/images/icon-96.png",
          tag: "story-app-notification",
        });
      });
    } else {
      new Notification(title, {
        body: message,
        icon: "/public/images/icon-96.png",
      });
    }
  }
}

// expose updateAuthNav globally
window.updateAuthNav = updateAuthNav;
window.showNotification = showNotification;
window.initNotificationButton = initNotificationButton;

// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      console.log("[App] Service Worker registered:", reg);
    })
    .catch((err) => {
      console.error("[App] Service Worker registration failed:", err);
    });
}

// initial UI state
updateAuthNav();

// Initialize navbar when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeNavbar);
} else {
  initializeNavbar();
}
