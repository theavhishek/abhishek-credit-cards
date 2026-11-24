// Note: data and core are loaded in a vm context, so compare arrays and objects by value (JSON), not deepEqual.
// Tests for /movie-offers: data validation and the savings calculator. Run: pnpm test:movies
import test from "node:test";
import assert from "node:assert/strict";
import { load } from "./bake.mjs";

const { data, core: C, ui } = load();
const TODAY = data.updated;
const base = { platform: "bms", issuer: "icici", cards: ["Test"], cardType: "credit", category: ["movies"], benefit: "x", status: "verified",
  source: { url: "https://example.com", type: "bank" }, accessed: TODAY, verified: TODAY };
const offer = (o) => ({ id: "t", ...base, ...o });
const booking = (o) => ({ price: 300, tickets: 2, platform: "", date: "", today: TODAY, ...o });

test("offer data passes every validation check", () => {
  const { errors } = C.validate(data, TODAY);
  assert.equal(errors.length, 0, errors.join("\n"));
});

test("validation catches broken records", () => {
  const bad = {
    ...data,
    offers: [
      offer({ id: "a", kind: "bogo", capTxn: 200 }),
      offer({ id: "a", kind: "bogo", capTxn: 200, cards: ["Other"] }), // duplicate id
      offer({ id: "b", kind: "percent" }), // percent missing
      offer({ id: "c", kind: "bogo", start: "2026-12-10", end: "2026-12-01" }), // bad dates
      offer({ id: "d", kind: "bogo", status: "listed", capTxn: 100, verified: undefined }), // listed with figures
      offer({ id: "e", kind: "percent", percent: 10, capTxn: 500, monthCap: 300 }), // cap conflict
      offer({ id: "f", kind: "bogo", issuer: "nope" }), // unknown issuer
      offer({ id: "g", kind: "bogo", cards: ["ICICI Bank Coral"] }), // issuer repeated in card name
      offer({ id: "h", kind: "bogo", capTxn: 100, uses: { count: 1, per: "month" }, monthCap: 500 }), // unreachable monthly cap
      offer({ id: "i", kind: "flat", flat: 100, status: "app", source: { url: "https://x.in", type: "bank" } }), // app needs app source
      offer({ id: "j", kind: "bogo", verified: undefined }), // verified without date
      offer({ id: "k", kind: "bogo", cards: ["Test"], benefit: "x" }), // duplicate of a
    ],
  };
  const { errors } = C.validate(bad, TODAY);
  const has = (id, re) => assert.ok(errors.some((e) => e.startsWith(id + ":") && re.test(e)), `${id} should fail with ${re}`);
  has("a", /duplicate id/); has("b", /without percent/); has("c", /start is after end/); has("d", /can’t carry figures/);
  has("e", /capTxn is above monthCap/); has("f", /unknown issuer/); has("g", /repeats the issuer/); has("h", /monthCap 500/);
  has("i", /app status/); has("j", /need a verified date/); has("k", /duplicate of/);
});

test("expired offers are flagged and hidden; missing end is not treated as confirmed ongoing", () => {
  const o = offer({ kind: "bogo", capTxn: 200, end: "2026-11-20" });
  assert.equal(C.effectiveStatus(o, TODAY), "expired");
  assert.ok(C.validate({ ...data, offers: [o] }, TODAY).warnings.some((w) => /ended/.test(w)));
  assert.equal(C.evaluate(o, booking({})), null);
  assert.equal(C.effectiveStatus(offer({ kind: "bogo" }), TODAY), "verified");
  assert.equal(C.endingSoon(offer({ kind: "bogo" }), TODAY), false);
});

test("today is computed in India time", () => {
  assert.equal(C.todayIST(new Date("2026-11-30T19:00:00Z")), "2026-12-01"); // 00:30 IST
  assert.equal(C.todayIST(new Date("2026-11-30T18:00:00Z")), "2026-11-30"); // 23:30 IST
});

test("BOGO: one free ticket per booking, capped", () => {
  const o = offer({ kind: "bogo", capTxn: 200, minTickets: 2 });
  assert.equal(C.evaluate(o, booking({ price: 300, tickets: 2 })).discount, 200);
  assert.equal(C.evaluate(o, booking({ price: 150, tickets: 2 })).discount, 150);
  assert.equal(C.evaluate(o, booking({ price: 300, tickets: 5 })).discount, 200);
  const single = C.evaluate(o, booking({ tickets: 1 }));
  assert.equal(single.eligible, false);
  assert.match(single.reason, /2 tickets/);
});

test("BOGO without a stated minimum still needs two tickets", () => {
  const r = C.evaluate(offer({ kind: "bogo", capTxn: 500 }), booking({ tickets: 1 }));
  assert.equal(r.eligible, false);
});

test("percent: capped per booking and per month; uncapped is flagged", () => {
  assert.equal(C.evaluate(offer({ kind: "percent", percent: 25, capTxn: 100 }), booking({ price: 300, tickets: 2 })).discount, 100);
  assert.equal(C.evaluate(offer({ kind: "percent", percent: 25, capTxn: 100 }), booking({ price: 150, tickets: 2 })).discount, 75);
  assert.equal(C.evaluate(offer({ kind: "percent", percent: 10, monthCap: 50 }), booking({ price: 400, tickets: 2 })).discount, 50);
  const r = C.evaluate(offer({ kind: "percent", percent: 10 }), booking({}));
  assert.equal(r.discount, 60);
  assert.ok(r.conditions.some((c) => /No cap/.test(c)));
});

test("flat: minimum booking amount and never more than the total", () => {
  const o = offer({ kind: "flat", flat: 125, minAmount: 500 });
  assert.equal(C.evaluate(o, booking({ price: 200, tickets: 2 })).eligible, false);
  assert.equal(C.evaluate(o, booking({ price: 250, tickets: 2 })).discount, 125);
  assert.equal(C.evaluate(offer({ kind: "flat", flat: 500 }), booking({ price: 200, tickets: 1 })).discount, 200);
});

test("single-ticket bookings only match offers that allow one ticket", () => {
  const { results } = C.rank(data.offers, booking({ price: 250, tickets: 1 }));
  for (const r of results) {
    assert.ok(!r.offer.minTickets || r.offer.minTickets <= 1, r.offer.id);
    assert.notEqual(r.offer.kind, "bogo", r.offer.id);
  }
});

test("free tickets: per-ticket cap and spend tiers are conditions", () => {
  const o = offer({ kind: "free", freeTickets: 2, capTicket: 250, tiers: [{ spend: 10000, freeTickets: 1 }, { spend: 15000, freeTickets: 2 }],
    spend: { amount: 10000, period: "billing-cycle", text: "₹10,000 a month" } });
  const r = C.evaluate(o, booking({ price: 300, tickets: 2 }));
  assert.equal(r.discount, 500);
  assert.equal(r.conditional, true);
  assert.ok(r.conditions.some((c) => /15,000/.test(c)));
  assert.equal(C.evaluate(o, booking({ price: 200, tickets: 1 })).discount, 200);
});

test("days: a show date on the wrong day doesn't fit; no date makes it a condition", () => {
  const o = offer({ kind: "bogo", capTxn: 200, days: [0, 6] });
  assert.equal(C.evaluate(o, booking({ date: "2026-11-25" })).eligible, false); // Wednesday
  assert.equal(C.evaluate(o, booking({ date: "2026-11-28" })).eligible, true); // Saturday
  assert.ok(C.evaluate(o, booking({})).conditions.includes("Only Sat and Sun"));
});

test("spend requirements are never assumed met", () => {
  const o = offer({ kind: "bogo", capTxn: 500, spend: { amount: 25000, period: "prev-quarter", text: "₹25,000 last quarter" } });
  const r = C.evaluate(o, booking({}));
  assert.equal(r.conditional, true);
  assert.match(r.conditions[0], /25,000/);
  const ranked = C.rank([o], booking({}), { hideConditional: true });
  assert.equal(ranked.results.length, 0);
});

test("cashback and points are not counted as instant discounts", () => {
  const cb = offer({ kind: "cashback", percent: 10, capTxn: 200 });
  const r = C.evaluate(cb, booking({}));
  assert.equal(r.instant, false);
  assert.equal(r.payable, r.total);
  assert.equal(C.rank([cb], booking({})).results.length, 0);
  assert.equal(C.rank([cb], booking({}), { includeLater: true }).results.length, 1);
  assert.equal(C.evaluate(offer({ kind: "rewards" }), booking({})).discount, null);
});

test("listed, needs-checking, upcoming and welcome offers stay out of the calculator", () => {
  for (const o of [offer({ kind: "bogo", status: "listed" }), offer({ kind: "bogo", status: "needs" }),
    offer({ kind: "bogo", capTxn: 200, start: "2027-01-01" }), offer({ kind: "flat", flat: 500, scope: "welcome" })]) {
    assert.equal(C.evaluate(o, booking({})), null, JSON.stringify(o));
  }
});

test("ranking puts the biggest instant saving first and respects platform and category", () => {
  const { results } = C.rank(data.offers, booking({ price: 400, tickets: 2, platform: "district" }));
  assert.ok(results.length > 5);
  for (let i = 1; i < results.length; i++) assert.ok(results[i - 1].discount >= results[i].discount);
  assert.ok(results.every((r) => r.offer.platform === "district" && r.offer.category.includes("movies")));
});

test("real data: corrected offers carry their verified conditions", () => {
  const get = (pred) => data.offers.find(pred);
  const eternal = get((o) => o.cards.includes("Eternal SBI"));
  assert.equal(eternal.capTxn, 200);
  assert.equal(JSON.stringify(eternal.uses), JSON.stringify({ count: 1, per: "month" }));
  assert.match(get((o) => o.cards.includes("FIRST Millennia")).spend.text, /previous calendar month/);
  assert.ok(data.offers.filter((o) => o.issuer === "icici" && o.platform === "bms" && o.status === "verified").every((o) => o.spend?.amount === 25000 || o.cardType === "debit"));
  const coral = get((o) => o.issuer === "icici" && o.platform === "pvr" && o.cards[0] === "Coral" && o.cardType === "credit");
  assert.equal(coral.changes[0].date, "2026-12-15");
  assert.equal(coral.end, "2026-12-14");
  assert.equal(get((o) => o.cards.includes("PLAY") && o.kind === "free").spend.amount, 5000);
  assert.ok(!data.offers.some((o) => o.issuer === "rupay"), "RuPay offers belong to their issuing banks");
});

test("baked lists render every shown offer once", () => {
  const html = ui.listHTML(data, "checked", TODAY) + ui.listHTML(data, "listed", TODAY);
  const ids = [...html.matchAll(/data-id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  const shown = data.offers.filter((o) => C.isShown(C.effectiveStatus(o, TODAY)));
  assert.equal(ids.length, shown.length);
});

test("search matches aliases and spellings", () => {
  const words = (pred) => C.searchWords(data.offers.find(pred), data);
  assert.ok(words((o) => o.cards.some((c) => /^MMT/.test(c))).includes("makemytrip"));
  assert.ok(words((o) => o.cards.includes("Live+")).includes("live plus"));
  assert.ok(words((o) => o.issuer === "sc").includes("stanchart"));
  assert.equal(C.queryTerms("  Live+  HSBC ").join(","), "live,plus,hsbc");
});
