import UrlParser from "../routes/url-parser.js";
import routes from "../routes/routes.js";

class App {
  constructor({ content }) {
    this._content = content;
    this._initialAppShell();
  }

  _initialAppShell() {
    // initial render + listen hash
    this._route();
    window.addEventListener("hashchange", () => this._route());
  }

  async _route() {
    const url = UrlParser.parseActiveUrlWithCombiner();
    const page = routes[url] || routes["/"];

    const renderTask = async () => {
      // clear container to avoid duplicates
      this._content.innerHTML = "";
      this._content.style.opacity = 0;
      // page.render() should append its element (e.g. #home-page)
      await page.render();
      const pageElement = document.querySelector(page.elementId);
      if (pageElement) {
        if (!this._content.contains(pageElement))
          this._content.appendChild(pageElement);
        // fade-in
        requestAnimationFrame(() => {
          this._content.style.transition = "opacity .25s";
          this._content.style.opacity = 1;
        });
      }
    };

    try {
      if ("startViewTransition" in document) {
        await document.startViewTransition(async () => {
          await renderTask();
        });
      } else {
        await renderTask();
      }
    } catch (err) {
      console.error("Route render error", err);
      this._content.innerHTML = `<div class="container"><p>Error: ${err.message}</p></div>`;
      this._content.style.opacity = 1;
    }
  }

  // public helper to force re-render current route (used after logout/sync)
  async renderCurrentRoute() {
    return this._route();
  }
}

export default App;
