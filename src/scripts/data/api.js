import CONFIG from "../config.js";

const api = {
  async getAllStories(page = 1, size = 20) {
    try {
      const token = localStorage.getItem("token");
      const url = `${CONFIG.BASE_URL}/stories?page=${page}&size=${size}`;
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        const msg = data?.message || `HTTP ${response.status}`;
        throw new Error(msg);
      }

      return data;
    } catch (error) {
      console.error("getAllStories error:", error);
      return { error: error.message || "Unknown error", listStory: [] };
    }
  },

  async addStory(formData, token) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }

      if (!response.ok) {
        let msg = "Failed to add story";
        if (data) {
          if (data.message) msg = data.message;
          else if (data.error) {
            msg =
              typeof data.error === "string"
                ? data.error
                : JSON.stringify(data.error);
          } else if (data.errors) {
            try {
              msg = Object.entries(data.errors)
                .map(([k, v]) => `${k}: ${v}`)
                .join("; ");
            } catch (e) {
              msg = JSON.stringify(data.errors);
            }
          } else {
            msg = JSON.stringify(data);
          }
        } else {
          msg = `HTTP ${response.status}`;
        }
        throw new Error(msg);
      }

      return data;
    } catch (error) {
      console.error("Error adding story:", error);
      throw error;
    }
  },

  async register(name, email, password) {
    try {
      console.log("Registering user:", email);
      const response = await fetch(`${CONFIG.BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      console.log("Register response status:", response.status);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      console.log("Register successful:", data);
      return data;
    } catch (error) {
      console.error("Error registering:", error);
      throw error;
    }
  },

  async login(email, password) {
    try {
      console.log("Logging in user:", email);
      const response = await fetch(`${CONFIG.BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("Login response status:", response.status);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      console.log("Login successful");
      return data;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  },

  // save subscription to backend so server can send push messages
  async savePushSubscription(subscription) {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${CONFIG.BASE_URL}/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(subscription),
      });
    } catch (err) {
      console.error("savePushSubscription error", err);
      throw err;
    }
  },

  async unsubscribePush(subscription) {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${CONFIG.BASE_URL}/subscriptions/unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    } catch (err) {
      console.error("unsubscribePush error", err);
    }
  },
};

export default api;
