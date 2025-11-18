import HomePage from "../pages/home/home-page.js";
import AboutPage from "../pages/about/about-page.js";
import AddStoryPage from "../pages/add-story/add-story-page.js";
import LoginPage from "../pages/login/login-page.js";
import RegisterPage from "../pages/register/register-page.js";

const routes = {
  "/": HomePage,
  "/about": AboutPage,
  "/add-story": AddStoryPage,
  "/login": LoginPage,
  "/register": RegisterPage,
};

export default routes;
