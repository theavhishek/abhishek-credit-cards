/* Pointer light for backdrop.css: lights the dot grid round a mouse pointer. */
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement;
  let x = 0, y = 0, queued = false;
  addEventListener("pointermove", (event) => {
    x = event.clientX;
    y = event.clientY;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      root.style.setProperty("--bd-x", x + "px");
      root.style.setProperty("--bd-y", y + "px");
      root.classList.add("bd-pointer");
    });
  }, { passive: true });
  document.addEventListener("pointerleave", () => root.classList.remove("bd-pointer"));
})();
