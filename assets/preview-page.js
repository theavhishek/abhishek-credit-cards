// Pre-launch preview: "what 10% could be worth" estimator.
// Assumes the advertised 10% applies with no cap, as stated on the page.
(() => {
  const calc = document.querySelector('.rv-calc[data-calc="discount"]');
  if (!calc) return;

  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const money = (value) => inr.format(Math.round(value));

  const rate = 0.1;
  const fee = Number(calc.dataset.fee) || 0;       // rumoured annual fee including GST
  const input = calc.querySelector("#est-spend");
  const max = Number(input.max) || 10000;
  const out = calc.querySelector("#est-spend-out");
  const bar = calc.querySelector("#est-bar");
  const monthEl = calc.querySelector("#est-month");
  const yearEl = calc.querySelector("#est-year");
  const netEl = calc.querySelector("#est-net");
  const note = calc.querySelector("#est-note");
  const breakEven = fee / rate / 12;                // monthly spend that covers the fee
  let timer;

  const describe = (spend, yearly) => {
    if (spend === 0) return "Move the slider to see what an uncapped 10% would be worth.";
    const feeLine = yearly >= fee
      ? `That would cover the rumoured fee of ${money(fee)} a year, which takes about ${money(breakEven)} a month of eligible spend.`
      : `That would not cover the rumoured fee of ${money(fee)} a year. You would need about ${money(breakEven)} a month of eligible spend.`;
    return `${feeLine} A monthly discount cap, if SBI sets one, would lower these numbers.`;
  };

  const update = () => {
    const spend = Number(input.value);
    const monthly = spend * rate;
    const yearly = monthly * 12;
    const net = yearly - fee;

    out.value = money(spend);
    out.textContent = money(spend);
    input.setAttribute("aria-valuetext", `${money(spend)} a month`);
    bar.style.inlineSize = `${(spend / max) * 100}%`;
    monthEl.textContent = money(monthly);
    yearEl.textContent = money(yearly);
    netEl.textContent = net < 0 ? `−${money(-net)}` : money(net);

    clearTimeout(timer);
    timer = setTimeout(() => { note.textContent = describe(spend, yearly); }, 350);
  };

  input.hidden = false;
  input.addEventListener("input", update);
  update();
})();
