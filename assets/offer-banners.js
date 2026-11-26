// Card offers row on the homepage: arrow buttons scroll by one banner; they show only when the row overflows.
(() => {
  const row = document.getElementById("hm-offers");
  const wrap = document.querySelector(".hm-offers .hm-scroll-btns");
  if (!row || !wrap) return;
  const [prev, next] = wrap.querySelectorAll(".hm-scroll-btn");
  const step = () => {
    const item = row.querySelector("li");
    return item ? item.getBoundingClientRect().width + parseFloat(getComputedStyle(row).columnGap || "0") : row.clientWidth;
  };
  const sync = () => {
    const max = row.scrollWidth - row.clientWidth;
    wrap.hidden = max <= 2;
    prev.disabled = row.scrollLeft <= 2;
    next.disabled = row.scrollLeft >= max - 2;
  };
  [prev, next].forEach(button => button.addEventListener("click", () => {
    row.scrollBy({ left: Number(button.dataset.dir) * step() });
  }));
  row.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  sync();
})();
