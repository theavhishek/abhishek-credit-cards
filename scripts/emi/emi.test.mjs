// Tests for assets/emi-core.js (the Loan EMI and No-Cost EMI calculation engine)
// and assets/emi-issuers.js (the issuer EMI rules). Run: pnpm test:emi
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const E = require("../../assets/emi-core.js");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const near = (a, b, tol = 0.01, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ""} expected ${b} ± ${tol}, got ${a}`);
const sum = (rows, k) => rows.reduce((s, r) => s + r[k], 0);

/* ---------------- Loan EMI ---------------- */

test("zero interest splits the principal evenly", () => {
  const r = E.loan({ principal: 120000, annualRate: 0, years: 1, months: 0 });
  assert.equal(r.ok, true);
  near(r.emi, 10000);
  assert.equal(r.totalInterest, 0);
  assert.equal(r.finalBalance, 0);
  assert.equal(r.schedule.rows.length, 12);
});

test("standard reducing-balance EMI matches the textbook value", () => {
  // ₹10,00,000 at 9% for 20 years: EMI ₹8,997.26
  const r = E.loan({ principal: 1000000, annualRate: 9, years: 20, months: 0 });
  near(r.emi, 8997.26);
  near(r.totalInterest, r.totalEmiPaid - 1000000, 0.01);
  assert.equal(r.finalBalance, 0);
  // ₹5,00,000 at 10.5% for 5 years: EMI ₹10,746.95
  near(E.emi(500000, 10.5, 60), 10746.95);
});

test("flat rate charges interest on the original principal and costs more than reducing", () => {
  const flat = E.loan({ principal: 100000, annualRate: 10, years: 2, months: 0, method: "flat" });
  near(flat.emi, (100000 + 20000) / 24);
  near(flat.totalInterest, 20000);
  assert.equal(flat.finalBalance, 0);
  const red = E.loan({ principal: 100000, annualRate: 10, years: 2, months: 0 });
  assert.ok(flat.totalInterest > red.totalInterest);
  // A 10% flat loan is roughly an 18% reducing-balance loan.
  assert.ok(flat.equivalentReducingRate > 17.5 && flat.equivalentReducingRate < 18.6, String(flat.equivalentReducingRate));
});

test("tenure accepts years only, months only and both", () => {
  assert.equal(E.tenureMonths(7, 6), 90);
  assert.equal(E.tenureMonths(0, 9), 9);
  assert.equal(E.tenureMonths(3, 0), 36);
  assert.equal(E.tenureMonths("2", ""), 24);
  const r = E.loan({ principal: 300000, annualRate: 11, years: 7, months: 6 });
  assert.equal(r.months, 90);
  assert.equal(r.schedule.rows.length, 90);
});

test("fixed processing fee with GST", () => {
  const r = E.loan({ principal: 200000, annualRate: 12, totalMonths: 24, fee: { type: "fixed", value: 2500 }, feeGst: true, gstRate: 18 });
  assert.equal(r.fee, 2500);
  assert.equal(r.feeGst, 450);
  assert.equal(r.upfrontCharges, 2950);
});

test("percentage fee respects minimum and maximum", () => {
  assert.equal(E.feeAmount({ type: "percent", value: 1 }, 500000), 5000);
  assert.equal(E.feeAmount({ type: "percent", value: 1, max: 3000 }, 500000), 3000);
  assert.equal(E.feeAmount({ type: "percent", value: 1, min: 1999 }, 50000), 1999);
  assert.equal(E.feeAmount({ type: "none", value: 5 }, 50000), 0);
});

test("GST applies only to charges marked taxable", () => {
  const r = E.loan({
    principal: 500000, annualRate: 10, totalMonths: 36, gstRate: 18,
    fee: { type: "none" },
    charges: [{ label: "Documentation", amount: 1000, gst: true }, { label: "Insurance", amount: 5000, gst: false }],
  });
  assert.equal(r.chargesBase, 6000);
  assert.equal(r.chargesGst, 180);
  assert.equal(r.upfrontCharges, 6180);
});

test("fee deducted from disbursement lowers the money received and raises the APR", () => {
  const base = { principal: 500000, annualRate: 10.5, totalMonths: 60, fee: { type: "percent", value: 2 }, feeGst: true, gstRate: 18 };
  const up = E.loan({ ...base, feeMode: "upfront" });
  const ded = E.loan({ ...base, feeMode: "deducted" });
  assert.equal(ded.netDisbursed, 500000 - 11800);
  assert.equal(up.netDisbursed, 500000);
  near(up.emi, ded.emi); // fee is not mixed into the EMI
  near(up.apr, ded.apr, 1e-6); // paying upfront or having it deducted costs the same
  assert.ok(ded.apr > 10.5 + 0.5, String(ded.apr));
  near(ded.borrowingCost, ded.totalInterest + 11800);
  const fin = E.loan({ ...base, feeMode: "financed" });
  near(fin.financedPrincipal, 511800);
  assert.ok(fin.emi > up.emi);
});

test("one-time prepayment uses the balance outstanding at that month", () => {
  const plan = E.prepaymentPlan({ principal: 1000000, annualRate: 9, months: 240, prepayments: [{ month: 24, amount: 200000 }], strategy: "tenure", startDate: "2026-11-05" });
  const row = plan.adjusted.rows[23];
  const orig = plan.original.rows[23];
  near(row.opening, orig.opening); // identical until the prepayment month
  assert.equal(row.extra, 200000);
  near(row.closing, orig.closing - 200000);
  assert.ok(plan.monthsSaved > 60 && plan.monthsSaved < 100, String(plan.monthsSaved));
  assert.ok(plan.interestSaved > 0);
  assert.equal(plan.adjusted.finalBalance, 0);
  assert.equal(plan.originalPayoff, "2046-10-05");
  // Prepaying later saves less than the same prepayment made in month 1.
  const early = E.prepaymentPlan({ principal: 1000000, annualRate: 9, months: 240, prepayments: [{ month: 1, amount: 200000 }], strategy: "tenure" });
  assert.ok(early.interestSaved > plan.interestSaved);
});

test("keep tenure lowers the EMI instead", () => {
  const plan = E.prepaymentPlan({ principal: 1000000, annualRate: 9, months: 240, prepayments: [{ month: 24, amount: 200000 }], strategy: "emi" });
  assert.equal(plan.monthsSaved, 0);
  assert.ok(plan.newEmi < plan.original.emi);
  near(plan.newEmi, E.emi(plan.adjusted.rows[23].closing, 9, 216));
  assert.equal(plan.adjusted.finalBalance, 0);
});

test("recurring extra payments start in the chosen month", () => {
  const plan = E.prepaymentPlan({ principal: 3000000, annualRate: 8.5, months: 240, recurring: { amount: 5000, fromMonth: 13 }, strategy: "tenure" });
  assert.equal(plan.adjusted.rows[11].extra, 0);
  assert.equal(plan.adjusted.rows[12].extra, 5000);
  assert.ok(plan.monthsSaved > 0 && plan.interestSaved > 0);
  assert.equal(plan.adjusted.finalBalance, 0);
});

test("prepayment charge and its GST reduce the net saving", () => {
  const plan = E.prepaymentPlan({ principal: 1000000, annualRate: 9, months: 240, prepayments: [{ month: 24, amount: 200000 }], prepaymentCharge: { type: "percent", value: 2, gst: true }, gstRate: 18 });
  assert.equal(plan.chargeBase, 4000);
  assert.equal(plan.chargeGst, 720);
  near(plan.netSavings, plan.interestSaved - 4720);
});

test("rate change: keep EMI stretches the tenure, keep tenure raises the EMI", () => {
  const keepEmi = E.amortize({ principal: 1000000, annualRate: 9, months: 240, rateChanges: [{ month: 37, rate: 10 }], ratePolicy: "tenure" });
  assert.ok(keepEmi.months > 240);
  near(keepEmi.rows[36].emi, keepEmi.rows[0].emi);
  assert.equal(keepEmi.finalBalance, 0);
  const keepTenure = E.amortize({ principal: 1000000, annualRate: 9, months: 240, rateChanges: [{ month: 37, rate: 10 }], ratePolicy: "emi" });
  assert.equal(keepTenure.months, 240);
  near(keepTenure.rows[36].emi, E.emi(keepTenure.rows[35].closing, 10, 204));
  assert.equal(keepTenure.finalBalance, 0);
  // A big rise under "keep EMI" would never repay: the EMI is raised instead.
  const shock = E.amortize({ principal: 1000000, annualRate: 9, months: 240, rateChanges: [{ month: 2, rate: 30 }], ratePolicy: "tenure" });
  assert.ok(shock.notes.includes("emi-raised"));
  assert.equal(shock.finalBalance, 0);
});

test("every schedule reaches zero and reconciles", () => {
  for (const [P, r, n] of [[1e5, 7.25, 13], [2.5e7, 8.4, 360], [9999.99, 36, 7], [1, 12, 1], [123456.78, 0.01, 600]]) {
    for (const roundEmi of ["paise", "rupee"]) {
      const s = E.amortize({ principal: P, annualRate: r, months: n, roundEmi });
      assert.equal(s.finalBalance, 0, `${P}/${r}/${n}`);
      assert.equal(s.rows.length, n, `${P}/${r}/${n} ${roundEmi}`);
      near(sum(s.rows, "principal"), P, 0.02);
      near(sum(s.rows, "emi"), P + s.totalInterest, 0.02);
    }
  }
});

test("invalid and extreme loan inputs are rejected with messages", () => {
  assert.equal(E.loan({ principal: 0, annualRate: 9, totalMonths: 12 }).ok, false);
  assert.ok(E.loan({ principal: 100000, annualRate: -1, totalMonths: 12 }).errors.annualRate);
  assert.ok(E.loan({ principal: 100000, annualRate: 9, years: 0, months: 0 }).errors.months);
  assert.ok(E.loan({ principal: 100000, annualRate: 9, totalMonths: 601 }).errors.months);
  assert.ok(E.loan({ principal: 100000, annualRate: 75, totalMonths: 12 }).errors.annualRate);
  const big = E.loan({ principal: 50e7, annualRate: 8.5, years: 30, months: 0 });
  assert.equal(big.ok, true);
  assert.equal(big.finalBalance, 0);
});

test("amount parsing handles commas, ₹ and lakh/crore shorthand", () => {
  assert.equal(E.parseAmount("₹1,25,000"), 125000);
  assert.equal(E.parseAmount("Rs. 2,500.50"), 2500.5);
  assert.equal(E.parseAmount(" 10 00 000 "), 1000000);
  assert.equal(E.parseAmount("1.5L"), 150000);
  assert.equal(E.parseAmount("2 crore"), 2e7);
  assert.ok(Number.isNaN(E.parseAmount("abc")));
  assert.equal(E.formatINR(125000), "₹1,25,000");
  assert.equal(E.formatINR(12345678.9, 2), "₹1,23,45,678.90");
});

test("rate sensitivity is calculated from the loan", () => {
  const s = E.rateSensitivity(1000000, 9, 240, [0.5, 1]);
  near(s[0].emi, E.emi(1000000, 9.5, 240));
  assert.ok(s[1].interestDiff > s[0].interestDiff && s[0].interestDiff > 0);
});

test("loan comparison picks the cheapest by total cost, not the lowest EMI", () => {
  const c = E.compareLoans([
    { principal: 500000, annualRate: 10.5, totalMonths: 60, fee: { type: "percent", value: 1 }, feeGst: true },
    { principal: 500000, annualRate: 11, totalMonths: 84, fee: { type: "none" } },
    { principal: 500000, annualRate: 9.9, totalMonths: 60, fee: { type: "fixed", value: 15000 }, feeGst: true },
  ]);
  assert.equal(c.lowestEmiIndex, 1);
  assert.equal(c.cheapestIndex, 0);
});

test("dates roll month by month and clamp month ends", () => {
  assert.equal(E.addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(E.addMonths("2026-11-05", 2), "2027-01-05");
  assert.equal(E.monthsLabel(90), "7 years 6 months");
});

/* ---------------- No-Cost EMI ---------------- */

const base = { price: 60000, months: 6, annualRate: 16, fee: { type: "none" }, interestGstRate: 18, gstRate: 18 };

test("standard EMI with no subsidy: interest, GST and fee all cost extra", () => {
  const r = E.noCost({ ...base, mode: "regular", fee: { type: "fixed", value: 199 } });
  assert.equal(r.bookingPrincipal, 60000);
  assert.equal(r.interestSubsidy, 0);
  near(r.interest, sum(r.schedule.rows, "interest"));
  near(r.interestGst, r.schedule.rows.reduce((s, x) => s + E.round2(x.interest * 0.18), 0));
  assert.equal(r.feeGst, 35.82);
  near(r.effectiveCost, 60000 + r.interest + r.interestGst + 199 + 35.82, 0.02);
  assert.equal(E.verdict(r).kind, "costlier");
});

test("full upfront subvention: instalments add up to the price, GST is the extra", () => {
  const r = E.noCost({ ...base, mode: "upfront" });
  near(r.totalEmis, 60000, 1);
  near(r.bookingPrincipal + r.interest, r.totalEmis, 0.01);
  near(r.upfrontSubsidy, r.interest, 1); // subsidy equals the interest the bank charges
  assert.equal(r.interestCashback, 0); // not counted twice
  near(r.effectiveCost - 60000, r.interestGst, 1);
  assert.equal(E.verdict(r).kind, "extra");
});

test("matches SBI Card's published manufacturer-subvention example", () => {
  // sbicard.com cal-tc: ₹35,000, 6 months, 14% → cashback ₹1,386, booking ₹33,614, EMI ₹5,833.
  const r = E.noCost({ price: 35000, months: 6, annualRate: 14, mode: "upfront", fee: { type: "none" }, gstOnInterest: false });
  assert.equal(Math.round(r.upfrontSubsidy), 1386);
  assert.equal(Math.round(r.bookingPrincipal), 33614);
  assert.equal(r.emi, 5833);
  near(r.totalEmis, 35000, 1);
  near(r.interest, 1386, 1);
});

test("American Express's ₹12,000 illustration differs by its billing convention", () => {
  // Amex's T&C show ₹282 interest at 14% over 3 months on ₹12,000. A monthly reducing schedule
  // on the reduced booking gives ₹274; we disclose the gap instead of matching it.
  const r = E.noCost({ price: 12000, months: 3, annualRate: 14, mode: "upfront", fee: { type: "none" }, gstOnInterest: false });
  near(r.totalEmis, 12000, 1);
  assert.ok(Math.abs(r.interest - 282) < 10);
});

test("partial (low-cost) subvention covers only part of the interest", () => {
  const full = E.noCost({ ...base, mode: "upfront" });
  const half = E.noCost({ ...base, mode: "lowcost", subsidyPct: 50 });
  near(half.upfrontSubsidy, full.upfrontSubsidy / 2, 0.01);
  assert.ok(half.totalEmis > 60000);
  assert.ok(half.effectiveCost > full.effectiveCost);
});

test("later cashback: you pay the interest first, then get it back", () => {
  const r = E.noCost({ ...base, mode: "cashback" });
  assert.equal(r.bookingPrincipal, 60000);
  near(r.interestCashback, r.interest);
  near(r.effectiveCost, 60000 + r.interestGst, 0.02);
  const pending = E.noCost({ ...base, mode: "cashback", cashbackReceived: false });
  near(pending.effectiveCost, 60000 + pending.interest + pending.interestGst, 0.02);
  assert.notEqual(r.mode, "upfront");
  // Cashback and upfront models are not the same: the cashback model charges interest on more.
  const up = E.noCost({ ...base, mode: "upfront" });
  assert.ok(r.interest > up.interest);
});

test("GST on interest follows the monthly schedule and can be switched off", () => {
  const r = E.noCost({ ...base, mode: "regular" });
  r.schedule.rows.forEach((x) => assert.equal(x.gst, E.round2(x.interest * 0.18)));
  const off = E.noCost({ ...base, mode: "regular", gstOnInterest: false });
  assert.equal(off.interestGst, 0);
});

test("processing fee: fixed, percentage with cap, none", () => {
  const fixed = E.noCost({ ...base, mode: "upfront", fee: { type: "fixed", value: 249 } });
  assert.equal(fixed.fee, 249);
  assert.equal(fixed.feeGst, 44.82);
  const pct = E.noCost({ ...base, mode: "upfront", fee: { type: "percent", value: 2.99, max: 299 } });
  assert.equal(pct.fee, 299);
  const none = E.noCost({ ...base, mode: "upfront", fee: { type: "none" } });
  assert.equal(none.fee + none.feeGst, 0);
  const noGst = E.noCost({ ...base, mode: "upfront", fee: { type: "fixed", value: 199 }, feeGst: false });
  assert.equal(noGst.feeGst, 0);
});

test("instant discounts lower the booking; EMI-only discounts don't help the full-payment side", () => {
  const r = E.noCost({ ...base, mode: "upfront", merchantDiscount: 2000, bankDiscountEmi: 3000 });
  assert.equal(r.emiBase, 55000);
  assert.equal(r.fullPay, 58000);
  assert.equal(E.verdict(r).kind, "cheaper");
  near(r.difference, r.effectiveCost - 58000);
});

test("full swipe vs EMI includes full-payment discounts and rewards", () => {
  const r = E.noCost({ ...base, mode: "upfront", bankDiscountFull: 1500, fullRewards: 600 });
  assert.equal(r.fullPay, 58500);
  assert.equal(r.fullNet, 57900);
  assert.ok(r.difference > 2000);
  assert.equal(E.verdict(r).kind, "extra");
});

test("different tenures cost different amounts under the same offer", () => {
  const costs = [3, 6, 9, 12, 18, 24].map((m) => E.noCost({ ...base, months: m, mode: "upfront" }).effectiveCost);
  for (let i = 1; i < costs.length; i++) assert.ok(costs[i] > costs[i - 1], costs.join(","));
});

test("no-cost validation catches impossible inputs", () => {
  assert.equal(E.noCost({ ...base, price: 0 }).ok, false);
  assert.ok(E.noCost({ ...base, merchantDiscount: 70000 }).errors.discounts);
  assert.ok(E.noCost({ ...base, months: 0 }).errors.months);
  assert.ok(E.noCost({ ...base, annualRate: "" }).errors.annualRate);
});

test("verdict reports insufficient information for unverified terms, and same cost within ₹1", () => {
  const r = E.noCost({ ...base, mode: "upfront", gstOnInterest: false });
  assert.equal(E.verdict(r).kind, "same");
  assert.equal(E.verdict(r, { unverified: true }).kind, "insufficient");
});

test("rupee-rounded EMIs reconcile: last instalment absorbs the rounding", () => {
  for (const m of [3, 6, 9, 12, 18, 24]) {
    const r = E.noCost({ price: 79999, months: m, annualRate: 15.99, mode: "upfront", fee: { type: "none" } });
    const rows = r.schedule.rows;
    rows.slice(0, -1).forEach((x) => assert.equal(x.emi, r.emi));
    near(sum(rows, "emi"), r.bookingPrincipal + r.interest, 0.01);
    assert.equal(r.schedule.finalBalance, 0);
    assert.ok(Math.abs(rows.at(-1).emi - r.emi) < m, `last ${rows.at(-1).emi} vs ${r.emi}`);
  }
});

test("foreclosure after k instalments uses the outstanding principal", () => {
  const r = E.noCost({ ...base, mode: "upfront" });
  const f = E.foreclosure(r, 2, { percent: 3, gst: true, gstRate: 18, reverseSubsidy: true });
  assert.equal(f.outstanding, r.schedule.rows[1].closing);
  near(f.fee, f.outstanding * 0.03, 0.01);
  near(f.feeGst, f.fee * 0.18, 0.01);
  assert.equal(f.subsidyReversed, r.interestSubsidy);
  const hsbcMin = E.foreclosure(r, 5, { percent: 3, min: 250 });
  assert.ok(hsbcMin.fee >= 250);
});

/* ---------------- Issuer rules ---------------- */

function loadIssuers() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "assets/emi-issuers.js"), "utf8"), ctx);
  return ctx.window.EMI_ISSUERS;
}

test("issuer file lists the 26 directory entries and only sourced rules are usable", () => {
  const data = loadIssuers();
  assert.equal(data.issuers.length, 26);
  const ids = new Set();
  for (const is of data.issuers) {
    assert.ok(!ids.has(is.id), `duplicate ${is.id}`);
    ids.add(is.id);
    for (const p of is.programs || []) {
      if (p.status === "verified" || p.status === "partial") {
        assert.ok(/^https:\/\//.test(p.source?.url || ""), `${is.id} needs an official https source`);
        assert.match(p.verifiedOn, /^\d{4}-\d{2}-\d{2}$/);
      }
    }
  }
});

test("unverified and expired rules never fill in a rate", () => {
  assert.equal(E.ruleTerms(null, 6).rate, null);
  assert.equal(E.ruleTerms({ status: "verified", rates: { all: 14 } }, 6).status, "unverified"); // no source
  const expired = { status: "verified", verifiedOn: "2026-07-01", source: { url: "https://example.com" }, validTo: "2026-09-09", rates: { all: 16.5 } };
  assert.equal(E.ruleStatus(expired, "2026-10-18"), "expired");
  assert.equal(E.ruleTerms(expired, 6, "2026-10-18").rate, null);
  const live = { status: "verified", verifiedOn: "2026-10-18", source: { url: "https://example.com" }, tenures: [3, 6], rates: { 3: 17.25, 6: 17 }, fee: { byTenure: { 3: 0, 6: 45 } } };
  assert.equal(E.ruleTerms(live, 6, "2026-10-18").rate, 17);
  assert.deepEqual(E.ruleTerms(live, 3, "2026-10-18").fee, { type: "none", value: 0 });
  assert.equal(E.ruleTerms(live, 9, "2026-10-18").rate, null); // unsupported tenure → simulation
});

test("SBI Card's Merchant EMI rule fills 17.25% / 17% and the tenure fee table", () => {
  const sbi = loadIssuers().issuers.find((i) => i.id === "sbi-card").programs[0];
  const t3 = E.ruleTerms(sbi, 3, "2026-10-18");
  const t12 = E.ruleTerms(sbi, 12, "2026-10-18");
  assert.equal(t3.rate, 17.25);
  assert.equal(t3.fee.type, "none");
  assert.equal(t12.rate, 17);
  assert.equal(t12.fee.value, 89);
});
