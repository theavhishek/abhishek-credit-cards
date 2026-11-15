// SBI Debit Card Rewardz calculator.
// Base: data-base points per data-per rupees. Tier multiplies the base (1, 1.5 or 2).
// Birthday month: SBI posts points at 2X and the tier multiplier applies to the birthday bonus,
// so it adds another full set of base × tier points.
// Per payment: at most data-tx-cap points (base + tier + birthday). The month's spend is paid in
// bills of the chosen size (data-pay), with the remainder as one last smaller bill; data-pay="0" is one bill.
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
  const txCap = Number(d.txCap) || 1000;

  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const num = new Intl.NumberFormat("en-IN");
  const money = (value) => inr.format(Math.round(value));
  const pts = (value) => num.format(Math.round(value));
  const lakh = (value) => (value % 100000 === 0 ? value / 100000 : (value / 100000).toFixed(2).replace(/0$/, "")) + " lakh";
  const $ = (id) => calc.querySelector("#" + id);

  const input = $("rz-spend");
  const max = Number(input.max) || 600000;
  const tiers = [...calc.querySelectorAll("[data-tier]")];
  const pays = [...calc.querySelectorAll("[data-pay]")];
  const birthday = $("rz-birthday");
  const tierNames = { 1: "Dreamer", 1.5: "Affluent", 2: "Elite" };
  let tier = 1;
  let pay = Number(pays.find((b) => b.getAttribute("aria-pressed") === "true")?.dataset.pay) || 0;
  let timer;

  // Points on one bill at a given rate per ₹200 slab, before and after the per-payment cap.
  const billPts = (amount, rate) => Math.floor(amount / per) * rate;
  // Points from all of the month's bills, after the per-payment cap.
  const billsPts = (spend, rate) => {
    if (!pay || spend <= pay) return Math.min(billPts(spend, rate), txCap);
    const full = Math.floor(spend / pay);
    return full * Math.min(billPts(pay, rate), txCap) + Math.min(billPts(spend - full * pay, rate), txCap);
  };
  const monthPts = (spend, rate) => billsPts(spend, rate) + (spend >= milestoneAt ? milestone : 0);

  // Smallest spend (in ₹200 steps) at which the month's points reach the cap, or Infinity.
  const capSpend = (rate) => {
    if (!pay) {
      // One bill can't pass the per-payment cap, so a single payment never reaches the monthly cap.
      return txCap + milestone >= cap ? Math.ceil((cap - milestone) / rate) * per : Infinity;
    }
    const perBill = Math.min(billPts(pay, rate), txCap);
    const need = cap - milestone;
    const full = Math.floor(need / perBill);
    const rest = need - full * perBill;
    return Math.max(full * pay + (rest ? Math.ceil(rest / rate) * per : 0), milestoneAt);
  };

  const update = () => {
    const spend = Number(input.value);
    const bday = birthday.checked;
    const rate = base * tier * (bday ? 2 : 1);
    const slabs = Math.floor(spend / per);
    const basePts = slabs * base;
    const tierPts = basePts * (tier - 1);
    const bdayPts = bday ? basePts * tier : 0;
    const earned = billsPts(spend, rate);
    const txCut = basePts + tierPts + bdayPts - earned;
    const milePts = spend >= milestoneAt ? milestone : 0;
    const raw = earned + milePts;
    const total = Math.min(raw, cap);
    const value = total * pointValue;
    const hitAt = capSpend(rate);
    const bills = !spend ? 0 : pay ? Math.ceil(spend / pay) : 1;

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
    $("rz-b-tx-row").hidden = txCut <= 0;
    $("rz-b-tx").textContent = "−" + pts(txCut);
    $("rz-b-tx-note").textContent = "1,000 RP a payment, " + bills + (bills === 1 ? " payment" : " payments");
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
    $("rz-cap-label").textContent = showCap ? "Cap at ₹" + lakh(hitAt) : "Cap";
    // On narrow screens the cap label can run into the milestone label; drop it a line when they touch.
    const scale = calc.querySelector(".rv-meter-scale");
    scale.classList.remove("rz-scale-stack");
    if (showCap) {
      const a = calc.querySelector(".rz-mark-label").getBoundingClientRect();
      const b = $("rz-cap-label").getBoundingClientRect();
      if (b.left < a.right + 8 && b.right > a.left - 8) scale.classList.add("rz-scale-stack");
    }

    const pool = $("rz-pool");
    pool.dataset.full = String(raw >= cap);
    $("rz-pool-bar").style.inlineSize = total / cap * 100 + "%";
    $("rz-pool-amt").innerHTML = "<strong>" + pts(total) + "</strong> of " + pts(cap) + " RP";

    clearTimeout(timer);
    timer = setTimeout(() => {
      let note;
      // Largest bill that still earns every point at this rate.
      const fullBill = Math.floor(txCap / rate) * per;
      if (!spend) note = "Move the slider to see this month’s points.";
      else if (raw > cap) note = "Over the cap. Spend above ₹" + lakh(hitAt) + " earns nothing more this month.";
      else if (raw === cap) note = "Exactly at the cap. Move further spend to next month.";
      else if (txCut > 0) note = "Each payment earns at most 1,000 RP. Bills of " + money(fullBill) + " or less would add " + pts(Math.min(txCut, cap - total)) + " RP.";
      else if (!milePts) note = money(milestoneAt - spend) + " more this month adds the 1,000 RP milestone, worth ₹" + num.format(milestone * pointValue) + ".";
      else if (!pay) note = "One payment stops at 1,000 RP, so the monthly cap needs smaller bills.";
      else note = showCap ? pts(cap - total) + " RP left before the cap, reached at ₹" + lakh(hitAt) + "." : "The cap needs ₹" + lakh(hitAt) + " on this tier, more than most people pay in a month.";
      $("rz-pool-note").textContent = note;
    }, 250);
  };

  tiers.forEach((button) => button.addEventListener("click", () => {
    tier = Number(button.dataset.tier);
    tiers.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    update();
  }));
  pays.forEach((button) => button.addEventListener("click", () => {
    pay = Number(button.dataset.pay);
    pays.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    update();
  }));
  birthday.addEventListener("change", update);
  input.addEventListener("input", update);
  window.addEventListener("resize", update);
  input.hidden = false;
  update();
})();
