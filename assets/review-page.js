// Review page behaviour: cap calculator, table of contents state and section highlighting.
(() => {
  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const money = (value) => inr.format(Math.round(value));

  /* ---------- Cap calculator ---------- */
  // Pages with their own calculator mark it with data-calc and load their own script.
  const calc = document.querySelector(".rv-calc:not([data-calc])");
  if (calc) {
    const rate = 0.1;
    const cap = 1200;
    const capSpend = cap / rate;            // ₹12,000
    const waiverSpend = 200000;             // yearly eligible spend for renewal-fee reversal
    const input = calc.querySelector("#calc-spend");
    const max = Number(input.max) || 30000;
    const out = calc.querySelector("#calc-spend-out");
    const earnBar = calc.querySelector("#calc-earn-bar");
    const overBar = calc.querySelector("#calc-over-bar");
    const cashbackEl = calc.querySelector("#calc-cashback");
    const wastedEl = calc.querySelector("#calc-wasted");
    const yearlyEl = calc.querySelector("#calc-yearly");
    const note = calc.querySelector("#calc-note");
    const capPct = (capSpend / max) * 100;
    let noteTimer;

    const describe = (spend, cashback, wasted) => {
      const yearlySpend = spend * 12;
      let first;
      if (spend === 0) {
        first = "Move the slider to see what you would earn.";
        return first;
      } else if (wasted > 0) {
        first = `${money(wasted)} of your ${money(spend)} earns no extra cashback this cycle. Put that part on another card.`;
      } else if (spend === capSpend) {
        first = `At ${money(spend)} a month you use the full cap. Anything more should go on another card.`;
      } else {
        first = `You earn ${money(cashback)}. Another ${money(capSpend - spend)} of 10% spend would reach the cap.`;
      }
      const second = yearlySpend > waiverSpend
        ? ` This spend alone, ${money(yearlySpend)} a year, is more than the ₹2,00,000 needed to get the renewal fee reversed.`
        : ` The renewal fee is reversed only above ₹2,00,000 of eligible spend a year; this covers ${money(yearlySpend)} of it.`;
      return first + second;
    };

    const update = () => {
      const spend = Number(input.value);
      const cashback = Math.min(spend * rate, cap);
      const wasted = Math.max(spend - capSpend, 0);
      const earnPct = (Math.min(spend, capSpend) / max) * 100;
      const overPct = (wasted / max) * 100;

      out.value = money(spend);
      out.textContent = money(spend);
      input.setAttribute("aria-valuetext", money(spend));
      earnBar.style.inlineSize = `${earnPct}%`;
      overBar.style.insetInlineStart = `${capPct}%`;
      overBar.style.inlineSize = `${overPct}%`;
      cashbackEl.textContent = money(cashback);
      wastedEl.textContent = money(wasted);
      yearlyEl.textContent = money(cashback * 12);

      // Announce the summary once the user pauses, not on every step.
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => { note.textContent = describe(spend, cashback, wasted); }, 350);
    };

    input.hidden = false;
    input.addEventListener("input", update);
    update();
  }

  /* ---------- Scrollable tables ---------- */
  // Table wrappers are focusable only while they actually scroll sideways.
  const wraps = [...document.querySelectorAll(".rv-table-wrap")];
  const syncWraps = () => wraps.forEach((wrap) => {
    if (wrap.scrollWidth > wrap.clientWidth + 1) wrap.setAttribute("tabindex", "0");
    else wrap.removeAttribute("tabindex");
  });
  if (wraps.length) {
    syncWraps();
    window.addEventListener("resize", syncWraps, { passive: true });
  }

  /* ---------- Table of contents ---------- */
  const tocBox = document.querySelector(".rv-toc-box");
  const tocSummary = tocBox?.querySelector("summary");
  const wide = window.matchMedia("(min-width: 960px)");
  const syncToc = () => {
    if (!tocBox) return;
    if (wide.matches) {
      tocBox.open = true;
      tocSummary.setAttribute("tabindex", "-1");
    } else {
      tocBox.open = false;
      tocSummary.removeAttribute("tabindex");
    }
  };
  tocSummary?.addEventListener("click", (event) => { if (wide.matches) event.preventDefault(); });
  wide.addEventListener?.("change", syncToc);
  syncToc();

  // Collapse the mobile list after choosing a section.
  tocBox?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    if (!wide.matches) tocBox.open = false;
  }));

  /* ---------- Bounce dot (desktop) ----------
     Port of BeUI "bounce-sidebar": the active dot hops to the next section on
     a sideways arc with a light spring. Phones keep the plain list. */
  const tocList = document.querySelector(".rv-toc ol");
  const tocDot = tocList && (() => {
    const DOT = 6;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dot = document.createElement("li");
    dot.className = "rv-toc-dot";
    dot.setAttribute("aria-hidden", "true");
    dot.setAttribute("role", "presentation");
    const box = document.createElement("li");
    box.className = "rv-toc-frame";
    box.setAttribute("aria-hidden", "true");
    box.setAttribute("role", "presentation");
    tocList.prepend(box, dot);
    tocList.parentElement.closest(".rv-toc").classList.add("has-dot");
    let x = 0, by = 0, bh = 0, placed = false, frame = 0;
    const draw = () => {
      dot.style.transform = `translate(${x.toFixed(2)}px, ${(by + (bh - DOT) / 2).toFixed(2)}px)`;
      box.style.transform = `translateY(${by.toFixed(2)}px)`;
      box.style.height = `${bh.toFixed(2)}px`;
    };
    const target = () => {
      const link = tocList.querySelector("a[aria-current='true']");
      if (!link) return null;
      const li = link.closest("li");
      return { top: li.offsetTop, h: li.offsetHeight };
    };
    const snap = () => {
      const t = target();
      if (!t) return;
      cancelAnimationFrame(frame);
      by = t.top; bh = t.h; x = 0; placed = true;
      dot.classList.add("is-on");
      box.classList.add("is-on");
      draw();
    };
    const move = () => {
      const t = target();
      if (!t) return;
      if (!placed || reduce.matches || !wide.matches) return snap();
      const fromTop = by, fromH = bh;
      const from = fromTop + fromH / 2, to = t.top + t.h / 2;
      const dist = to - from, travel = Math.abs(dist);
      if (travel < 0.5) return;
      // Same tuning as the original: longer jumps get a softer spring, and the
      // sideways hop (away from the labels) is capped near 20px.
      const long = Math.min(1, Math.max(0, (travel - 48) / 120));
      const k = 280 - 60 * long, c = 18 + long, m = 0.3 + 0.15 * long;
      const bulge = Math.min(0.26 * travel, 40) / 2;
      let p = 0, v = 0, last = performance.now();
      cancelAnimationFrame(frame);
      const step = (now) => {
        let dt = Math.min(0.032, (now - last) / 1000);
        last = now;
        while (dt > 0) {
          const h = Math.min(dt, 1 / 240);
          v += ((-k * (p - 1) - c * v) / m) * h;
          p += v * h;
          dt -= h;
        }
        by = fromTop + (t.top - fromTop) * p;
        bh = fromH + (t.h - fromH) * Math.min(Math.max(p, 0), 1);
        x = -bulge * Math.max(0, Math.sin(Math.PI * Math.min(p, 1)));
        draw();
        if (Math.abs(p - 1) < 0.001 && Math.abs(v) < 0.01) { by = t.top; bh = t.h; x = 0; draw(); return; }
        frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };
    if ("ResizeObserver" in window) new ResizeObserver(snap).observe(tocList);
    wide.addEventListener?.("change", snap);
    return { move };
  })();

  /* ---------- Highlight the section in view ---------- */
  const links = [...document.querySelectorAll(".rv-toc a[href^='#']")];
  const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const visible = new Map();
    let lockUntil = 0;
    const setCurrent = (id) => {
      links.forEach((link) => {
        if (link.getAttribute("href") === `#${id}`) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
      tocDot?.move();
    };
    const mark = () => {
      if (Date.now() < lockUntil) return;
      const current = sections.find((section) => visible.get(section));
      if (!current) return;
      setCurrent(current.id);
    };
    // A click jumps the dot straight to its section instead of stepping
    // through every heading the page scrolls past.
    links.forEach((link) => link.addEventListener("click", () => {
      if (!wide.matches) return;
      lockUntil = Date.now() + 1200;
      setCurrent(link.getAttribute("href").slice(1));
    }));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visible.set(entry.target, entry.isIntersecting));
      mark();
    }, { rootMargin: "-120px 0px -55% 0px" });
    sections.forEach((section) => observer.observe(section));
  }
})();

// Sources dropdown: open it when a link (like "On this page") jumps to #sources.
(() => {
  const box = document.querySelector("#sources .rv-src-box");
  if (!box) return;
  const openIfTarget = () => { if (location.hash === "#sources") box.open = true; };
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href="#sources"]');
    if (link) box.open = true;
  });
  window.addEventListener("hashchange", openIfTarget);
  openIfTarget();
  window.addEventListener("beforeprint", () => { box.open = true; });
})();
