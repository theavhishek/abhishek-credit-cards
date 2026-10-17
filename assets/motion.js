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
