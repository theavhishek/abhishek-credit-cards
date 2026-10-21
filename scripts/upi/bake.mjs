// Bakes the bank picker and the "other banks" list into credit-card-upi-id.html
// from assets/pay-data.js, using the same render functions as assets/upi-id.js.
// Run after any change to pay-data.js or upi-id.js: pnpm build:upi (add --check to only compare).
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const ctx = { window: {}, module: { exports: {} } };
vm.createContext(ctx);
vm.runInContext(read("assets/pay-data.js"), ctx);
vm.runInContext(read("assets/upi-id.js"), ctx);
const { pickerHTML, othersHTML } = ctx.module.exports;

const page = "credit-card-upi-id.html";
let html = read(page);
const fill = (name, body) => {
  const re = new RegExp(`(<!-- upi:${name} -->)[\\s\\S]*?(<!-- /upi:${name} -->)`);
  if (!re.test(html)) throw new Error(`Marker upi:${name} not found in ${page}`);
  html = html.replace(re, (_, a, b) => a + body + b);
};
fill("picker", pickerHTML());
fill("others", othersHTML());

if (process.argv.includes("--check")) {
  if (html !== read(page)) { console.error(`${page} is out of date: run pnpm build:upi`); process.exit(1); }
  console.log(`${page} is up to date`);
} else {
  writeFileSync(new URL(page, root), html);
  console.log(`Baked ${page}`);
}
