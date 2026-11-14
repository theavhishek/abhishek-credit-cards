// PhonePe HDFC Ultimo vs Uno: reward points calculator and the fees tab panels.
// From HDFC Bank's reward point terms and FAQs (v2.2, 28 Jul 2026), caps per calendar month:
//   Ultimo: 10% on PhonePe categories (1,000 points), 5% on 7 online brands (500), 1% Scan & Pay (500).
//   Uno: 2% on PhonePe categories (500), 1% on online brands (500), 1% Scan & Pay (500).
//   No points on anything else. 1 point = ₹1 as statement cashback.
// Fees (incl. 18% GST): Ultimo ₹1,179, renewal waived at ₹2 lakh a year; Uno ₹589, at ₹1 lakh. No joining-fee waiver.
// Ultimo lounge: 2 visits a quarter after ₹75,000 spend in a calendar quarter.
(() => {
  const calc = document.querySelector('.rv-calc[data-calc="phonepe"]');
  if (!calc) return;

  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const money = (value) => inr.format(Math.round(value));
  const signed = (value) => (value < 0 ? `−${money(-value)}` : money(value));
  const group = new Intl.NumberFormat("en-IN");
  const pts = (value) => group.format(Math.round(value));

  const ULTIMO_FEE = 1179;
  const UNO_FEE = 589;
  const ULTIMO_WAIVER = 200000;
  const UNO_WAIVER = 100000;
  const LOUNGE_QUARTER = 75000;

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
    ultimo: { total: $("pp-ultimo"), y1: $("pp-ultimo-y1"), y2: $("pp-ultimo-y2") },
    uno: { total: $("pp-uno"), y1: $("pp-uno-y1"), y2: $("pp-uno-y2") },
  };
  const verdictEl = $("pp-verdict");
  const presets = [...calc.querySelectorAll("[data-preset]")];

  const parse = (value) => {
    const n = Number(String(value).replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? Math.min(n, 9999999) : 0;
  };
  const setPool = (p, earned) => {
    const used = Math.min(earned, p.cap);
    const lost = earned - used;
    p.amt.innerHTML = `<strong>${pts(used)}</strong> of ${pts(p.cap)} points`;
    p.bar.style.inlineSize = `${Math.min(earned / p.cap, 1) * 100}%`;
    p.el.dataset.full = String(earned >= p.cap && earned > 0);
    p.note.textContent = lost > 0 ? `Cap reached: ${pts(lost)} more points are lost each month.`
      : earned > 0 ? `${pts(p.cap - used)} points left before the cap.` : "Nothing entered yet.";
    return used;
  };

  const update = () => {
    const phonepe = parse(rows.phonepe.input.value);
    const online = parse(rows.online.input.value);
    const scan = parse(rows.scan.input.value);
    const other = parse(rows.other.input.value);

    rows.phonepe.result.innerHTML = phonepe ? `<strong>${pts(phonepe * 0.1)}</strong> / <strong>${pts(phonepe * 0.02)}</strong>` : "10% / 2%";
    rows.online.result.innerHTML = online ? `<strong>${pts(online * 0.05)}</strong> / <strong>${pts(online * 0.01)}</strong>` : "5% / 1%";
    rows.scan.result.innerHTML = scan ? `<strong>${pts(scan * 0.01)}</strong> on both` : "1% on both";
    rows.other.result.innerHTML = other ? "<strong>0</strong> on both" : "0%";

    const ult10 = setPool(pools.ult10, phonepe * 0.1);
    const ult5 = setPool(pools.ult5, online * 0.05);
    const uno2 = setPool(pools.uno2, phonepe * 0.02);
    const uno1 = setPool(pools.uno1, online * 0.01);
    const scanPts = setPool(pools.scan, scan * 0.01);

    const month = phonepe + online + scan + other;
    const year = month * 12;
    const ultimoMonth = ult10 + ult5 + scanPts;
    const unoMonth = uno2 + uno1 + scanPts;

    const ultimoY1 = ultimoMonth * 12 - ULTIMO_FEE;
    const ultimoY2 = ultimoMonth * 12 - (year >= ULTIMO_WAIVER ? 0 : ULTIMO_FEE);
    const unoY1 = unoMonth * 12 - UNO_FEE;
    const unoY2 = unoMonth * 12 - (year >= UNO_WAIVER ? 0 : UNO_FEE);

    out.ultimo.total.textContent = pts(ultimoMonth);
    out.ultimo.y1.textContent = signed(ultimoY1);
    out.ultimo.y2.textContent = signed(ultimoY2);
    out.uno.total.textContent = pts(unoMonth);
    out.uno.y1.textContent = signed(unoY1);
    out.uno.y2.textContent = signed(unoY2);

    if (!month) {
      verdictEl.textContent = "Enter your monthly spends to compare the two cards.";
      return;
    }
    const diff = ultimoY2 - unoY2;
    const lead = Math.abs(diff) < 1 ? "<strong>It’s a tie</strong> on these numbers from year two."
      : diff > 0 ? `<strong>Ultimo pays ${money(diff)} more a year</strong> from year two, after fees.`
        : `<strong>Uno pays ${money(-diff)} more a year</strong> from year two, after fees.`;
    const notes = [
      year >= ULTIMO_WAIVER ? "Ultimo renewal waived" : `Ultimo needs ${money(ULTIMO_WAIVER - year)} more a year for a free renewal`,
      year >= UNO_WAIVER ? "Uno renewal waived" : `Uno needs ${money(UNO_WAIVER - year)} more`,
      month * 3 >= LOUNGE_QUARTER ? "Ultimo’s 2 lounge visits a quarter unlocked" : `Ultimo lounge needs ${money(LOUNGE_QUARTER - month * 3)} more a quarter`,
    ];
    verdictEl.innerHTML = `${lead} ${notes.join("; ")}.`;
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

  const order = ["phonepe", "online", "scan", "other"];
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

// Offer banner: drop it once the offer window has closed (it stays in the HTML for no-JS readers).
(() => {
  const offer = document.getElementById("offer");
  const ends = offer && Date.parse(offer.dataset.ends);
  if (ends && Date.now() >= ends) offer.remove();
})();
