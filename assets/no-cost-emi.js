/* No-Cost EMI calculator page (/calculator/no-cost-emi).
   Engine: emi-core.js. Issuer terms: emi-issuers.js. Helpers: emi-ui.js. */
(function () {
  "use strict";
  var E = window.EmiCore, U = window.EmiUI, DATA = window.EMI_ISSUERS;
  if (!E || !U || !DATA) return;
  var $ = U.$, $$ = U.$$, fmt = E.formatINR, esc = U.esc;
  var form = $("#ncForm");
  if (!form) return;
  var el = function (id) { return document.getElementById(id); };
  var radio = function (name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ""; };
  var setRadio = function (name, v) { $$('input[name="' + name + '"]').forEach(function (r) { r.checked = r.value === String(v); }); };
  var today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10); // India date

  var SAMPLE = { rate: "16", feeType: "fixed", feeValue: "199" };
  var DEFAULTS = {
    price: "60,000", merchant: "", mode: "upfront", tenure: "6", customMonths: "15", rate: SAMPLE.rate,
    feeType: SAMPLE.feeType, feeValue: SAMPLE.feeValue, feeMin: "", feeMax: "", feeGst: true,
    subsidyPct: "50", customUpfront: "", customCashback: "", merchantDiscount: "", merchantOnFull: true,
    coupon: "", couponOnFull: true, bankDiscountEmi: "", bankDiscountFull: "", cashbackLater: "", cashbackMonth: "3",
    cashbackPending: false, surcharge: "", downPayment: "", fullRewards: "", gstOnInterest: true, interestGstRate: "18",
    gstRate: "18", roundEmi: "rupee", fcAfter: "2", fcPct: "3", fcMin: "", fcAccrued: "", fcReverse: true
  };
  var RADIOS = ["mode", "tenure", "feeType", "roundEmi"];

  var issuer = null;           // selected issuer object
  var program = null;          // its EMI programme (rule)
  var rateSource = "sample";   // sample | bank | user
  var feeSource = "sample";    // sample | bank | user
  var fcSource = "default";    // default | bank | user
  var state = null;

  /* ---------- Issuer selector (combobox) ---------- */
  var input = el("bankInput"), list = el("bankList"), logo = el("bankLogo");
  var active = -1, shown = [];
  function statusOf(is) {
    var p = is.programs && is.programs[0];
    return p ? E.ruleStatus(p, today) : "unverified";
  }
  var STATUS_TEXT = { verified: "Verified terms", partial: "Some terms", unverified: "Not verified", expired: "Expired", upcoming: "Not yet live" };
  function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function renderList() {
    var q = norm(input.value);
    var selectedName = issuer ? norm(issuer.name) : null;
    if (selectedName && q === selectedName) q = "";
    shown = DATA.issuers.filter(function (is) { return !q || norm(is.name + " " + is.short + " " + is.id).indexOf(q) >= 0; });
    list.innerHTML = shown.length ? shown.map(function (is, k) {
      var st = statusOf(is);
      return '<li class="ce-option' + (k === active ? " is-active" : "") + '" role="option" id="bank-opt-' + is.id + '" data-id="' + is.id + '" aria-selected="' + (issuer === is) + '">' +
        '<span class="ce-combo-logo" aria-hidden="true"><img src="/assets/bank-logos/' + is.logo + '" alt="" width="20" height="20" loading="lazy"></span>' +
        "<span>" + esc(is.name) + "</span><small class=\"" + (st === "verified" ? "is-ok" : "") + "\">" + STATUS_TEXT[st] + "</small></li>";
    }).join("") : '<li class="ce-listbox-empty" role="presentation">No bank matches. Try a short name like HDFC or Amex.</li>';
    input.setAttribute("aria-activedescendant", active >= 0 && shown[active] ? "bank-opt-" + shown[active].id : "");
    var act = active >= 0 && list.children[active];
    if (act && act.scrollIntoView) act.scrollIntoView({ block: "nearest" });
  }
  function openList() { list.hidden = false; input.setAttribute("aria-expanded", "true"); renderList(); }
  function closeList() { list.hidden = true; input.setAttribute("aria-expanded", "false"); active = -1; input.removeAttribute("aria-activedescendant"); }
  function choose(is, quiet) {
    issuer = is || null;
    program = issuer && issuer.programs && issuer.programs.length ? issuer.programs[0] : null;
    input.value = issuer ? issuer.name : "";
    logo.hidden = !issuer;
    if (issuer) $("img", logo).src = "/assets/bank-logos/" + issuer.logo;
    el("bankClear").hidden = !issuer;
    // A new bank's published terms replace earlier figures (yours stay if no terms exist).
    if (rateSource === "bank") rateSource = "sample";
    if (feeSource === "bank") feeSource = "sample";
    if (rateSource === "user" && program && program.rates) rateSource = "sample";
    if (feeSource === "user" && program && program.fee && program.fee.exact !== false) feeSource = "sample";
    if (fcSource !== "user") fcSource = "default";
    var variants = issuer && issuer.programs && issuer.programs.length > 1 ? issuer.programs : null;
    el("variantField").hidden = !variants;
    if (variants) el("variant").innerHTML = variants.map(function (p, k) { return '<option value="' + k + '">' + esc(p.name) + "</option>"; }).join("");
    closeList();
    if (!quiet) schedule();
  }
  input.addEventListener("focus", openList);
  input.addEventListener("click", openList);
  input.addEventListener("input", function () { active = 0; openList(); });
  input.addEventListener("keydown", function (ev) {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      if (list.hidden) openList();
      var n = shown.length;
      if (!n) return;
      active = ev.key === "ArrowDown" ? (active + 1) % n : (active - 1 + n) % n;
      renderList();
    } else if (ev.key === "Enter") {
      if (!list.hidden && shown[active >= 0 ? active : 0]) { ev.preventDefault(); choose(shown[active >= 0 ? active : 0]); }
    } else if (ev.key === "Escape") {
      if (!list.hidden) { ev.preventDefault(); closeList(); input.value = issuer ? issuer.name : ""; }
    } else if (ev.key === "Tab") {
      closeList();
    }
  });
  input.addEventListener("blur", function () {
    setTimeout(function () {
      if (document.activeElement === input) return;
      closeList();
      if (!input.value.trim()) { if (issuer) choose(null); }
      else input.value = issuer ? issuer.name : "";
    }, 150);
  });
  list.addEventListener("mousedown", function (ev) { ev.preventDefault(); });
  list.addEventListener("click", function (ev) {
    var li = ev.target.closest("[data-id]");
    if (!li) return;
    choose(DATA.issuers.filter(function (is) { return is.id === li.dataset.id; })[0]);
  });
  el("bankClear").addEventListener("click", function () { choose(null); input.focus(); });
  el("variant").addEventListener("change", function () { program = issuer.programs[+el("variant").value]; rateSource = rateSource === "user" ? "user" : "sample"; schedule(); });

  /* ---------- Reading the form ---------- */
  function months() {
    var t = radio("tenure");
    return t === "custom" ? parseInt(el("customMonths").value, 10) || 0 : parseInt(t, 10);
  }
  function money(id) { var n = U.readNum(el(id)); return isFinite(n) ? n : 0; }
  function feeSpec() {
    var t = radio("feeType");
    return { type: t, value: t === "percent" ? U.readNum(el("feeValue")) : E.parseAmount(el("feeValue").value), min: t === "percent" ? U.readNum(el("feeMin")) : NaN, max: t === "percent" ? U.readNum(el("feeMax")) : NaN };
  }
  function readInputs(overrides) {
    var o = overrides || {};
    var gstI = U.readNum(el("interestGstRate")), gstF = U.readNum(el("gstRate"));
    return Object.assign({
      price: U.readNum(el("price")),
      mode: radio("mode"),
      months: months(),
      annualRate: el("rate").value.trim() === "" ? NaN : U.readNum(el("rate")),
      fee: feeSpec(), feeGst: el("feeGst").checked, gstRate: isFinite(gstF) ? gstF : 18,
      gstOnInterest: el("gstOnInterest").checked, interestGstRate: isFinite(gstI) ? gstI : 18,
      merchantDiscount: money("merchantDiscount"), merchantDiscountOnFull: el("merchantOnFull").checked,
      coupon: money("coupon"), couponOnFull: el("couponOnFull").checked,
      bankDiscountEmi: money("bankDiscountEmi"), bankDiscountFull: money("bankDiscountFull"),
      downPayment: money("downPayment"), surcharge: money("surcharge"),
      cashbackLater: money("cashbackLater"), cashbackMonth: parseInt(el("cashbackMonth").value, 10) || 3,
      cashbackReceived: !el("cashbackPending").checked, fullRewards: money("fullRewards"),
      subsidyPct: U.readNum(el("subsidyPct")), customUpfront: money("customUpfront"), customCashback: money("customCashback"),
      roundEmi: radio("roundEmi")
    }, o);
  }

  /* ---------- Applying issuer terms ---------- */
  function applyTerms() {
    var n = months();
    var terms = E.ruleTerms(program, n, today);
    if (terms.rate !== null && rateSource !== "user") {
      el("rate").value = String(terms.rate);
      rateSource = "bank";
    } else if (terms.rate === null && rateSource === "bank") {
      rateSource = "sample";
    }
    if (terms.fee && feeSource !== "user") {
      setRadio("feeType", terms.fee.type);
      el("feeValue").value = terms.fee.type === "none" ? "" : String(terms.fee.value);
      U.setMoney(el("feeMin"), terms.fee.min);
      U.setMoney(el("feeMax"), terms.fee.max);
      el("feeGst").checked = true;
      feeSource = "bank";
    } else if (!terms.fee && feeSource === "bank") {
      feeSource = "sample";
    }
    var fc = program && E.ruleStatus(program, today) !== "expired" && program.foreclosure;
    if (fcSource !== "user") {
      el("fcPct").value = fc ? String(fc.percent) : "3";
      U.setMoney(el("fcMin"), fc && fc.min ? fc.min : NaN);
      fcSource = fc ? "bank" : "default";
    }
    return terms;
  }

  function badge(node, kind, text) {
    node.className = "ce-badge" + (kind ? " is-" + kind : "");
    node.textContent = text;
  }

  /* ---------- Render ---------- */
  function render() {
    var terms = applyTerms();
    var inp = readInputs();
    var bankName = issuer ? issuer.short : "";
    var st = program ? E.ruleStatus(program, today) : issuer ? "unverified" : "none";

    // Badges and hints on the form
    if (rateSource === "bank") badge(el("rateBadge"), "ok", "From " + bankName + " terms");
    else if (rateSource === "user") badge(el("rateBadge"), "", "You entered");
    else badge(el("rateBadge"), "warn", issuer ? "Not verified" : "Sample rate");
    el("rateHint").textContent = rateSource === "bank"
      ? bankName + " publishes " + inp.annualRate + "% a year for this tenure. Change it if checkout shows another rate."
      : issuer && rateSource !== "user"
        ? "Bank-specific terms not verified. Enter the rate and fees shown at checkout for an accurate estimate."
        : "Use the rate shown at checkout. Under No-Cost EMI the bank still charges this rate; the discount or cashback covers it.";
    if (feeSource === "bank") badge(el("feeBadge"), "ok", "From " + bankName + " terms");
    else if (feeSource === "user") badge(el("feeBadge"), "", "You entered");
    else badge(el("feeBadge"), "warn", issuer ? "Not verified" : "Sample fee");
    el("feeHint").textContent = program && program.fee && program.fee.exact === false && feeSource !== "user" ? program.fee.note + " Not filled in because the exact fee isn’t published." : "";
    var pct = inp.fee.type === "percent";
    $$("[data-pct-only]").forEach(function (n) { n.hidden = !pct; });
    el("feeFields").hidden = inp.fee.type === "none";
    el("feeValueLabel").textContent = pct ? "Fee (% of amount)" : "Fee ₹";
    el("customTenureField").hidden = radio("tenure") !== "custom";
    var tenures = program && program.tenures && (st === "verified" || st === "partial") ? program.tenures : null;
    var tHint = "";
    if (radio("tenure") === "custom") tHint = "A " + inp.months + "-month tenure is a simulation" + (tenures ? "; " + bankName + " lists " + tenures.join(", ") + " months." : ".");
    else if (tenures && tenures.indexOf(inp.months) < 0) tHint = bankName + " doesn’t list a " + inp.months + "-month tenure (it lists " + tenures.join(", ") + "), so this is a simulation.";
    else if (tenures) tHint = bankName + " lists " + tenures.join(", ") + " months. The store decides which of these get No-Cost EMI.";
    else if (program && program.tenureNote) tHint = bankName + ": " + program.tenureNote;
    el("tenureHint").textContent = tHint;

    var mode = inp.mode;
    el("subsidyPctField").hidden = mode !== "lowcost";
    el("customFields").hidden = mode !== "custom";
    el("subsidyHint").textContent = {
      upfront: "Worked out for you from the rate and tenure: the discount that makes your EMIs add up to the price.",
      cashback: "Worked out for you: the cashback equals the interest the bank charges.",
      lowcost: "The store covers this share of the interest as an upfront discount; you pay the rest.",
      regular: "Regular EMI has no subsidy.",
      custom: "Enter what your offer page states. Don’t enter the same subsidy twice."
    }[mode];
    el("taxSummary").textContent = (inp.gstOnInterest ? inp.interestGstRate + "% on interest" : "No GST on interest") + (inp.feeGst ? ", " + inp.gstRate + "% on fee" : "") + ", " + (inp.roundEmi === "rupee" ? "whole rupees" : "paise");

    var res = E.noCost(inp);
    U.setError(el("price"), res.errors && (res.errors.price || res.errors.discounts));
    U.setError(el("rate"), res.errors && res.errors.annualRate);
    el("months-err").textContent = (res.errors && res.errors.months) || "";
    if (!res.ok) { state = null; return; }

    var unverified = rateSource === "sample" || feeSource === "sample";
    var v = E.verdict(res, { unverified: unverified });
    state = { inp: inp, res: res, verdict: v, unverified: unverified };

    var offers = [];
    if (inp.merchantDiscount) offers.push("store " + fmt(inp.merchantDiscount));
    if (inp.bankDiscountEmi) offers.push("bank EMI " + fmt(inp.bankDiscountEmi));
    if (inp.bankDiscountFull) offers.push("full pay " + fmt(inp.bankDiscountFull));
    if (inp.coupon) offers.push("coupon " + fmt(inp.coupon));
    if (inp.cashbackLater) offers.push("cashback " + fmt(inp.cashbackLater));
    if (inp.surcharge) offers.push("surcharge " + fmt(inp.surcharge));
    if (inp.downPayment) offers.push("down payment " + fmt(inp.downPayment));
    if (inp.fullRewards) offers.push("rewards " + fmt(inp.fullRewards));
    el("offersSummary").textContent = offers.length ? offers.join(", ") : "None added";

    renderVerdict(res, v);
    renderBreakdown(res);
    renderBank(res, terms, st);
    renderVs(res);
    renderTenures(inp, res);
    renderMonths(res);
    renderForeclosure(res);
  }

  function signed(n) { return Math.abs(n) < 0.5 ? fmt(0) : (n > 0 ? "+" : "−") + fmt(Math.abs(n)); }

  function renderVerdict(res, v) {
    var box = el("verdict");
    var kind = v.kind;
    var d = res.difference;
    var costs = [];
    if (res.interestGst) costs.push("GST on interest (" + fmt(res.interestGst) + ")");
    if (res.fee + res.feeGst) costs.push("the processing fee with GST (" + fmt(res.fee + res.feeGst) + ")");
    var unpaid = res.interest - res.interestSubsidy;
    if (unpaid > 1) costs.unshift("interest not covered by the subsidy (" + fmt(unpaid) + ")");
    if (res.surcharge) costs.push("a surcharge (" + fmt(res.surcharge) + ")");
    var costText = costs.length ? costs.slice(0, -1).join(", ") + (costs.length > 1 ? " and " : "") + costs[costs.length - 1] : "";
    var title, text;
    if (kind === "insufficient") {
      title = issuer ? "Bank-specific terms not verified" : "Estimate with sample terms";
      text = (issuer ? "Bank-specific terms not verified. Enter the rate and fees shown at checkout for an accurate estimate." : "Uses a sample " + res.annualRate + "% rate" + (feeSource === "sample" ? " and sample fee" : "") + ". Pick your bank or enter the rate and fee shown at checkout.") + " With these figures it costs " + (d >= 0 ? fmt(d) + " more" : fmt(-d) + " less") + " than paying in full.";
    } else if (kind === "same") {
      title = "No additional cost compared with paying in full";
      text = "The subsidy covers the interest and nothing else is charged on top, so the EMI costs the same as paying in full.";
    } else if (kind === "extra") {
      title = "Extra charges despite the interest subsidy";
      text = "The " + (res.mode === "cashback" ? "cashback" : "discount") + " covers the bank’s interest, but " + costText + " are still yours.";
    } else if (kind === "costlier") {
      title = "More expensive than paying in full";
      text = "You pay " + costText + " that paying in full avoids.";
    } else {
      title = "Cheaper than paying in full";
      text = "EMI-only discounts or cashback outweigh " + (costText || "the EMI costs") + ".";
    }
    if (res.cashbackPending && res.cashbacks) text += " Cashback of " + fmt(res.cashbacks) + " isn’t counted until you receive it.";
    else if (res.cashbacks && res.mode === "cashback") text += " You carry " + fmt(res.interestCashback) + " of interest until the cashback arrives.";
    box.dataset.kind = kind;
    U.setText(el("verdict-title"), title);
    U.setText(el("verdictAmount"), signed(d), true);
    U.setText(el("verdictText"), text);
  }

  function renderBreakdown(res) {
    U.setText(el("oEmi"), fmt(res.emi) + (Math.abs(res.lastEmi - res.emi) >= 0.5 ? " (last " + fmt(res.lastEmi) + ")" : "") + " × " + res.months, true);
    U.setText(el("oBooking"), fmt(res.bookingPrincipal));
    U.setText(el("oInterest"), fmt(res.interest));
    U.setText(el("oSubsidy"), res.interestSubsidy ? "−" + fmt(res.interestSubsidy) + (res.interestCashback && !res.upfrontSubsidy ? " later" : "") : fmt(0));
    U.setText(el("oIntGst"), fmt(res.interestGst));
    U.setText(el("oFee"), fmt(res.fee));
    U.setText(el("oFeeGst"), fmt(res.feeGst));
    U.setText(el("oOther"), fmt(res.surcharge));
    var instant = res.discounts.merchant + res.discounts.bankEmi + res.discounts.coupon;
    U.setText(el("oCashback"), instant || res.cashbacks ? "−" + fmt(instant + (res.cashbackPending ? 0 : res.cashbacks)) : fmt(0));
    U.setText(el("oPaid"), fmt(res.totalPaid));
    U.setText(el("oEffective"), fmt(res.effectiveCost), true);
    U.setText(el("oFull"), fmt(res.fullNet));
    U.setText(el("oDiff"), signed(res.difference), true);
  }

  /* ---------- Bank information panel ---------- */
  var KIND = { confirmed: ["ok", "Confirmed policy"], offer: ["", "Offer-specific"], user: ["", "Your input"], missing: ["warn", "Not published"], upto: ["warn", "Upper limit only"] };
  function row(label, kind, html) {
    var k = KIND[kind];
    return "<div><dt>" + esc(label) + "</dt><dd>" + (k ? '<span class="ce-badge' + (k[0] ? " is-" + k[0] : "") + '">' + k[1] + "</span>" : "") + "<span>" + html + "</span></dd></div>";
  }
  function renderBank(res, terms, st) {
    var panel = el("bankPanel");
    if (!issuer) {
      panel.innerHTML = '<p class="ce-note">Pick your card’s bank to see the EMI terms it publishes, with the official source. Until then the calculator uses the rate and fee in the form.</p>';
      return;
    }
    var head = '<div class="ce-bank-head"><span class="ce-combo-logo" aria-hidden="true"><img src="/assets/bank-logos/' + issuer.logo + '" alt="" width="28" height="28"></span><div><h3>' + esc(issuer.name) + (program ? " · " + esc(program.name) : "") + '</h3><p><span class="ce-badge' + (st === "verified" ? " is-ok" : st === "expired" ? " is-bad" : " is-warn") + '">' + (STATUS_TEXT[st] || "Not verified") + "</span></p></div></div>";
    var note = issuer.issuerNote ? '<p class="ce-note">' + esc(issuer.issuerNote) + "</p>" : "";
    if (!program || st === "unverified" || st === "expired") {
      var src = program && program.source ? '<p class="ce-src">Checked: <a href="' + esc(program.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(program.source.title) + "</a> on " + E.formatDate(program.verifiedOn, true) + "</p>" : "";
      panel.innerHTML = head + note + '<p class="ce-note"><strong>Bank-specific terms not verified.</strong> Enter the rate and fees shown at checkout for an accurate estimate.' + (program && program.rateNote ? " " + esc(program.rateNote) : "") + (st === "expired" ? " The terms on file ended " + E.formatDate(program.validTo, true) + " and aren’t applied." : "") + "</p>" + src;
      return;
    }
    var p = program, rows = "";
    rows += row("Tenures", p.tenures ? "confirmed" : p.tenureNote ? "confirmed" : "missing", p.tenures ? p.tenures.join(", ") + " months" : p.tenureNote ? esc(p.tenureNote) : "Not listed in the source.");
    if (rateSource === "user") rows += row("Interest rate", "user", "You entered " + esc(state.inp.annualRate) + "%. " + esc(p.rateNote || ""));
    else rows += row("Interest rate", p.rates ? "confirmed" : "missing", esc(p.rateNote || "Not published."));
    if (feeSource === "user") rows += row("Processing fee", "user", "You entered your own fee." + (p.fee ? " Bank terms: " + esc(p.fee.note) : ""));
    else rows += row("Processing fee", !p.fee ? "missing" : p.fee.exact === false ? "upto" : "confirmed", p.fee ? esc(p.fee.note) : "Not published.");
    rows += row("GST", p.gst ? "confirmed" : "user", p.gst ? esc(p.gst) : "Not stated in the source; the calculator uses the GST rates you set.");
    if (p.minAmount) rows += row("Minimum amount", "confirmed", fmt(p.minAmount) + (p.maxAmount ? ", up to " + fmt(p.maxAmount) : "") + (res.emiBase < p.minAmount ? ' <strong>Your EMI amount is below this.</strong>' : ""));
    rows += row("No-Cost EMI", p.subvention ? "offer" : "missing", p.subvention ? esc(p.subvention) + " Whether a product has it depends on the store and brand." : "The source doesn’t describe it.");
    if (p.foreclosure) rows += row("Foreclosure", "confirmed", esc(p.foreclosure.note));
    if (p.cancellation) rows += row("Cancellation", "confirmed", esc(p.cancellation));
    if (p.rewards) rows += row("Rewards", "confirmed", esc(p.rewards));
    if (p.exclusions) rows += row("Exclusions", "confirmed", esc(p.exclusions));
    if (p.validFrom) rows += row("Effective", "confirmed", "From " + E.formatDate(p.validFrom, true) + (p.validTo ? " to " + E.formatDate(p.validTo, true) : ""));
    var sources = [p.source].concat(p.sources || []).map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.title) + '<span class="sr-only"> (opens in a new tab)</span></a>'; }).join("<br>");
    panel.innerHTML = head + note + '<dl class="ce-terms">' + rows + "</dl>" + '<p class="ce-src"><span>Last verified ' + E.formatDate(p.verifiedOn, true) + ". Official source:</span>" + sources + "</p>";
  }

  /* ---------- Pay in full vs EMI ---------- */
  function line(label, value, cls) { return '<div class="' + (cls || "") + '"><dt>' + esc(label) + "</dt><dd>" + value + "</dd></div>"; }
  function renderVs(res) {
    var fullWins = res.difference > 0.5, emiWins = res.difference < -0.5;
    var full = '<h3>Pay in full' + (fullWins ? ' <span class="ce-badge is-ok">Costs less</span>' : "") + '</h3><dl class="ce-list">' +
      line("Selling price", fmt(res.price)) +
      line("Discounts for full payment", res.price - res.fullPay ? "−" + fmt(res.price - res.fullPay) : fmt(0), "is-minus") +
      line("Pay today", fmt(res.fullPay), "is-strong") +
      line("Rewards or cashback you entered", res.fullRewards ? "−" + fmt(res.fullRewards) : fmt(0), "is-minus") +
      line("Net cost", fmt(res.fullNet), "is-strong") + "</dl>";
    var emiDisc = res.discounts.merchant + res.discounts.bankEmi + res.discounts.coupon;
    var emi = "<h3>" + (res.mode === "regular" ? "Regular EMI" : res.mode === "lowcost" ? "Low-Cost EMI" : "No-Cost EMI") + (emiWins ? ' <span class="ce-badge is-ok">Costs less</span>' : "") + '</h3><dl class="ce-list">' +
      line("Monthly EMI", fmt(res.emi) + " × " + res.months) +
      line("Instant discounts on EMI", emiDisc ? "−" + fmt(emiDisc) : fmt(0), "is-minus") +
      line("Interest subsidy", res.interestSubsidy ? "−" + fmt(res.interestSubsidy) : fmt(0), "is-minus") +
      line("Interest charged", fmt(res.interest)) +
      line("GST on interest", fmt(res.interestGst)) +
      line("Processing fee + GST", fmt(res.fee + res.feeGst)) +
      (res.downPayment ? line("Down payment", fmt(res.downPayment)) : "") +
      (res.surcharge ? line("Surcharge", fmt(res.surcharge)) : "") +
      line("Total payable", fmt(res.totalPaid), "is-strong") +
      line("Cashback later" + (res.cashbacks ? " (about " + Math.max(1, state.inp.cashbackMonth) + " months)" : ""), res.cashbacks ? "−" + fmt(res.cashbacks) + (res.cashbackPending ? " pending" : "") : fmt(0), "is-minus") +
      line("Net effective cost", fmt(res.effectiveCost), "is-strong") + "</dl>";
    el("vsFull").innerHTML = full;
    el("vsEmi").innerHTML = emi;
    el("vsFull").classList.toggle("is-winner", fullWins);
    el("vsEmi").classList.toggle("is-winner", emiWins);
  }

  /* ---------- Tenure comparison ---------- */
  function renderTenures(inp, res) {
    var st = program ? E.ruleStatus(program, today) : "none";
    var list = program && program.tenures && (st === "verified" || st === "partial") ? program.tenures.slice() : [3, 6, 9, 12, 18, 24];
    if (list.indexOf(inp.months) < 0) list.push(inp.months);
    list.sort(function (a, b) { return a - b; });
    var rows = list.map(function (m) {
      var t = E.ruleTerms(program, m, today);
      var over = { months: m };
      if (rateSource === "bank" && t.rate !== null) over.annualRate = t.rate;
      if (feeSource === "bank" && t.fee) over.fee = t.fee;
      var r = E.noCost(readInputs(over));
      if (!r.ok) return "";
      var cur = m === inp.months;
      return '<tr class="' + (cur ? "is-current" : "") + '"><th scope="row">' + m + " months" + (cur ? " (yours)" : "") + "</th><td>" + fmt(r.emi) + "</td><td>" + fmt(r.interest) + "</td><td>" + (r.interestSubsidy ? "−" + fmt(r.interestSubsidy) : fmt(0)) + "</td><td>" + fmt(r.fee + r.feeGst) + "</td><td>" + fmt(r.interestGst) + "</td><td>" + fmt(r.effectiveCost) + '</td><td class="' + (r.difference > 0.5 ? "is-pos" : r.difference < -0.5 ? "is-neg" : "") + '">' + signed(r.difference) + "</td></tr>";
    });
    el("tenureBody").innerHTML = rows.join("");
    el("tenuresIntro").textContent = "The same offer over each " + (program && program.tenures && (st === "verified" || st === "partial") ? issuer.short + " tenure" : "common tenure") + (rateSource === "bank" ? ", at the bank’s published rate and fee for each." : ", at the rate and fee in the form.") + " A longer No-Cost EMI isn’t free for longer: the GST on the larger interest grows with it.";
  }

  /* ---------- Month-by-month ---------- */
  function renderMonths(res) {
    var rows = res.schedule.rows;
    el("monthBody").innerHTML = rows.map(function (r) {
      return "<tr><th scope=\"row\">" + r.month + "</th><td>" + fmt(r.principal, 2) + "</td><td>" + fmt(r.interest, 2) + "</td><td>" + fmt(r.gst, 2) + "</td><td>" + fmt(r.emi + r.gst, 2) + "</td><td>" + fmt(r.closing, 2) + "</td></tr>";
    }).join("");
    var tp = rows.reduce(function (s, r) { return s + r.principal; }, 0), ti = res.interest, tg = res.interestGst;
    el("monthFoot").innerHTML = "<tr><th scope=\"row\">Total</th><td>" + fmt(tp, 2) + "</td><td>" + fmt(ti, 2) + "</td><td>" + fmt(tg, 2) + "</td><td>" + fmt(res.totalEmis + tg, 2) + "</td><td>" + fmt(res.schedule.finalBalance, 2) + "</td></tr>";
  }

  /* ---------- Foreclosure ---------- */
  function renderForeclosure(res) {
    var k = parseInt(el("fcAfter").value, 10);
    if (!isFinite(k)) k = 0;
    el("fcAfter").max = String(res.months);
    var f = E.foreclosure(res, k, { percent: U.readNum(el("fcPct")) || 0, min: U.readNum(el("fcMin")) || 0, accruedInterest: money("fcAccrued"), gst: true, gstRate: state.inp.gstRate, reverseSubsidy: el("fcReverse").checked });
    el("fcOut").textContent = fmt(f.outstanding);
    el("fcFee").textContent = fmt(f.fee + f.feeGst);
    el("fcRev").textContent = fmt(f.subsidyReversed);
    el("fcClose").textContent = fmt(f.toClose);
    el("fcTotal").textContent = fmt(f.totalCost);
    var vs = f.totalCost - res.fullNet;
    el("fcVsFull").textContent = (vs >= 0 ? fmt(vs) + " more" : fmt(-vs) + " less") + " than paying in full";
    var fc = program && program.foreclosure && E.ruleStatus(program, today) !== "expired";
    el("fcSource").textContent = fcSource === "bank" ? issuer.short + " terms: " + fc.note : fcSource === "user" ? "Using the fee you entered." : issuer ? "Foreclosure terms for " + issuer.short + " aren’t verified here; 3% is a common fee. Enter your bank’s figure." : "3% is a common foreclosure fee. Pick your bank or enter its figure.";
  }

  /* ---------- Share link, copy, CSV ---------- */
  var KEYS = {
    p: "price", m: "merchant", md: "merchantDiscount", mf: "merchantOnFull", cp: "coupon", cf: "couponOnFull", be: "bankDiscountEmi", bf: "bankDiscountFull",
    cl: "cashbackLater", cm: "cashbackMonth", cpend: "cashbackPending", sc: "surcharge", dp: "downPayment", fr: "fullRewards", sp: "subsidyPct",
    cu: "customUpfront", cc: "customCashback", r: "rate", fv: "feeValue", fmin: "feeMin", fmax: "feeMax", fg: "feeGst", gi: "gstOnInterest",
    gir: "interestGstRate", gr: "gstRate", cmo: "customMonths"
  };
  function shareUrl() {
    var q = new URLSearchParams();
    if (issuer) q.set("bank", issuer.id);
    q.set("mode", radio("mode")); q.set("n", radio("tenure")); q.set("ft", radio("feeType")); q.set("rd", radio("roundEmi"));
    q.set("rs", rateSource); q.set("fs", feeSource);
    Object.keys(KEYS).forEach(function (k) {
      var n = el(KEYS[k]);
      if (!n) return;
      if (n.type === "checkbox") { if (n.checked !== DEFAULTS[KEYS[k]]) q.set(k, n.checked ? "1" : "0"); }
      else if (n.value !== "" && n.value !== DEFAULTS[KEYS[k]]) q.set(k, n.dataset.money !== undefined ? String(E.parseAmount(n.value)) : n.value);
    });
    return location.origin + location.pathname + "?" + q.toString();
  }
  function loadFromUrl() {
    var q = new URLSearchParams(location.search);
    if (!q.toString()) return false;
    Object.keys(KEYS).forEach(function (k) {
      if (!q.has(k)) return;
      var n = el(KEYS[k]), v = q.get(k).slice(0, 40);
      if (!n) return;
      if (n.type === "checkbox") n.checked = v === "1";
      else if (n.tagName === "SELECT") { if ($$("option", n).some(function (o) { return o.value === v; })) n.value = v; }
      else n.value = n.dataset.money !== undefined && isFinite(+v) ? E.formatNumber(+v, 2) : v.replace(/[^0-9.]/g, "");
    });
    ["mode", "n", "ft", "rd"].forEach(function (k, i) { if (q.has(k)) setRadio(["mode", "tenure", "feeType", "roundEmi"][i], q.get(k)); });
    var bank = q.get("bank");
    var is = DATA.issuers.filter(function (x) { return x.id === bank; })[0];
    if (is) choose(is, true);
    if (q.get("rs") === "user") rateSource = "user";
    if (q.get("fs") === "user") feeSource = "user";
    if (q.has("r") && rateSource !== "user" && q.get("rs") !== "bank") rateSource = "user";
    return true;
  }
  function breakdownText() {
    if (!state) return "";
    var r = state.res, i = state.inp, m = el("merchant");
    var lines = [
      "No-Cost EMI breakdown (avhishek.in/calculator/no-cost-emi)",
      "Product price: " + fmt(r.price) + (m.value ? " at " + m.options[m.selectedIndex].text : ""),
      "Card issuer: " + (issuer ? issuer.name : "not chosen") + (state.unverified ? " (rate/fee not verified)" : ""),
      "Offer type: " + $('input[name="mode"]:checked').closest("label").querySelector("b").textContent,
      "Tenure: " + r.months + " months at " + r.annualRate + "% a year",
      "Your EMI: " + fmt(r.emi) + "/month",
      "Amount the bank lends: " + fmt(r.bookingPrincipal),
      "Interest charged: " + fmt(r.interest),
      "Merchant interest subsidy: " + fmt(r.interestSubsidy),
      "GST on interest: " + fmt(r.interestGst),
      "Processing fee: " + fmt(r.fee),
      "GST on processing fee: " + fmt(r.feeGst),
      "Other charges: " + fmt(r.surcharge),
      "Cashback or discounts: " + fmt(r.discounts.merchant + r.discounts.bankEmi + r.discounts.coupon + (r.cashbackPending ? 0 : r.cashbacks)),
      "Final effective purchase cost: " + fmt(r.effectiveCost),
      "Paying in full: " + fmt(r.fullNet),
      "Difference versus paying in full: " + signed(r.difference),
      "Verdict: " + el("verdict-title").textContent
    ];
    return lines.join("\n");
  }
  function exportCsv() {
    if (!state) return;
    var r = state.res;
    var rows = [["Instalment", "Opening balance", "EMI", "Principal", "Interest", "GST on interest", "Total this month", "Closing balance"]];
    r.schedule.rows.forEach(function (x) { rows.push([x.month, x.opening.toFixed(2), x.emi.toFixed(2), x.principal.toFixed(2), x.interest.toFixed(2), x.gst.toFixed(2), (x.emi + x.gst).toFixed(2), x.closing.toFixed(2)]); });
    rows.push([]);
    breakdownText().split("\n").forEach(function (l) { var k = l.indexOf(": "); rows.push(k > 0 ? [l.slice(0, k), l.slice(k + 2)] : [l]); });
    U.download("no-cost-emi-" + Math.round(r.price) + "-" + r.months + "m.csv", U.csv(rows));
  }

  function reset() {
    Object.keys(DEFAULTS).forEach(function (k) {
      if (RADIOS.indexOf(k) >= 0) { setRadio(k, DEFAULTS[k]); return; }
      var n = el(k);
      if (!n) return;
      if (n.type === "checkbox") n.checked = DEFAULTS[k]; else n.value = DEFAULTS[k];
    });
    rateSource = "sample"; feeSource = "sample"; fcSource = "default";
    choose(null, true);
    el("offersBox").open = false; el("taxBox").open = false;
    if (location.search) history.replaceState(null, "", location.pathname);
    render();
  }

  /* ---------- Wiring ---------- */
  var schedule = U.scheduler(render);
  $$("input[data-money]").forEach(function (n) { U.bindMoney(n, schedule); });
  form.addEventListener("input", function (ev) {
    var id = ev.target.id;
    if (id === "rate") rateSource = "user";
    if (id === "feeValue" || id === "feeMin" || id === "feeMax") feeSource = "user";
    if (id === "bankInput") return;
    schedule();
  });
  form.addEventListener("change", function (ev) {
    if (ev.target.name === "feeType" || ev.target.id === "feeGst") feeSource = "user";
    if (ev.target.id === "bankInput") return;
    schedule();
  });
  $$("#fcAfter, #fcPct, #fcMin, #fcAccrued, #fcReverse").forEach(function (n) {
    n.addEventListener("input", function () { if (n.id === "fcPct" || n.id === "fcMin") fcSource = "user"; schedule(); });
    n.addEventListener("change", schedule);
  });
  $$('input[type="number"]').forEach(function (n) { n.addEventListener("wheel", function () { if (document.activeElement === n) n.blur(); }, { passive: true }); });

  var status = el("status");
  el("btnCopy").addEventListener("click", function () {
    U.copy(breakdownText()).then(function () { U.confirm(el("btnCopy"), status, "Breakdown copied."); }, function () { U.confirm(null, status, "Couldn’t copy. Select the results and copy them instead."); });
  });
  el("btnShare").addEventListener("click", function () {
    var url = shareUrl();
    history.replaceState(null, "", url);
    U.copy(url).then(function () { U.confirm(el("btnShare"), status, "Link copied. It holds only these settings."); }, function () { U.confirm(null, status, "Couldn’t copy. The link is now in the address bar."); });
  });
  el("btnCsv").addEventListener("click", function () { exportCsv(); U.confirm(el("btnCsv"), status, "Breakdown downloaded as CSV."); });
  el("btnPrint").addEventListener("click", function () { window.print(); });
  el("btnReset").addEventListener("click", function () { reset(); U.confirm(el("btnReset"), status, "Back to the defaults."); });

  loadFromUrl();
  render();
})();
