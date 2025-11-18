import CONFIG from '../config.js';

const api = {
  async getAllStories(pageNumber = 1, pageSize = 20) {
    try {
      const response = await fetch(
        `${CONFIG.BASE_URL}/stories?page=${pageNumber}&size=${pageSize}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Gagal mengambil cerita');
      return json.data || json;
    } catch (error) {
      console.error('[API] getAllStories error', error);
      throw error;
    }
  },

  async getDetailStory(id) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/stories/${id}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Gagal mengambil detail cerita');
      return json.data || json;
    } catch (error) {
      console.error('[API] getDetailStory error', error);
      throw error;
    }
  },

  async addStory(formDataBody, token) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataBody,
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Gagal menambah cerita');
      return json.data || json;
    } catch (error) {
      console.error('[API] addStory error', error);
      throw error;
    }
  },

  async deleteStory(storyId, token) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Gagal menghapus cerita');
      return json.data || json;
    } catch (error) {
      console.error('[API] deleteStory error', error);
      throw error;
    }
  },

  async login(email, password) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Gagal login');
      return json;
    } catch (error) {
      console.error('[API] login error', error);
      throw error;
    }
  },

  async register(name, email, password) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Gagal register');
      return json;
    } catch (error) {
      console.error('[API] register error', error);
      throw error;
    }
  },
};

export default api;

// Di bagian delete handler, ganti dengan:
const deleteButtons = document.querySelectorAll(".btn-delete-story");
deleteButtons.forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const storyId = btn.dataset.storyId;
    if (!storyId) {
      console.warn("[Home] No story ID found");
      return;
    }

    if (!confirm("Hapus cerita ini?")) return;

    try {
      const token = localStorage.getItem("token");

      // Import api di atas file
      const api = (await import("../../data/api.js")).default;

      // Delete dari API jika user login
      if (token) {
        try {
          await api.deleteStory(storyId, token);
          console.log("[Home] Story deleted from API:", storyId);
        } catch (apiErr) {
          console.warn(
            "[Home] API delete failed, continuing with local delete:",
            apiErr
          );
        }
      }

      // Delete dari IndexedDB
      const { idbDelete } = await import("../../utils/idb.js");
      await idbDelete("stories", storyId);
      console.log("[Home] Story deleted from IndexedDB:", storyId);

      // Remove dari DOM
      btn.closest(".story-card").remove();

      // Update currentStories
      this.currentStories = this.currentStories.filter((s) => s.id !== storyId);

      alert("✓ Cerita berhasil dihapus");
    } catch (err) {
      console.error("[Home] Delete error:", err);
      alert("❌ Gagal menghapus cerita: " + err.message);
    }
  });
});
