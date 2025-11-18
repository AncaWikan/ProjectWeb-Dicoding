import api from "../../data/api.js";

const RegisterPage = {
  async render() {
    const registerContent = document.createElement("section");
    registerContent.id = "register-page";
    registerContent.className = "register-page";
    registerContent.innerHTML = `
      <div class="auth-container" style="max-width: 500px; margin: 3rem auto; padding: 0 1rem;">
        <div class="auth-card" style="padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h1 style="text-align: center; margin-bottom: 2rem;">Daftar Akun</h1>
          <form id="register-form">
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="name" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Nama</label>
              <input type="text" id="name" name="name" placeholder="Nama lengkap" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 1rem;" />
            </div>
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="email" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email</label>
              <input type="email" id="email" name="email" placeholder="contoh@email.com" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 1rem;" />
            </div>
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label for="password" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Password</label>
              <input type="password" id="password" name="password" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 1rem;" />
            </div>
            <button type="submit" class="btn-primary" style="width: 100%; padding: 0.75rem; background: #3f51b5; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; font-weight: 500;">Daftar</button>
            <p style="text-align: center; margin-top: 1rem;">Sudah punya akun? <a href="#/login" style="color: #3f51b5; text-decoration: none;">Login di sini</a></p>
          </form>
          <div id="error-message" class="error-message" style="display: none; margin-top: 1rem; padding: 1rem; background: #ffebee; color: #c62828; border-radius: 4px; text-align: center;"></div>
          <div id="success-message" class="success-message" style="display: none; margin-top: 1rem; padding: 1rem; background: #e8f5e9; color: #2e7d32; border-radius: 4px; text-align: center;"></div>
        </div>
      </div>
    `;

    document.getElementById("main-content").appendChild(registerContent);

    document
      .getElementById("register-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const errorDiv = document.getElementById("error-message");
        const successDiv = document.getElementById("success-message");

        errorDiv.style.display = "none";
        successDiv.style.display = "none";

        try {
          const result = await api.register(name, email, password);
          successDiv.style.display = "block";
          successDiv.textContent =
            "✓ Pendaftaran berhasil! Arahkan ke login...";

          setTimeout(() => {
            window.location.hash = "#/login";
          }, 1500);
        } catch (error) {
          console.error("Register error:", error);
          errorDiv.style.display = "block";
          errorDiv.textContent = `✗ ${error.message}`;
        }
      });
  },

  elementId: "#register-page",
};

export default RegisterPage;
