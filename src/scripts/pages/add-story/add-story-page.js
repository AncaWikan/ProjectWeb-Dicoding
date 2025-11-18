import api from "../../data/api.js";
import { idbPut } from "../../utils/idb.js";

const AddStoryPage = {
  async render() {
    return `
      <section id="add-story-page" class="add-story-page">
        <div class="container">
          <h1>Tambah Cerita</h1>
          <form id="add-story-form" class="add-story-form">
            <div class="form-group">
              <label for="name">Nama:</label>
              <input type="text" id="name" name="name" required />
            </div>

            <div class="form-group">
              <label for="description">Deskripsi:</label>
              <textarea id="description" name="description" rows="4" required></textarea>
            </div>

            <div class="form-group">
              <label for="photo">Foto:</label>
              <input type="file" id="photo" name="photo" accept="image/*" required />
            </div>

            <div class="form-group">
              <label for="lat">Latitude:</label>
              <input type="number" id="lat" name="lat" step="0.000001" value="-6.2088" required />
            </div>

            <div class="form-group">
              <label for="lon">Longitude:</label>
              <input type="number" id="lon" name="lon" step="0.000001" value="106.8456" required />
            </div>

            <button type="submit" class="btn-submit">Tambah Cerita</button>
          </form>
        </div>
      </section>
    `;
  },

  async afterRender() {
    const form = document.getElementById("add-story-form");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Silakan login terlebih dahulu");
        window.location.hash = "#/login";
        return;
      }

      try {
        const response = await api.addStory(formData, token);
        console.log("[AddStory] Success:", response);

        // Cache ke IndexedDB
        try {
          await idbPut("stories", {
            id: response.id,
            name: formData.get("name"),
            description: formData.get("description"),
            photoUrl: response.photoUrl,
            createdAt: response.createdAt,
            lat: parseFloat(formData.get("lat")),
            lon: parseFloat(formData.get("lon")),
          });
          console.log("[AddStory] Cached to IndexedDB");
        } catch (cacheErr) {
          console.warn("[AddStory] Cache error:", cacheErr);
        }

        alert("✓ Cerita berhasil ditambahkan");
        window.location.hash = "#/";
      } catch (error) {
        console.error("[AddStory] Error:", error);
        alert("❌ Gagal menambahkan cerita: " + error.message);
      }
    });
  },

  elementId: "#add-story-page",
};

export default AddStoryPage;
