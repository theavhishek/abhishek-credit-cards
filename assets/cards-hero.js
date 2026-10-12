// Hero deck: three photo cards. Tap, click or Enter deals the front card to
// the back of the deck; the place caption, dots and background glow follow.
// The front card also tilts toward a fine pointer. Motion respects
// prefers-reduced-motion (cards then swap with a short fade).
(() => {
  const stage = document.querySelector(".ch-stage");
  const deck = stage?.querySelector(".ch-deck");
  if (!stage || !deck) return;

  const cards = [...deck.querySelectorAll(".ch-card")];
  const total = cards.length;
  const placeText = stage.querySelector(".ch-place-text");
  const dots = [...stage.querySelectorAll(".ch-dots span")];
  const ambient = stage.querySelector(".ch-ambient");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canTilt = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  const ease = "cubic-bezier(0.2, 0, 0, 1)";
  let busy = false;
  let frame = 0;

  // Card order is kept in the DOM order of `cards`; `order[0]` is in front.
  let order = cards.slice();
  const front = () => order[0];
  const indexOf = (card) => cards.indexOf(card); // 0-based photo number

  // The intro fan plays once; drop the class so later shuffles don't replay it.
  const endIntro = () => deck.classList.remove("is-intro");
  if (reduceMotion.matches) endIntro();
  else setTimeout(endIntro, 1300);

  const applyPositions = () => order.forEach((card, pos) => { card.dataset.pos = String(pos); });

  const describe = () => {
    const card = front();
    const n = indexOf(card) + 1;
    const place = card.dataset.place;
    deck.setAttribute("aria-label", `Photo ${n} of ${total}: Abhishek at ${place}. Show the next photo.`);
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === n - 1));
    return place;
  };

  const swapCaption = (place) => {
    if (!placeText) return;
    if (reduceMotion.matches || !placeText.animate) { placeText.textContent = place; return; }
    const out = placeText.animate(
      [{ opacity: 1, transform: "translateY(0)", filter: "blur(0)" },
       { opacity: 0, transform: "translateY(-6px)", filter: "blur(2px)" }],
      { duration: 160, easing: "ease-in", fill: "forwards" });
    out.onfinish = () => {
      placeText.textContent = place;
      placeText.animate(
        [{ opacity: 0, transform: "translateY(6px)", filter: "blur(2px)" },
         { opacity: 1, transform: "translateY(0)", filter: "blur(0)" }],
        { duration: 280, easing: ease });
      out.cancel();
    };
  };

  const swapAmbient = () => {
    if (!ambient) return;
    const url = front().dataset.ambient;
    if (!url) return;
    ambient.classList.add("is-swapping");
    setTimeout(() => {
      ambient.style.backgroundImage = `url("${url}")`;
      ambient.classList.remove("is-swapping");
    }, 200);
  };

  const resetTilt = (card) => {
    card.classList.remove("is-tracking");
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    card.style.removeProperty("--sx");
    card.style.removeProperty("--sy");
  };

  const shuffle = () => {
    if (busy || total < 2) return;
    busy = true;
    endIntro();
    const outgoing = front();
    resetTilt(outgoing);
    stage.classList.remove("is-tilting");

    order = [...order.slice(1), outgoing];

    if (reduceMotion.matches || !outgoing.animate) {
      // Quick fade instead of movement.
      deck.animate?.([{ opacity: 1 }, { opacity: 0.4 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
      applyPositions();
      swapCaption(describe());
      swapAmbient();
      setTimeout(() => { busy = false; }, 260);
      return;
    }

    // Lift the front card out to the side, then tuck it in at the back.
    const start = { rotate: "0deg", translate: "0px 0px", scale: "1", filter: "brightness(1) saturate(1)" };
    outgoing.style.transition = "none";
    applyPositions(); // others glide forward via their CSS transitions
    const endStyle = getComputedStyle(outgoing);
    const end = { rotate: endStyle.rotate === "none" ? "0deg" : endStyle.rotate,
                  translate: endStyle.translate === "none" ? "0px 0px" : endStyle.translate,
                  scale: "1",
                  filter: endStyle.filter === "none" ? "brightness(1) saturate(1)" : endStyle.filter };
    const wide = deck.getBoundingClientRect().width;
    const lift = { rotate: "-14deg", translate: `${Math.round(-wide * 0.62)}px ${Math.round(-wide * 0.05)}px`, scale: "1.02", filter: "brightness(1) saturate(1)" };

    // Keep the outgoing card on top while it travels out, then send it back.
    outgoing.style.zIndex = "4";
    const anim = outgoing.animate(
      [{ ...start, offset: 0, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
       { ...lift, offset: 0.45, easing: "cubic-bezier(0.25, 0, 0.1, 1)" },
       { ...end, offset: 1 }],
      { duration: 760 });
    setTimeout(() => { outgoing.style.zIndex = ""; }, 760 * 0.45);

    swapCaption(describe());
    swapAmbient();

    anim.onfinish = anim.oncancel = () => {
      outgoing.style.transition = "";
      busy = false;
    };
  };

  deck.addEventListener("click", shuffle);

  // Pointer tilt on whichever card is in front.
  stage.addEventListener("pointermove", (event) => {
    if (!canTilt.matches || busy) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const card = front();
      const box = deck.getBoundingClientRect();
      const x = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
      const y = Math.min(Math.max((event.clientY - box.top) / box.height, 0), 1);
      card.classList.add("is-tracking");
      stage.classList.add("is-tilting");
      card.style.setProperty("--ry", `${((x - 0.5) * 14).toFixed(2)}deg`);
      card.style.setProperty("--rx", `${((0.5 - y) * 14).toFixed(2)}deg`);
      card.style.setProperty("--sx", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--sy", `${(y * 100).toFixed(1)}%`);
    });
  });
  stage.addEventListener("pointerleave", () => {
    cancelAnimationFrame(frame);
    stage.classList.remove("is-tilting");
    resetTilt(front());
  });

  // Warm the cache for the back photos at full size once the page is idle.
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
  idle(() => cards.slice(1).forEach((card) => card.querySelector("img")?.decode?.().catch(() => {})));
})();
