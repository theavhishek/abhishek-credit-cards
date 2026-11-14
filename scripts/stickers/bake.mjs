// Bakes the stick-it-up stickers the site uses into static SVG files in assets/stickers/,
// so pages load them as plain images: no React on the page and no CSP change.
// Run: pnpm build:stickers (after changing the list below or updating stick-it-up).
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as S from "stick-it-up";

const STICKERS = {
  "curious-globe": "CuriousGlobeSticker",
  sparkles: "SparklesSticker",
  heart: "HeartSticker",
  flame: "FlameSticker",
  "sparkle-trio": "SparkleTrioSticker",
};

const check = process.argv.includes("--check");
const out = new URL("../../assets/stickers/", import.meta.url);
mkdirSync(out, { recursive: true });
let stale = 0;
for (const [file, name] of Object.entries(STICKERS)) {
  let svg = renderToStaticMarkup(createElement(S[name], { size: 200 }));
  // The component wraps its own inline style for React hover; a static file needs neither.
  svg = svg.replace(/ style="[^"]*"/, "");
  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  if (svg.includes("xlink:href") && !svg.includes("xmlns:xlink")) svg = svg.replace("<svg", '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  const path = new URL(`${file}.svg`, out);
  if (check) { if (!existsSync(path) || readFileSync(path, "utf8") !== svg) { console.error(`stale: ${file}.svg`); stale++; } continue; }
  writeFileSync(path, svg);
  console.log(`${file}.svg ${(svg.length / 1024).toFixed(1)} KB`);
}
if (stale) process.exit(1);
