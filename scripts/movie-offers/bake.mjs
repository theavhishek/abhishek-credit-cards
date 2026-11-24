// Bakes the offer list and bank options into movie-offers.html from assets/movie-offers-data.js,
// using the same render functions as assets/movie-offers.js, so the list reads without JavaScript.
// Run after any change to the data or renderer: pnpm build:movies (add --check to only compare).
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const ctx = { window: {}, module: { exports: {} } };
vm.createContext(ctx);
vm.runInContext(read("assets/movie-offers-data.js"), ctx);
vm.runInContext(read("assets/movie-offers.js"), ctx);
const { listHTML, banksHTML } = ctx.module.exports;
const data = ctx.window.MOVIE_OFFERS;

const page = "movie-offers.html";
let html = read(page);
const fill = (name, body) => {
  const re = new RegExp(`(<!-- movies:${name} -->)[\\s\\S]*?(<!-- /movies:${name} -->)`);
  if (!re.test(html)) throw new Error(`Marker movies:${name} not found in ${page}`);
  html = html.replace(re, (_, a, b) => a + body + b);
};
fill("checked", listHTML(data, "checked"));
fill("listed", listHTML(data, "listed"));
fill("banks", banksHTML(data));

if (process.argv.includes("--check")) {
  if (html !== read(page)) { console.error(`${page} is out of date: run pnpm build:movies`); process.exit(1); }
  console.log(`${page} is up to date`);
} else {
  writeFileSync(new URL(page, root), html);
  console.log(`Baked ${page} (${data.offers.length} offers)`);
}
