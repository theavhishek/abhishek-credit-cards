// Unity Bank Vibe vs Zero: rewards calculator and the fees tab panels.
// Reward points per ₹100 for each category sit on each row as data-rp="zero,budget,shopaholic,wanderer"
// (from Unity Bank's Zero and Vibe reward terms). 1 RP = ₹0.25 as statement credit.
// Vibe: ₹249 + 18% GST joining fee once, no annual fee; ₹250 Amazon Pay gift card on ₹15,000 in 45 days.
(() => {
  const calc = document.querySelector('.rv-calc[data-calc="unity"]');
  if (!calc) return;

  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const money = (value) => inr.format(Math.round(value));
  const signed = (value) => (value < 0 ? `−${money(-value)}` : money(value));
  const group = new Intl.NumberFormat("en-IN");

  const RP_VALUE = 0.25;
  const VIBE_FEE = 293.82;
  const WELCOME = 250;
  const WELCOME_SPEND = 15000; // in 45 days, so 1.5 months of spend here
  const PLANS = ["zero", "bb", "shop", "wand"];
  const NAMES = { zero: "Zero", bb: "Vibe Budget Balancer", shop: "Vibe Shopaholic", wand: "Vibe Wanderer" };

  const rows = [...calc.querySelectorAll(".ec-row")].map((row) => ({
    key: row.dataset.key,
    rp: row.dataset.rp.split(",").map(Number),
    input: row.querySelector("input"),
    result: row.querySelector(".ec-result"),
  }));
  const $ = (id) => calc.querySelector("#" + id);
  const out = Object.fromEntries(PLANS.map((p) => [p, { total: $("uc-" + p), y1: $("uc-" + p + "-y1"), y2: $("uc-" + p + "-y2"), card: calc.querySelector(`[data-plan="${p}"]`) }]));
  const verdictEl = $("uc-verdict");
  const presets = [...calc.querySelectorAll("[data-preset]")];

  const parse = (value) => {
    const n = Number(String(value).replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? Math.min(n, 9999999) : 0;
  };

  const update = () => {
    const month = [0, 0, 0, 0];
    let spend = 0;
    for (const r of rows) {
      const amount = parse(r.input.value);
      spend += amount;
      r.rp.forEach((rp, i) => { month[i] += amount / 100 * rp * RP_VALUE; });
      if (!amount) { r.result.textContent = ""; continue; }
      const zero = amount / 100 * r.rp[0] * RP_VALUE;
      const bestVibe = Math.max(...r.rp.slice(1)) * amount / 100 * RP_VALUE;
      r.result.innerHTML = `<strong>${money(zero)}</strong> / <strong>${money(bestVibe)}</strong>`;
      r.result.title = "Zero / best Vibe plan";
    }
    const welcome = spend * 1.5 >= WELCOME_SPEND;
    const results = PLANS.map((p, i) => {
      const year = month[i] * 12;
      const y1 = i === 0 ? year : year - VIBE_FEE + (welcome ? WELCOME : 0);
      out[p].total.textContent = money(month[i]);
      out[p].y1.textContent = signed(y1);
      out[p].y2.textContent = money(year);
      return { p, month: month[i], year, y1 };
    });

    const vibe = results.slice(1).reduce((a, b) => (b.year > a.year ? b : a));
    PLANS.forEach((p) => { out[p].card.dataset.best = String(spend > 0 && p === vibe.p); });

    if (!spend) {
      verdictEl.textContent = "Enter your monthly spends to compare Zero with the three Vibe plans.";
      return;
    }
    const zero = results[0];
    const diff = vibe.year - zero.year;
    const firstYear = vibe.y1 - zero.y1;
    const lead = `<strong>${NAMES[vibe.p]} is the best Vibe plan</strong> for this spend` +
      (Math.abs(diff) < 1 ? ", and it earns the same as Zero." : diff > 0
        ? `, earning <strong>${money(diff)} more a year</strong> than Zero.`
        : `, but <strong>Zero earns ${money(-diff)} more a year</strong>.`);
    const y1Text = ` In the first year, after the fee${welcome ? " and the ₹250 gift card" : ""}, Vibe is ${firstYear >= 0 ? money(firstYear) + " ahead" : money(-firstYear) + " behind"}.`;
    const welcomeText = welcome ? "" : ` You’d need ${money(WELCOME_SPEND)} in 45 days for the welcome gift card.`;
    verdictEl.innerHTML = lead + y1Text + welcomeText;
  };

  const tidy = (input) => {
    const n = parse(input.value);
    input.value = n ? group.format(n) : "";
  };
  const apply = (button) => {
    const values = button.dataset.preset.split(",").map(Number);
    rows.forEach((r, i) => { r.input.value = values[i] ? group.format(values[i]) : ""; });
    presets.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    update();
  };

  for (const r of rows) {
    r.input.addEventListener("input", () => {
      presets.forEach((b) => b.setAttribute("aria-pressed", "false"));
      update();
    });
    r.input.addEventListener("blur", () => tidy(r.input));
  }
  presets.forEach((button) => button.addEventListener("click", () => apply(button)));

  const start = presets.find((b) => b.getAttribute("aria-pressed") === "true");
  if (start) apply(start); else update();
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
