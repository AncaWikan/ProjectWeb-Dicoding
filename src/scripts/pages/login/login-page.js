import api from "../../data/api.js";

const LoginPage = {
  async render() {
    const loginContent = document.createElement("section");
    loginContent.id = "login-page";
    loginContent.className = "login-page";
    loginContent.innerHTML = `
      <div class="auth-container" style="max-width: 500px; margin: 3rem auto; padding: 0 1rem;">
        <div class="auth-card" style="padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h1 style="text-align: center; margin-bottom: 2rem;">🔐 Login</h1>
          <form id="login-form">
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="email" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email</label>
              <input type="email" id="email" name="email" placeholder="contoh@email.com" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 1rem;" />
            </div>
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label for="password" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Password</label>
              <input type="password" id="password" name="password" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 1rem;" />
            </div>
            <button type="submit" class="btn-primary" style="width: 100%; padding: 0.75rem; background: #3f51b5; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; font-weight: 500;">Login</button>
            <p style="text-align: center; margin-top: 1rem; font-size: 0.95rem;">Belum punya akun? <a href="#/register" style="color: #3f51b5; text-decoration: none; font-weight: 600;">Daftar di sini</a></p>
          </form>
          <div id="error-message" class="error-message" style="display: none; margin-top: 1rem; padding: 1rem; background: #ffebee; color: #c62828; border-radius: 4px; text-align: center;"></div>
          <div id="success-message" class="success-message" style="display: none; margin-top: 1rem; padding: 1rem; background: #e8f5e9; color: #2e7d32; border-radius: 4px; text-align: center;"></div>
        </div>
      </div>
    `;

    document.getElementById("main-content").appendChild(loginContent);

    document
      .getElementById("login-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const errorDiv = document.getElementById("error-message");
        const successDiv = document.getElementById("success-message");

        errorDiv.style.display = "none";
        successDiv.style.display = "none";

        try {
          const result = await api.login(email, password);

          if (result.loginResult && result.loginResult.token) {
            localStorage.setItem("token", result.loginResult.token);
            localStorage.setItem("userId", result.loginResult.userId);

            // Update navbar
            if (typeof window.updateAuthNav === "function") {
              window.updateAuthNav();
            }

            successDiv.style.display = "block";
            successDiv.textContent = "✓ Login berhasil! Redirect...";

            setTimeout(() => {
              window.location.hash = "#/";
            }, 1000);
          } else {
            throw new Error("Response tidak valid");
          }
        } catch (error) {
          console.error("Login error:", error);
          errorDiv.style.display = "block";
          errorDiv.textContent = `✗ ${error.message}`;
        }
      });
  },

  elementId: "#login-page",
};

export default LoginPage;
