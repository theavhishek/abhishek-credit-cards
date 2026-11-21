// Kotak × Zepto credit card cashback calculator.
// Rows carry data-rate (0.1 = 10%) and data-pool. Pools with data-cap share that monthly cap;
// a pool without a cap ("zepto") is counted in full, since Kotak hasn't published one.
// Zepto Club adds 5% on Zepto orders, outside the card's caps. The PVR INOX ticket (up to ₹250)
// needs ₹5,000 of spend in the month. Figures come from the in-app launch details, not a T&C.
(() => {
  const calc = document.querySelector('.rv-calc[data-calc="zepto"]');
  if (!calc) return;

  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const money = (value) => inr.format(Math.round(value));
  const group = new Intl.NumberFormat("en-IN");
  const fee = Number(calc.dataset.fee) || 0;
  const waiverAt = Number(calc.dataset.waiver) || 0;
  const ticket = Number(calc.dataset.ticket) || 0;
  const ticketAt = Number(calc.dataset.ticketAt) || 0;
  const clubRate = Number(calc.dataset.club) || 0;

  const rows = [...calc.querySelectorAll(".ec-row")].map((row) => ({
    input: row.querySelector("input"),
    rate: Number(row.dataset.rate),
    pool: row.dataset.pool,
    result: row.querySelector(".ec-result"),
  }));
  const pools = Object.fromEntries([...calc.querySelectorAll(".ec-pool")].map((el) => [el.dataset.pool, {
    cap: Number(el.dataset.cap) || 0,
    amt: el.querySelector(".ec-pool-amt"),
    bar: el.querySelector(".ec-bar span"),
    note: el.querySelector(".ec-pool-note"),
    el,
  }]));
  const club = calc.querySelector("#zc-club");
  const movie = calc.querySelector("#zc-movie");
  const totalEl = calc.querySelector("#zc-total");
  const clubEl = calc.querySelector("#zc-club-amt");
  const ticketEl = calc.querySelector("#zc-ticket");
  const yearEl = calc.querySelector("#zc-year");
  const netEl = calc.querySelector("#zc-net");
  const waiverEl = calc.querySelector("#zc-waiver");
  const presets = [...calc.querySelectorAll("[data-preset]")];

  const parse = (value) => {
    const n = Number(String(value).replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? Math.min(n, 9999999) : 0;
  };

  const update = () => {
    const raw = {};
    let spend = 0;
    let zepto = 0;
    for (const r of rows) {
      const amount = parse(r.input.value);
      const earned = amount * r.rate;
      spend += amount;
      if (r.pool === "zepto") zepto += amount;
      raw[r.pool] = (raw[r.pool] || 0) + earned;
      r.result.innerHTML = amount
        ? `<strong>${money(earned)}</strong> cashback`
        : `${r.rate * 100}% cashback`;
    }

    let cashback = 0;
    for (const [key, p] of Object.entries(pools)) {
      const earned = raw[key] || 0;
      if (!p.cap) {
        cashback += earned;
        p.amt.innerHTML = `<strong>${money(earned)}</strong>`;
        p.note.textContent = earned > 0 ? "No cap published yet. Counted in full." : "Nothing entered yet.";
        continue;
      }
      const kept = Math.min(earned, p.cap);
      const over = earned - kept;
      cashback += kept;
      p.amt.innerHTML = `<strong>${money(kept)}</strong> of ${money(p.cap)}`;
      p.bar.style.inlineSize = `${Math.min(kept / p.cap, 1) * 100}%`;
      p.el.dataset.full = String(earned >= p.cap && earned > 0);
      p.note.textContent = over > 0
        ? `Cap reached: ${money(over)} more is lost this month.`
        : earned > 0 ? `${money(p.cap - kept)} left before the cap.` : "Nothing entered yet.";
    }

    const clubBack = club.checked ? zepto * clubRate : 0;
    const gotTicket = movie.checked && spend >= ticketAt;
    const ticketBack = gotTicket ? ticket : 0;
    const monthly = cashback + clubBack + ticketBack;
    const yearly = monthly * 12;
    const annualSpend = spend * 12;
    const feeDue = annualSpend >= waiverAt ? 0 : fee;
    const net = yearly - feeDue;

    totalEl.textContent = money(monthly);
    clubEl.textContent = club.checked ? money(clubBack) : "Not counted";
    ticketEl.textContent = !movie.checked ? "Not counted"
      : gotTicket ? money(ticketBack)
      : `Spend ${money(ticketAt - spend)} more`;
    yearEl.textContent = money(yearly);
    netEl.textContent = net < 0 ? `−${money(-net)}` : money(net);

    waiverEl.innerHTML = annualSpend >= waiverAt
      ? `At about <strong>${money(annualSpend)}</strong> a year, you cross the ${money(waiverAt)} that waives the ${money(fee)} annual fee.`
      : `At about <strong>${money(annualSpend)}</strong> a year, you’re ${money(waiverAt - annualSpend)} short of the ${money(waiverAt)} that waives the ${money(fee)} annual fee, so it’s taken off above.`;
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
  club.addEventListener("change", update);
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
