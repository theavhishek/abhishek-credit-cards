// Eternal SBI Card cashback calculator.
// Each input row has data-rate (0.1 = 10%) and data-pool. Pools carry their monthly cap in data-cap.
// Movie offer: a booking discount of up to ₹200 on the second ticket, outside every cap.
(() => {
  const calc = document.querySelector('.rv-calc[data-calc="eternal"]');
  if (!calc) return;

  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const money = (value) => inr.format(Math.round(value));
  const fee = Number(calc.dataset.fee) || 0;
  const waiverAt = Number(calc.dataset.waiver) || 0;
  const movieCap = Number(calc.dataset.movieCap) || 0;

  const rows = [...calc.querySelectorAll(".ec-row")].map((row) => ({
    input: row.querySelector("input"),
    rate: Number(row.dataset.rate),
    pool: row.dataset.pool,
    kind: row.dataset.kind,
    result: row.querySelector(".ec-result"),
  }));
  const pools = Object.fromEntries([...calc.querySelectorAll(".ec-pool")].map((el) => [el.dataset.pool, {
    cap: Number(el.dataset.cap),
    amt: el.querySelector(".ec-pool-amt"),
    bar: el.querySelector(".ec-bar span"),
    note: el.querySelector(".ec-pool-note"),
    el,
  }]));
  const movie = calc.querySelector("#ec-movie");
  const totalEl = calc.querySelector("#ec-total");
  const yearEl = calc.querySelector("#ec-year");
  const netEl = calc.querySelector("#ec-net");
  const waiverEl = calc.querySelector("#ec-waiver");
  const presets = [...calc.querySelectorAll("[data-preset]")];

  const parse = (value) => {
    const n = Number(String(value).replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? Math.min(n, 9999999) : 0;
  };
  const group = new Intl.NumberFormat("en-IN");

  const update = () => {
    const raw = {};
    let spend = 0;
    for (const r of rows) {
      const amount = parse(r.input.value);
      const earned = amount * r.rate;
      spend += amount;
      raw[r.pool] = (raw[r.pool] || 0) + earned;
      r.result.innerHTML = amount
        ? `<strong>${money(earned)}</strong> ${r.kind === "discount" ? "off" : "cashback"}`
        : `${Math.round(r.rate * 100)}% ${r.kind === "discount" ? "off" : "cashback"}`;
    }

    let monthly = 0;
    for (const [key, p] of Object.entries(pools)) {
      const earned = raw[key] || 0;
      const kept = Math.min(earned, p.cap);
      const over = earned - kept;
      monthly += kept;
      p.amt.innerHTML = `<strong>${money(kept)}</strong> of ${money(p.cap)}`;
      p.bar.style.inlineSize = `${Math.min(kept / p.cap, 1) * 100}%`;
      p.el.dataset.full = String(earned >= p.cap && earned > 0);
      p.note.textContent = over > 0
        ? `Cap reached: ${money(over)} more is lost this month.`
        : earned > 0 ? `${money(p.cap - kept)} left before the cap.` : "Nothing entered yet.";
    }

    const movieSave = movie.checked ? movieCap : 0;
    monthly += movieSave;
    const yearly = monthly * 12;
    const net = yearly - fee;

    totalEl.textContent = money(monthly);
    yearEl.textContent = money(yearly);
    netEl.textContent = net < 0 ? `−${money(-net)}` : money(net);

    const annualSpend = spend * 12;
    waiverEl.innerHTML = annualSpend >= waiverAt
      ? `At about <strong>${money(annualSpend)}</strong> a year, you cross the ${money(waiverAt)} spend that waives the ₹499 renewal fee.`
      : `At about <strong>${money(annualSpend)}</strong> a year, you’re ${money(waiverAt - annualSpend)} short of the ${money(waiverAt)} spend that waives the ₹499 renewal fee.`;
  };

  const tidy = (input) => {
    const n = parse(input.value);
    input.value = n ? group.format(n) : "";
  };

  for (const r of rows) {
    r.input.addEventListener("input", () => {
      presets.forEach((b) => b.setAttribute("aria-pressed", "false"));
      update();
    });
    r.input.addEventListener("blur", () => tidy(r.input));
  }
  movie.addEventListener("change", update);

  for (const button of presets) {
    button.addEventListener("click", () => {
      const values = button.dataset.preset.split(",").map(Number);
      rows.forEach((r, i) => { r.input.value = values[i] ? group.format(values[i]) : ""; });
      presets.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      update();
    });
  }

  rows.forEach((r) => tidy(r.input));
  update();
})();
