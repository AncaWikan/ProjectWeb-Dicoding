const AboutPage = {
  async render() {
    const aboutContent = document.createElement("section");
    aboutContent.id = "about-page";
    aboutContent.className = "about-page";
    aboutContent.innerHTML = `
      <div class="container">
        <h1>Tentang Aplikasi</h1>
        <article class="about-content">
          <p>Aplikasi ini adalah Single Page Application untuk berbagi cerita dengan lokasi geografis.</p>
          <h2>Fitur Utama</h2>
          <ul>
            <li>✓ Tampilkan cerita dari pengguna lain</li>
            <li>✓ Visualisasi lokasi cerita di peta digital</li>
            <li>✓ Tambah cerita baru dengan geolokasi</li>
            <li>✓ Autentikasi pengguna</li>
          </ul>
        </article>
      </div>
    `;

    document.getElementById("main-content").appendChild(aboutContent);
  },

  elementId: "#about-page",
};

export default AboutPage;
