// Update article credit limit checker: the FD slider shows the limit (ratio % of the FD, up to each
// card's max) and which cards that FD qualifies for. scripts/updates/build.mjs renders the same
// maths and wording for the starting value.
(() => {
  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const rupees = (n) => inr.format(Math.round(n));

  document.querySelectorAll(".up-limit[data-limit]").forEach((box) => {
    const ratio = Number(box.dataset.ratio);
    const input = box.querySelector("input[type=range]");
    const out = box.querySelector("output");
    const fill = box.querySelector(".up-calc-fill");
    const total = box.querySelector(".up-limit-total");
    const why = box.querySelector(".up-calc-why");
    const rows = [...box.querySelectorAll(".up-limit-cards li")];
    const min = Number(input.min);
    const max = Number(input.max);

    const update = () => {
      const fd = Number(input.value);
      const limit = Math.floor(fd * ratio / 100);
      out.value = rupees(fd);
      out.textContent = rupees(fd);
      input.setAttribute("aria-valuetext", rupees(fd));
      fill.style.inlineSize = `${((fd - min) / (max - min)) * 100}%`;
      total.textContent = rupees(limit);
      let n = 0;
      rows.forEach((li) => {
        const minFd = Number(li.dataset.minFd);
        const maxLimit = Number(li.dataset.maxLimit);
        const ok = fd >= minFd;
        if (ok) n += 1;
        li.toggleAttribute("data-ok", ok);
        li.querySelector(".up-limit-val").textContent = ok
          ? `${rupees(Math.min(limit, maxLimit))}${limit > maxLimit ? " (card max)" : ""}`
          : `Add ${rupees(minFd - fd)} to your FD`;
      });
      why.textContent = n
        ? `${ratio}% of your FD. You can apply for ${n} of ${rows.length} cards.`
        : `${ratio}% of your FD, but it's below every card's minimum.`;
    };
    input.addEventListener("input", update);
  });
})();
