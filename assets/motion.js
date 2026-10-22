/* Motion layer: theme-switch reveal and scroll reveal. Styles live in motion.css. */
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const easeOut = "cubic-bezier(0.23, 1, 0.32, 1)";

  // Theme switch: each page applies the theme in its own change handler. Catch the
  // change first and replay it inside a view transition, so the new theme grows out
  // of the switch instead of snapping.
  let replaying = false;
  document.addEventListener("change", (event) => {
    const input = event.target;
    if (replaying || input?.id !== "themeSwitch") return;
    if (!document.startViewTransition || reduceMotion.matches) return;

    event.stopPropagation();
    const box = input.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    root.classList.add("mo-theme-vt");
    const transition = document.startViewTransition(() => {
      replaying = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      replaying = false;
    });
    transition.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 500, easing: easeOut, pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(() => {});
    transition.finished.finally(() => root.classList.remove("mo-theme-vt"));
  }, true);

  // Phone tab bar: shrink to icons while scrolling down, bring the labels back on the
  // way up or near the top. Styles live in header.css (.nav-compact).
  const tabBar = document.querySelector("body.unified-navbar .topbar-links");
  const phone = window.matchMedia("(max-width: 640px)");
  if (tabBar) {
    let lastY = scrollY;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = Math.max(scrollY, 0);
      const delta = y - lastY;
      if (!phone.matches || y < 80) root.classList.remove("nav-compact");
      else if (delta > 6) root.classList.add("nav-compact");
      else if (delta < -6) root.classList.remove("nav-compact");
      else return;
      lastY = y;
    };
    addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    phone.addEventListener("change", update);
    // Reaching for the bar (or tabbing into it) always shows the labels.
    tabBar.addEventListener("focusin", () => root.classList.remove("nav-compact"));
  }

  // Tools sheet (#navTools): a native popover. Phones open it from the tab bar, wider
  // screens from the Tools button in the bar, where it drops down right-aligned under
  // the button. Browsers without popover support get a plain toggle.
  const toolsSheet = document.getElementById("navTools");
  const toolsButtons = document.querySelectorAll(".nav-tools-toggle, .nav-tools-menu");
  if (toolsSheet && toolsButtons.length) {
    const place = () => {
      const button = document.querySelector(".nav-tools-menu");
      if (phone.matches || !button) return;
      const rect = button.getBoundingClientRect();
      const bar = button.closest(".topbar-shell")?.getBoundingClientRect() ?? rect;
      toolsSheet.style.setProperty("--nav-menu-top", `${Math.round(bar.bottom + 8)}px`);
      toolsSheet.style.setProperty("--nav-menu-right", `${Math.max(12, Math.round(innerWidth - rect.right - 6))}px`);
    };
    toolsSheet.addEventListener("beforetoggle", event => { if (event.newState === "open") place(); });
    addEventListener("resize", () => { if (toolsSheet.matches(".is-open")) place(); try { if (toolsSheet.matches(":popover-open")) toolsSheet.hidePopover(); } catch {} });
    if (!HTMLElement.prototype.hasOwnProperty("popover")) {
      const setOpen = open => {
        if (open) place();
        toolsSheet.classList.toggle("is-open", open);
        toolsButtons.forEach(button => button.setAttribute("aria-expanded", String(open)));
      };
      setOpen(false);
      toolsButtons.forEach(button => button.addEventListener("click", event => { event.stopPropagation(); setOpen(!toolsSheet.classList.contains("is-open")); }));
      document.addEventListener("click", event => { if (!toolsSheet.contains(event.target)) setOpen(false); });
      document.addEventListener("keydown", event => { if (event.key === "Escape") setOpen(false); });
    }
  }

  // Bottom-edge blur band (styled in polish.css): decorative, so hidden from assistive tech.
  const edge = document.createElement("div");
  edge.className = "pl-edge-blur";
  edge.setAttribute("aria-hidden", "true");
  edge.innerHTML = "<span></span><span></span><span></span><span></span>";
  document.body.appendChild(edge);

  // Review hero card: the image leans toward the pointer on a light spring, with a
  // glare that follows. Decorative only, so fine pointers only and never with reduced motion.
  const tiltCard = document.querySelector(".rv-hero-card");
  const tiltImage = tiltCard?.querySelector("img");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (tiltImage && finePointer.matches && !reduceMotion.matches) {
    tiltCard.classList.add("pl-tilt");
    const glare = document.createElement("span");
    glare.className = "pl-glare";
    glare.setAttribute("aria-hidden", "true");
    tiltCard.appendChild(glare);

    const state = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, s: 1, vs: 0, ts: 1 };
    let frame = 0;
    const step = () => {
      // Spring: stiffness 0.08, damping 0.78 per frame; a little give, no wobble.
      for (const [p, v, t] of [["x", "vx", "tx"], ["y", "vy", "ty"], ["s", "vs", "ts"]]) {
        state[v] = (state[v] + (state[t] - state[p]) * 0.08) * 0.78;
        state[p] += state[v];
      }
      tiltImage.style.transform =
        `perspective(900px) rotateX(${state.y * -6}deg) rotateY(${state.x * 8}deg) scale(${state.s})`;
      const moving = [state.vx, state.vy, state.vs].some((v) => Math.abs(v) > 0.0005) ||
        Math.abs(state.tx - state.x) > 0.001 || Math.abs(state.ty - state.y) > 0.001;
      frame = moving ? requestAnimationFrame(step) : 0;
    };
    const kick = () => { if (!frame) frame = requestAnimationFrame(step); };

    tiltImage.addEventListener("pointermove", (event) => {
      const box = tiltImage.getBoundingClientRect();
      const px = (event.clientX - box.left) / box.width;
      const py = (event.clientY - box.top) / box.height;
      state.tx = px - 0.5;
      state.ty = py - 0.5;
      state.ts = 1.06;
      glare.style.setProperty("--gx", `${px * 100}%`);
      glare.style.setProperty("--gy", `${py * 100}%`);
      tiltCard.classList.add("is-tilting");
      kick();
    });
    tiltImage.addEventListener("pointerleave", () => {
      state.tx = 0;
      state.ty = 0;
      state.ts = 1;
      tiltCard.classList.remove("is-tilting");
      kick();
    });
  }

  // Scroll reveal: only content that starts below the fold, once, with a short stagger.
  if (!("IntersectionObserver" in window)) return;
  const selectors = [
    ".sp-guide-head", ".sp-guide-steps > li",
    ".py-safety-head", ".py-tips > li", ".py-safety > .py-verify", ".py-bbps",
    ".rv-calc", ".up-article-figure", ".rv-article > section", ".rv-article > aside",
    ".wa-follow:not(.hm-follow)", // the home page has its own scroll-linked reveal
  ];
  const fold = innerHeight;
  const targets = [...new Set(document.querySelectorAll(selectors.join(",")))]
    .filter((el) => el.getBoundingClientRect().top > fold);
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
      const el = entry.target;
      observer.unobserve(el);
      el.style.setProperty("--mo-delay", `${Math.min(index, 4) * 60}ms`);
      el.classList.add("is-in");
      const done = (event) => {
        if (event.target !== el || event.propertyName !== "opacity") return;
        el.removeEventListener("transitionend", done);
        el.classList.remove("mo-reveal", "is-in");
        el.style.removeProperty("--mo-delay");
      };
      el.addEventListener("transitionend", done);
    });
  }, { rootMargin: "0px 0px -8% 0px" });

  targets.forEach((el) => {
    el.classList.add("mo-reveal");
    observer.observe(el);
  });
})();
