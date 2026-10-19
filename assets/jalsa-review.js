// RBL Jalsa review: cashback calculator and the fees tab panels.
// Cashback: 5% on the nine partner apps, at most ₹50 per order and ₹500 per calendar month.
// Vouchers: ₹1,000 welcome (first year) and ₹500 at ₹3 lakh of yearly spend, each redeemed for ₹99 + GST.
(() => {
  const calc = document.querySelector('.rv-calc[data-calc="jalsa"]');
  if (!calc) return;

  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const money = (value) => inr.format(Math.round(value));
  const signed = (value) => (value < 0 ? `−${money(-value)}` : money(value));
  const group = new Intl.NumberFormat("en-IN");
  const num = (key) => Number(calc.dataset[key]) || 0;
  const fee = num("fee");
  const redeemFee = num("redeemFee");
  const welcome = num("welcome");
  const milestone = num("milestone");
  const milestoneAt = num("milestoneAt");
  const RATE = 0.05;
  const PER_ORDER = 50;
  const MONTH_CAP = 500;

  const rows = Object.fromEntries([...calc.querySelectorAll(".ec-row")].map((row) => [row.dataset.key, {
    input: row.querySelector("input"),
    result: row.querySelector(".ec-result"),
  }]));
  const pools = Object.fromEntries([...calc.querySelectorAll(".ec-pool")].map((el) => [el.dataset.pool, {
    cap: Number(el.dataset.cap),
    amt: el.querySelector(".ec-pool-amt"),
    bar: el.querySelector(".ec-bar span"),
    note: el.querySelector(".ec-pool-note"),
    el,
  }]));
  const totalEl = calc.querySelector("#jc-total");
  const y1El = calc.querySelector("#jc-y1");
  const y2El = calc.querySelector("#jc-y2");
  const breakEl = calc.querySelector("#jc-break");
  const presets = [...calc.querySelectorAll("[data-preset]")];

  const parse = (value) => {
    const n = Number(String(value).replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? Math.min(n, 9999999) : 0;
  };
  const setPool = (p, value, label, note) => {
    p.amt.innerHTML = label;
    p.bar.style.inlineSize = `${Math.min(value / p.cap, 1) * 100}%`;
    p.el.dataset.full = String(value >= p.cap && value > 0);
    p.note.textContent = note;
  };

  const update = () => {
    const apps = parse(rows.apps.input.value);
    const order = parse(rows.order.input.value);
    const other = parse(rows.other.input.value);

    // Each order earns 5%, up to ₹50; with a typical order size, that's the effective rate on all app spend.
    const rate = order > PER_ORDER / RATE ? PER_ORDER / order : RATE;
    const earned = apps * rate;
    const monthly = Math.min(earned, MONTH_CAP);
    const lost = earned - monthly;

    rows.apps.result.innerHTML = apps ? `<strong>${money(earned)}</strong> cashback` : "5% cashback";
    rows.order.result.innerHTML = order
      ? `<strong>${money(Math.min(order * RATE, PER_ORDER))}</strong> an order`
      : "₹50 max an order";
    rows.other.result.textContent = other ? "No cashback" : "0% cashback";

    setPool(pools.month, monthly, `<strong>${money(monthly)}</strong> of ${money(MONTH_CAP)}`,
      lost > 0 ? `Cap reached: ${money(lost)} more is lost this month.`
        : earned > 0 ? `${money(MONTH_CAP - monthly)} left before the cap.` : "Nothing entered yet.");

    const yearSpend = (apps + other) * 12;
    const hit = yearSpend >= milestoneAt;
    setPool(pools.milestone, yearSpend, `<strong>${money(yearSpend)}</strong> a year`,
      hit ? `Milestone reached: a ${money(milestone)} voucher.`
        : `${money(milestoneAt - yearSpend)} short of the ${money(milestone)} voucher.`);

    const cashbackYear = monthly * 12;
    const milestoneNet = hit ? milestone - redeemFee : 0;
    const first = cashbackYear + (welcome - redeemFee) + milestoneNet - fee;
    const later = cashbackYear + milestoneNet - fee;

    totalEl.textContent = money(monthly);
    y1El.textContent = signed(first);
    y2El.textContent = signed(later);
    breakEl.innerHTML = `First year: <strong>${money(cashbackYear)}</strong> cashback + ${money(welcome)} welcome voucher` +
      (hit ? ` + ${money(milestone)} milestone voucher` : "") +
      ` − ${money(redeemFee * (hit ? 2 : 1))} redemption ${hit ? "fees" : "fee"} − ${money(fee)} annual fee.`;
  };

  const tidy = (input) => {
    const n = parse(input.value);
    input.value = n ? group.format(n) : "";
  };

  for (const r of Object.values(rows)) {
    r.input.addEventListener("input", () => {
      presets.forEach((b) => b.setAttribute("aria-pressed", "false"));
      update();
    });
    r.input.addEventListener("blur", () => tidy(r.input));
  }

  const order = ["apps", "order", "other"];
  for (const button of presets) {
    button.addEventListener("click", () => {
      const values = button.dataset.preset.split(",").map(Number);
      order.forEach((key, i) => { rows[key].input.value = values[i] ? group.format(values[i]) : ""; });
      presets.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      update();
    });
  }

  Object.values(rows).forEach((r) => tidy(r.input));
  update();
})();

// Fees: one panel at a time once the script runs; without it, all three panels show in full.
(() => {
  const section = document.querySelector(".rv-fees");
  if (!section) return;
  const buttons = [...section.querySelectorAll(".jl-tabs button[data-panel]")];
  const panels = [...section.querySelectorAll("[data-fee-panel]")];
  const show = (id) => {
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.panel === id)));
    panels.forEach((p) => { p.hidden = p.id !== id; });
  };
  buttons.forEach((b) => b.addEventListener("click", () => show(b.dataset.panel)));
  section.classList.add("is-tabbed");
  show(buttons.find((b) => b.getAttribute("aria-pressed") === "true")?.dataset.panel || panels[0].id);
})();
