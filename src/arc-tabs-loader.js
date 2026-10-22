// Loads the uiarc tabs (React, assets/arc-tabs-app.js) only where they show. Phones hide the navbar tabs and
// keep the bottom tab bar, so a phone page with no other tab group skips the bundle until the window is wider than 640px.
// Bump APP_VERSION whenever arc-tabs-app.js is rebuilt (pnpm build:tabs).
const APP_VERSION = "1";
const load = () => import("./arc-tabs-app.js?v=" + APP_VERSION);
const wide = window.matchMedia("(min-width: 641px)");
if (wide.matches || document.querySelector('[data-arc-tabs]:not([data-arc-tabs="nav"])')) load();
else if (document.querySelector("[data-arc-tabs]")) {
  wide.addEventListener("change", function widen(event) {
    if (!event.matches) return;
    wide.removeEventListener("change", widen);
    load();
  });
}
