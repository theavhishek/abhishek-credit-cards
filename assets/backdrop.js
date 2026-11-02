/* ==========================================================================
   Site backdrop: a fine grid that behaves like a stretched membrane.
   - The pointer presses a dent and the lines slide into it; when it leaves,
     the sheet springs back (a damped spring per grid point).
   - A click or tap sends a wave rolling outward. Clicks on links, buttons
     and form fields don't.
   - When nobody touches it, a soft ripple now and then, away from the
     middle of the screen where the copy sits.
   Drawn on one fixed, transparent <canvas> behind the page. The loop runs
   only while something moves, and stops while the tab is hidden. With
   prefers-reduced-motion the grid is drawn once, flat, with no interaction.
   ========================================================================== */
(() => {
  const CELL = 50;          // grid cell size in px
  const DEPTH = 1.0;        // dent and wave strength multiplier
  const INTERACTIVE = true; // pointer dent + click waves

  const root = document.documentElement;
  const canvas = document.createElement("canvas");
  canvas.className = "bd-membrane";
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  document.body.prepend(canvas);
  root.classList.add("bd-has-membrane");

  const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const fineQuery = matchMedia("(hover: hover) and (pointer: fine)");
  let reduced = reduceQuery.matches;

  // Line colours, read from CSS so light and dark mode stay in the stylesheet.
  let colors = { line: "rgba(0,0,0,.06)", hot: "rgba(252,110,32,.5)" };
  const readColors = () => {
    const cs = getComputedStyle(canvas);
    colors = {
      line: cs.getPropertyValue("--bd-line").trim() || colors.line,
      hot: cs.getPropertyValue("--bd-hot").trim() || colors.hot,
    };
  };

  // Grid points: rest position, dent offset (sprung), dent velocity.
  let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, ox = 0, oy = 0;
  let px, py, dx, dy, vx, vy, sx, sy;

  const build = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    // One extra cell on every side, so a moving edge never shows a gap.
    cols = Math.ceil(W / CELL) + 3;
    rows = Math.ceil(H / CELL) + 3;
    // Centre the grid, so a line always runs down the middle of the screen.
    ox = ((W / 2) % CELL) - CELL * 1.5 + 0.5;
    oy = -CELL + 0.5;
    const n = cols * rows;
    px = new Float32Array(n); py = new Float32Array(n);
    dx = new Float32Array(n); dy = new Float32Array(n);
    vx = new Float32Array(n); vy = new Float32Array(n);
    sx = new Float32Array(n); sy = new Float32Array(n);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        px[i] = ox + c * CELL;
        py[i] = oy + r * CELL;
      }
    }
  };

  // ---- Inputs --------------------------------------------------------------
  const pointer = { x: 0, y: 0, on: false, s: 0, sv: 0 }; // s = dent strength (sprung 0..1)
  const waves = [];   // { x, y, t0, amp, speed, width, life }
  const DENT_R = 120;  // dent radius
  const DENT_K = 0.34 * DEPTH; // how far points slide into the dent
  let lastTouch = performance.now();

  const addWave = (x, y, amp, speed, width, life) => {
    waves.push({ x, y, t0: performance.now(), amp: amp * DEPTH, speed, width, life });
    if (waves.length > 8) waves.shift();
    wake();
  };

  const NO_WAVE = "a, button, input, select, textarea, label, summary, option, video, audio, iframe, [role='button'], [role='link'], [role='tab'], [role='menuitem'], [role='switch'], [role='slider'], [contenteditable], [tabindex]:not([tabindex='-1'])";

  if (INTERACTIVE) {
    addEventListener("pointermove", (e) => {
      if (reduced || e.pointerType !== "mouse" || !fineQuery.matches) return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.on = true;
      lastTouch = performance.now();
      wake();
    }, { passive: true });
    document.addEventListener("pointerleave", () => { pointer.on = false; wake(); });
    addEventListener("blur", () => { pointer.on = false; wake(); });
    addEventListener("pointerdown", (e) => {
      if (reduced || e.button > 0) return;
      lastTouch = performance.now();
      const t = e.target;
      if (t && t.closest && t.closest(NO_WAVE)) return;
      if (getSelection && String(getSelection()).length) return;
      addWave(e.clientX, e.clientY, 11, 560, 46, 1.9);
    }, { passive: true });
  }

  // Idle ripples: soft, small, out at the sides, never in the middle column.
  let idleTimer = 0;
  const scheduleIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(idleRipple, 3800 + Math.random() * 4200);
  };
  const idleRipple = () => {
    if (!reduced && !document.hidden && performance.now() - lastTouch > 4000) {
      const side = Math.random() < 0.5 ? 0 : 1;
      const band = W < 700 ? 0.16 : 0.22; // outer share of the width on each side
      const x = (side ? 1 - band : 0) * W + Math.random() * band * W;
      const y = H * (0.12 + Math.random() * 0.76);
      addWave(x, y, 4.2, 300, 60, 2.6);
    }
    scheduleIdle();
  };

  // ---- Simulation ----------------------------------------------------------
  const SPRING = 150, DAMP = 13;   // per-point dent spring (overshoots a little: the sheet springs back)
  const SSPRING = 90, SDAMP = 15;  // dent strength spring
  let raf = 0, last = 0;

  const step = (now) => {
    raf = 0;
    const dt = Math.min((now - last) / 1000 || 0.016, 1 / 30);
    last = now;

    // Dent strength springs towards 1 while the pointer is on the page.
    pointer.sv += (SSPRING * ((pointer.on ? 1 : 0) - pointer.s) - SDAMP * pointer.sv) * dt;
    pointer.s += pointer.sv * dt;

    // Drop finished waves.
    for (let w = waves.length - 1; w >= 0; w--) {
      if ((now - waves[w].t0) / 1000 > waves[w].life) waves.splice(w, 1);
    }

    const n = cols * rows;
    const s = pointer.s, R2 = DENT_R * DENT_R;
    const reach = DENT_R * 2.6, reach2 = reach * reach;
    let motion = Math.abs(pointer.sv) + Math.abs(s - (pointer.on ? 1 : 0));

    for (let i = 0; i < n; i++) {
      // Target dent offset: points slide towards the pointer, most at mid radius.
      let tx = 0, ty = 0;
      if (s > 0.001) {
        const ddx = pointer.x - px[i], ddy = pointer.y - py[i];
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < reach2) {
          const f = DENT_K * s * Math.exp(-d2 / R2);
          tx = ddx * f; ty = ddy * f;
        }
      }
      const ax = SPRING * (tx - dx[i]) - DAMP * vx[i];
      const ay = SPRING * (ty - dy[i]) - DAMP * vy[i];
      vx[i] += ax * dt; vy[i] += ay * dt;
      dx[i] += vx[i] * dt; dy[i] += vy[i] * dt;
      motion = Math.max(motion, Math.abs(vx[i]) + Math.abs(vy[i]) + Math.abs(tx - dx[i]) + Math.abs(ty - dy[i]));

      // Waves push points out and pull them back as the ring passes.
      let wx = 0, wy = 0;
      for (let w = 0; w < waves.length; w++) {
        const wv = waves[w];
        const age = (now - wv.t0) / 1000;
        const ring = age * wv.speed;
        const rx = px[i] - wv.x, ry = py[i] - wv.y;
        const r = Math.sqrt(rx * rx + ry * ry) || 1;
        const u = (r - ring) / wv.width;
        if (u < -3 || u > 3) continue;
        const fade = Math.pow(1 - age / wv.life, 2) / (1 + ring / 700);
        const disp = wv.amp * fade * Math.sin(u * Math.PI * 0.9) * Math.exp(-u * u * 0.6);
        wx += (rx / r) * disp; wy += (ry / r) * disp;
      }
      sx[i] = px[i] + dx[i] + wx;
      sy[i] = py[i] + dy[i] + wy;
    }

    draw();
    if (waves.length || motion > 0.02) raf = requestAnimationFrame(step);
  };

  // ---- Drawing -------------------------------------------------------------
  // Lines are drawn in two passes: the plain grid, then the stretched parts
  // again in orange, brighter the further a segment has moved from rest.
  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.line;
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      let i = r * cols;
      ctx.moveTo(sx[i], sy[i]);
      for (let c = 1; c < cols; c++) { i++; ctx.lineTo(sx[i], sy[i]); }
    }
    for (let c = 0; c < cols; c++) {
      let i = c;
      ctx.moveTo(sx[i], sy[i]);
      for (let r = 1; r < rows; r++) { i += cols; ctx.lineTo(sx[i], sy[i]); }
    }
    ctx.stroke();

    // Hot pass, three strength buckets.
    const buckets = [[], [], []];
    const n = cols * rows;
    for (let i = 0; i < n; i++) {
      const m = Math.abs(sx[i] - px[i]) + Math.abs(sy[i] - py[i]);
      if (m < 1.5) continue;
      const b = m > 8 ? 2 : m > 4 ? 1 : 0;
      const c = i % cols, r = (i - c) / cols;
      if (c + 1 < cols) buckets[b].push(i, i + 1);
      if (r + 1 < rows) buckets[b].push(i, i + cols);
    }
    ctx.strokeStyle = colors.hot;
    const alphas = [0.14, 0.28, 0.5];
    for (let b = 0; b < 3; b++) {
      const seg = buckets[b];
      if (!seg.length) continue;
      ctx.globalAlpha = alphas[b];
      ctx.beginPath();
      for (let k = 0; k < seg.length; k += 2) {
        ctx.moveTo(sx[seg[k]], sy[seg[k]]);
        ctx.lineTo(sx[seg[k + 1]], sy[seg[k + 1]]);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const drawFlat = () => {
    for (let i = 0; i < cols * rows; i++) { sx[i] = px[i]; sy[i] = py[i]; }
    draw();
  };

  function wake() {
    if (raf || reduced || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(step);
  }

  const reset = () => {
    build();
    readColors();
    if (reduced) drawFlat(); else { drawFlat(); wake(); }
  };

  // ---- Lifecycle -----------------------------------------------------------
  let resizeQueued = false;
  addEventListener("resize", () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => { resizeQueued = false; reset(); });
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      pointer.on = false;
    } else {
      wake();
    }
  });

  // Theme switch: re-read the line colours and repaint.
  new MutationObserver(() => {
    readColors();
    if (!raf) draw();
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  const onReduce = () => {
    reduced = reduceQuery.matches;
    waves.length = 0;
    pointer.on = false;
    reset();
  };
  if (reduceQuery.addEventListener) reduceQuery.addEventListener("change", onReduce);

  reset();
  scheduleIdle();
})();
