// Swiggy HDFC Ornge vs BLCK: cashback calculator and the fees tab panels.
// From HDFC Bank's combined Ornge and BLCK terms (15 Oct 2026):
//   Ornge: 5% on Swiggy + select online, one ₹1,500 cap per billing cycle; 1% elsewhere, ₹1,000 cap.
//   BLCK: 10% on Swiggy, ₹1,500 cap; 5% on select online, its own ₹1,500 cap; 1% elsewhere, ₹1,000 cap.
// Fees (incl. 18% GST): Ornge ₹590, renewal waived at ₹1.5 lakh a year.
//   BLCK ₹1,180, joining fee waived at ₹75,000 in 90 days, renewal waived at ₹2 lakh a year.
(() => {
  const calc = document.querySelector('.rv-calc[data-calc="swiggy"]');
  if (!calc) return;

  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const money = (value) => inr.format(Math.round(value));
  const signed = (value) => (value < 0 ? `−${money(-value)}` : money(value));
  const group = new Intl.NumberFormat("en-IN");

  const ORNGE_FEE = 590;
  const BLCK_FEE = 1180;
  const ORNGE_WAIVER = 150000;
  const BLCK_WAIVER = 200000;
  const BLCK_JOINING_WAIVER = 75000; // in the first 90 days, so three months of spend here

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
  const $ = (id) => calc.querySelector("#" + id);
  const out = {
    ornge: { total: $("sc-ornge"), y1: $("sc-ornge-y1"), y2: $("sc-ornge-y2") },
    blck: { total: $("sc-blck"), y1: $("sc-blck-y1"), y2: $("sc-blck-y2") },
  };
  const verdictEl = $("sc-verdict");
  const presets = [...calc.querySelectorAll("[data-preset]")];

  const parse = (value) => {
    const n = Number(String(value).replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? Math.min(n, 9999999) : 0;
  };
  const setPool = (p, earned) => {
    const used = Math.min(earned, p.cap);
    const lost = earned - used;
    p.amt.innerHTML = `<strong>${money(used)}</strong> of ${money(p.cap)}`;
    p.bar.style.inlineSize = `${Math.min(earned / p.cap, 1) * 100}%`;
    p.el.dataset.full = String(earned >= p.cap && earned > 0);
    p.note.textContent = lost > 0 ? `Cap reached: ${money(lost)} more is lost each month.`
      : earned > 0 ? `${money(p.cap - used)} left before the cap.` : "Nothing entered yet.";
    return used;
  };

  const update = () => {
    const swiggy = parse(rows.swiggy.input.value);
    const online = parse(rows.online.input.value);
    const other = parse(rows.other.input.value);

    rows.swiggy.result.innerHTML = swiggy ? `<strong>${money(swiggy * 0.05)}</strong> / <strong>${money(swiggy * 0.1)}</strong>` : "5% / 10%";
    rows.online.result.innerHTML = online ? `<strong>${money(online * 0.05)}</strong> on both` : "5% on both";
    rows.other.result.innerHTML = other ? `<strong>${money(other * 0.01)}</strong> on both` : "1% on both";

    const orngeFive = setPool(pools.ornge5, (swiggy + online) * 0.05);
    const blckTen = setPool(pools.blck10, swiggy * 0.1);
    const blckFive = setPool(pools.blck5, online * 0.05);
    const one = setPool(pools.one, other * 0.01);

    const month = swiggy + online + other;
    const year = month * 12;
    const orngeMonth = orngeFive + one;
    const blckMonth = blckTen + blckFive + one;

    const orngeY1 = orngeMonth * 12 - ORNGE_FEE;
    const orngeY2 = orngeMonth * 12 - (year >= ORNGE_WAIVER ? 0 : ORNGE_FEE);
    const blckY1 = blckMonth * 12 - (month * 3 >= BLCK_JOINING_WAIVER ? 0 : BLCK_FEE);
    const blckY2 = blckMonth * 12 - (year >= BLCK_WAIVER ? 0 : BLCK_FEE);

    out.ornge.total.textContent = money(orngeMonth);
    out.ornge.y1.textContent = signed(orngeY1);
    out.ornge.y2.textContent = signed(orngeY2);
    out.blck.total.textContent = money(blckMonth);
    out.blck.y1.textContent = signed(blckY1);
    out.blck.y2.textContent = signed(blckY2);

    if (!month) {
      verdictEl.textContent = "Enter your monthly spends to compare the two cards.";
      return;
    }
    const diff = blckY2 - orngeY2;
    const lead = Math.abs(diff) < 1 ? "<strong>It’s a tie</strong> on these numbers from year two."
      : diff > 0 ? `<strong>BLCK pays ${money(diff)} more a year</strong> from year two, after fees.`
        : `<strong>Ornge pays ${money(-diff)} more a year</strong> from year two, after fees.`;
    const waivers = [
      year >= ORNGE_WAIVER ? "Ornge renewal waived" : `Ornge needs ${money(ORNGE_WAIVER - year)} more a year for a free renewal`,
      year >= BLCK_WAIVER ? "BLCK renewal waived" : `BLCK needs ${money(BLCK_WAIVER - year)} more`,
    ];
    verdictEl.innerHTML = `${lead} ${waivers.join("; ")}.`;
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

  const order = ["swiggy", "online", "other"];
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

// Fees: one panel at a time once the script runs; without it, all panels show in full.
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
