// Hero card: tilts toward the pointer and moves its light sheen.
// Only on devices with a fine, hovering pointer, and never under reduced motion.
(() => {
  const stage = document.querySelector(".ch-stage");
  const card = stage?.querySelector(".ch-card");
  if (!stage || !card) return;

  const canTilt = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  const maxTilt = 7; // degrees
  let frame = 0;

  const reset = () => {
    cancelAnimationFrame(frame);
    card.classList.remove("is-tracking");
    stage.classList.remove("is-tilting");
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    card.style.removeProperty("--sx");
    card.style.removeProperty("--sy");
  };

  const onMove = (event) => {
    if (!canTilt.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const box = card.getBoundingClientRect();
      const x = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
      const y = Math.min(Math.max((event.clientY - box.top) / box.height, 0), 1);
      card.classList.add("is-tracking");
      stage.classList.add("is-tilting");
      card.style.setProperty("--ry", `${((x - 0.5) * 2 * maxTilt).toFixed(2)}deg`);
      card.style.setProperty("--rx", `${((0.5 - y) * 2 * maxTilt).toFixed(2)}deg`);
      card.style.setProperty("--sx", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--sy", `${(y * 100).toFixed(1)}%`);
    });
  };

  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerleave", reset);
  canTilt.addEventListener?.("change", reset);
})();
