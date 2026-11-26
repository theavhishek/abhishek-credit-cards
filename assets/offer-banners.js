// Card offers rows (homepage section and the band on other pages): arrow buttons scroll by one banner and
// show only when the row overflows. Markup comes from scripts/offers/build.mjs.
(() => {
  document.querySelectorAll("[data-ofs]").forEach((box) => {
    const row = box.querySelector(".ofs-row");
    const wrap = box.querySelector("[data-ofs-btns]");
    if (!row || !wrap) return;
    const [prev, next] = wrap.querySelectorAll("button");
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
    [prev, next].forEach((button) => button.addEventListener("click", () => {
      row.scrollBy({ left: Number(button.dataset.dir) * step() });
    }));
    row.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  });
})();
