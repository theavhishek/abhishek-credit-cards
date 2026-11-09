/* ==========================================================================
   Site backdrop: silk lines (see backdrop.css).
   - A ribbon of N fine lines crosses the page diagonally; its width swells
     and pinches along the way, so it reads like twisting fabric.
   - Colour runs grey -> brand orange from left to right; light and dark
     colours come from CSS variables, and redraw on theme change.
   - Performance: the ribbon is drawn ONCE, after the page has loaded and the
     browser is idle, so it never competes with page load. There is no
     per-frame drawing; the gentle drift on desktop is a CSS transform on the
     canvas (backdrop.css), which runs on the compositor.
   - Redrawn only on theme change and (debounced) width resize.
   ========================================================================== */
(() => {
  const N = 46;
  const root = document.documentElement;
  let canvas, ctx, colors, lastW = 0, lastH = 0;

  const readColors = () => {
    const cs = getComputedStyle(canvas);
    colors = {
      line: cs.getPropertyValue("--bd-line").trim(),
      dot: cs.getPropertyValue("--bd-dot").trim(),
      hot: cs.getPropertyValue("--bd-hot").trim(),
      dark: root.dataset.theme === "dark",
    };
  };

  const draw = () => {
    const sm = innerWidth <= 640;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    // The canvas is a little larger than the screen so the drift never shows an edge.
    const W = canvas.clientWidth, H = canvas.clientHeight;
    lastW = innerWidth; lastH = innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    readColors();
    const c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, colors.line); g.addColorStop(0.45, colors.dot); g.addColorStop(1, colors.hot);
    c.strokeStyle = g; c.lineWidth = 1;
    const t = 4; // fixed phase of the twist
    const amp = H * (sm ? 0.07 : 0.1), gap = sm ? 4 : 7;
    const step = sm ? 10 : 14;
    for (let i = 0; i < N; i++) {
      const k = i - N / 2;
      c.globalAlpha = (colors.dark ? 1 : 0.9) * (0.4 + 0.6 * (1 - Math.abs(k) / (N / 2)));
      c.beginPath();
      for (let x = -20; x <= W + 20; x += step) {
        const u = x / W;
        const twist = Math.sin(u * 3.2 + t * 0.18 + 0.8);
        const y = H * (sm ? 0.42 : 0.95) - u * H * (sm ? 0.36 : 0.85) + amp * Math.sin(u * 2.4 + t * 0.12)
          + k * gap * (0.25 + 1.1 * Math.abs(twist)) + Math.sin(u * 9 + i * 0.25 + t * 0.3) * 3;
        x < 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    }
    c.globalAlpha = 1;
  };

  const start = () => {
    canvas = document.createElement("canvas");
    canvas.className = "bd-fx";
    canvas.setAttribute("aria-hidden", "true");
    ctx = canvas.getContext("2d");
    if (!ctx) return;
    document.body.prepend(canvas);
    draw();
    requestAnimationFrame(() => canvas.classList.add("is-on")); // fade in

    let timer = 0;
    addEventListener("resize", () => {
      // Phones: ignore address-bar height changes; redraw only on real size changes.
      if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 160) return;
      clearTimeout(timer);
      timer = setTimeout(draw, 200);
    }, { passive: true });
    new MutationObserver(draw).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  };

  // Wait for the page to finish loading, then for an idle moment.
  const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 300));
  if (document.readyState === "complete") idle();
  else addEventListener("load", idle, { once: true });
})();
