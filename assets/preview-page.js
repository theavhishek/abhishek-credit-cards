// Pre-launch preview estimators.
// data-calc="discount": the advertised discount rate, less a rumoured annual fee (data-fee).
// data-calc="cashback": the advertised top cashback rate (data-rate), with a half-rate comparison.
// Both assume no cap, as stated on each page.
(() => {
  const calc = document.querySelector('.rv-calc[data-calc="discount"], .rv-calc[data-calc="cashback"]');
  if (!calc) return;

  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const money = (value) => inr.format(Math.round(value));

  const mode = calc.dataset.calc;
  const rate = Number(calc.dataset.rate) || 0.1;
  const fee = Number(calc.dataset.fee) || 0;
  const input = calc.querySelector("#est-spend");
  const max = Number(input.max) || 10000;
  const out = calc.querySelector("#est-spend-out");
  const bar = calc.querySelector("#est-bar");
  const monthEl = calc.querySelector("#est-month");
  const yearEl = calc.querySelector("#est-year");
  const netEl = calc.querySelector("#est-net");
  const note = calc.querySelector("#est-note");
  const breakEven = fee / rate / 12;
  let timer;

  const describe = (spend, yearly) => {
    if (mode === "cashback") {
      if (spend === 0) return "Move the slider to see what the advertised cashback could be worth.";
      return `At the full ${rate * 100}%, that’s ${money(yearly)} a year, and with no annual fee all of it would be yours to keep. Caps or excluded categories, such as tax or GST payments, would lower these numbers.`;
    }
    if (spend === 0) return "Move the slider to see what an uncapped discount would be worth.";
    const feeLine = yearly >= fee
      ? `That would cover the rumoured fee of ${money(fee)} a year, which takes about ${money(breakEven)} a month of eligible spend.`
      : `That would not cover the rumoured fee of ${money(fee)} a year. You would need about ${money(breakEven)} a month of eligible spend.`;
    return `${feeLine} A monthly discount cap, if SBI sets one, would lower these numbers.`;
  };

  const update = () => {
    const spend = Number(input.value);
    const monthly = spend * rate;
    const yearly = monthly * 12;
    const third = mode === "cashback" ? yearly / 2 : yearly - fee;

    out.value = money(spend);
    out.textContent = money(spend);
    input.setAttribute("aria-valuetext", `${money(spend)} a month`);
    bar.style.inlineSize = `${(spend / max) * 100}%`;
    monthEl.textContent = money(monthly);
    yearEl.textContent = money(yearly);
    netEl.textContent = third < 0 ? `−${money(-third)}` : money(third);

    clearTimeout(timer);
    timer = setTimeout(() => { note.textContent = describe(spend, yearly); }, 350);
  };

  input.hidden = false;
  input.addEventListener("input", update);
  update();
})();
