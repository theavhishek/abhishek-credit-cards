// Tests for the /updates content pipeline. Run with: pnpm test:updates
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { core, parseFrontmatter, renderMarkdown, loadItems, ROOT } from "./lib.mjs";

const ist = (s) => Date.parse(s.replace(" ", "T") + "+05:30");

test("dates are read as India time", () => {
  assert.equal(core.toMs("2026-10-31", "start"), Date.parse("2026-10-30T18:30:00Z"));
  assert.equal(core.toMs("2026-10-31", "end"), Date.parse("2026-10-31T18:29:59.999Z"));
  assert.equal(core.toMs("2026-10-31 18:00", "start"), Date.parse("2026-10-31T12:30:00Z"));
  assert.equal(core.istDayKey(Date.parse("2026-10-31T19:00:00Z")), "2026-11-01");
  assert.equal(core.isValidDate("2026-02-30"), false);
  assert.equal(core.isValidDate("2026-10-14 24:00"), false);
  assert.equal(core.isValidDate("2026-10-14 23:59"), true);
});

test("offer status follows the validity window in IST", () => {
  const offer = { starts: "2026-10-10", ends: "2026-10-31", verified: "2026-10-09" };
  assert.equal(core.offerStatus(offer, ist("2026-10-09 23:59")), "upcoming");
  assert.equal(core.offerStatus(offer, ist("2026-10-10 00:00")), "active");
  assert.equal(core.offerStatus(offer, ist("2026-10-31 23:59")), "active");
  assert.equal(core.offerStatus(offer, ist("2026-11-01 00:00")), "expired");
  // 23:30 UTC on 31 Oct is already 1 Nov in India.
  assert.equal(core.offerStatus(offer, Date.parse("2026-10-31T18:30:00Z")), "expired");
});

test("an offer is never active without verification or an end date", () => {
  const now = ist("2026-10-14 12:00");
  assert.equal(core.offerStatus({ ends: "2026-10-31" }, now), "unverified");
  assert.equal(core.offerStatus({ verified: "2026-10-14" }, now), "unverified");
  assert.equal(core.offerStatus({}, now), "unverified");
  // Ended offers read as expired even if they were never verified.
  assert.equal(core.offerStatus({ ends: "2026-10-01" }, now), "expired");
});

test("ongoing offers need a re-check every 30 days", () => {
  const offer = { ends: "ongoing", verified: "2026-10-01" };
  assert.equal(core.offerStatus(offer, ist("2026-10-31 12:00")), "active");
  assert.equal(core.offerStatus(offer, ist("2026-11-01 12:00")), "unverified");
});

test("timed end dates end at that minute", () => {
  const offer = { ends: "2026-10-14 18:00", verified: "2026-10-13" };
  assert.equal(core.offerStatus(offer, ist("2026-10-14 18:00")), "active");
  assert.equal(core.offerStatus(offer, ist("2026-10-14 18:01")), "expired");
  assert.equal(core.validityText(offer), "Until 14 Oct 2026, 6:00 pm IST");
  assert.equal(core.validityText({ starts: "2026-10-01", ends: "2026-10-31" }), "1 Oct 2026 to 31 Oct 2026, 11:59 pm IST");
  assert.equal(core.validityText({}), "End date not confirmed");
});

test("frontmatter parser reads the supported subset and rejects the rest", () => {
  const { data, body } = parseFrontmatter(`---
type: offer
title: "Quoted: title"
cards: [One, "Two, with comma"]
draft: false
sources:
  - label: Terms
    url: https://example.com/a#b
    kind: official
offer:
  value: 10% off
  ends: 2026-10-31 23:00
---
Body text
`);
  assert.equal(data.title, "Quoted: title");
  assert.deepEqual(data.cards, ["One", "Two, with comma"]);
  assert.equal(data.draft, false);
  assert.deepEqual(data.sources, [{ label: "Terms", url: "https://example.com/a#b", kind: "official" }]);
  assert.equal(data.offer.ends, "2026-10-31 23:00");
  assert.equal(body.trim(), "Body text");
  assert.throws(() => parseFrontmatter("---\ntitle: a\ntitle: b\n---\n"), /appears twice/);
  assert.throws(() => parseFrontmatter("---\nsummary: |\n---\n"), /Multi-line/);
  assert.throws(() => parseFrontmatter("title: no fence\n"), /must start/);
});

test("markdown escapes HTML and only allows safe links", () => {
  const problems = [];
  const { html } = renderMarkdown("Hello <script>x</script> **bold** [ok](https://a.com) [bad](javascript:alert(1))\n\n## Head\n\n- one\n- two", problems);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<a href="https:\/\/a.com" target="_blank" rel="noopener noreferrer">/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /<h2 id="head">Head<\/h2>/);
  assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  assert.equal(problems.length, 1);
});

test("markdown allows tap-to-call phone links", () => {
  const problems = [];
  const { html } = renderMarkdown("Call [**02269445464**](tel:02269445464) or [x](tel:12ab)", problems);
  assert.match(html, /<a href="tel:02269445464"><strong>02269445464<\/strong><\/a>/);
  assert.equal(problems.length, 1);
});

test("markdown tables render as review-style tables", () => {
  const problems = [];
  const { html } = renderMarkdown("## Fees\n\n| Due | Fee |\n|---|---|\n| ₹500 or less | **NIL** |\n| <b>x</b> | ₹500 |", problems);
  assert.match(html, /<div class="rv-table-wrap" role="region" aria-label="Fees" tabindex="0"><table class="rv-table">/);
  assert.match(html, /<thead><tr><th scope="col">Due<\/th><th scope="col">Fee<\/th><\/tr><\/thead>/);
  assert.match(html, /<td><strong>NIL<\/strong><\/td>/);
  assert.match(html, /&lt;b&gt;x/);
  assert.equal(problems.length, 0);
  renderMarkdown("| a | b |\n| c | d |", problems);
  assert.equal(problems.length, 1);
});

test("filters: default view hides ended and unverified offers", () => {
  const now = ist("2026-10-14 12:00");
  const items = [
    { slug: "n", type: "news", title: "HDFC news", summary: "", category: "devaluation", issuer: "HDFC Bank" },
    { slug: "old", type: "news", title: "Old", summary: "", category: "banking", archived: true },
    { slug: "a", type: "offer", title: "Active", summary: "", category: "cashback", merchant: "Myntra", offer: { ends: "2026-10-31", verified: "2026-10-14", code: "SAVE10" } },
    { slug: "e", type: "offer", title: "Ended", summary: "", category: "cashback", offer: { ends: "2026-10-01", verified: "2026-09-01" } },
    { slug: "u", type: "offer", title: "Unverified", summary: "", category: "cashback", offer: {} },
  ];
  const pick = (state) => items.filter((i) => core.matches(i, state, now)).map((i) => i.slug).join();
  assert.equal(pick({ view: "all" }), "n,a");
  assert.equal(pick({ view: "offers" }), "a");
  assert.equal(pick({ view: "devaluations" }), "n");
  assert.equal(pick({ view: "devaluations", show: "all" }), "n");
  assert.equal(pick({ view: "all", show: "archive" }), "old,e");
  assert.equal(pick({ view: "all", show: "all" }), "n,old,a,e,u");
  assert.equal(pick({ view: "all", q: "save10" }), "a");
  assert.equal(pick({ view: "all", q: "hdfc devaluation" }), "n");
  assert.equal(pick({ view: "all", bank: "Myntra" }), "a");
  assert.equal(pick({ view: "all", cat: "devaluation" }), "n");
});

test("feed cards show the item's fact tile beside the headline, not its image", () => {
  const item = { slug: "x", type: "news", title: "T", summary: "S", category: "devaluation", published: "2026-10-14", confirmation: "official", issuer: "PNB",
    image: { src: "/assets/updates/x.jpg", thumb: "/assets/updates/x-thumb.webp", width: 1024, height: 1536, alt: "Poster" },
    tile: { figure: "₹99", caption: "per redemption", logo: "/assets/bank-logos/punb.svg" } };
  const html = core.renderItem(item);
  assert.match(html, /class="up-item up-news has-thumb"/);
  assert.match(html, /<span class="up-thumb up-tile" data-cat="devaluation" aria-hidden="true"><span class="up-tile-mark"><img class="up-tile-logo" src="\/assets\/bank-logos\/punb.svg" alt=""/);
  assert.match(html, /<span class="up-tile-figure">₹99<\/span><span class="up-tile-caption">per redemption<\/span>/);
  assert.doesNotMatch(html, /x-thumb\.webp|x\.jpg/);
  assert.match(html, /<div class="up-item-head">.*<h3 class="up-title">T<\/h3><\/div><div class="up-item-body"><p class="up-summary">S<\/p>/);
  delete item.tile.logo;
  assert.match(core.renderItem(item), /<span class="up-tile-name">PNB<\/span>/);
  delete item.tile;
  assert.doesNotMatch(core.renderItem(item), /up-thumb|up-item-head/);
});

test("the repo's content is valid", () => {
  const { errors } = loadItems();
  assert.deepEqual(errors, []);
});

test("the sample fixtures are valid and cover every offer status", () => {
  const now = Date.now();
  const { items, errors } = loadItems({ fixtures: true, drafts: true, now });
  assert.deepEqual(errors, []);
  const statuses = new Set(items.filter((i) => i.fixture && i.offer).map((i) => core.offerStatus(i.offer, now)));
  for (const s of ["active", "upcoming", "expired", "unverified"]) assert.ok(statuses.has(s), `missing ${s}`);
});

test("validation catches common mistakes", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "updates-"));
  const file = path.join(ROOT, "content/updates", `zz-test-${path.basename(dir)}.md`);
  const write = (text) => fs.writeFileSync(file, text);
  try {
    write(`---\ntype: offer\ntitle: Test offer for validation\nsummary: A summary long enough to pass the length warning check.\ncategory: devaluation\npublished: 2026-10-14\nexpires: 2026-10-20\noffer:\n  verified: 2026-10-14\n---\n`);
    const { errors } = loadItems();
    const text = errors.join("\n");
    assert.match(text, /Unknown field "expires"/);
    assert.match(text, /Category "devaluation" is for news items/);
    assert.match(text, /verified offer needs the official offer.link or offer.terms/);
  } finally {
    fs.rmSync(file, { force: true });
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("generated files are up to date", () => {
  execFileSync(process.execPath, [path.join(ROOT, "scripts/updates/build.mjs"), "--check"], { stdio: "pipe" });
});
