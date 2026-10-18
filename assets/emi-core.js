/* ==========================================================================
   EMI core: the calculation engine for /calculator/loan-emi and
   /calculator/no-cost-emi. Shared by the browser (window.EmiCore) and the
   Node tests (require). No DOM code lives here.

   Money rules
   - Amounts are rupees as JS numbers, rounded to paise (2 decimals) at every
     step that a bank would post: each month's interest, GST and principal.
   - Reducing-balance EMI uses the standard formula
       EMI = P × r × (1 + r)^n / ((1 + r)^n − 1),  r = annual rate / 12 / 100
     and falls back to P / n at 0% interest.
   - The final instalment absorbs rounding so the closing balance is exactly 0.
   - Card EMIs are rounded to whole rupees (as SBI Card's and Amex's published
     examples are); the last instalment is adjusted.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.EmiCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var MAX_MONTHS = 600; // 50 years: anything longer is not a real loan

  function round2(n) {
    // Round half away from zero at paise, guarding against 1.005 style float errors.
    var s = n < 0 ? -1 : 1;
    return s * Math.round((Math.abs(n) + Number.EPSILON) * 100) / 100;
  }
  function num(v, fallback) {
    var n = typeof v === "number" ? v : parseFloat(v);
    return isFinite(n) ? n : (fallback === undefined ? 0 : fallback);
  }
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

  /* ---------- Parsing and formatting ---------- */

  // "₹1,25,000", " 1 25 000 ", "Rs. 2,500.50" -> number. "1.5L"/"2 lakh"/"1cr" are understood too.
  function parseAmount(value) {
    if (typeof value === "number") return isFinite(value) ? value : NaN;
    if (value == null) return NaN;
    var s = String(value).trim().toLowerCase().replace(/^(rs\.?|inr|₹)\s*/, "").replace(/[₹,\s]/g, "");
    if (!s) return NaN;
    var mult = 1;
    var m = s.match(/^(-?\d*\.?\d+)(k|l|lac|lakh|lakhs|cr|crore|crores)$/);
    if (m) {
      s = m[1];
      mult = m[2] === "k" ? 1e3 : m[2].charAt(0) === "l" ? 1e5 : 1e7;
    }
    if (!/^-?\d*\.?\d+$/.test(s)) return NaN;
    return parseFloat(s) * mult;
  }

  var inrFmt = {};
  function formatINR(n, decimals) {
    if (!isFinite(n)) return "—";
    var d = decimals === undefined ? 0 : decimals;
    var f = inrFmt[d] || (inrFmt[d] = new Intl.NumberFormat("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }));
    var v = d === 0 ? Math.round(n) : n;
    if (Object.is(v, -0) || (d === 0 && v === 0)) v = 0;
    return (v < 0 ? "−₹" : "₹") + f.format(Math.abs(v));
  }
  function formatNumber(n, decimals) {
    if (!isFinite(n)) return "";
    var d = decimals || 0;
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: d }).format(n);
  }
  function formatPct(n, decimals) {
    if (!isFinite(n)) return "—";
    return (Math.round(n * Math.pow(10, decimals || 2)) / Math.pow(10, decimals || 2)).toFixed(decimals || 2) + "%";
  }

  /* ---------- Dates ---------- */

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // ISO "2026-11-05" + k months, clamped to the month's last day (31 Jan + 1 = 28/29 Feb).
  function addMonths(iso, k) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!p) return null;
    var y = +p[1], m = +p[2] - 1 + k, d = +p[3];
    y += Math.floor(m / 12);
    m = ((m % 12) + 12) % 12;
    var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    var dd = Math.min(d, last);
    return y + "-" + String(m + 1).padStart(2, "0") + "-" + String(dd).padStart(2, "0");
  }
  function formatDate(iso, withDay) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!p) return "";
    return (withDay ? +p[3] + " " : "") + MONTHS[+p[2] - 1] + " " + p[1];
  }
  function monthsLabel(n) {
    n = Math.round(n);
    var y = Math.floor(n / 12), m = n % 12, parts = [];
    if (y) parts.push(y + (y === 1 ? " year" : " years"));
    if (m || !y) parts.push(m + (m === 1 ? " month" : " months"));
    return parts.join(" ");
  }

  /* ---------- Basic formulas ---------- */

  function tenureMonths(years, months) {
    var y = Math.max(0, Math.floor(num(years))), m = Math.max(0, Math.floor(num(months)));
    return y * 12 + m;
  }

  function emiFactor(annualRate, n) {
    var r = num(annualRate) / 1200;
    if (n <= 0) return NaN;
    if (r === 0) return 1 / n;
    var g = Math.pow(1 + r, n);
    return (r * g) / (g - 1);
  }
  // Exact (unrounded) reducing-balance EMI.
  function emi(principal, annualRate, n) {
    if (!(principal > 0) || !(n > 0)) return 0;
    return principal * emiFactor(annualRate, n);
  }
  // Months needed to repay `balance` with `payment` a month (whole months, NaN if never).
  function nper(balance, annualRate, payment) {
    var r = num(annualRate) / 1200;
    if (!(payment > 0) || !(balance > 0)) return NaN;
    if (r === 0) return Math.ceil(balance / payment - 1e-9);
    var x = 1 - (balance * r) / payment;
    if (x <= 0) return NaN;
    var m = -Math.log(x) / Math.log(1 + r);
    return Math.abs(m - Math.round(m)) < 0.02 ? Math.round(m) : Math.ceil(m);
  }
  // Flat rate: interest on the full original principal for the whole tenure.
  function flatEmi(principal, annualRate, n) {
    if (!(principal > 0) || !(n > 0)) return 0;
    return (principal + principal * (num(annualRate) / 100) * (n / 12)) / n;
  }

  // Monthly IRR of a cash-flow list (index = month). Returns NaN when it cannot be found.
  function irrMonthly(flows) {
    function npv(r) { var v = 0; for (var i = 0; i < flows.length; i++) v += flows[i] / Math.pow(1 + r, i); return v; }
    var lo = -0.99, hi = 1, flo = npv(lo), fhi = npv(hi);
    if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) {
      // Fall back to a coarse scan for a sign change.
      var prev = npv(-0.5), prevR = -0.5, found = false;
      for (var s = -0.49; s <= 2; s += 0.01) {
        var cur = npv(s);
        if (prev * cur <= 0) { lo = prevR; hi = s; found = true; break; }
        prev = cur; prevR = s;
      }
      if (!found) return NaN;
    }
    for (var k = 0; k < 200; k++) {
      var mid = (lo + hi) / 2, fm = npv(mid);
      if (Math.abs(fm) < 1e-9) return mid;
      if (npv(lo) * fm < 0) hi = mid; else lo = mid;
    }
    return (lo + hi) / 2;
  }
  // Annual cost from cash flows: nominal APR (monthly IRR × 12) and effective annual rate.
  function annualCost(flows) {
    var r = irrMonthly(flows);
    if (!isFinite(r)) return { apr: NaN, effective: NaN };
    return { apr: r * 1200, effective: (Math.pow(1 + r, 12) - 1) * 100 };
  }

  // { type: "none" | "fixed" | "percent", value, min, max } -> rupees before GST.
  function feeAmount(spec, base) {
    if (!spec || spec.type === "none" || spec.type === "waived") return 0;
    var fee = spec.type === "percent" ? (num(base) * num(spec.value)) / 100 : num(spec.value);
    var min = num(spec.min, NaN), max = num(spec.max, NaN);
    if (isFinite(min) && min > 0) fee = Math.max(fee, min);
    if (isFinite(max) && max > 0) fee = Math.min(fee, max);
    return round2(Math.max(0, fee));
  }
  function gstOn(amount, rate) { return round2(num(amount) * num(rate) / 100); }

  /* ---------- Validation ---------- */

  function validateLoan(input) {
    var errors = {};
    var P = num(input.principal, NaN);
    if (!(P > 0)) errors.principal = "Enter a loan amount above ₹0.";
    else if (P > 1e11) errors.principal = "Enter a loan amount below ₹10,000 crore.";
    var rate = num(input.annualRate, NaN);
    if (!isFinite(rate) || rate < 0) errors.annualRate = "Enter an interest rate of 0% or more.";
    else if (rate > 60) errors.annualRate = "Enter a rate of 60% a year or less.";
    var n = num(input.months, NaN);
    if (!(n >= 1)) errors.months = "Tenure must be at least 1 month.";
    else if (n > MAX_MONTHS) errors.months = "Tenure can be at most 50 years.";
    return errors;
  }

  /* ---------- Amortization ---------- */

  /*
    amortize({
      principal, annualRate, months,
      method: "reducing" | "flat",
      roundEmi: "paise" | "rupee",
      startDate: "YYYY-MM-DD" (first instalment date, optional),
      prepayments: [{ month, amount }],          // paid with that month's EMI, after it
      recurring: { amount, fromMonth },          // extra every month from fromMonth
      strategy: "tenure" | "emi",                 // after a prepayment: keep EMI or keep tenure
      rateChanges: [{ month, rate }],            // new rate applies to that month's interest onward
      ratePolicy: "tenure" | "emi",              // after a rate change: keep EMI or keep tenure
      gstOnInterest: rate in % (optional; card EMIs)
    })
    Returns { rows, emi, totalInterest, totalPrincipal, totalExtra, totalGst, months, finalBalance, notes }
  */
  function amortize(opts) {
    var P = round2(num(opts.principal));
    var n = Math.floor(num(opts.months));
    var method = opts.method === "flat" ? "flat" : "reducing";
    var roundTo = opts.roundEmi === "rupee" ? 0 : 2;
    var gstRate = num(opts.gstOnInterest);
    var notes = [];
    var rows = [];
    if (!(P > 0) || !(n >= 1)) return { rows: rows, emi: 0, totalInterest: 0, totalPrincipal: 0, totalExtra: 0, totalGst: 0, months: 0, finalBalance: P > 0 ? P : 0, notes: notes };
    n = Math.min(n, MAX_MONTHS);

    function roundEmi(v) { return roundTo === 0 ? Math.round(v) : round2(v); }

    if (method === "flat") {
      var totalFlatInterest = round2(P * (num(opts.annualRate) / 100) * (n / 12));
      var perInterest = round2(totalFlatInterest / n), perPrincipal = round2(P / n);
      var bal = P, intLeft = totalFlatInterest, fe = roundEmi(perInterest + perPrincipal);
      var tg = 0;
      for (var k = 1; k <= n; k++) {
        var last = k === n;
        var i = last ? round2(intLeft) : perInterest;
        var pr = last ? bal : perPrincipal;
        var g = gstRate ? gstOn(i, gstRate) : 0;
        tg += g;
        rows.push({ month: k, date: opts.startDate ? addMonths(opts.startDate, k - 1) : null, opening: bal, emi: round2(i + pr), interest: i, principal: pr, extra: 0, gst: g, closing: round2(bal - pr), rate: num(opts.annualRate) });
        bal = round2(bal - pr);
        intLeft = round2(intLeft - i);
      }
      return { rows: rows, emi: fe, totalInterest: totalFlatInterest, totalPrincipal: P, totalExtra: 0, totalGst: round2(tg), months: n, finalBalance: 0, notes: notes };
    }

    var rate = num(opts.annualRate);
    var prepay = {};
    (opts.prepayments || []).forEach(function (p) {
      var m = Math.floor(num(p.month)), a = num(p.amount);
      if (m >= 1 && a > 0) prepay[m] = (prepay[m] || 0) + a;
    });
    var rec = opts.recurring && num(opts.recurring.amount) > 0 ? { amount: num(opts.recurring.amount), from: Math.max(1, Math.floor(num(opts.recurring.fromMonth, 1))) } : null;
    var changes = {};
    (opts.rateChanges || []).forEach(function (c) {
      var m = Math.floor(num(c.month)), r = num(c.rate, NaN);
      if (m >= 1 && isFinite(r) && r >= 0) changes[m] = r;
    });
    var strategy = opts.strategy === "emi" ? "emi" : "tenure";
    var ratePolicy = opts.ratePolicy === "emi" ? "emi" : "tenure";

    var plannedEnd = n; // the month the loan is scheduled to end under current terms
    // The most that EMI rounding can leave over at the planned end (rounding error compounded).
    var residual = 0;
    function setResidual(annual, months) {
      var unit = roundTo === 0 ? 0.5 : 0.005, rr = annual / 1200;
      residual = (rr === 0 ? unit * months : unit * (Math.pow(1 + rr, months) - 1) / rr) + 0.01;
    }
    var curEmi = roundEmi(emi(P, rate, n));
    setResidual(rate, n);
    var firstEmi = curEmi;
    var balance = P;
    var totI = 0, totP = 0, totX = 0, totG = 0;
    var month = 0;
    var bumped = false;

    while (balance > 0.004 && month < MAX_MONTHS) {
      month++;
      if (changes[month] !== undefined && changes[month] !== rate) {
        if (ratePolicy === "emi") {
          // Keep the loan's current end date: months left at the old rate and EMI.
          var left = nper(balance, rate, curEmi);
          var remaining = isFinite(left) ? Math.max(1, left) : Math.max(1, plannedEnd - month + 1);
          plannedEnd = month + remaining - 1;
          curEmi = roundEmi(emi(balance, changes[month], remaining));
          setResidual(changes[month], remaining);
        }
        rate = changes[month];
      }
      var r = rate / 1200;
      var interest = round2(balance * r);
      if (curEmi <= interest && interest > 0) {
        // The EMI no longer covers interest (rate rose under "keep EMI"): lengthening the loan
        // would never repay it, so lenders raise the EMI. Re-spread over the planned end.
        curEmi = roundEmi(emi(balance, rate, Math.max(1, plannedEnd - month + 1)));
        if (curEmi <= interest) curEmi = roundEmi(emi(balance, rate, 1));
        bumped = true;
      }
      var principalPart = round2(curEmi - interest);
      var payment = curEmi;
      // Pay off in full when the EMI covers the rest, or when only EMI rounding is left at the planned end.
      if (principalPart >= balance || (month >= plannedEnd && balance - principalPart <= residual)) {
        principalPart = balance;
        payment = round2(balance + interest);
      }
      var afterEmi = round2(balance - principalPart);
      var extra = 0;
      var want = (prepay[month] || 0) + (rec && month >= rec.from ? rec.amount : 0);
      if (want > 0 && afterEmi > 0) extra = round2(Math.min(want, afterEmi));
      var closing = round2(afterEmi - extra);
      var g = gstRate ? gstOn(interest, gstRate) : 0;
      rows.push({
        month: month,
        date: opts.startDate ? addMonths(opts.startDate, month - 1) : null,
        opening: balance, emi: payment, interest: interest, principal: principalPart,
        extra: extra, gst: g, closing: closing, rate: rate
      });
      totI += interest; totP += principalPart; totX += extra; totG += g;
      balance = closing;
      if (extra > 0 && strategy === "emi" && balance > 0) {
        curEmi = roundEmi(emi(balance, rate, Math.max(1, plannedEnd - month)));
        setResidual(rate, Math.max(1, plannedEnd - month));
      }
    }
    if (bumped) notes.push("emi-raised");
    if (month >= MAX_MONTHS && balance > 0.004) notes.push("not-repaid");
    return {
      rows: rows, emi: firstEmi,
      totalInterest: round2(totI), totalPrincipal: round2(totP), totalExtra: round2(totX), totalGst: round2(totG),
      months: rows.length, finalBalance: round2(balance), notes: notes
    };
  }

  /* ---------- Loan EMI calculator ---------- */

  /*
    loan({
      principal, annualRate, years, months (or totalMonths), method,
      fee: { type, value, min, max }, feeGst (bool), gstRate, feeMode: "upfront" | "deducted" | "financed",
      charges: [{ label, amount, gst (bool) }],
      startDate
    })
  */
  function loan(input) {
    var P = round2(num(input.principal));
    var n = input.totalMonths !== undefined ? Math.floor(num(input.totalMonths)) : tenureMonths(input.years, input.months);
    var rate = num(input.annualRate);
    var errors = validateLoan({ principal: P, annualRate: rate, months: n });
    if (Object.keys(errors).length) return { ok: false, errors: errors };
    var gstRate = num(input.gstRate, 18);
    var fee = feeAmount(input.fee, P);
    var feeGst = input.feeGst ? gstOn(fee, gstRate) : 0;
    var charges = (input.charges || []).filter(function (c) { return num(c.amount) > 0; }).map(function (c) {
      var a = round2(num(c.amount));
      return { label: c.label, amount: a, gst: c.gst ? gstOn(a, gstRate) : 0 };
    });
    var chargesBase = round2(charges.reduce(function (s, c) { return s + c.amount; }, 0));
    var chargesGst = round2(charges.reduce(function (s, c) { return s + c.gst; }, 0));
    var upfront = round2(fee + feeGst + chargesBase + chargesGst);
    var feeMode = input.feeMode || "upfront";
    var financed = feeMode === "financed" ? round2(P + upfront) : P;

    var sched = amortize({ principal: financed, annualRate: rate, months: n, method: input.method, startDate: input.startDate });
    var totalEmi = round2(sched.rows.reduce(function (s, r) { return s + r.emi; }, 0));
    // What actually reaches the borrower on day one.
    var netDisbursed = feeMode === "deducted" ? round2(P - upfront) : P;
    var paidUpfront = feeMode === "upfront" ? upfront : 0;
    var flows = [round2(netDisbursed - paidUpfront)];
    sched.rows.forEach(function (r) { flows.push(-r.emi); });
    var cost = annualCost(flows);
    var equivalentReducing = input.method === "flat" ? annualCost([financed].concat(sched.rows.map(function (r) { return -r.emi; }))).apr : rate;

    return {
      ok: true,
      months: n,
      principal: P,
      financedPrincipal: financed,
      emi: sched.emi,
      schedule: sched,
      totalInterest: sched.totalInterest,
      fee: fee, feeGst: feeGst,
      charges: charges, chargesBase: chargesBase, chargesGst: chargesGst,
      upfrontCharges: upfront,
      // Everything you pay over the loan: instalments plus fees and charges not already inside them.
      totalRepayment: round2(totalEmi + (feeMode === "financed" ? 0 : upfront)),
      totalEmiPaid: totalEmi,
      // Everything paid above the money borrowed (interest + fees + charges + their GST).
      borrowingCost: round2(totalEmi + (feeMode === "financed" ? 0 : upfront) - P),
      netDisbursed: netDisbursed,
      feeMode: feeMode,
      apr: cost.apr,
      effectiveAnnual: cost.effective,
      equivalentReducingRate: equivalentReducing,
      finalBalance: sched.finalBalance
    };
  }

  // Original vs adjusted schedule for the "Repay smarter" planner.
  function prepaymentPlan(input) {
    // Original = the loan as quoted. Adjusted = with prepayments and any rate-change scenario.
    var base = { principal: input.principal, annualRate: input.annualRate, months: input.months, startDate: input.startDate };
    var original = amortize(base);
    var adjusted = amortize(Object.assign({}, base, {
      prepayments: input.prepayments, recurring: input.recurring, strategy: input.strategy,
      rateChanges: input.rateChanges, ratePolicy: input.ratePolicy
    }));
    var gstRate = num(input.gstRate, 18);
    var charge = 0;
    var spec = input.prepaymentCharge || {};
    if (spec.type === "percent") {
      // A percentage charge applies to the amount actually prepaid in the one-time prepayment months.
      var pmonths = {};
      (input.prepayments || []).forEach(function (p) { pmonths[Math.floor(num(p.month))] = true; });
      adjusted.rows.forEach(function (r) {
        if (pmonths[r.month]) {
          var recurringPart = input.recurring && num(input.recurring.amount) > 0 && r.month >= num(input.recurring.fromMonth, 1) ? num(input.recurring.amount) : 0;
          charge += Math.max(0, r.extra - recurringPart) * num(spec.value) / 100;
        }
      });
      charge = round2(charge);
    } else if (spec.type === "fixed") charge = round2(num(spec.value));
    var chargeGst = spec.gst ? gstOn(charge, gstRate) : 0;
    var interestSaved = round2(original.totalInterest - adjusted.totalInterest);
    var lastO = original.rows[original.rows.length - 1], lastA = adjusted.rows[adjusted.rows.length - 1];
    // EMI after the first extra payment (changes only under "keep tenure, lower EMI").
    var newEmi = adjusted.emi;
    for (var i = 0; i < adjusted.rows.length - 1; i++) {
      if (adjusted.rows[i].extra > 0) { newEmi = adjusted.rows[i + 1].emi; break; }
    }
    var lastEmi = adjusted.rows.length ? adjusted.rows[adjusted.rows.length - 1].emi : 0;
    return {
      original: original,
      adjusted: adjusted,
      originalPayoff: lastO ? lastO.date : null,
      newPayoff: lastA ? lastA.date : null,
      originalMonths: original.months,
      newMonths: adjusted.months,
      monthsSaved: original.months - adjusted.months,
      interestSaved: interestSaved,
      charges: round2(charge + chargeGst),
      chargeBase: charge, chargeGst: chargeGst,
      netSavings: round2(interestSaved - charge - chargeGst),
      newEmi: newEmi,
      lastEmi: lastEmi
    };
  }

  // Sum a schedule by loan year (12 instalments each).
  function yearly(rows) {
    var out = [];
    rows.forEach(function (r) {
      var y = Math.ceil(r.month / 12);
      var b = out[y - 1] || (out[y - 1] = { year: y, from: r.date, to: r.date, opening: r.opening, emi: 0, interest: 0, principal: 0, extra: 0, gst: 0, closing: 0 });
      b.emi += r.emi; b.interest += r.interest; b.principal += r.principal; b.extra += r.extra; b.gst += r.gst;
      b.closing = r.closing; b.to = r.date;
    });
    out.forEach(function (b) { ["emi", "interest", "principal", "extra", "gst"].forEach(function (k) { b[k] = round2(b[k]); }); });
    return out;
  }

  // EMI and interest at the current rate ± deltas.
  function rateSensitivity(principal, annualRate, months, deltas) {
    var baseEmi = emi(principal, annualRate, months);
    var baseInt = baseEmi * months - principal;
    return (deltas || [-1, -0.5, 0.5, 1]).map(function (d) {
      var r = Math.max(0, annualRate + d);
      var e = emi(principal, r, months);
      return { delta: d, rate: r, emi: round2(e), emiDiff: round2(e - baseEmi), totalInterest: round2(e * months - principal), interestDiff: round2(e * months - principal - baseInt) };
    });
  }

  // Up to three loan offers side by side.
  function compareLoans(list) {
    var res = list.map(function (s) { return loan(s); });
    var ok = res.filter(function (r) { return r.ok; });
    var cheapest = null, lowestEmi = null;
    ok.forEach(function (r) {
      if (!cheapest || r.borrowingCost < cheapest.borrowingCost) cheapest = r;
      if (!lowestEmi || r.emi < lowestEmi.emi) lowestEmi = r;
    });
    return { results: res, cheapestIndex: res.indexOf(cheapest), lowestEmiIndex: res.indexOf(lowestEmi) };
  }

  /* ---------- No-Cost EMI calculator ---------- */

  var MODES = ["regular", "upfront", "cashback", "lowcost", "custom"];

  /*
    noCost({
      price,                      // selling price
      merchantDiscount, merchantDiscountOnFull (bool, default true),
      bankDiscountEmi,            // bank instant discount only for EMI
      bankDiscountFull,           // bank instant discount only for paying in full
      coupon, couponOnFull (bool, default true),
      downPayment,
      surcharge,                  // convenience / EMI surcharge, paid upfront
      cashbackLater,              // other cashback credited later (EMI option)
      cashbackReceived (bool),    // false: show the cost before that cashback arrives
      fullRewards,                // rewards/cashback expected when paying in full (₹)
      mode, months, annualRate,
      subsidyPct,                 // lowcost: share of the interest the merchant covers
      customUpfront, customCashback, // custom mode
      fee: { type, value, min, max }, feeGst (bool), gstRate,
      gstOnInterest (bool), interestGstRate,
      roundEmi: "rupee" | "paise"
    })
  */
  function noCost(input) {
    var errors = {};
    var price = round2(num(input.price));
    var n = Math.floor(num(input.months));
    var rate = num(input.annualRate, NaN);
    if (!(price > 0)) errors.price = "Enter the product’s selling price.";
    if (!(n >= 1)) errors.months = "Pick a tenure of at least 1 month.";
    else if (n > 60) errors.months = "Card EMIs run up to 60 months here.";
    if (!isFinite(rate) || rate < 0) errors.annualRate = "Enter the interest rate shown at checkout (0% or more).";
    else if (rate > 60) errors.annualRate = "Enter a rate of 60% a year or less.";
    var mode = MODES.indexOf(input.mode) >= 0 ? input.mode : "regular";

    var merchantDisc = round2(Math.max(0, num(input.merchantDiscount)));
    var bankEmi = round2(Math.max(0, num(input.bankDiscountEmi)));
    var bankFull = round2(Math.max(0, num(input.bankDiscountFull)));
    var coupon = round2(Math.max(0, num(input.coupon)));
    var down = round2(Math.max(0, num(input.downPayment)));
    var surcharge = round2(Math.max(0, num(input.surcharge)));
    var later = round2(Math.max(0, num(input.cashbackLater)));
    var rewards = round2(Math.max(0, num(input.fullRewards)));
    var onFullM = input.merchantDiscountOnFull !== false;
    var onFullC = input.couponOnFull !== false;

    var emiBase = round2(price - merchantDisc - bankEmi - coupon - down);
    if (!errors.price && emiBase <= 0) errors.discounts = "Discounts and down payment leave nothing to convert to EMI.";
    if (Object.keys(errors).length) return { ok: false, errors: errors };

    var factor = emiFactor(rate, n);
    var roundTo = input.roundEmi === "paise" ? "paise" : "rupee";
    // Full subvention: the booking principal whose instalments add up to emiBase exactly.
    var fullSubsidy = round2(emiBase - emiBase / (n * factor));
    var upfrontSubsidy = 0, interestCashback = 0;
    if (mode === "upfront") upfrontSubsidy = fullSubsidy;
    else if (mode === "lowcost") upfrontSubsidy = round2(fullSubsidy * clamp(num(input.subsidyPct), 0, 100) / 100);
    else if (mode === "custom") {
      upfrontSubsidy = round2(clamp(num(input.customUpfront), 0, emiBase - 0.01));
      interestCashback = round2(Math.max(0, num(input.customCashback)));
    }
    var booking = round2(emiBase - upfrontSubsidy);

    var interestGstRate = input.gstOnInterest === false ? 0 : num(input.interestGstRate, 18);
    var sched = amortize({ principal: booking, annualRate: rate, months: n, roundEmi: roundTo, gstOnInterest: interestGstRate });
    if (mode === "cashback") interestCashback = sched.totalInterest; // the bank's interest, paid back later

    var feeBase = feeAmount(input.fee, booking);
    var feeGst = input.feeGst === false ? 0 : gstOn(feeBase, num(input.gstRate, 18));
    var totalEmis = round2(sched.rows.reduce(function (s, r) { return s + r.emi; }, 0));
    var paidUpfront = round2(down + surcharge);
    var totalPaid = round2(paidUpfront + totalEmis + sched.totalGst + feeBase + feeGst);
    var cashbacks = round2(interestCashback + later);
    var cashbackPending = input.cashbackReceived === false;
    var effective = round2(totalPaid - (cashbackPending ? 0 : cashbacks));

    var fullPay = round2(price - (onFullM ? merchantDisc : 0) - (onFullC ? coupon : 0) - bankFull);
    var fullNet = round2(fullPay - rewards);
    var diff = round2(effective - fullNet);

    // Cash flows for an annual-cost figure (rupee benefit of paying later).
    var flows = [round2(fullNet - paidUpfront - feeBase - feeGst)];
    sched.rows.forEach(function (r) { flows.push(-(r.emi + r.gst)); });
    if (!cashbackPending && cashbacks > 0) {
      var cbMonth = Math.min(n, Math.max(1, Math.round(num(input.cashbackMonth, 3))));
      flows[cbMonth] += cashbacks;
    }
    var cost = annualCost(flows);

    return {
      ok: true,
      mode: mode,
      months: n,
      annualRate: rate,
      price: price,
      discounts: { merchant: merchantDisc, bankEmi: bankEmi, coupon: coupon, bankFull: bankFull },
      downPayment: down,
      surcharge: surcharge,
      emiBase: emiBase,                  // amount converted before any interest subsidy
      upfrontSubsidy: upfrontSubsidy,    // merchant-funded discount that cuts the booking
      bookingPrincipal: booking,         // what the bank actually lends
      emi: sched.emi,
      lastEmi: sched.rows.length ? sched.rows[sched.rows.length - 1].emi : 0,
      schedule: sched,
      interest: sched.totalInterest,     // interest the bank charges on the statement
      interestGst: sched.totalGst,
      interestSubsidy: round2(upfrontSubsidy + interestCashback),
      interestCashback: interestCashback,
      fee: feeBase, feeGst: feeGst,
      otherCashback: later,
      cashbacks: cashbacks,
      cashbackPending: cashbackPending,
      totalEmis: totalEmis,
      totalPaid: totalPaid,              // everything that leaves your account for the EMI option
      effectiveCost: effective,          // after cashback (if received)
      fullPay: fullPay,
      fullRewards: rewards,
      fullNet: fullNet,
      difference: diff,                  // + means EMI costs more than paying in full
      apr: cost.apr,
      fullSubsidy: fullSubsidy
    };
  }

  // A plain-English verdict from a noCost() result.
  function verdict(res, opts) {
    var o = opts || {};
    if (!res || !res.ok) return { kind: "invalid" };
    var d = res.difference;
    var tolerance = 1; // rupee rounding
    if (o.unverified) return { kind: "insufficient", amount: d };
    if (Math.abs(d) <= tolerance) return { kind: "same", amount: 0 };
    if (d < 0) return { kind: "cheaper", amount: -d };
    if (res.mode === "upfront" || res.mode === "cashback" || res.mode === "lowcost" || res.interestSubsidy > 0) return { kind: "extra", amount: d };
    return { kind: "costlier", amount: d };
  }

  // Outstanding principal and cost to close after k instalments.
  function foreclosure(res, afterInstalments, spec) {
    if (!res || !res.ok) return null;
    var k = clamp(Math.floor(num(afterInstalments)), 0, res.months);
    var rows = res.schedule.rows;
    var outstanding = k === 0 ? res.bookingPrincipal : rows[k - 1].closing;
    var s = spec || {};
    var feeBase = 0;
    if (outstanding > 0) {
      feeBase = num(s.percent) * outstanding / 100;
      if (num(s.min) > 0) feeBase = Math.max(feeBase, num(s.min));
      feeBase = round2(feeBase);
    }
    var gstRate = num(s.gstRate, 18);
    var feeGst = s.gst === false ? 0 : gstOn(feeBase, gstRate);
    var accrued = round2(Math.max(0, num(s.accruedInterest)));
    var accruedGst = s.gst === false ? 0 : gstOn(accrued, gstRate);
    var paidSoFar = 0;
    for (var i = 0; i < k; i++) paidSoFar += rows[i].emi + rows[i].gst;
    var reversal = s.reverseSubsidy ? res.interestSubsidy : 0;
    var toClose = round2(outstanding + feeBase + feeGst + accrued + accruedGst + reversal);
    return {
      afterInstalments: k,
      outstanding: outstanding,
      fee: feeBase, feeGst: feeGst, accrued: accrued, accruedGst: accruedGst,
      subsidyReversed: reversal,
      toClose: toClose,
      paidSoFar: round2(paidSoFar),
      totalCost: round2(res.downPayment + res.surcharge + res.fee + res.feeGst + paidSoFar + toClose)
    };
  }

  /* ---------- Issuer EMI rules ---------- */

  // Status of an issuer programme on a date (ISO). Expired and unverified rules never auto-fill.
  function ruleStatus(rule, todayIso) {
    if (!rule) return "unverified";
    var today = todayIso || new Date().toISOString().slice(0, 10);
    if (rule.validTo && rule.validTo < today) return "expired";
    if (rule.validFrom && rule.validFrom > today) return "upcoming";
    if (!rule.verifiedOn || !rule.source) return "unverified";
    return rule.status === "partial" ? "partial" : rule.status === "verified" ? "verified" : "unverified";
  }
  // Rate / fee for a tenure, only from a usable rule.
  function ruleTerms(rule, months, todayIso) {
    var st = ruleStatus(rule, todayIso);
    var out = { status: st, rate: null, fee: null, tenureSupported: null };
    if (st !== "verified" && st !== "partial") return out;
    if (rule.tenures && rule.tenures.length) out.tenureSupported = rule.tenures.indexOf(months) >= 0;
    if (rule.rates) {
      var r = rule.rates[months];
      if (r === undefined && rule.rates.all !== undefined) r = rule.rates.all;
      if (typeof r === "number" && out.tenureSupported !== false) out.rate = r;
    }
    if (rule.fee) {
      if (rule.fee.byTenure) {
        var f = rule.fee.byTenure[months];
        if (typeof f === "number" && out.tenureSupported !== false) out.fee = { type: f === 0 ? "none" : "fixed", value: f };
      } else if (rule.fee.type && (rule.fee.exact !== false)) {
        out.fee = { type: rule.fee.type, value: rule.fee.value, min: rule.fee.min, max: rule.fee.max };
      }
    }
    return out;
  }

  return {
    MAX_MONTHS: MAX_MONTHS,
    MODES: MODES,
    round2: round2,
    parseAmount: parseAmount,
    formatINR: formatINR,
    formatNumber: formatNumber,
    formatPct: formatPct,
    formatDate: formatDate,
    addMonths: addMonths,
    monthsLabel: monthsLabel,
    tenureMonths: tenureMonths,
    emiFactor: emiFactor,
    emi: emi,
    nper: nper,
    flatEmi: flatEmi,
    irrMonthly: irrMonthly,
    annualCost: annualCost,
    feeAmount: feeAmount,
    gstOn: gstOn,
    validateLoan: validateLoan,
    amortize: amortize,
    loan: loan,
    prepaymentPlan: prepaymentPlan,
    yearly: yearly,
    rateSensitivity: rateSensitivity,
    compareLoans: compareLoans,
    noCost: noCost,
    verdict: verdict,
    foreclosure: foreclosure,
    ruleStatus: ruleStatus,
    ruleTerms: ruleTerms
  };
});
