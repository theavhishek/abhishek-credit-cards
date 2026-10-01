(() => {
  const root = document.documentElement;
  const themeButton = document.getElementById("themeButton");
  const themeKey = "abhishek-card-stack-theme";

  const syncThemeButton = () => {
    const isDark = root.dataset.theme === "dark";
    themeButton?.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDark ? "#090a0f" : "#f4f1e9");
    root.style.colorScheme = isDark ? "dark" : "light";
  };

  syncThemeButton();
  themeButton?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem(themeKey, next);
    syncThemeButton();
  });

  if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("mousemove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate3d(${x * .1}px, ${y * .13}px, 0) scale(1.015)`;
    });
    element.addEventListener("mouseleave", () => {
      element.style.transform = "translate3d(0,0,0) scale(1)";
    });
  });
})();
