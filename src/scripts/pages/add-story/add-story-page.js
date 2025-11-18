import api from "../../data/api.js";
import { idbAdd } from "../../utils/idb.js";

const AddStoryPage = {
  map: null,
  selectedLat: null,
  selectedLon: null,
  marker: null,

  async _compressImageFile(file, maxBytes = 900000) {
    if (!file || !file.type.startsWith("image/")) return file;

    const dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    const MAX_WIDTH = 1280;
    let { width, height } = img;
    if (width > MAX_WIDTH) {
      height = Math.round((MAX_WIDTH / width) * height);
      width = MAX_WIDTH;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.9;
    let blob = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", quality)
    );
    // turunkan quality iteratif sampai ukuran <= maxBytes atau quality terlalu rendah
    while (blob && blob.size > maxBytes && quality > 0.2) {
      quality -= 0.1;
      // eslint-disable-next-line no-await-in-loop
      blob = await new Promise((res) =>
        canvas.toBlob(res, "image/jpeg", Math.max(0.1, quality))
      );
    }

    if (!blob) return file;

    try {
      return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
        type: "image/jpeg",
      });
    } catch (e) {
      return blob;
    }
  },

  async render() {
    const addStoryContent = document.createElement("section");
    addStoryContent.id = "add-story-page";
    addStoryContent.className = "add-story-page";
    addStoryContent.innerHTML = `
      <div class="container">
        <h1>Tambah Cerita Baru</h1>
        <div class="add-story-content">
          <form id="add-story-form">
            <div class="form-group">
              <label for="name">Nama</label>
              <input type="text" id="name" name="name" required />
            </div>
            <div class="form-group">
              <label for="description">Deskripsi</label>
              <textarea id="description" name="description" required></textarea>
            </div>
            <div class="form-group">
              <label for="photo">Foto</label>
              <input type="file" id="photo" name="photo" accept="image/*" required />
            </div>
            <div class="form-group">
              <label>Pilih Lokasi di Peta</label>
              <div id="add-map" style="height: 300px; margin-bottom: 1rem; border-radius: 8px;"></div>
              <input type="hidden" id="latitude" name="latitude" />
              <input type="hidden" id="longitude" name="longitude" />
              <p id="location-info" style="color: #666;">Klik pada peta untuk memilih lokasi</p>
            </div>
            <button type="submit" class="btn-primary">Kirim Cerita</button>
          </form>
          <div id="success-message" class="success-message" style="display: none;"></div>
          <div id="error-message" class="error-message" style="display: none;"></div>
        </div>
      </div>
    `;

    document.getElementById("main-content").appendChild(addStoryContent);

    setTimeout(() => {
      this._initMap();
      this._attachFormListener();
    }, 100);
  },

  _initMap() {
    const mapElement = document.getElementById("add-map");
    if (!mapElement) {
      console.error("Map element not found");
      return;
    }

    this.map = L.map("add-map").setView([-6.2088, 106.8456], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(this.map);

    this.map.on("click", (e) => {
      this.selectedLat = e.latlng.lat;
      this.selectedLon = e.latlng.lng;
      document.getElementById("latitude").value = this.selectedLat;
      document.getElementById("longitude").value = this.selectedLon;
      document.getElementById(
        "location-info"
      ).textContent = `✓ Lokasi dipilih: ${this.selectedLat.toFixed(
        4
      )}, ${this.selectedLon.toFixed(4)}`;

      // Remove existing marker
      if (this.marker) {
        this.map.removeLayer(this.marker);
      }

      this.marker = L.marker([this.selectedLat, this.selectedLon]).addTo(
        this.map
      );
    });
  },

  _attachFormListener() {
    document
      .getElementById("add-story-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        if (!token) {
          window.location.hash = "#/login";
          return;
        }

        const errorDiv = document.getElementById("error-message");
        const successDiv = document.getElementById("success-message");
        errorDiv.style.display = "none";
        successDiv.style.display = "none";
        errorDiv.textContent = "";

        // client-side validation with specific messages
        const title = document.getElementById("name").value.trim();
        const descriptionInput = document
          .getElementById("description")
          .value.trim();
        if (!descriptionInput) {
          errorDiv.style.display = "block";
          errorDiv.textContent = "✗ Isi deskripsi cerita terlebih dahulu.";
          return;
        }
        if (descriptionInput.length < 10) {
          errorDiv.style.display = "block";
          errorDiv.textContent =
            "✗ Deskripsi terlalu pendek (minimal 10 karakter).";
          return;
        }

        if (!this.selectedLat || !this.selectedLon) {
          errorDiv.style.display = "block";
          errorDiv.textContent = "✗ Pilih lokasi di peta terlebih dahulu.";
          return;
        }

        const fileInput = document.getElementById("photo");
        const originalFile = fileInput.files[0];
        if (!originalFile) {
          errorDiv.style.display = "block";
          errorDiv.textContent = "✗ Pilih file gambar terlebih dahulu.";
          return;
        }
        if (!originalFile.type.startsWith("image/")) {
          errorDiv.style.display = "block";
          errorDiv.textContent = "✗ File harus berupa gambar.";
          return;
        }

        // prepare description to send: gabungkan judul ke deskripsi agar API tidak menerima field "name"
        const descriptionToSend = title
          ? `${title}\n\n${descriptionInput}`
          : descriptionInput;

        // compress if necessary
        let fileToSend = originalFile;
        try {
          if (originalFile.size > 950000) {
            fileToSend = await this._compressImageFile(originalFile, 900000);
          }
        } catch (compressError) {
          console.warn(
            "Compression failed, sending original file",
            compressError
          );
          fileToSend = originalFile;
        }

        if (fileToSend.size && fileToSend.size > 1000000) {
          errorDiv.style.display = "block";
          errorDiv.textContent =
            "✗ Gambar terlalu besar setelah kompresi. Gunakan gambar < 1MB.";
          return;
        }

        const formData = new FormData();
        formData.append("description", descriptionToSend);
        formData.append(
          "photo",
          fileToSend,
          fileToSend.name || originalFile.name
        );
        formData.append("lat", this.selectedLat);
        formData.append("lon", this.selectedLon);

        // try network first
        try {
          await api.addStory(formData, token);
          // on success optionally save to idb 'stories' for offline viewing
          // redirect home
          window.location.hash = "#/";
        } catch (err) {
          console.warn("Network addStory failed, saving to outbox", err);
          // save outbox entry to idb for later sync (can't store FormData directly; convert to object)
          const reader = new FileReader();
          reader.onload = async () => {
            const blobData = reader.result; // base64 data URL
            await idbAdd("outbox", {
              description: descriptionToSend,
              imageDataUrl: blobData,
              lat: this.selectedLat,
              lon: this.selectedLon,
              createdAt: new Date().toISOString(),
            });
            // register background sync if available
            if ("serviceWorker" in navigator && "SyncManager" in window) {
              const reg = await navigator.serviceWorker.ready;
              try {
                await reg.sync.register("sync-outbox");
              } catch (syncErr) {
                console.warn("sync register failed", syncErr);
              }
            }
            // feedback user
            const successDiv = document.getElementById("success-message");
            successDiv.style.display = "block";
            successDiv.textContent =
              "✓ Cerita disimpan offline dan akan dikirim saat online.";
            setTimeout(() => (window.location.hash = "#/"), 1500);
          };
          reader.readAsDataURL(fileToSend);
        }
      });
  },

  async _openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // show a temporary <video> modal to capture one frame and convert to Blob/File
      // implement UI per project style (omitted here for brevity)...
    } catch (err) {
      console.error("Camera error", err);
      alert("Tidak dapat mengakses kamera: " + err.message);
    }
  },

  elementId: "#add-story-page",
};

export default AddStoryPage;
