// Homepage "Latest reviews": a pinned stack of review cards driven by scroll.
// Cards slide up into a stack (each one PEEK px lower and a little smaller than
// the one in front). Then the front card flies out top-left and the cards behind
// move forward one place, until only the last card is left.
// Plain JS with a sticky stage (no scroll library). Styles: assets/review-stack.css.
// Skipped when the visitor prefers reduced motion (the sideways row stays).
(() => {
  const section = document.querySelector(".hm-latest.is-stack");
  if (!section) return;
  const track = section.querySelector(".hm-stack-track");
  const stage = section.querySelector(".hm-stack-stage");
  const list = section.querySelector(".hm-reviews");
  const cards = list ? Array.from(list.children) : [];
  if (!track || !stage || cards.length < 2) {
    section.classList.remove("is-stack");
    return;
  }

  const N = cards.length;
  const DEPTH = 3; // cards drawn behind the front one; deeper ones wait out of sight
  const RISE = 1.35; // timeline units for one card to rise into the stack
  const STAGGER = 0.06;
  const FLY_AT = RISE + (N - 1) * STAGGER + 0.35;
  const TOTAL = FLY_AT + (N - 1) + 0.4;

  let peek = 42;
  let scaleStep = 0.045;
  let stageH = 0;
  let start = 0;
  let perUnit = 1;
  let front = -1;
  let queued = false;
  const last = cards.map(() => "");

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  // Resting pose for a card `p` places behind the front (p may be fractional).
  const pose = (p) => {
    const d = Math.min(p, DEPTH);
    return { y: d * peek, s: 1 - d * scaleStep, o: clamp(DEPTH + 1 - p, 0, 1) };
  };

  const measure = () => {
    const css = getComputedStyle(section);
    peek = parseFloat(css.getPropertyValue("--stack-peek")) || 42;
    scaleStep = parseFloat(css.getPropertyValue("--stack-scale")) || 0.045;
    stageH = window.innerHeight;
    // One timeline unit is about half a screen of scrolling (a bit less on phones).
    perUnit = stageH * (window.innerWidth < 720 ? 0.48 : 0.55);
    const lead = stageH * 0.5; // the stack starts rising while the section scrolls in
    const range = TOTAL * perUnit;
    track.style.height = Math.round(stageH + range - lead) + "px";
    start = track.getBoundingClientRect().top + window.scrollY - lead;
  };

  const apply = (i, y, s, r, o) => {
    const key = y.toFixed(1) + "|" + s.toFixed(4) + "|" + r.toFixed(2) + "|" + o.toFixed(2);
    if (key === last[i]) return;
    last[i] = key;
    const el = cards[i];
    el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0) rotate(" + r.toFixed(2) + "deg) scale(" + s.toFixed(4) + ")";
    el.style.opacity = o >= 1 ? "" : o.toFixed(2);
  };

  const render = () => {
    queued = false;
    const t = clamp((window.scrollY - start) / perUnit, 0, TOTAL);
    let nextFront = 0;

    if (t < FLY_AT) {
      // Phase 1: rise from below the stage into the stack.
      for (let i = 0; i < N; i++) {
        const k = easeOut(clamp((t - i * STAGGER) / RISE, 0, 1));
        const to = pose(i);
        const fromY = stageH * 0.72 + i * peek;
        apply(i, lerp(fromY, to.y, k), lerp(to.s * 0.9, to.s, k), 0, i > DEPTH ? 0 : 1);
      }
    } else {
      // Phase 2: the front card flies out, the rest move up one place.
      const u = Math.min(t - FLY_AT, N - 1);
      const k = Math.min(Math.floor(u), N - 1);
      const f = k === N - 1 ? 0 : u - k;
      nextFront = f > 0.5 ? k + 1 : k;
      for (let i = 0; i < N; i++) {
        if (i < k) {
          apply(i, -stageH * 1.15, 0.94, -25, 0);
        } else if (i === k && f > 0) {
          apply(i, lerp(0, -stageH * 1.15, f), lerp(1, 0.94, f), -25 * f, 1);
        } else {
          const p = pose(i - k - f);
          apply(i, p.y, p.s, 0, p.o);
        }
      }
    }

    if (nextFront !== front) {
      if (front >= 0) cards[front].classList.remove("is-front");
      cards[nextFront].classList.add("is-front");
      front = nextFront;
    }
  };

  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(render);
    }
  };

  cards.forEach((card, i) => { card.style.zIndex = String(N - i); });

  // Keyboard: tabbing to a card behind the front one scrolls until it is in front.
  list.addEventListener("focusin", (event) => {
    const i = cards.findIndex((card) => card.contains(event.target));
    if (i < 0 || i === front) return;
    const t = i === N - 1 ? TOTAL : FLY_AT + i;
    window.scrollTo({ top: start + t * perUnit, behavior: "instant" });
    render();
  });

  measure();
  render();
  window.addEventListener("scroll", queue, { passive: true });
  let width = window.innerWidth;
  window.addEventListener("resize", () => {
    // Phones fire resize when the address bar hides; only remeasure on real changes.
    if (window.innerWidth === width && Math.abs(window.innerHeight - stageH) < 120) return;
    width = window.innerWidth;
    measure();
    last.fill("");
    queue();
  });
  // Fonts and images above can shift the section; remeasure once everything is in.
  window.addEventListener("load", () => { measure(); queue(); });
})();
