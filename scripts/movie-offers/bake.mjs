// Validates assets/movie-offers-data.js, then bakes the offer lists, bank options, "checked" date, the homepage "Movie and show offers" row, the
// per-card offers on reviews tagged in `reviews`, and the
// year in the page title into movie-offers.html, using the same render code as the browser
// (assets/movie-offers-core.js + assets/movie-offers.js), so the page reads without JavaScript.
// Run after any change to the data or renderer: pnpm build:movies (add --check to only compare).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

export function load() {
  const ctx = { window: {}, globalThis: {}, Intl, Date };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(read("assets/movie-offers-data.js"), ctx);
  vm.runInContext(read("assets/movie-offers-core.js"), ctx);
  ctx.window.MovieOffersCore = ctx.MovieOffersCore;
  // The UI file takes the core from window when there's no CommonJS module.
  const ui = { exports: {} };
  const uiCtx = { window: ctx.window, module: ui, require: () => ctx.MovieOffersCore };
  vm.createContext(uiCtx);
  vm.runInContext(read("assets/movie-offers.js"), uiCtx);
  return { data: ctx.window.MOVIE_OFFERS, core: ctx.MovieOffersCore, ui: ui.exports };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { data, core, ui } = load();
  const asOf = data.updated;
  const { errors, warnings } = core.validate(data, core.todayIST());
  for (const w of warnings) console.warn(`warning: ${w}`);
  for (const [k, a] of Object.entries(data.cardArt || {}))
    if (a && a.file && !existsSync(new URL(`assets/movie-offers/cards/${a.file}`, root))) errors.push(`cardArt ${k}: assets/movie-offers/cards/${a.file} is missing`);
  if (errors.length) {
    for (const e of errors) console.error(`error: ${e}`);
    console.error(`${errors.length} data error(s) in assets/movie-offers-data.js`);
    process.exit(1);
  }

  const page = "movie-offers.html";
  let html = read(page);
  const fill = (name, body) => {
    const re = new RegExp(`(<!-- movies:${name} -->)[\\s\\S]*?(<!-- /movies:${name} -->)`);
    if (!re.test(html)) throw new Error(`Marker movies:${name} not found in ${page}`);
    html = html.replace(re, (_, a, b) => a + body + b);
  };
  fill("checked", ui.listHTML(data, "checked", asOf));
  fill("listed", ui.listHTML(data, "listed", asOf));
  fill("banks", ui.banksHTML(data));
  fill("updated", `<time datetime="${asOf}">${core.fmtDate(asOf)}</time>`);
  // Keep the year in titles and the page's dateModified in step with the data.
  const year = asOf.slice(0, 4);
  html = html.replace(/(PVR INOX \()\d{4}(\))/g, `$1${year}$2`)
    .replace(/("dateModified":")[^"]+(")/g, `$1${asOf}$2`);

  // Homepage: the biggest checked offer per bank, and every card review tagged in an offer's `reviews`.
  const outputs = new Map([[page, html]]);
  const fillIn = (file, name, body) => {
    let h = outputs.get(file) ?? read(file);
    const re = new RegExp(`(<!-- movies:${name}:start -->)[\\s\\S]*?(<!-- movies:${name}:end -->)`);
    if (!re.test(h)) throw new Error(`Marker movies:${name} not found in ${file}`);
    outputs.set(file, h.replace(re, (_, a, b) => a + body + b));
  };
  const total = data.offers.filter((o) => core.isShown(core.effectiveStatus(o, asOf))).length;
  fillIn("home.html", "home", `
    <section class="hm-movies" aria-labelledby="movies-title">
      <div class="hm-section-head hm-section-head-row">
        <h2 id="movies-title">Movie and show offers</h2>
        <a class="hm-more" href="/movie-offers">All ${total} offers<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
      </div>
      <p class="mox-lead">The biggest card offers with no spend condition on BookMyShow, District and PVR INOX right now. Terms checked <time datetime="${asOf}">${core.fmtDate(asOf)}</time>.</p>
      <ul class="mox-list">${ui.homePicks(data, asOf).map((o) => ui.miniHTML(o, data, asOf)).join("")}</ul>
    </section>
    `);
  const slugs = [...new Set(data.offers.flatMap((o) => o.reviews || []))];
  for (const slug of slugs) {
    const list = ui.reviewOffers(data, slug, asOf);
    fillIn(`card-reviews/${slug}.html`, "review", list.length ? `
      <section id="movie-offers" class="rv-section mox-section" aria-labelledby="movie-offers-title">
        <h2 id="movie-offers-title">Movie and show offers on this card</h2>
        <p class="mox-lead">Every offer I’ve found for this card on BookMyShow, District and PVR INOX, terms checked <time datetime="${asOf}">${core.fmtDate(asOf)}</time>.</p>
        <ul class="mox-list mox-list--review">${list.map((o) => ui.miniHTML(o, data, asOf)).join("")}</ul>
        <p class="mox-all"><a href="/movie-offers">Compare every card’s movie offers</a></p>
      </section>
      ` : "");
  }

  if (process.argv.includes("--check")) {
    for (const [file, out] of outputs) if (out !== read(file)) { console.error(`${file} is out of date: run pnpm build:movies`); process.exit(1); }
    console.log(`${page} is up to date (${data.offers.length} offers, data valid)`);
  } else {
    outputs.set(page, html);
    for (const [file, out] of outputs) writeFileSync(new URL(file, root), out);
    const shown = data.offers.filter((o) => core.isShown(core.effectiveStatus(o, asOf)));
    console.log(`Baked ${page}: ${shown.length} offers shown of ${data.offers.length}, data valid`);
  }
}
