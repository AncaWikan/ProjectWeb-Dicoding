import api from "../../data/api.js";
import { idbGetAll } from "../../utils/idb.js";

const HomePage = {
  async render() {
    try {
      const res = await api.getAllStories(1, 30);
      let stories = [];
      if (res && Array.isArray(res.listStory)) stories = res.listStory;
      else if (Array.isArray(res)) stories = res;
      else if (res && res.error) {
        // if offline fallback to idb
        if (!navigator.onLine) stories = await idbGetAll("stories");
        else return this._showError(res.error);
      } else {
        if (!navigator.onLine) stories = await idbGetAll("stories");
        else stories = [];
      }
      this._displayStories(stories || []);
    } catch (err) {
      console.error(err);
      // fallback idb
      const offlineStories = await idbGetAll("stories");
      this._displayStories(offlineStories || []);
    }
  },

  _displayStories(stories) {
    // remove existing home section to avoid duplicates
    const existing = document.getElementById("home-page");
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

        <div class="stories-container">
          <div id="map" class="map-container" style="height: 400px; margin-bottom: 2rem;"></div>
          
          <div id="stories-list" class="stories-list">
            ${stories
              .map(
                (story, idx) => `
              <article class="story-card" data-lat="${
                story.lat || ""
              }" data-lon="${story.lon || ""}" data-idx="${idx}">
                <img src="${story.photoUrl || ""}" alt="Foto cerita ${
                  story.name || "pengguna"
                }" class="story-image" />
                <div class="story-content">
                  <h2>${story.name || "Tanpa Judul"}</h2>
                  <p class="story-description">${story.description || ""}</p>
                  <small>${
                    story.createdAt
                      ? new Date(story.createdAt).toLocaleDateString("id-ID")
                      : ""
                  }</small>
                </div>
              </article>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;

    // append once
    document.getElementById("main-content").appendChild(homeContent);

    if (stories.length > 0) setTimeout(() => this._initMap(stories), 100);
  },

  _initMap(stories) {
    const mapElement = document.getElementById("map");
    if (!mapElement) return;

    try {
      const map = L.map("map").setView([-6.2088, 106.8456], 10);

      const osm = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap contributors",
        }
      );

      const carto = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        {
          attribution: "&copy; CARTO",
        }
      );

      // add default layer and layer control
      osm.addTo(map);
      const baseLayers = {
        OpenStreetMap: osm,
        "Carto Light": carto,
      };
      L.control.layers(baseLayers).addTo(map);

      // markers and simple sync
      const markers = [];
      stories.forEach((story, idx) => {
        if (story.lat && story.lon) {
          const marker = L.marker([story.lat, story.lon]).addTo(map);
          marker.bindPopup(`
            <div class="marker-popup">
              <img src="${story.photoUrl || ""}" alt="${
            story.name || "Foto"
          }" style="width: 100%; height: auto; border-radius: 4px; max-height: 150px;" />
              <h3>${story.name || "Tanpa Judul"}</h3>
              <p>${(story.description || "").substring(0, 100)}...</p>
            </div>
          `);
          markers.push(marker);
        } else {
          markers.push(null);
        }
      });

      // click sync: article -> pan & open popup
      document.querySelectorAll(".story-card").forEach((card) => {
        card.addEventListener("click", () => {
          const lat = parseFloat(card.dataset.lat);
          const lon = parseFloat(card.dataset.lon);
          const idx = parseInt(card.dataset.idx, 10);
          if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
            map.setView([lat, lon], 13, { animate: true });
            const marker = markers[idx];
            if (marker) marker.openPopup();
          }
        });
      });
    } catch (err) {
      console.error("Error initializing map:", err);
    }
  },

  _showError(message) {
    const homeContent = document.createElement("section");
    homeContent.id = "home-page";
    homeContent.className = "home-page";
    homeContent.innerHTML = `
      <div class="container">
        <div class="error-message">
          <p>⚠️ ${message}</p>
        </div>
      </div>
    `;
    document.getElementById("main-content").appendChild(homeContent);
  },

  elementId: "#home-page",
};

export default HomePage;
