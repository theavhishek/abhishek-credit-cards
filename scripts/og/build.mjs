#!/usr/bin/env node
// Renders the 1200×630 link-preview (Open Graph) images that WhatsApp, X,
// Telegram, LinkedIn and others show when a link to the site is shared.
//
//   pnpm build:og           render the images whose inputs changed
//   pnpm build:og --force   render every image again
//   pnpm check:og           fail if an image is missing or out of date (no browser needed)
//
// Two kinds of image:
//   assets/og/<file>.jpg            fixed pages, configured in scripts/og/pages.mjs
//   assets/og/updates/<slug>.jpg    one per /updates article page, built from the
//                                   post's category, title, dates and "tile" field
//
// assets/og/manifest.json records a hash of each image's inputs, so the check
// can tell when an image needs rendering again. After rendering update cards,
// run `pnpm build:updates` so the article pages point at them.
//
// Rendering uses Playwright's Chromium. If it isn't installed:
//   pnpm dlx playwright install chromium   (and `pnpm add -D playwright`)
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { loadItems, core, ROOT } from "../updates/lib.mjs";
import { PAGES } from "./pages.mjs";

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const FORCE = args.includes("--force");

const OG_DIR = path.join(ROOT, "assets/og");
const MANIFEST = path.join(OG_DIR, "manifest.json");
const MAX_BYTES = 300 * 1024; // WhatsApp skips preview images above roughly 300 KB
const TEMPLATE_VERSION = hash(fs.readFileSync(new URL(import.meta.url)));

// Category colours match the /updates badges (assets/updates.css).
const CATEGORY_COLOURS = {
  devaluation: ["#dc2626", "#ef4444"],
  launch: ["#4f46e5", "#818cf8"],
  cashback: ["#15803d", "#22c55e"],
  "spend-offer": ["#1d4ed8", "#3b82f6"],
};
const DEFAULT_COLOURS = ["#b45309", "#f2a24a"];

function hash(data) {
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 16);
}

const fileUrl = (rel) => pathToFileURL(path.join(ROOT, rel)).href;
const esc = core.esc;

/* ---------- Jobs ---------- */

function updateItems() {
  const { items, errors } = loadItems({ now: Date.now() });
  if (errors.length) {
    console.error(errors.map((e) => `  ✗ ${e}`).join("\n"));
    console.error("\nFix the /updates content first (pnpm build:updates shows the same problems).");
    process.exit(1);
  }
  return items;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dayParts(value) {
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  return { y, m, d };
}
function shortDate(value) {
  const p = dayParts(value);
  return `${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}
function dateRange(start, end) {
  if (!start) return end ? `Until ${shortDate(end)}` : "";
  if (!end) return `From ${shortDate(start)}`;
  const a = dayParts(start);
  const b = dayParts(end);
  if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${MONTHS[b.m - 1]} ${b.y}`;
  if (a.y === b.y) return `${a.d} ${MONTHS[a.m - 1]} – ${b.d} ${MONTHS[b.m - 1]} ${b.y}`;
  return `${shortDate(start)} – ${shortDate(end)}`;
}

function updateJob(item) {
  const t = item.tile;
  const when = item.type === "offer" && item.offer ? dateRange(item.offer.starts, item.offer.ends) : shortDate(item.published);
  const data = {
    kind: "update",
    category: item.category,
    label: core.categoryLabel(item.category),
    when,
    title: item.title,
    figure: t.figure,
    caption: t.caption || "",
    logo: t.logo || null,
    name: item.issuer || item.merchant || "",
  };
  return { out: `updates/${item.slug}.jpg`, data, files: t.logo ? [t.logo] : [] };
}

const today = new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10); // IST

function pageJob(page, items) {
  const data = { kind: "page", ...page };
  const files = [];
  const v = page.visual || {};
  if (v.cards) v.cards.forEach((c) => files.push(`/assets/hero/marquee/${c}.webp`));
  if (v.card) files.push(`/assets/hero/marquee/${v.card}.webp`);
  if (v.logos) v.logos.forEach((l) => files.push(`/assets/bank-logos/${l}`));
  if (v.tiles === "latest") {
    data.tiles = items
      .filter((i) => i.tile && i.tile.figure && !(i.offer && i.offer.ends && String(i.offer.ends).slice(0, 10) < today))
      .sort((a, b) => String(b.published).localeCompare(String(a.published)))
      .slice(0, 3)
      .map((i) => ({ category: i.category, figure: i.tile.figure, caption: i.tile.caption || "", logo: i.tile.logo || null }));
    data.tiles.forEach((t) => t.logo && files.push(t.logo));
  }
  return { out: page.file, data, files };
}

function jobs() {
  const items = updateItems();
  const list = PAGES.map((p) => pageJob(p, items));
  items.filter((i) => i.page && i.tile && i.tile.figure).forEach((i) => list.push(updateJob(i)));
  for (const job of list) {
    const assets = job.files.map((f) => hash(fs.readFileSync(path.join(ROOT, f))));
    job.hash = hash(JSON.stringify([TEMPLATE_VERSION, job.data, assets]));
  }
  return list;
}

/* ---------- Markup ---------- */

const CSS = `
@font-face{font-family:Geist;src:url(${fileUrl("assets/geist-sans-vf.woff2")}) format("woff2");font-weight:100 900}
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px}
body{font-family:Geist,system-ui,sans-serif;background:#0b0c10;color:#f5f5f4;position:relative;overflow:hidden;-webkit-font-smoothing:antialiased}
body::before{content:"";position:absolute;inset:0;background:radial-gradient(720px 440px at 92% 8%,var(--glow) 0%,transparent 70%);opacity:.2}
.wrap{position:absolute;inset:60px 72px 52px;display:grid;grid-template-columns:1fr var(--side,400px);gap:56px}
.wrap.solo{grid-template-columns:1fr}
.left{display:flex;flex-direction:column;min-width:0}
.top{display:flex;align-items:center;gap:14px;min-height:42px}
.pill{display:inline-flex;align-items:center;font-size:20px;font-weight:600;padding:9px 18px;border-radius:999px;background:var(--fill);color:#fff}
.when{font-size:20px;color:#a8a29e;font-weight:500}
.eyebrow{font-size:19px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#f2a24a}
h1{margin-top:26px;font-size:60px;line-height:1.08;font-weight:700;letter-spacing:-.028em;text-wrap:balance}
.sub{margin-top:18px;font-size:25px;line-height:1.35;color:#a8a29e;text-wrap:pretty;max-width:660px}
.stats{display:flex;gap:44px;margin-top:30px}
.stat b{display:block;font-size:40px;font-weight:700;letter-spacing:-.02em;color:#fafaf9}
.stat span{display:block;margin-top:4px;font-size:18px;color:#a8a29e}
.foot{margin-top:auto;display:flex;align-items:baseline;gap:10px;font-size:21px;color:#a8a29e;padding-top:20px;border-top:1px solid #26272d}
.foot b{color:#fafaf9;font-weight:700}
.right{position:relative;min-width:0}
.tile{position:absolute;inset:0;background:#fff;color:#111;border-radius:28px;padding:38px 36px;display:flex;flex-direction:column;box-shadow:0 30px 60px -20px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08);transform:rotate(2deg)}
.tile img{height:64px;width:auto;max-width:100%;object-fit:contain;object-position:left center;align-self:flex-start}
.tile .name{font-size:30px;font-weight:700}
.fig{margin-top:auto;white-space:nowrap;font-size:124px;font-weight:800;letter-spacing:-.045em;line-height:.95;color:var(--ink)}
.cap{margin-top:14px;font-size:28px;color:#57534e;font-weight:500;line-height:1.2}
.face{position:absolute;width:250px;aspect-ratio:54/85.6;object-fit:cover;border-radius:16px;box-shadow:0 30px 50px -18px rgba(0,0,0,.75),0 0 0 1px rgba(255,255,255,.1)}
.fan .face:nth-child(1){left:12px;top:70px;transform:rotate(-12deg)}
.fan .face:nth-child(2){left:150px;top:28px;transform:rotate(9deg)}
.fan .face:nth-child(3){left:76px;top:44px;transform:rotate(-1deg)}
.one .face{width:300px;left:50px;top:6px;transform:rotate(6deg)}
.logos{position:absolute;inset:20px 0 30px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;transform:rotate(2deg)}
.logos span{background:#fff;border-radius:20px;display:grid;place-items:center;padding:22px;box-shadow:0 18px 36px -16px rgba(0,0,0,.7)}
.logos img{max-width:100%;max-height:58px;object-fit:contain}
.donut{position:absolute;inset:20px 0 40px;display:grid;place-items:center}
.donut svg{width:330px;height:330px}
.legend{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:center;gap:28px;font-size:20px;color:#d6d3d1}
.legend i{display:inline-block;width:14px;height:14px;border-radius:4px;margin-right:9px;vertical-align:-1px}
.stack{position:absolute;inset:0}
.mini{position:absolute;left:0;right:0;height:150px;background:#fff;color:#111;border-radius:22px;padding:0 28px;display:grid;grid-template-columns:64px 1fr;grid-template-rows:auto auto;align-content:center;column-gap:22px;box-shadow:0 24px 44px -18px rgba(0,0,0,.75)}
.mini img{grid-row:span 2;align-self:center;width:64px;height:64px;object-fit:contain}
.mini .fig{margin:0;font-size:60px}
.mini .cap{font-size:20px;margin-top:6px}
.mini:nth-child(1){top:0;transform:rotate(-2deg)}
.mini:nth-child(2){top:178px;transform:rotate(1.5deg) translateX(14px)}
.mini:nth-child(3){top:356px;transform:rotate(-1deg)}
`;

function inkFor(category) {
  return (CATEGORY_COLOURS[category] || DEFAULT_COLOURS)[0];
}

function updateHtml(d) {
  const [fill, glow] = CATEGORY_COLOURS[d.category] || DEFAULT_COLOURS;
  const mark = d.logo ? `<img src="${fileUrl(d.logo.slice(1))}" alt="">` : `<span class="name">${esc(d.name)}</span>`;
  return `<body style="--fill:${fill};--glow:${glow};--ink:${fill}"><div class="wrap" style="--side:380px">
  <div class="left"><div class="top"><span class="pill">${esc(d.label)}</span><span class="when">${esc(d.when)}</span></div>
  <h1>${esc(d.title)}</h1>
  <div class="foot"><b>avhishek.in</b><span>· Credit card updates by Abhishek Meena</span></div></div>
  <div class="right"><div class="tile">${mark}<div class="fig">${esc(d.figure)}</div><div class="cap">${esc(d.caption)}</div></div></div>
</div></body>`;
}

function visualHtml(d) {
  const v = d.visual || {};
  if (v.cards) return `<div class="right fan">${v.cards.map((c) => `<img class="face" src="${fileUrl(`assets/hero/marquee/${c}.webp`)}" alt="">`).join("")}</div>`;
  if (v.card) return `<div class="right one"><img class="face" src="${fileUrl(`assets/hero/marquee/${v.card}.webp`)}" alt=""></div>`;
  if (v.logos) return `<div class="right"><div class="logos">${v.logos.map((l) => `<span><img src="${fileUrl(`assets/bank-logos/${l}`)}" alt=""></span>`).join("")}</div></div>`;
  if (v.donut) {
    const r = 120, c = 2 * Math.PI * r, share = 0.72;
    return `<div class="right"><div class="donut"><svg viewBox="0 0 300 300"><g transform="rotate(-90 150 150)" fill="none" stroke-width="40">
      <circle cx="150" cy="150" r="${r}" stroke="#f2a24a" stroke-dasharray="${c * share - 6} ${c}"/>
      <circle cx="150" cy="150" r="${r}" stroke="#57534e" stroke-dasharray="${c * (1 - share) - 6} ${c}" stroke-dashoffset="${-c * share}"/></g></svg></div>
      <div class="legend"><span><i style="background:#f2a24a"></i>${esc(v.donut[0])}</span><span><i style="background:#57534e"></i>${esc(v.donut[1])}</span></div></div>`;
  }
  if (d.tiles) {
    return `<div class="right"><div class="stack">${d.tiles.map((t) => `<div class="mini" style="--ink:${inkFor(t.category)}">${t.logo ? `<img src="${fileUrl(t.logo.slice(1))}" alt="">` : ""}<div class="fig">${esc(t.figure)}</div><div class="cap">${esc(t.caption)}</div></div>`).join("")}</div></div>`;
  }
  return "";
}

function pageHtml(d) {
  const visual = visualHtml(d);
  const stats = d.stats && d.stats.length
    ? `<div class="stats">${d.stats.map(([b, s]) => `<div class="stat"><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("")}</div>`
    : "";
  return `<body style="--glow:#f2a24a"><div class="wrap${visual ? "" : " solo"}">
  <div class="left"><div class="top"><span class="eyebrow">${esc(d.eyebrow)}</span></div>
  <h1>${esc(d.title)}</h1>${d.subtitle ? `<p class="sub">${esc(d.subtitle)}</p>` : ""}${stats}
  <div class="foot"><b>avhishek.in</b><span>· Abhishek Meena</span></div></div>
  ${visual}
</div></body>`;
}

const documentFor = (job) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${CSS}</style></head>${job.data.kind === "update" ? updateHtml(job.data) : pageHtml(job.data)}</html>`;

/* ---------- Run ---------- */

const list = jobs();
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
const stale = list.filter((j) => FORCE || manifest[j.out] !== j.hash || !fs.existsSync(path.join(OG_DIR, j.out)));

if (CHECK) {
  if (stale.length) {
    console.error(stale.map((j) => `  ✗ assets/og/${j.out} is missing or out of date`).join("\n"));
    console.error("\nRun pnpm build:og, then pnpm build:updates.");
    process.exit(1);
  }
  console.log(`  ✓ ${list.length} link-preview images are up to date`);
  process.exit(0);
}

if (!stale.length) {
  console.log(`  ✓ ${list.length} link-preview images are up to date`);
  process.exit(0);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  // Fall back to a global install (NODE_PATH), which ESM imports don't search.
  try { ({ chromium } = createRequire(import.meta.url)("playwright")); } catch {}
}
if (!chromium) {
  console.error("  ✗ Playwright isn't installed. Run: pnpm add -D playwright && pnpm dlx playwright install chromium");
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "og-"));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
try {
  for (const job of stale) {
    const htmlPath = path.join(tmp, "card.html");
    fs.writeFileSync(htmlPath, documentFor(job));
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
      // Shrink the headline until it clears the footer, and the big figure until it fits its tile.
      const h = document.querySelector("h1");
      const last = document.querySelector(".stats") || document.querySelector(".sub") || h;
      const foot = document.querySelector(".foot");
      let size = parseFloat(getComputedStyle(h).fontSize);
      const fits = () => last.getBoundingClientRect().bottom <= foot.getBoundingClientRect().top - 24;
      while (!fits() && size > 34) h.style.fontSize = `${(size -= 2)}px`;
      for (const fig of document.querySelectorAll(".fig")) {
        const box = fig.parentElement;
        const room = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) * 2;
        let fs = parseFloat(getComputedStyle(fig).fontSize);
        while (fig.scrollWidth > room && fs > 40) fig.style.fontSize = `${(fs -= 4)}px`;
      }
    });
    const out = path.join(OG_DIR, job.out);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    let quality = 88;
    let buffer = await page.screenshot({ type: "jpeg", quality });
    while (buffer.length > MAX_BYTES && quality > 60) buffer = await page.screenshot({ type: "jpeg", quality: (quality -= 6) });
    fs.writeFileSync(out, buffer);
    manifest[job.out] = job.hash;
    console.log(`  ✓ assets/og/${job.out} (${Math.round(buffer.length / 1024)} KB)`);
  }
} finally {
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}

const sorted = Object.fromEntries(Object.keys(manifest).filter((k) => list.some((j) => j.out === k)).sort().map((k) => [k, manifest[k]]));
fs.writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");
console.log(`\n  ${stale.length} image${stale.length === 1 ? "" : "s"} rendered. Run pnpm build:updates if any update card changed.`);
