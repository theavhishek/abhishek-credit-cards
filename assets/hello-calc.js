// IDFC FIRST Hello Cashback: cashback calculator for one statement cycle.
// Online: 3% on the first ₹10,000, 5% above it, capped at ₹1,000 a cycle.
// Flights and hotels in the IDFC FIRST app: treated as online spend, plus an extra 1%.
// Offline POS, UPI in the IDFC FIRST app and essentials: 1%. All cashback capped at ₹1,500 a cycle.
// Bank fees: rent 1% (at least ₹249) + GST; utilities above ₹20,000 a cycle 1% of the total + GST.
// Joining fee ₹1,000 + GST; renewal ₹1,180 below ₹1 lakh a year, ₹590 from ₹1 lakh, ₹0 from ₹2 lakh.
(() => {
  const calc = document.querySelector('.rv-calc[data-calc="hello"]');
  if (!calc) return;

  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const money = (value) => inr.format(Math.round(value));
  const signed = (value) => (Math.round(value) < 0 ? `−${money(-value)}` : money(value));
  const group = new Intl.NumberFormat("en-IN");

  const GST = 1.18;
  const SLAB = 10000;
  const ONLINE_CAP = 1000;
  const ALL_CAP = 1500;
  const JOINING = 1000 * GST;
  const renewal = (yearSpend) => (yearSpend >= 200000 ? 0 : yearSpend >= 100000 ? 500 * GST : 1000 * GST);

  const rows = Object.fromEntries([...calc.querySelectorAll(".ec-row")].map((row) => [row.dataset.key, {
    input: row.querySelector("input"),
    result: row.querySelector(".ec-result"),
  }]));
  const spendKeys = ["online", "travel", "offline", "upi", "utilities", "rent", "essentials"];
  const pools = Object.fromEntries([...calc.querySelectorAll(".ec-pool")].map((el) => [el.dataset.pool, {
    cap: Number(el.dataset.cap),
    amt: el.querySelector(".ec-pool-amt"),
    bar: el.querySelector(".ec-bar span"),
    note: el.querySelector(".ec-pool-note"),
    el,
  }]));
  const $ = (id) => calc.querySelector("#" + id);
  const presets = [...calc.querySelectorAll("[data-preset]")];

  const parse = (value) => {
    const n = Number(String(value).replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? Math.min(n, 9999999) : 0;
  };
  const slab = (amount) => Math.min(amount, SLAB) * 0.03 + Math.max(amount - SLAB, 0) * 0.05;

  const update = () => {
    const v = Object.fromEntries(Object.entries(rows).map(([k, r]) => [k, parse(r.input.value)]));
    const online = v.online + v.travel;
    const onlineRaw = slab(online);
    const onlineKept = Math.min(onlineRaw, ONLINE_CAP);
    const travelExtra = v.travel * 0.01;
    const onePct = (v.offline + v.upi + v.utilities + v.rent + v.essentials) * 0.01;
    const allRaw = onlineKept + travelExtra + onePct;
    const cashback = Math.min(allRaw, ALL_CAP);

    const rentFee = v.rent ? Math.max(v.rent * 0.01, 249) * GST : 0;
    const utilFee = v.utilities > 20000 ? v.utilities * 0.01 * GST : 0;
    const fees = rentFee + utilFee;
    const net = cashback - fees;

    // Per-row figures before the caps. Online rows share the 3% / 5% slabs.
    const share = online ? onlineRaw / online : 0;
    const rowEarn = {
      online: v.online * share,
      travel: v.travel * share + travelExtra,
      offline: v.offline * 0.01, upi: v.upi * 0.01, essentials: v.essentials * 0.01,
      utilities: v.utilities * 0.01, rent: v.rent * 0.01,
    };
    for (const k of spendKeys) {
      const r = rows[k];
      const fee = k === "rent" ? rentFee : k === "utilities" ? utilFee : 0;
      r.result.innerHTML = v[k]
        ? `<strong>${money(rowEarn[k])}</strong> cashback` + (fee ? `, <strong>−${money(fee)}</strong> fee` : "")
        : "";
    }

    const showPool = (p, earned) => {
      const kept = Math.min(earned, p.cap);
      const over = earned - kept;
      p.amt.innerHTML = `<strong>${money(kept)}</strong> of ${money(p.cap)}`;
      p.bar.style.inlineSize = `${Math.min(kept / p.cap, 1) * 100}%`;
      p.el.dataset.full = String(earned >= p.cap && earned > 0);
      p.note.textContent = over > 0.5
        ? `Cap reached: ${money(over)} more is lost this cycle.`
        : earned > 0 ? `${money(p.cap - kept)} left before the cap.` : "Nothing entered yet.";
    };
    showPool(pools.online, onlineRaw);
    showPool(pools.all, allRaw);
    if (onlineRaw > 0 && onlineRaw < ONLINE_CAP) {
      const toCap = 24000 - online;
      pools.online.note.textContent = online < SLAB
        ? `${money(SLAB - online)} more online to reach 5%.`
        : `${money(toCap)} more online fills the cap.`;
    }

    const spend = spendKeys.reduce((sum, k) => sum + v[k], 0);
    const yearSpend = spend * 12;
    const year = net * 12;
    $("hc-total").textContent = signed(net);
    $("hc-cashback").textContent = money(cashback);
    $("hc-fees").textContent = fees ? `−${money(fees)}` : money(0);
    $("hc-y1").textContent = signed(year - JOINING);
    $("hc-y2").textContent = signed(year - renewal(yearSpend));

    const limit = v.limit;
    rows.limit.result.textContent = limit && limit < 10000 ? "The smallest FD is ₹10,000." : "";
    const verdict = $("hc-verdict");
    if (!spend) {
      verdict.textContent = "Enter a cycle’s spending to see your cashback.";
      return;
    }
    const parts = [];
    if (limit && spend > limit) {
      parts.push(`<strong>Your spend is above your ${money(limit)} limit.</strong> Only spend up to the limit earns cashback, even if you pay the card off mid-cycle, so the real figure can be lower.`);
    }
    if (fees > 0 && rentFee + utilFee >= (v.rent + v.utilities) * 0.01) {
      parts.push(`Rent and bill fees (${money(fees)}) cost more than the 1% they earn here.`);
    }
    const waiver = renewal(yearSpend);
    parts.push(waiver === 0
      ? `At about <strong>${money(yearSpend)}</strong> a year, the renewal fee is reversed in full.`
      : `At about <strong>${money(yearSpend)}</strong> a year, you’d pay ${money(waiver)} at renewal. Full reversal needs ${money(200000)}.`);
    verdict.innerHTML = parts.join(" ");
  };

  const tidy = (input) => {
    const n = parse(input.value);
    input.value = n ? group.format(n) : "";
  };
  for (const [key, r] of Object.entries(rows)) {
    r.input.addEventListener("input", () => {
      if (key !== "limit") presets.forEach((b) => b.setAttribute("aria-pressed", "false"));
      update();
    });
    r.input.addEventListener("blur", () => tidy(r.input));
  }
  const apply = (button) => {
    const values = button.dataset.preset.split(",").map(Number);
    spendKeys.forEach((k, i) => { rows[k].input.value = values[i] ? group.format(values[i]) : ""; });
    presets.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    update();
  };
  presets.forEach((button) => button.addEventListener("click", () => apply(button)));

  const start = presets.find((b) => b.getAttribute("aria-pressed") === "true");
  if (start) apply(start); else update();
})();
