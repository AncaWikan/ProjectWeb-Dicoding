import UrlParser from "../routes/url-parser.js";
import routes from "../routes/routes.js";

class App {
  constructor({ content }) {
    this._content = content;
    this._initialAppShell();
  }

  _initialAppShell() {
    this._route();
    window.addEventListener("hashchange", () => this._route());
  }

  async _route() {
    const url = UrlParser.parseActiveUrlWithCombiner();
    const page = routes[url] || routes["/"];

    const renderTask = async () => {
      try {
        // Clear HANYA main-content, bukan header
        this._content.innerHTML = "";

        // Render halaman
        await page.render();

        // Verify element exists
        const pageElement = document.querySelector(page.elementId);
        if (!pageElement) {
          console.warn("[App] Page element not found:", page.elementId);
        }
      } catch (err) {
        console.error("[App] Render error:", err);
        this._content.innerHTML = `<div style="padding: 2rem; color: #d32f2f; text-align: center;"><p>⚠️ Error: ${err.message}</p></div>`;
      }
    };

    try {
      if ("startViewTransition" in document) {
        await document.startViewTransition(renderTask);
      } else {
        await renderTask();
      }
    } catch (err) {
      console.error("[App] Route error:", err);
    }
  }

  async renderCurrentRoute() {
    return this._route();
  }
}

export default App;
