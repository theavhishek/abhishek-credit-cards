// SBI Debit Card Rewardz calculator.
// Base: data-base points per data-per rupees. Tier multiplies the base (1, 1.5 or 2).
// Birthday adds one more set of base points, without the tier multiplier.
// Milestone: data-milestone points once a month at data-milestone-at spend. Everything stops at data-cap points.
(() => {
  const calc = document.querySelector('.rv-calc[data-calc="rewardz"]');
  if (!calc) return;

  const d = calc.dataset;
  const pointValue = Number(d.pointValue) || 0.25;
  const base = Number(d.base) || 2;
  const per = Number(d.per) || 200;
  const milestone = Number(d.milestone) || 1000;
  const milestoneAt = Number(d.milestoneAt) || 100000;
  const cap = Number(d.cap) || 10000;

  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const num = new Intl.NumberFormat("en-IN");
  const money = (value) => inr.format(Math.round(value));
  const pts = (value) => num.format(Math.round(value));
  const lakh = (value) => (value % 100000 === 0 ? value / 100000 : (value / 100000).toFixed(1)) + " lakh";
  const $ = (id) => calc.querySelector("#" + id);

  const input = $("rz-spend");
  const max = Number(input.max) || 600000;
  const tiers = [...calc.querySelectorAll("[data-tier]")];
  const birthday = $("rz-birthday");
  const tierNames = { 1: "Dreamer", 1.5: "Affluent", 2: "Elite" };
  let tier = 1;
  let timer;

  // Spend at which the month's points reach the cap (the milestone is in by then).
  const capSpend = (perRupee) => Math.ceil((cap - milestone) / perRupee / per) * per;

  const update = () => {
    const spend = Number(input.value);
    const bday = birthday.checked;
    const slabs = Math.floor(spend / per);
    const basePts = slabs * base;
    const tierPts = basePts * (tier - 1);
    const bdayPts = bday ? basePts : 0;
    const milePts = spend >= milestoneAt ? milestone : 0;
    const raw = basePts + tierPts + bdayPts + milePts;
    const total = Math.min(raw, cap);
    const value = total * pointValue;
    const perRupee = (base * tier + (bday ? base : 0)) / per;
    const hitAt = capSpend(perRupee);

    input.setAttribute("aria-valuetext", money(spend));
    $("rz-spend-out").textContent = money(spend);
    $("rz-total").textContent = money(value);
    $("rz-points").textContent = pts(total) + " RP";
    // Three decimals keep 0.625% and 0.875% exact; trailing zeros beyond two are dropped.
    $("rz-rate").textContent = spend ? (value / spend * 100).toFixed(3).replace(/0$/, "") + "%" : "–";
    $("rz-b-base").textContent = pts(basePts);
    $("rz-b-tier").textContent = pts(tierPts);
    $("rz-b-tier-note").textContent = tier === 1 ? "Dreamer adds nothing" : tierNames[tier] + ", " + tier + "× base";
    $("rz-b-bday").textContent = pts(bdayPts);
    $("rz-b-mile").textContent = pts(milePts);
    $("rz-b-cut-row").hidden = raw <= cap;
    $("rz-b-cut").textContent = "−" + pts(raw - cap);

    // Meter: fill up to the cap point, hatch beyond it.
    const capPct = Math.min(hitAt / max, 1) * 100;
    const earnPct = Math.min(spend, hitAt) / max * 100;
    $("rz-earn-bar").style.inlineSize = earnPct + "%";
    $("rz-over-bar").style.insetInlineStart = capPct + "%";
    $("rz-over-bar").style.inlineSize = Math.max(spend - hitAt, 0) / max * 100 + "%";
    const showCap = hitAt <= max;
    $("rz-cap-line").hidden = !showCap;
    $("rz-cap-label").hidden = !showCap;
    $("rz-cap-line").style.insetInlineStart = capPct + "%";
    $("rz-cap-label").style.insetInlineStart = capPct + "%";
    $("rz-cap-label").textContent = "Cap at ₹" + lakh(hitAt);

    const pool = $("rz-pool");
    pool.dataset.full = String(raw >= cap);
    $("rz-pool-bar").style.inlineSize = total / cap * 100 + "%";
    $("rz-pool-amt").innerHTML = "<strong>" + pts(total) + "</strong> of " + pts(cap) + " RP";

    clearTimeout(timer);
    timer = setTimeout(() => {
      let note;
      if (!spend) note = "Move the slider to see this month’s points.";
      else if (raw > cap) note = "Over the cap. Spend above ₹" + lakh(hitAt) + " earns nothing more this month.";
      else if (raw === cap) note = "Exactly at the cap. Move further spend to next month.";
      else if (!milePts) note = money(milestoneAt - spend) + " more this month adds the 1,000 RP milestone, worth ₹" + num.format(milestone * pointValue) + ".";
      else note = showCap ? pts(cap - total) + " RP left before the cap, reached at ₹" + lakh(hitAt) + "." : "The cap needs ₹" + lakh(hitAt) + " on this tier, more than most people pay in a month.";
      $("rz-pool-note").textContent = note;
    }, 250);
  };

  tiers.forEach((button) => button.addEventListener("click", () => {
    tier = Number(button.dataset.tier);
    tiers.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    update();
  }));
  birthday.addEventListener("change", update);
  input.addEventListener("input", update);
  input.hidden = false;
  update();
})();
