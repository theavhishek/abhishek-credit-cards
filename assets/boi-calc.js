// BOI Star Rewardz calculator for credit card bill payments by debit card.
// Points depend on the size of each transaction: data-slabs is "upTo:rate" pairs (points per ₹100),
// the last rate applies above the last limit. RuPay Select uses data-select-top above the top limit.
// Slab points stop at data-cap a month; the monthly bonus (data-bonus above data-bonus-at) sits outside the cap.
(() => {
  const calc = document.querySelector('.rv-calc[data-calc="boi"]');
  if (!calc) return;

  const d = calc.dataset;
  const pointValue = Number(d.pointValue) || 0.25;
  const slabs = (d.slabs || "5000:1,10000:1.5,:2").split(",").map((s) => {
    const [upTo, rate] = s.split(":");
    return { upTo: upTo ? Number(upTo) : Infinity, rate: Number(rate) };
  });
  const selectTop = Number(d.selectTop) || 3;
  const cap = Number(d.cap) || 10000;
  const bonus = Number(d.bonus) || 100;
  const bonusAt = Number(d.bonusAt) || 50000;

  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
  const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
  const money = (value) => inr.format(Math.round(value * 100) / 100).replace(/\.00$/, "");
  const pts = (value) => num.format(value);
  const $ = (id) => calc.querySelector("#" + id);

  const input = $("bc-amount");
  const max = Number(input.max) || 100000;
  const counts = [...calc.querySelectorAll("[data-count]")];
  const cards = [...calc.querySelectorAll("[data-card]")];
  let count = 1;
  let select = true;
  let timer;

  const rateFor = (amount) => {
    const i = slabs.findIndex((s) => amount <= s.upTo);
    const top = i === slabs.length - 1;
    return top && select ? selectTop : slabs[i].rate;
  };

  const update = () => {
    const amount = Number(input.value);
    const rate = rateFor(amount);
    const perPay = Math.floor(amount / 100) * rate;
    const raw = perPay * count;
    const slabPts = Math.min(raw, cap);
    const spend = amount * count;
    const bonusPts = spend > bonusAt ? bonus : 0;
    const total = slabPts + bonusPts;
    const value = total * pointValue;

    input.setAttribute("aria-valuetext", money(amount));
    $("bc-amount-out").textContent = money(amount);
    $("bc-total").textContent = money(value);
    $("bc-points").textContent = pts(total) + " RP";
    $("bc-rate").textContent = spend ? (value / spend * 100).toFixed(3).replace(/0+$/, "").replace(/\.$/, "") + "%" : "–";
    $("bc-b-rate").textContent = pts(rate) + " RP";
    $("bc-b-rate-note").textContent = "per ₹100 on a " + money(amount) + " payment";
    $("bc-b-slab").textContent = pts(perPay * count);
    $("bc-b-slab-note").textContent = count === 1 ? "One payment" : count + " payments of " + money(amount);
    $("bc-b-bonus").textContent = pts(bonusPts);
    $("bc-b-cut-row").hidden = raw <= cap;
    $("bc-b-cut").textContent = "−" + pts(raw - cap);

    $("bc-earn-bar").style.inlineSize = amount / max * 100 + "%";

    const pool = $("bc-pool");
    pool.dataset.full = String(raw >= cap);
    $("bc-pool-bar").style.inlineSize = slabPts / cap * 100 + "%";
    $("bc-pool-amt").innerHTML = "<strong>" + pts(slabPts) + "</strong> of " + pts(cap) + " RP";

    clearTimeout(timer);
    timer = setTimeout(() => {
      let note;
      if (!amount) note = "Move the slider to see this month’s points.";
      else if (raw > cap) note = "Over the cap. Slab points above 10,000 aren’t credited this month.";
      else if (amount <= slabs[slabs.length - 2].upTo) note = "Payments of ₹10,001 or more earn the top rate. Pay the bill in one go rather than in parts.";
      else if (!bonusPts) note = money(bonusAt + 1 - spend) + " more this month adds the " + bonus + "-point monthly bonus.";
      else note = pts(cap - slabPts) + " RP left before the monthly cap.";
      $("bc-pool-note").textContent = note;
    }, 250);
  };

  const group = (buttons, apply) => buttons.forEach((button) => button.addEventListener("click", () => {
    apply(button);
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    update();
  }));
  group(counts, (b) => { count = Number(b.dataset.count); });
  group(cards, (b) => { select = b.dataset.card === "select"; });
  input.addEventListener("input", update);
  input.hidden = false;
  update();
})();
