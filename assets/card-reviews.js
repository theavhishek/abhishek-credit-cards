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
      meta.setAttribute("content", dark ? "#000000" : "#eef1f3");
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
})();
