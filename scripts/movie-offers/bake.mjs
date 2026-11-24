// Validates assets/movie-offers-data.js, then bakes the offer lists, bank options, "checked" date and the
// year in the page title into movie-offers.html, using the same render code as the browser
// (assets/movie-offers-core.js + assets/movie-offers.js), so the page reads without JavaScript.
// Run after any change to the data or renderer: pnpm build:movies (add --check to only compare).
import { readFileSync, writeFileSync } from "node:fs";
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

  if (process.argv.includes("--check")) {
    if (html !== read(page)) { console.error(`${page} is out of date: run pnpm build:movies`); process.exit(1); }
    console.log(`${page} is up to date (${data.offers.length} offers, data valid)`);
  } else {
    writeFileSync(new URL(page, root), html);
    const shown = data.offers.filter((o) => core.isShown(core.effectiveStatus(o, asOf)));
    console.log(`Baked ${page}: ${shown.length} offers shown of ${data.offers.length}, data valid`);
  }
}
