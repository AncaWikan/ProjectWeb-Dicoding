import api from "../../data/api.js";

const LoginPage = {
  async render() {
    const loginContent = document.createElement("section");
    loginContent.id = "login-page";
    loginContent.className = "login-page";
    loginContent.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <h1>Login</h1>
          <form id="login-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" placeholder="contoh@email.com" required />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required />
            </div>
            <button type="submit" class="btn-primary">Login</button>
            <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
          </form>
          <div id="error-message" class="error-message" style="display: none;"></div>
          <div id="success-message" class="success-message" style="display: none;"></div>
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

            // update navbar segera setelah login
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
