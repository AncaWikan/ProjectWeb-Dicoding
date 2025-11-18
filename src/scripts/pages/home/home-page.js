import api from "../../data/api.js";
import { idbGetAll, idbDelete, idbPut } from "../../utils/idb.js";

const HomePage = {
  currentStories: [],
  currentFilter: "all",

  async render() {
    try {
      const res = await api.getAllStories(1, 30);
      let stories = [];

      if (res && Array.isArray(res.listStory)) {
        stories = res.listStory;
      } else if (Array.isArray(res)) {
        stories = res;
      } else if (res && res.error) {
        if (!navigator.onLine) {
          console.log("[Home] Offline - loading from IndexedDB");
          stories = await idbGetAll("stories");
        } else {
          return this._showError(res.error);
        }
      } else {
        if (!navigator.onLine) {
          stories = await idbGetAll("stories");
        } else {
          stories = [];
        }
      }

      for (const story of stories) {
        try {
          await idbPut("stories", story);
        } catch (err) {
          console.warn("[Home] Cache failed:", err);
        }
      }

      this.currentStories = [...stories];
      this._displayStories(stories);
    } catch (err) {
      console.error("[Home] Render error:", err);
      const offlineStories = await idbGetAll("stories");
      this.currentStories = [...offlineStories];
      this._displayStories(offlineStories);
    }
  },

  _displayStories(stories) {
    let existing = document.getElementById("home-page");
    if (existing) existing.remove();

    const homeContent = document.createElement("section");
    homeContent.id = "home-page";
    homeContent.className = "home-page";

    if (!Array.isArray(stories) || stories.length === 0) {
      homeContent.innerHTML = `
        <div class="container">
          <div class="stories-header">
            <h1>Daftar Cerita</h1>
            <a href="#/add-story" class="btn-add-story">+ Tambah Cerita</a>
          </div>
          <p>Tidak ada cerita tersedia.</p>
        </div>
      `;
      document.getElementById("main-content").appendChild(homeContent);
      return;
    }

    homeContent.innerHTML = `
      <div class="container">
        <div class="stories-header">
          <h1>Daftar Cerita</h1>
          <a href="#/add-story" class="btn-add-story">+ Tambah Cerita</a>
        </div>

        <div class="stories-controls" style="margin-bottom: 1.5rem; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
          <input 
            type="text" 
            id="search-input" 
            placeholder="Cari cerita..." 
            style="width: 100%; padding: 0.75rem; margin-bottom: 0.5rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 1rem;"
          />
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" class="filter-btn" data-filter="all" style="padding: 0.5rem 1rem; background: #3f51b5; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; transition: all 0.3s ease;">Semua</button>
            <button type="button" class="filter-btn" data-filter="recent" style="padding: 0.5rem 1rem; background: #ccc; color: #333; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; transition: all 0.3s ease;">Terbaru</button>
            <button type="button" class="filter-btn" data-filter="oldest" style="padding: 0.5rem 1rem; background: #ccc; color: #333; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; transition: all 0.3s ease;">Tertua</button>
          </div>
        </div>

        <div class="stories-container">
          <div id="map-home" class="map-container" style="height: 400px; margin-bottom: 2rem; border-radius: 8px; border: 1px solid #ddd;"></div>
          
          <div id="stories-list" class="stories-list">
            ${stories
              .map(
                (story, idx) => `
              <article class="story-card" data-lat="${
                story.lat || ""
              }" data-lon="${story.lon || ""}" data-idx="${idx}" data-id="${
                  story.id || ""
                }" style="position: relative; padding-bottom: 3rem; margin-bottom: 1rem;">
                <img src="${story.photoUrl || ""}" alt="Foto cerita ${
                  story.name || ""
                }" class="story-image" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 0.5rem;" />
                <div class="story-content">
                  <h2 style="margin: 0.5rem 0; font-size: 1.2rem;">${
                    story.name || "Tanpa Judul"
                  }</h2>
                  <p class="story-description" style="margin: 0.5rem 0; color: #666; line-height: 1.5;">${(
                    story.description || ""
                  ).substring(0, 150)}</p>
                  <small style="color: #999;">${
                    story.createdAt
                      ? new Date(story.createdAt).toLocaleDateString("id-ID")
                      : ""
                  }</small>
                </div>
                <button 
                  type="button"
                  class="btn-delete-story" 
                  data-story-id="${story.id || ""}" 
                  style="position: absolute; bottom: 0.5rem; right: 0.5rem; padding: 0.35rem 0.75rem; background: #f44336; color: white; border: none; cursor: pointer; border-radius: 4px; font-size: 0.8rem;">
                  🗑️ Hapus
                </button>
              </article>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;

    document.getElementById("main-content").appendChild(homeContent);

    this._attachHandlers([...stories]);

    if (stories.length > 0) {
      setTimeout(() => this._initMap(stories), 100);
    }
  },

  _attachHandlers(stories) {
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("keyup", (e) => {
        const query = e.target.value.trim().toLowerCase();

        if (!query) {
          this._displayStories(this.currentStories);
        } else {
          const results = this.currentStories.filter((story) => {
            const name = (story.name || "").toLowerCase();
            const description = (story.description || "").toLowerCase();
            return name.includes(query) || description.includes(query);
          });
          this._displayStories(results);
        }
      });
    }

    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const filter = btn.dataset.filter;
        this.currentFilter = filter;

        filterBtns.forEach((b) => {
          if (b === btn) {
            b.style.background = "#3f51b5";
            b.style.color = "white";
          } else {
            b.style.background = "#ccc";
            b.style.color = "#333";
          }
        });

        let displayStories = [...this.currentStories];

        if (filter === "recent") {
          displayStories.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });
        } else if (filter === "oldest") {
          displayStories.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateA - dateB;
          });
        }

        this._displayStories(displayStories);
      });
    });

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

          await idbDelete("stories", storyId);
          console.log("[Home] Story deleted from IndexedDB:", storyId);

          btn.closest(".story-card").remove();

          this.currentStories = this.currentStories.filter(
            (s) => s.id !== storyId
          );

          alert("✓ Cerita berhasil dihapus");
        } catch (err) {
          console.error("[Home] Delete error:", err);
          alert("❌ Gagal menghapus cerita: " + err.message);
        }
      });
    });

    const storyCards = document.querySelectorAll(".story-card");
    storyCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".btn-delete-story")) return;

        const lat = parseFloat(card.dataset.lat);
        const lon = parseFloat(card.dataset.lon);

        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          const map = window._homePageMap;
          if (map) {
            map.setView([lat, lon], 13, { animate: true });
          }
        }
      });
    });
  },

  _initMap(stories) {
    const mapElement = document.getElementById("map-home");
    if (!mapElement) {
      console.warn("[Home] Map element not found");
      return;
    }

    try {
      if (window._homePageMap) {
        window._homePageMap.remove();
      }

      const map = L.map("map-home").setView([-6.2088, 106.8456], 10);
      window._homePageMap = map;

      const osm = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }
      );

      const carto = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        {
          attribution: "&copy; CARTO",
          maxZoom: 19,
        }
      );

      osm.addTo(map);
      L.control.layers({ OpenStreetMap: osm, "Carto Light": carto }).addTo(map);

      stories.forEach((story) => {
        if (story.lat && story.lon) {
          const marker = L.marker([story.lat, story.lon]).addTo(map);
          marker.bindPopup(`
            <div style="max-width: 250px;">
              <img src="${
                story.photoUrl || ""
              }" alt="" style="width: 100%; max-height: 150px; border-radius: 4px; margin-bottom: 0.5rem;" />
              <h4 style="margin: 0.5rem 0; font-size: 0.95rem;">${
                story.name || ""
              }</h4>
              <p style="margin: 0; font-size: 0.85rem; color: #666;">${(
                story.description || ""
              ).substring(0, 80)}</p>
            </div>
          `);
        }
      });

      console.log("[Home] Map initialized with", stories.length, "markers");
    } catch (err) {
      console.error("[Home] Map init error:", err);
    }
  },

  _showError(message) {
    const homeContent = document.createElement("section");
    homeContent.id = "home-page";
    homeContent.innerHTML = `<div class="container" style="padding: 2rem; text-align: center; color: #d32f2f;"><p>⚠️ ${message}</p></div>`;
    document.getElementById("main-content").appendChild(homeContent);
  },

  elementId: "#home-page",
};

export default HomePage;
