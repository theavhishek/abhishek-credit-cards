#!/usr/bin/env node
// Writes the card offers row (scripts/offers/cards.mjs) into every page that shows it.
//   node scripts/offers/build.mjs          write the pages
//   node scripts/offers/build.mjs --check  fail if any page is out of date
// Homepage: between <!-- offers:home:start/end --> (its own section in the page flow).
// Other pages: between <!-- offers:start/end -->, a band between </main> and the footer. The /updates
// article template gets the band too, so run `node scripts/updates/build.mjs` afterwards (pnpm build:offers does).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { CARDS, CHECKED_ON } from "./cards.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CHECK = process.argv.includes("--check");

const HOME = "home.html";
const BAND_PAGES = [
  "card-reviews.html",
  ...fs.readdirSync(path.join(ROOT, "card-reviews")).filter((f) => f.endsWith(".html")).sort().map((f) => `card-reviews/${f}`),
  "support.html",
  "pay-credit-card-bill.html",
  "movie-offers.html",
  "credit-card-upi-id.html",
  "calculator/loan-emi.html",
  "calculator/no-cost-emi.html",
  "updates.html",
  "portfolio.html",
  "scripts/updates/templates/page.html",
];

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const hash = (rel) => crypto.createHash("sha256").update(read(rel)).digest("hex").slice(0, 8);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const CSS_V = hash("assets/offer-banners.css");
const JS_V = hash("assets/offer-banners.js");

const chevron = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;

function art(card) {
  const alt = esc(`${card.name} credit card`);
  if (card.art === "logo") {
    return `<span class="ofs-art ofs-art--logo" aria-hidden="true"><span><img src="${card.src}" alt="" width="56" height="56" loading="lazy" decoding="async"></span></span>`;
  }
  const cls = card.art === "wide" ? "ofs-art ofs-art--wide" : "ofs-art";
  return `<span class="${cls}"><img src="${card.src}" alt="${alt}" width="${card.width}" height="${card.height}" loading="lazy" decoding="async"></span>`;
}

// Facts and headlines are trusted repo data and may hold <b> for figures.
const banner = (card, pad) => `${pad}<li>
${pad}  <a class="ofs" style="--ofs-a:${card.colors[0]};--ofs-b:${card.colors[1]}" href="${esc(card.url)}" target="_blank" rel="sponsored noopener noreferrer">
${pad}    ${art(card)}
${pad}    <span class="ofs-copy">
${pad}      <span class="ofs-pill"><b>${esc(card.name)}</b><i></i><span>${esc(card.bank)}</span></span>
${pad}      <strong class="ofs-h">${card.headline}</strong>
${pad}      <span class="ofs-facts">${card.facts.map((f) => `<span>${f}</span>`).join("")}</span>
${pad}    </span>
${pad}    <span class="sr-only"> (opens in a new tab)</span>
${pad}  </a>
${pad}</li>`;

function section({ home }) {
  const rowId = home ? "hm-offers" : "ofs-row";
  const titleId = home ? "offers-title" : "ofs-title";
  const btnCls = home ? "hm-scroll-btn" : "ofs-btn";
  const pad = home ? "    " : "  ";
  const buttons = `<div class="${home ? "hm-scroll-btns" : "ofs-btns"}" data-ofs-btns hidden>
${pad}      <button type="button" class="${btnCls}" data-dir="-1" aria-controls="${rowId}" aria-label="Previous offers">${chevron("M15 6l-6 6 6 6")}</button>
${pad}      <button type="button" class="${btnCls}" data-dir="1" aria-controls="${rowId}" aria-label="Next offers">${chevron("M9 6l6 6-6 6")}</button>
${pad}    </div>`;
  const open = home
    ? `${pad}<section class="hm-offers" aria-labelledby="${titleId}" data-ofs>
${pad}  <div class="hm-section-head hm-section-head-row">
${pad}    <h2 id="${titleId}">Card offers</h2>`
    : `${pad}<aside class="ofs-band" aria-labelledby="${titleId}" data-ofs>
${pad}  <div class="ofs-head">
${pad}    <h2 id="${titleId}" class="ofs-title">Card offers</h2>`;
  return `${open}
${pad}    ${buttons}
${pad}  </div>
${pad}  <p class="ofs-lead">Card benefits checked on each bank’s own site on <time datetime="${CHECKED_ON.iso}">${CHECKED_ON.label}</time>. Tap a card to apply.</p>
${pad}  <ul class="ofs-row" id="${rowId}" aria-label="Card offers">
${CARDS.map((c) => banner(c, pad + "    ")).join("\n")}
${pad}  </ul>
${pad}</${home ? "section" : "aside"}>`;
}

function withAssets(html, rel) {
  const css = `<link rel="stylesheet" href="/assets/offer-banners.css?v=${CSS_V}">`;
  const js = `<script src="/assets/offer-banners.js?v=${JS_V}" defer></script>`;
  if (/offer-banners\.css\?v=[^"]*"/.test(html)) html = html.replace(/<link rel="stylesheet" href="\/assets\/offer-banners\.css\?v=[^"]*">/, css);
  else html = html.replace("</head>", `  ${css}\n</head>`);
  if (/offer-banners\.js\?v=[^"]*"/.test(html)) html = html.replace(/<script src="\/assets\/offer-banners\.js\?v=[^"]*" defer><\/script>/, js);
  else html = html.replace("</body>", `  ${js}\n</body>`);
  if (!html.includes(css) || !html.includes(js)) throw new Error(`${rel}: could not add offer-banners assets`);
  return html;
}

function build(rel) {
  let html = read(rel);
  if (rel === HOME) {
    const re = /    <!-- offers:home:start -->\n[\s\S]*?<!-- offers:home:end -->\n/;
    if (!re.test(html)) throw new Error(`${rel}: missing <!-- offers:home:start/end --> markers`);
    html = html.replace(re, `    <!-- offers:home:start -->\n${section({ home: true })}\n    <!-- offers:home:end -->\n`);
  } else {
    const block = `<!-- offers:start -->\n${section({ home: false })}\n  <!-- offers:end -->`;
    const re = /<!-- offers:start -->[\s\S]*?<!-- offers:end -->/;
    if (re.test(html)) html = html.replace(re, block);
    else {
      const at = html.search(/^[ \t]*<footer class="global-footer gf"/m);
      if (at < 0) throw new Error(`${rel}: no global footer to place the offers band before`);
      html = html.slice(0, at) + `  ${block}\n\n` + html.slice(at);
    }
  }
  return withAssets(html, rel);
}

let stale = 0;
for (const rel of [HOME, ...BAND_PAGES]) {
  const next = build(rel);
  if (next === read(rel)) continue;
  if (CHECK) { console.error(`out of date: ${rel}`); stale++; }
  else { fs.writeFileSync(path.join(ROOT, rel), next); console.log(`wrote ${rel}`); }
}
if (CHECK && stale) { console.error(`${stale} page(s) out of date. Run: pnpm build:offers`); process.exit(1); }
if (CHECK) console.log(`offers: ${1 + BAND_PAGES.length} pages up to date (${CARDS.length} cards)`);
