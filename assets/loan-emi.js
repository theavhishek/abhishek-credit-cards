/* Loan EMI calculator page (/calculator/loan-emi). Engine: emi-core.js. Helpers: emi-ui.js. */
(function () {
  "use strict";
  var E = window.EmiCore, U = window.EmiUI;
  if (!E || !U) return;
  var $ = U.$, $$ = U.$$, fmt = E.formatINR;
  var form = $("#loanForm");
  if (!form) return;

  var DEFAULTS = {
    amount: "10,00,000", rate: "10.5", method: "reducing", years: "5", months: "0", startDate: "",
    feeType: "percent", feeValue: "1", feeMin: "", feeMax: "", feeGst: true, feeMode: "deducted",
    docCharge: "", docGst: true, insCharge: "", insGst: false, otherCharge: "", otherGst: false, gstRate: "18",
    ppAmount: "", ppMonth: "12", ppChargeValue: "", ppChargeType: "percent", ppChargeGst: true,
    recAmount: "", recFrom: "1", strategy: "tenure", rcOn: false, rcRate: "11", rcMonth: "13", rcPolicy: "tenure",
    view: "monthly"
  };
  var COLORS = function () {
    var cs = getComputedStyle(document.querySelector(".ce"));
    return { principal: cs.getPropertyValue("--ce-principal").trim(), interest: cs.getPropertyValue("--ce-interest").trim() };
  };

  var el = function (id) { return document.getElementById(id); };
  var radio = function (name) { var r = form.ownerDocument.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ""; };
  var setRadio = function (name, v) { $$('input[name="' + name + '"]').forEach(function (r) { r.checked = r.value === v; }); };

  var amountRange = U.bindRange(el("amountRange"), el("amount"), { log: true, snap: U.snapAmount, text: function (v) { return fmt(v); } });
  var rateRange = U.bindRange(el("rateRange"), el("rate"), { snap: function (v) { return Math.round(v * 20) / 20; }, text: function (v) { return v + "% a year"; } });

  var state = null; // last calculation, for exports

  function readInputs() {
    var feeType = radio("feeType");
    return {
      principal: U.readNum(el("amount")),
      annualRate: U.readNum(el("rate")),
      method: radio("method"),
      years: el("years").value === "" ? 0 : parseInt(el("years").value, 10),
      months: el("months").value === "" ? 0 : parseInt(el("months").value, 10),
      startDate: el("startDate").value || "",
      fee: { type: feeType, value: feeType === "percent" ? U.readNum(el("feeValue")) : E.parseAmount(el("feeValue").value), min: feeType === "percent" ? U.readNum(el("feeMin")) : NaN, max: feeType === "percent" ? U.readNum(el("feeMax")) : NaN },
      feeGst: el("feeGst").checked,
      gstRate: isFinite(U.readNum(el("gstRate"))) ? U.readNum(el("gstRate")) : 18,
      feeMode: radio("feeMode"),
      charges: [
        { label: "Documentation charges", amount: U.readNum(el("docCharge")) || 0, gst: el("docGst").checked },
        { label: "Insurance premium", amount: U.readNum(el("insCharge")) || 0, gst: el("insGst").checked },
        { label: "Other upfront charges", amount: U.readNum(el("otherCharge")) || 0, gst: el("otherGst").checked }
      ]
    };
  }

  function readPlan(total) {
    var pp = U.readNum(el("ppAmount")) || 0;
    var ppMonth = Math.max(1, Math.min(total, parseInt(el("ppMonth").value, 10) || 1));
    var rec = U.readNum(el("recAmount")) || 0;
    var recFrom = Math.max(1, parseInt(el("recFrom").value, 10) || 1);
    var rcOn = el("rcOn").checked;
    var rcRate = U.readNum(el("rcRate"));
    var rcMonth = Math.max(2, parseInt(el("rcMonth").value, 10) || 2);
    return {
      prepayments: pp > 0 ? [{ month: ppMonth, amount: pp }] : [],
      recurring: rec > 0 ? { amount: rec, fromMonth: recFrom } : null,
      strategy: radio("strategy"),
      rateChanges: rcOn && isFinite(rcRate) && rcRate >= 0 && rcRate <= 60 ? [{ month: rcMonth, rate: rcRate }] : [],
      ratePolicy: radio("rcPolicy"),
      prepaymentCharge: { type: el("ppChargeType").value, value: U.readNum(el("ppChargeValue")) || 0, gst: el("ppChargeGst").checked },
      active: pp > 0 || rec > 0 || (rcOn && isFinite(rcRate)),
      ppMonth: ppMonth
    };
  }

  function dateFor(input, month) {
    return input.startDate ? E.formatDate(E.addMonths(input.startDate, month - 1)) : "";
  }

  function render() {
    var input = readInputs();
    var total = E.tenureMonths(input.years, input.months);

    // Tenure line and method hints
    U.setText(el("tenureTotal").querySelector("strong") || el("tenureTotal"), total ? total + (total === 1 ? " month" : " months") + (total >= 12 && total % 12 ? " (" + E.monthsLabel(total) + ")" : "") : "0 months");
    el("methodHint").textContent = input.method === "flat"
      ? "Flat rate charges interest on the full original amount for the whole tenure. It is not the same as a reducing-balance rate with the same number; the APR below shows its true cost."
      : "Reducing balance charges interest only on what you still owe, as home, car and most personal loans do.";
    var pct = input.fee.type === "percent";
    $$("[data-pct-only]").forEach(function (n) { n.hidden = !pct; });
    el("feeFields").hidden = input.fee.type === "none";
    el("feeValueLabel").textContent = pct ? "Fee (% of loan)" : "Fee ₹";
    el("feeModeHint").textContent = {
      deducted: "Most lenders deduct the fee: the EMI stays the same, but less money reaches your account.",
      upfront: "You pay the fee and charges yourself and receive the full loan amount.",
      financed: "The fee and charges are added to the loan, so you pay interest on them through a higher EMI."
    }[input.feeMode];
    var feeTxt = input.fee.type === "none" ? "No fee" : pct ? (isFinite(input.fee.value) ? input.fee.value : 0) + "%" : fmt(input.fee.value || 0);
    el("feesSummary").textContent = feeTxt + (input.fee.type !== "none" && input.feeGst ? " + GST" : "") + ", " + { deducted: "deducted", upfront: "paid separately", financed: "added to loan" }[input.feeMode];

    var res = E.loan(input);
    // Field errors
    U.setError(el("amount"), res.errors && res.errors.principal);
    U.setError(el("rate"), res.errors && res.errors.annualRate);
    el("months-err").textContent = (res.errors && res.errors.months) || "";
    if (isFinite(input.principal)) amountRange.sync();
    if (isFinite(input.annualRate)) rateRange.sync();
    if (!res.ok) { state = null; return; }

    var plan = readPlan(res.months);
    var flat = input.method === "flat";
    el("flatNote").hidden = !flat;
    var pp = E.prepaymentPlan({
      principal: res.financedPrincipal, annualRate: input.annualRate, months: res.months, startDate: input.startDate,
      prepayments: flat ? [] : plan.prepayments, recurring: flat ? null : plan.recurring, strategy: plan.strategy,
      rateChanges: flat ? [] : plan.rateChanges, ratePolicy: plan.ratePolicy,
      prepaymentCharge: plan.prepaymentCharge, gstRate: input.gstRate
    });
    var useAdjusted = plan.active && !flat;
    var sched = useAdjusted ? pp.adjusted : res.schedule;
    state = { input: input, res: res, plan: plan, pp: pp, sched: sched, useAdjusted: useAdjusted };

    // Results
    var endDate = input.startDate ? E.formatDate(E.addMonths(input.startDate, res.months - 1)) : "";
    U.setText(el("outEmi"), fmt(res.emi), true);
    U.setText(el("outEmiSub"), "for " + res.months + " months (" + E.monthsLabel(res.months) + ")" + (endDate ? ", last EMI " + endDate : "") + (flat ? ", flat rate" : ""));
    U.setText(el("outPrincipal"), fmt(res.principal));
    U.setText(el("outInterest"), fmt(res.totalInterest), true);
    U.setText(el("outFee"), fmt(res.fee));
    U.setText(el("outFeeGst"), fmt(res.feeGst));
    U.setText(el("outCharges"), fmt(res.chargesBase + res.chargesGst));
    el("outChargesNote").textContent = res.chargesGst ? "(incl. " + fmt(res.chargesGst) + " GST)" : "";
    U.setText(el("outTotal"), fmt(res.totalRepayment), true);
    U.setText(el("outCost"), fmt(res.borrowingCost), true);
    el("outNetRow").hidden = res.feeMode !== "deducted" || res.upfrontCharges === 0;
    U.setText(el("outNet"), fmt(res.netDisbursed));
    U.setText(el("outApr"), E.formatPct(res.apr, 2));
    var gap = res.apr - input.annualRate;
    var note;
    if (flat) note = "A " + input.annualRate + "% flat rate works out to about " + E.formatPct(res.equivalentReducingRate, 2) + " on a reducing balance" + (res.upfrontCharges ? ", and " + E.formatPct(res.apr, 2) + " once fees and charges are added." : ".");
    else if (Math.abs(gap) < 0.005) note = "With no fees or charges, the effective annual cost equals the quoted " + input.annualRate + "% rate.";
    else note = "Quoted rate " + input.annualRate + "%, but fees and charges push the effective annual cost to " + E.formatPct(res.apr, 2) + ". APR is the yearly rate that matches what you receive with every EMI you pay. Compounded monthly it is " + E.formatPct(res.effectiveAnnual, 2) + " a year.";
    el("aprNote").textContent = note;

    var c = COLORS();
    var p = res.financedPrincipal, i = res.totalInterest;
    U.donut(el("donut"), [{ value: p, color: c.principal }, { value: i, color: c.interest }]);
    var pctP = p + i > 0 ? Math.round((p / (p + i)) * 100) : 100;
    el("lgPrincipal").textContent = pctP + "%";
    el("lgInterest").textContent = (100 - pctP) + "%";
    el("donut").setAttribute("aria-label", "Principal " + pctP + "% (" + fmt(p) + "), interest " + (100 - pctP) + "% (" + fmt(i) + ")");

    renderChart(input, res, pp, useAdjusted, c);
    renderRepay(input, res, pp, plan, flat);
    renderSensitivity(input, res);
    renderSchedule(input, sched);
    syncScenarioA(input);
    renderCompare();
  }

  function balances(s, P) { return [P].concat(s.rows.map(function (r) { return r.closing; })); }

  function renderChart(input, res, pp, useAdjusted, c) {
    var series = [{ name: useAdjusted ? "Original plan" : "Balance", values: balances(pp.original, res.financedPrincipal), cls: "is-orig" + (useAdjusted ? " is-dashed" : ""), color: c.principal }];
    if (useAdjusted) series.push({ name: "With your changes", values: balances(pp.adjusted, res.financedPrincipal), cls: "is-adj", color: c.interest });
    el("balanceLegend").innerHTML = series.map(function (s) {
      return '<span><i class="' + (s.cls.indexOf("dashed") >= 0 ? "is-dashed" : "") + '" style="background:' + s.color + '"></i>' + U.esc(s.name) + "</span>";
    }).join("");
    U.lineChart(el("balanceChart"), series, {
      label: "Loan balance from " + fmt(res.financedPrincipal) + " to zero over " + E.monthsLabel(pp.original.months) + (useAdjusted ? "; with your changes it ends after " + E.monthsLabel(pp.adjusted.months) : ""),
      hitLabel: "Loan balance by month. Use the arrow keys to move.",
      dateFor: function (m) { return m > 0 ? dateFor(input, m) : ""; }
    });
  }

  function renderRepay(input, res, pp, plan, flat) {
    var origEnd = pp.originalPayoff ? E.formatDate(pp.originalPayoff) : "EMI " + pp.originalMonths;
    var newEnd = pp.newPayoff ? E.formatDate(pp.newPayoff) : "EMI " + pp.newMonths;
    el("rpOrigEnd").textContent = origEnd;
    el("rpOrigMonths").textContent = E.monthsLabel(pp.originalMonths);
    el("rpNewEnd").textContent = plan.active && !flat ? newEnd : "—";
    el("rpNewMonths").textContent = plan.active && !flat ? E.monthsLabel(pp.newMonths) : "";
    var saved = pp.monthsSaved;
    el("rpMonths").textContent = saved >= 0 ? String(saved) : "+" + (-saved) + " longer";
    el("rpInterestLabel").textContent = pp.interestSaved < 0 ? "Extra interest" : "Interest saved";
    el("rpInterest").textContent = fmt(Math.abs(pp.interestSaved));
    el("rpCharges").textContent = fmt(pp.charges);
    el("rpNetLabel").textContent = pp.netSavings < 0 ? "Net extra cost" : "Net saving";
    el("rpNet").textContent = fmt(Math.abs(pp.netSavings));
    el("rpNet").parentNode.classList.toggle("is-good", pp.netSavings >= 0);
    el("rpNewEmiBox").hidden = !((plan.strategy === "emi" && (plan.prepayments.length || plan.recurring)) || (plan.rateChanges.length && plan.ratePolicy === "emi"));
    var emiAfter = pp.newEmi;
    if (plan.rateChanges.length) {
      var row = pp.adjusted.rows[plan.rateChanges[0].month - 1];
      if (row) emiAfter = row.emi;
    }
    el("rpNewEmi").textContent = fmt(emiAfter);
    var notes = [];
    if (plan.rateChanges.length) notes.push("Rate-change scenario: " + plan.rateChanges[0].rate + "% from EMI " + plan.rateChanges[0].month + ", then " + (plan.ratePolicy === "emi" ? "a new EMI over the same end date" : "the same EMI over a " + (plan.rateChanges[0].rate > input.annualRate ? "longer" : "shorter") + " tenure") + ". It shows the arithmetic of a change, not a prediction of what your lender will do.");
    if (pp.adjusted.notes.indexOf("emi-raised") >= 0) notes.push("At this rate the old EMI wouldn’t cover the interest, so the EMI is raised to finish by the planned end. Lenders do the same.");
    if (plan.rateChanges.length && (plan.prepayments.length || plan.recurring)) notes.push("The new payoff and savings include both your prepayments and the rate change.");
    if (plan.prepayments.length && plan.ppMonth > pp.original.months) notes.push("The prepayment month is after the loan ends.");
    el("rpNote").hidden = !notes.length;
    el("rpNote").textContent = notes.join(" ");
    el("ppMonthDate").textContent = input.startDate ? dateFor(input, plan.ppMonth) : "";
    el("ppMonth").max = String(res.months);
    var bits = [];
    if (plan.prepayments.length) bits.push(fmt(plan.prepayments[0].amount) + " once");
    if (plan.recurring) bits.push(fmt(plan.recurring.amount) + "/month");
    if (plan.rateChanges.length) bits.push("rate " + plan.rateChanges[0].rate + "%");
    el("repaySummary").textContent = bits.length ? bits.join(", ") + (pp.netSavings > 0 ? " · saves " + fmt(pp.netSavings) : "") : "Off";
    el("rcFields").hidden = !el("rcOn").checked;
  }

  function renderSensitivity(input, res) {
    var n = res.months, P = res.financedPrincipal;
    var rows = E.rateSensitivity(P, input.annualRate, n, [-1, -0.5, 0, 0.5, 1]).filter(function (r) { return r.rate >= 0; });
    var seen = {};
    el("sensBody").innerHTML = rows.filter(function (r) { var k = r.rate.toFixed(2); if (seen[k]) return false; seen[k] = 1; return true; }).map(function (r) {
      var cur = r.delta === 0;
      var cls = function (v) { return v > 0.5 ? "is-pos" : v < -0.5 ? "is-neg" : ""; };
      var sign = function (v) { return Math.abs(v) < 0.5 ? "—" : (v > 0 ? "+" : "−") + fmt(Math.abs(v)).replace("−", ""); };
      return '<tr class="' + (cur ? "is-current" : "") + '"><th scope="row">' + (Math.round(r.rate * 100) / 100) + "%" + (cur ? " (yours)" : "") + "</th><td>" + fmt(r.emi) + '</td><td class="' + cls(r.emiDiff) + '">' + sign(r.emiDiff) + "</td><td>" + fmt(r.totalInterest) + '</td><td class="' + cls(r.interestDiff) + '">' + sign(r.interestDiff) + "</td></tr>";
    }).join("");
    var plus = rows.filter(function (r) { return r.delta === 1; })[0];
    el("rateIntro").textContent = "The same loan at rates 0.5% and 1% either side of yours." + (plus ? " One percentage point more costs " + fmt(plus.emiDiff) + " a month and " + fmt(plus.interestDiff) + " over the loan." : "") + (input.method === "flat" ? " Shown on a reducing-balance basis." : "");
  }

  function renderSchedule(input, s) {
    var yearlyView = radio("view") === "yearly";
    var hasDates = !!input.startDate;
    var hasExtra = s.totalExtra > 0;
    var head, body = "", foot;
    if (yearlyView) {
      head = "<tr><th scope=\"col\">Year</th>" + (hasDates ? "<th scope=\"col\">Period</th>" : "") + "<th scope=\"col\">Opening balance</th><th scope=\"col\">EMIs paid</th><th scope=\"col\">Interest</th><th scope=\"col\">Principal</th>" + (hasExtra ? "<th scope=\"col\">Prepaid</th>" : "") + "<th scope=\"col\">Closing balance</th></tr>";
      E.yearly(s.rows).forEach(function (y) {
        body += "<tr><th scope=\"row\">" + y.year + "</th>" + (hasDates ? "<td>" + E.formatDate(y.from) + " – " + E.formatDate(y.to) + "</td>" : "") + "<td>" + fmt(y.opening) + "</td><td>" + fmt(y.emi) + "</td><td>" + fmt(y.interest) + "</td><td>" + fmt(y.principal) + "</td>" + (hasExtra ? "<td>" + fmt(y.extra) + "</td>" : "") + "<td>" + fmt(y.closing) + "</td></tr>";
      });
    } else {
      head = "<tr><th scope=\"col\">EMI</th>" + (hasDates ? "<th scope=\"col\">Date</th>" : "") + "<th scope=\"col\">Opening balance</th><th scope=\"col\">EMI</th><th scope=\"col\">Interest</th><th scope=\"col\">Principal</th>" + (hasExtra ? "<th scope=\"col\">Prepaid</th>" : "") + "<th scope=\"col\">Closing balance</th></tr>";
      var parts = [];
      s.rows.forEach(function (r) {
        parts.push("<tr><th scope=\"row\">" + r.month + "</th>" + (hasDates ? "<td>" + E.formatDate(r.date, true) + "</td>" : "") + "<td>" + fmt(r.opening, 0) + "</td><td>" + fmt(r.emi, 0) + "</td><td>" + fmt(r.interest) + "</td><td>" + fmt(r.principal) + "</td>" + (hasExtra ? "<td>" + (r.extra ? fmt(r.extra) : "—") + "</td>" : "") + "<td>" + fmt(r.closing) + "</td></tr>");
      });
      body = parts.join("");
    }
    var totEmi = s.rows.reduce(function (a, r) { return a + r.emi; }, 0);
    foot = "<tr><th scope=\"row\">Total</th>" + (hasDates ? "<td></td>" : "") + "<td></td><td>" + fmt(totEmi) + "</td><td>" + fmt(s.totalInterest) + "</td><td>" + fmt(s.totalPrincipal) + "</td>" + (hasExtra ? "<td>" + fmt(s.totalExtra) + "</td>" : "") + "<td>" + fmt(s.finalBalance) + "</td></tr>";
    el("schedHead").innerHTML = head;
    el("schedBody").innerHTML = body;
    el("schedFoot").innerHTML = foot;
    el("scheduleCheck").textContent = (Math.abs(s.finalBalance) < 0.01 ? "Balance reaches ₹0 after EMI " + s.months + "." : "Balance left: " + fmt(s.finalBalance, 2)) + " Amounts rounded to the rupee; the last EMI absorbs rounding.";
  }

  /* ---------- Comparison ---------- */
  var scnTouched = { a: false };
  function scnRead(box) {
    var q = function (n) { return box.querySelector('[data-f="' + n + '"]'); };
    var type = q("feeType").value;
    return {
      principal: E.parseAmount(q("amount").value),
      annualRate: parseFloat(q("rate").value),
      years: parseInt(q("years").value, 10) || 0,
      months: parseInt(q("months").value, 10) || 0,
      fee: { type: type, value: type === "percent" ? parseFloat(q("feeValue").value) : E.parseAmount(q("feeValue").value) },
      feeGst: true, gstRate: 18, feeMode: "deducted",
      charges: [{ label: "Upfront charges", amount: E.parseAmount(q("charges").value) || 0, gst: false }]
    };
  }
  function syncScenarioA(input) {
    if (scnTouched.a) return;
    var a = $('[data-scn="a"]');
    if (!a) return;
    var q = function (n) { return a.querySelector('[data-f="' + n + '"]'); };
    if (document.activeElement && a.contains(document.activeElement)) return;
    q("amount").value = isFinite(input.principal) ? E.formatNumber(input.principal, 2) : "";
    q("rate").value = isFinite(input.annualRate) ? String(input.annualRate) : "";
    q("years").value = String(input.years || 0);
    q("months").value = String(input.months || 0);
    var t = input.fee.type === "none" ? "none" : input.fee.type;
    q("feeType").value = t;
    q("feeValue").value = t === "none" ? "" : isFinite(input.fee.value) ? String(input.fee.value) : "";
    var ch = input.charges.reduce(function (s, c) { return s + c.amount; }, 0);
    q("charges").value = ch ? E.formatNumber(ch, 2) : "";
  }
  function renderCompare() {
    var boxes = $$("[data-scn]");
    var inputs = boxes.map(scnRead);
    var cmp = E.compareLoans(inputs);
    boxes.forEach(function (box, k) {
      var r = cmp.results[k];
      var out = box.querySelector(".ce-scn-out");
      box.classList.toggle("is-best", k === cmp.cheapestIndex && cmp.results.filter(function (x) { return x.ok; }).length > 1);
      if (!r.ok) { out.innerHTML = '<p class="ce-error">' + U.esc(Object.values(r.errors)[0]) + "</p>"; return; }
      out.innerHTML = '<dl class="ce-list">' +
        "<div><dt>EMI</dt><dd>" + fmt(r.emi) + "</dd></div>" +
        "<div><dt>Total interest</dt><dd>" + fmt(r.totalInterest) + "</dd></div>" +
        "<div><dt>Fees and charges</dt><dd>" + fmt(r.upfrontCharges) + "</dd></div>" +
        '<div class="is-strong"><dt>Total cost</dt><dd>' + fmt(r.borrowingCost) + "</dd></div>" +
        "<div><dt>Effective annual cost</dt><dd>" + E.formatPct(r.apr, 2) + "</dd></div></dl>" +
        (k === cmp.cheapestIndex && boxes.length > 1 ? '<span class="ce-badge is-ok">Costs least</span>' : "");
    });
    var ok = cmp.results.map(function (r, k) { return { r: r, k: k }; }).filter(function (x) { return x.r.ok; });
    var names = ["A", "B", "C"];
    if (ok.length < 2) { el("cmpExplain").textContent = "Fill in at least two offers to compare them."; return; }
    var best = cmp.results[cmp.cheapestIndex];
    var sorted = ok.slice().sort(function (a, b) { return a.r.borrowingCost - b.r.borrowingCost; });
    var next = sorted[1];
    var txt = "Offer " + names[cmp.cheapestIndex] + " costs least: " + fmt(best.borrowingCost) + " in interest, fees and charges, " + fmt(next.r.borrowingCost - best.borrowingCost) + " less than offer " + names[next.k] + ".";
    if (cmp.lowestEmiIndex !== cmp.cheapestIndex) {
      var low = cmp.results[cmp.lowestEmiIndex];
      txt += " Offer " + names[cmp.lowestEmiIndex] + " has the lowest EMI (" + fmt(low.emi) + ") but costs " + fmt(low.borrowingCost - best.borrowingCost) + " more overall" + (low.months > best.months ? ", because you pay interest for longer." : ".");
    } else if (best.apr < Math.min.apply(null, ok.filter(function (x) { return x.k !== cmp.cheapestIndex; }).map(function (x) { return x.r.apr; }))) {
      txt += " It also has the lowest effective annual cost.";
    }
    var amounts = ok.map(function (x) { return x.r.principal; });
    if (Math.max.apply(null, amounts) !== Math.min.apply(null, amounts)) txt += " The loan amounts differ, so compare the effective annual cost too.";
    el("cmpExplain").textContent = txt;
  }

  /* ---------- Exports ---------- */
  function summaryText() {
    if (!state) return "";
    var r = state.res, i = state.input;
    var lines = [
      "Loan EMI summary (avhishek.in/calculator/loan-emi)",
      "Loan amount: " + fmt(r.principal),
      "Interest rate: " + i.annualRate + "% a year (" + (i.method === "flat" ? "flat" : "reducing balance") + ")",
      "Tenure: " + r.months + " months (" + E.monthsLabel(r.months) + ")",
      "Monthly EMI: " + fmt(r.emi),
      "Total interest: " + fmt(r.totalInterest),
      "Processing fee: " + fmt(r.fee) + " + GST " + fmt(r.feeGst),
      "Other charges: " + fmt(r.chargesBase + r.chargesGst),
      "Total repayment: " + fmt(r.totalRepayment),
      "Cost above principal: " + fmt(r.borrowingCost),
      r.feeMode === "deducted" && r.upfrontCharges ? "Money you receive: " + fmt(r.netDisbursed) : null,
      "Effective annual cost (APR): " + E.formatPct(r.apr, 2)
    ];
    if (state.useAdjusted) {
      lines.push("With your prepayment plan: ends after " + E.monthsLabel(state.pp.newMonths) + ", interest saved " + fmt(state.pp.interestSaved) + ", net saving " + fmt(state.pp.netSavings));
    }
    return lines.filter(Boolean).join("\n");
  }
  function exportCsv() {
    if (!state) return;
    var s = state.sched, i = state.input;
    var rows = [["EMI no.", "Date", "Opening balance", "EMI", "Interest", "Principal", "Prepayment", "Closing balance", "Rate %"]];
    s.rows.forEach(function (r) { rows.push([r.month, r.date || "", r.opening.toFixed(2), r.emi.toFixed(2), r.interest.toFixed(2), r.principal.toFixed(2), r.extra.toFixed(2), r.closing.toFixed(2), r.rate]); });
    rows.push([]);
    summaryText().split("\n").forEach(function (l) { var k = l.indexOf(": "); rows.push(k > 0 ? [l.slice(0, k), l.slice(k + 2)] : [l]); });
    U.download("loan-emi-schedule-" + Math.round(state.res.principal) + "-" + i.annualRate + "pct-" + state.res.months + "m.csv", U.csv(rows));
  }

  function reset() {
    Object.keys(DEFAULTS).forEach(function (k) {
      var v = DEFAULTS[k];
      if (["method", "feeType", "feeMode", "strategy", "rcPolicy", "view"].indexOf(k) >= 0) { setRadio(k, v); return; }
      var n = el(k);
      if (!n) return;
      if (n.type === "checkbox") n.checked = v; else n.value = v;
    });
    $$("[data-scn]").forEach(function (box) { scnDefaults(box); });
    scnTouched.a = false;
    el("repay").open = false;
    render();
  }

  /* ---------- Scenario markup defaults ---------- */
  var SCN = { a: null, b: { rate: "9.99", years: "5", months: "0", feeType: "fixed", feeValue: "15000", charges: "" }, c: { rate: "11.25", years: "6", months: "0", feeType: "none", feeValue: "", charges: "" } };
  function scnDefaults(box) {
    var id = box.dataset.scn, d = SCN[id];
    var q = function (n) { return box.querySelector('[data-f="' + n + '"]'); };
    if (!d) return;
    q("amount").value = "10,00,000";
    ["rate", "years", "months", "feeType", "feeValue", "charges"].forEach(function (k) { q(k).value = d[k]; });
  }

  /* ---------- Wiring ---------- */
  var schedule = U.scheduler(render);
  $$("input[data-money]", form).forEach(function (n) { U.bindMoney(n, schedule); });
  $$("#repay input[data-money]").forEach(function (n) { U.bindMoney(n, schedule); });
  form.addEventListener("input", schedule);
  form.addEventListener("change", schedule);
  el("repay").addEventListener("input", schedule);
  el("repay").addEventListener("change", schedule);
  $$('input[name="view"]').forEach(function (r) { r.addEventListener("change", schedule); });
  $$("[data-scn]").forEach(function (box) {
    if (box.dataset.scn !== "a") scnDefaults(box);
    $$("input[data-money]", box).forEach(function (n) { U.bindMoney(n, function () {}); });
    box.addEventListener("input", function () { if (box.dataset.scn === "a") scnTouched.a = true; renderCompare(); });
    box.addEventListener("change", function () { if (box.dataset.scn === "a") scnTouched.a = true; renderCompare(); });
  });
  // Keep the whole number visible: no stray wheel changes on number fields.
  $$('input[type="number"]').forEach(function (n) { n.addEventListener("wheel", function () { if (document.activeElement === n) n.blur(); }, { passive: true }); });

  var status = el("status");
  el("btnCopy").addEventListener("click", function () {
    U.copy(summaryText()).then(function () { U.confirm(el("btnCopy"), status, "Summary copied."); }, function () { U.confirm(null, status, "Couldn’t copy. Select the results and copy them instead."); });
  });
  el("btnCsv").addEventListener("click", function () { exportCsv(); U.confirm(el("btnCsv"), status, "Schedule downloaded as CSV."); });
  el("btnPrint").addEventListener("click", function () { window.print(); });
  el("btnReset").addEventListener("click", function () { reset(); U.confirm(el("btnReset"), status, "Back to the default loan."); });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", schedule);
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener("resize", U.scheduler(function () { if (state) renderChart(state.input, state.res, state.pp, state.useAdjusted, COLORS()); }));

  render();
})();
