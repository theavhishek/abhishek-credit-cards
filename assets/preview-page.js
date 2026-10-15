// Pre-launch preview estimators.
// data-calc="discount": an eligible-spend discount rate, optional monthly cap (data-cap), less a joining fee (data-fee).
// data-calc="cashback": the advertised top cashback rate (data-rate), with a half-rate comparison.
// The calculator reads optional cap and fee-verification data from each page.
(() => {
  const calc = document.querySelector('.rv-calc[data-calc="discount"], .rv-calc[data-calc="cashback"]');
  if (!calc) return;

  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const money = (value) => inr.format(Math.round(value));

  const mode = calc.dataset.calc;
  const rate = Number(calc.dataset.rate) || 0.1;
  const fee = Number(calc.dataset.fee) || 0;
  const cap = Number(calc.dataset.cap) || 0;
  const feeConfirmed = calc.dataset.feeConfirmed === "true";
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
    if (spend === 0) return cap > 0
      ? `Move the slider to estimate eligible 10% discounts, capped at ${money(cap)} per month.`
      : "Move the slider to see what an uncapped discount would be worth.";
    const feeLabel = feeConfirmed ? "first-year joining fee" : "rumoured annual fee";
    const feeLine = yearly >= fee
      ? `This illustrative return would cover the ${feeLabel} of ${money(fee)}. At the assumed rate, it takes about ${money(breakEven)} monthly eligible spend before restrictions.`
      : `This illustrative return would not cover the ${feeLabel} of ${money(fee)}. At the assumed rate, it takes about ${money(breakEven)} monthly eligible spend before restrictions.`;
    return `${feeLine} ${cap > 0 ? `The ${money(cap)} shared monthly discount limit is included.` : "Actual limits may reduce savings."} Category exclusions, minimum orders and offer stacking could reduce it further.`;
  };

  const update = () => {
    const spend = Number(input.value);
    const monthly = mode === "discount" && cap > 0 ? Math.min(spend * rate, cap) : spend * rate;
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
