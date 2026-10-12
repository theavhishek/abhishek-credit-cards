// Mark the WhatsApp follow panel once it scrolls into view, so its button
// glow plays when someone can actually see it (CSS limits it to 3 pulses).
(() => {
  const panels = document.querySelectorAll(".wa-follow");
  if (!panels.length) return;
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-seen");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  panels.forEach((panel) => observer.observe(panel));
})();
