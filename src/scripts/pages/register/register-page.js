import api from "../../data/api.js";

const RegisterPage = {
  async render() {
    const registerContent = document.createElement("section");
    registerContent.id = "register-page";
    registerContent.className = "register-page";
    registerContent.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <h1>Daftar Akun</h1>
          <form id="register-form">
            <div class="form-group">
              <label for="name">Nama Lengkap</label>
              <input type="text" id="name" name="name" required />
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required />
            </div>
            <div class="form-group">
              <label for="password-confirm">Konfirmasi Password</label>
              <input type="password" id="password-confirm" name="password-confirm" required />
            </div>
            <button type="submit" class="btn-primary">Daftar</button>
            <p>Sudah punya akun? <a href="#/login">Login di sini</a></p>
          </form>
          <div id="error-message" class="error-message" style="display: none;"></div>
          <div id="success-message" class="success-message" style="display: none;"></div>
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
        const passwordConfirm =
          document.getElementById("password-confirm").value;
        const errorDiv = document.getElementById("error-message");
        const successDiv = document.getElementById("success-message");

        // Validasi password
        if (password !== passwordConfirm) {
          errorDiv.style.display = "block";
          errorDiv.textContent = "✗ Password tidak sesuai!";
          return;
        }

        if (password.length < 6) {
          errorDiv.style.display = "block";
          errorDiv.textContent = "✗ Password minimal 6 karakter!";
          return;
        }

        try {
          const result = await api.register(name, email, password);
          console.log("Register result:", result);

          successDiv.style.display = "block";
          successDiv.textContent =
            "✓ Pendaftaran berhasil! Redirect ke login...";

          setTimeout(() => {
            window.location.hash = "#/login";
          }, 1500);
        } catch (error) {
          errorDiv.style.display = "block";
          errorDiv.textContent = `✗ ${error.message}`;
        }
      });
  },

  elementId: "#register-page",
};

export default RegisterPage;
