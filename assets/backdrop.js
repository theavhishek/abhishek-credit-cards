/* ==========================================================================
   Site backdrop: silk lines (see backdrop.css).
   - A ribbon of N fine lines crosses the page diagonally; its width swells
     and pinches along the way, so it reads like twisting fabric.
   - Colour runs grey -> brand orange from left to right; light and dark
     colours come from CSS variables, and redraw on theme change.
   - Desktop with a mouse: animates slowly at 30fps, paused while the tab is
     hidden. Phones/touch screens and prefers-reduced-motion: drawn once.
   ========================================================================== */
(() => {
  const N = 46;
  const FX = {
    fps: 30, still: 4,
    setup() {},
    draw(c, S, t) {
      const W = S.W, H = S.H, sm = S.mobile;
      const g = c.createLinearGradient(0, 0, W, 0);
      const hot = S.c.hot;
      g.addColorStop(0, S.c.line); g.addColorStop(0.45, S.c.dot); g.addColorStop(1, hot);
      c.strokeStyle = g; c.lineWidth = 1;
      const amp = H * (sm ? 0.07 : 0.1), gap = sm ? 4 : 7;
      for (let i = 0; i < N; i++) {
        const k = i - N / 2;
        c.globalAlpha = (S.c.dark ? 1 : 0.9) * (0.4 + 0.6 * (1 - Math.abs(k) / (N / 2)));
        c.beginPath();
        for (let x = -20; x <= W + 20; x += 12) {
          const u = x / W;
          const twist = Math.sin(u * 3.2 + t * 0.18 + 0.8);
          const y = H * (sm ? 0.42 : 0.95) - u * H * (sm ? 0.36 : 0.85) + amp * Math.sin(u * 2.4 + t * 0.12) + k * gap * (0.25 + 1.1 * Math.abs(twist)) + Math.sin(u * 9 + i * 0.25 + t * 0.3) * 3;
          x < 0 ? c.moveTo(x, y) : c.lineTo(x, y);
        }
        c.stroke();
      }
      c.globalAlpha = 1;
    },
  };
  // ---- shared runner -------------------------------------------------------
  const root = document.documentElement;
  const canvas = document.createElement("canvas");
  canvas.className = "bd-fx";
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  document.body.prepend(canvas);
  const mobile = !matchMedia("(hover: hover) and (pointer: fine)").matches || innerWidth <= 640;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const live = !mobile && !reduced;
  const S = { W: 0, H: 0, dpr: 1, mobile, live, c: {} };
  const readColors = () => {
    const cs = getComputedStyle(canvas);
    S.c = { line: cs.getPropertyValue("--bd-line").trim(), dot: cs.getPropertyValue("--bd-dot").trim(), hot: cs.getPropertyValue("--bd-hot").trim(), dark: root.dataset.theme === "dark" };
  };
  let lastW = 0;
  const size = (force) => {
    if (!force && mobile && innerWidth === lastW) return; // phones: ignore address-bar height changes
    lastW = innerWidth;
    S.dpr = Math.min(devicePixelRatio || 1, 2);
    S.W = innerWidth; S.H = mobile ? Math.max(innerHeight, screen.height || 0) : innerHeight;
    canvas.style.height = S.H + "px";
    canvas.width = Math.round(S.W * S.dpr); canvas.height = Math.round(S.H * S.dpr);
    FX.setup(S);
    frame(performance.now());
  };
  const frame = (t) => {
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    ctx.clearRect(0, 0, S.W, S.H);
    FX.draw(ctx, S, live ? t / 1000 : (FX.still || 0));
  };
  let raf = 0, last = 0;
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    if (t - last < (FX.fps ? 1000 / FX.fps - 2 : 0)) return;
    last = t; frame(t);
  };
  readColors();
  size(true);
  addEventListener("resize", () => size(false));
  new MutationObserver(() => { readColors(); if (FX.recolor) FX.recolor(S); frame(performance.now()); })
    .observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  if (live) {
    document.addEventListener("visibilitychange", () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    });
    raf = requestAnimationFrame(loop);
  }
})();
