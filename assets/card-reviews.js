(() => {
  const root = document.documentElement;
  const themeSwitch = document.querySelector("#themeSwitch");

  const applyTheme = (theme, persist = true) => {
    const dark = theme === "dark";
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (themeSwitch) {
      themeSwitch.checked = !dark;
      themeSwitch.setAttribute("aria-label", dark ? "Switch to day mode" : "Switch to night mode");
    }
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute("content", dark ? "#090909" : "#f5f6f7");
    });
    if (persist) localStorage.setItem("abhishek-card-stack-theme", theme);
  };

  applyTheme(root.dataset.theme || "light", false);
  themeSwitch?.addEventListener("change", () => applyTheme(themeSwitch.checked ? "light" : "dark"));

  const navbarShell = document.querySelector("#navbarShell");
  if (navbarShell) {
    const updateNavbar = () => navbarShell.classList.toggle("scrolled", window.scrollY > 20);
    window.addEventListener("scroll", updateNavbar, { passive: true });
    updateNavbar();
  }

  const index = document.querySelector("[data-review-index]");
  const reader = document.querySelector("[data-review-reader]");
  const trigger = document.querySelector("[data-review-open]");
  const closeButton = document.querySelector("[data-review-close]");
  const indexExtras = [...document.querySelectorAll("[data-index-extra]")];
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let indexScroll = 0;

  const scrollTop = () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });

  const showReview = (updateHistory = true) => {
    if (!index || !reader || reader.hidden === false) return;
    indexScroll = window.scrollY;
    index.hidden = true;
    indexExtras.forEach((section) => { section.hidden = true; });
    reader.hidden = false;
    trigger?.setAttribute("aria-expanded", "true");
    if (updateHistory) history.pushState({ review: "hsbc-live-plus" }, "", "#hsbc-live-plus");
    scrollTop();
    window.setTimeout(() => closeButton?.focus({ preventScroll: true }), reducedMotion ? 0 : 280);
  };

  const hideReview = (updateHistory = true) => {
    if (!index || !reader || reader.hidden) return;
    reader.hidden = true;
    index.hidden = false;
    indexExtras.forEach((section) => { section.hidden = false; });
    trigger?.setAttribute("aria-expanded", "false");
    if (updateHistory) {
      const cleanUrl = location.pathname + location.search;
      history.replaceState(null, "", cleanUrl);
    }
    window.scrollTo({ top: indexScroll, behavior: reducedMotion ? "auto" : "smooth" });
    window.setTimeout(() => trigger?.focus({ preventScroll: true }), reducedMotion ? 0 : 280);
  };

  trigger?.addEventListener("click", () => showReview(true));
  closeButton?.addEventListener("click", () => hideReview(true));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && reader && !reader.hidden) hideReview(true);
  });
  window.addEventListener("popstate", () => {
    if (location.hash === "#hsbc-live-plus") showReview(false);
    else hideReview(false);
  });

  if (location.hash === "#hsbc-live-plus") showReview(false);
})();
