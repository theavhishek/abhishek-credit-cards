// Update article fee calculator: each slider shows the fee once the amount passes its threshold.
// The build (scripts/updates/build.mjs) renders the same maths and wording for the starting values.
(() => {
  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const rupees = (n) => inr.format(Math.round(n));

  document.querySelectorAll(".up-calc-row").forEach((row) => {
    const input = row.querySelector("input[type=range]");
    const out = row.querySelector("output");
    const fill = row.querySelector(".up-calc-fill");
    const feeEl = row.querySelector(".up-calc-fee strong");
    const why = row.querySelector(".up-calc-why");
    const gst = row.querySelector(".up-calc-gst");
    const threshold = Number(row.dataset.threshold);
    const rate = Number(row.dataset.rate);
    const cap = row.dataset.cap ? Number(row.dataset.cap) : Infinity;
    const chargedOn = row.dataset.chargedOn;
    const max = Number(input.max);

    const update = () => {
      const amount = Number(input.value);
      const fee = amount > threshold ? Math.min(amount * rate / 100, cap) : 0;
      out.value = rupees(amount);
      out.textContent = rupees(amount);
      input.setAttribute("aria-valuetext", rupees(amount));
      fill.style.inlineSize = `${(amount / max) * 100}%`;
      row.toggleAttribute("data-over", fee > 0);
      feeEl.textContent = rupees(fee);
      if (gst) gst.hidden = !fee;
      why.textContent = fee
        ? `${rate}% of ${rupees(amount)}, charged on ${chargedOn}${fee === cap ? `, capped at ${rupees(cap)}` : ""}.`
        : `No fee up to ${rupees(threshold)}.`;
    };
    input.addEventListener("input", update);
  });
})();
