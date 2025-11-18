const AboutPage = {
  async render() {
    const aboutContent = document.createElement("section");
    aboutContent.id = "about-page";
    aboutContent.className = "about-page";
    aboutContent.innerHTML = `
      <div class="container" style="max-width: 800px; margin: 2rem auto; padding: 0 1rem;">
        <h1>Tentang Story App</h1>
        <p>Story App adalah aplikasi web progresif yang memungkinkan Anda berbagi cerita dengan lokasi pada peta interaktif.</p>
        
        <h2>Fitur Utama</h2>
        <ul style="line-height: 1.8;">
          <li>📍 Bagikan cerita dengan lokasi pada peta</li>
          <li>🔔 Terima notifikasi untuk cerita baru</li>
          <li>📱 Instal aplikasi di homescreen</li>
          <li>🔓 Akses offline untuk data yang sudah disimpan</li>
          <li>🔍 Cari dan filter cerita</li>
        </ul>

        <h2>Teknologi</h2>
        <p>Dibangun dengan:</p>
        <ul style="line-height: 1.8;">
          <li>HTML5, CSS3, JavaScript ES6+</li>
          <li>Service Worker untuk offline support</li>
          <li>IndexedDB untuk penyimpanan lokal</li>
          <li>Leaflet.js untuk peta interaktif</li>
          <li>Push Notifications API</li>
        </ul>

        <h2>Privacy & Security</h2>
        <p>Data Anda disimpan secara aman dengan enkripsi. Kami menghormati privasi Anda dan tidak membagikan data tanpa persetujuan.</p>

        <p style="margin-top: 2rem; text-align: center; color: #666;">
          <small>Story App v1.0 &copy; 2024 | <a href="#/" style="color: #3f51b5; text-decoration: none;">Kembali ke Home</a></small>
        </p>
      </div>
    `;

    document.getElementById("main-content").appendChild(aboutContent);
  },

  elementId: "#about-page",
};

export default AboutPage;
