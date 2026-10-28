// Keep homepage and card-review listing in sync with review HTML.
// Source of truth: card-reviews/*.html (hero, byline, intro and image).
// Run: node scripts/reviews/build.mjs [--check | --cache]
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = resolve(fileURLToPath(new URL("../../", import.meta.url)));
const reviewDir = join(root, "card-reviews");
const check = process.argv.includes("--check");
const cache = process.argv.includes("--cache");
const changed = [];
const read = (path) => readFileSync(join(root, path), "utf8");
function write(path, next) {
  const full = join(root, path);
  const previous = readFileSync(full, "utf8");
  if (previous.replace(/\r\n/g, "\n") === next.replace(/\r\n/g, "\n")) return;
  changed.push(path);
  if (!check) writeFileSync(full, next);
}
const decode = (s) => s.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39|#x27|#x([0-9a-f]+)|#([0-9]+));/gi, (entity, hex, dec) => {
  if (hex) return String.fromCodePoint(parseInt(hex, 16));
  if (dec) return String.fromCodePoint(Number(dec));
  return { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&apos;": "'", "&nbsp;": " ", "&#39;": "'", "&#x27;": "'" }[entity.toLowerCase()] || entity;
});
const plain = (html) => decode(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const attribute = (tag, name) => {
  const result = tag.match(new RegExp("\\b" + name + '="([^"]*)"'));
  return result ? decode(result[1]) : "";
};
const match = (s, regex, name) => {
  const result = s.match(regex);
  if (!result) throw new Error("Missing " + name);
  return result[1];
};
// Article bylines use the long form ("October 15, 2026").
const longDate = (date) => new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(date + "T00:00:00Z"));
const formatDate = (date) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(date + "T00:00:00Z"));

function extract(filename) {
  const html = readFileSync(join(reviewDir, filename), "utf8");
  const slug = basename(filename, ".html");
  const hero = match(html, /<header class="rv-hero">([\s\S]*?)<\/header>/, slug + " hero");
  const heading = plain(match(hero, /<h1[^>]*>([\s\S]*?)<\/h1>/, slug + " H1"));
  // Long article H1s (guides) can set a shorter listing title and image alt in meta tags.
  const listTitle = decode((html.match(/<meta name="review:list-title" content="([^"]+)"/) || [,""])[1]);
  const title = listTitle || (slug === "slice-business-credit-card" ? "Slice Business Credit Card" : heading.replace(/(?::\s*the full review|\s+(?:review|preview))$/i, "").trim());
  const byline = match(hero, /<p class="rv-byline">([\s\S]*?)<\/p>/, slug + " byline");
  const date = match(byline, /<time datetime="(\d{4}-\d{2}-\d{2})"/, slug + " updated date");
  // Bylines read "9 min read" (older ones said "About 9 minutes to read").
  const readTime = Number(match(byline, /(\d+) (?:min read|minutes? to read)/i, slug + " reading time"));
  const excerpt = plain(match(hero, /<p class="rv-dek">([\s\S]*?)<\/p>/, slug + " introductory summary"));
  const intro = excerpt.length > 220 ? excerpt.slice(0, 217).replace(/\s+\S*$/, "") + "…" : excerpt;
  const status = (hero.match(/<p class="pv-status">([\s\S]*?)<\/p>/) || [,""])[1];
  const categoryMeta = (html.match(/<meta name="review:category" content="([^"]+)"/) || [,""])[1];
  const statusText = plain(status);
  const category = categoryMeta || (/\b(pre.launch|launching|waitlist|coming soon)\b/i.test(statusText) ? "Pre-launch" : /\b(launched|launch|available|live)\b/i.test(statusText) ? "Launched" : "Cashback");
  const figure = match(hero, /<figure class="rv-hero-card">([\s\S]*?)<\/figure>/, slug + " hero figure");
  const imgTag = match(figure, /(<img\b[^>]*>)/, slug + " hero image");
  const image = { src: attribute(imgTag,"src"), alt: attribute(imgTag,"alt") || title };
  const listAlt = decode((html.match(/<meta name="review:list-alt" content="([^"]+)"/) || [,""])[1]) || title.replace(/(?:\s+Credit)?\s+Card$/i, "") + " credit card";
  if (!image.src.startsWith("/assets/reviews/")) throw new Error(slug + ": expected a local review hero image");
  const img = { src: image.src, alt: image.alt, srcset: attribute(imgTag,"srcset"), width: attribute(imgTag,"width"), height: attribute(imgTag,"height"), referrerpolicy: attribute(imgTag,"referrerpolicy") };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !readTime || !title || !intro) throw new Error("Invalid review details: " + slug);
  return { id: slug, title, excerpt: intro, category, date, readTime, author: { name: "Abhishek Meena", role: "Independent card reviewer", avatar: "/assets/abhishek-face-96.jpg" }, image, listAlt, img };
}

const posts = readdirSync(reviewDir).filter(x => x.endsWith(".html")).map(extract).sort((a,b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
if (!posts.length) throw new Error("No card reviews found.");
const top = posts.slice(0,3);
const categories = ["Cashback", "Launched", "Pre-launch", ...new Set(posts.map(p => p.category))].filter((x,i,arr) => posts.some(p=>p.category===x) && arr.indexOf(x)===i);

// Generated TypeScript is bundled as-is by the existing esbuild command.
const source = [
  "// GENERATED by scripts/reviews/build.mjs from card-reviews/*.html.",
  "// Edit the review article's H1, intro, status, hero image or byline; do not edit this file.",
  "export type BlogAuthor = { name: string; avatar?: string; role?: string };",
  "export type BlogPost = {",
  "  id: string; title: string; excerpt: string; category: string; date: string;",
  "  readTime: number; author: BlogAuthor; image?: { src: string; alt: string; srcset?: string };",
  "  body?: string[]; featured?: boolean;",
  "};",
  "export const blogCategories = " + JSON.stringify(categories) + ";",
  "export const blogPosts: BlogPost[] = " + JSON.stringify(posts.map(p => ({
    id:p.id,title:p.title,excerpt:p.excerpt,category:p.category,date:p.date,readTime:p.readTime,author:p.author,image:p.img.srcset ? { ...p.image, alt: p.listAlt, srcset: p.img.srcset } : { ...p.image, alt: p.listAlt },featured:false
  })),null,2) + ";",
  ""
].join("\n");
write("src/card-reviews/blog-grid-data.ts", source);

const reviewItem = (p) => {
  const im = p.img;
  const attrs = 'src="' + escape(im.src) + '"' +
    (im.srcset ? ' srcset="' + escape(im.srcset) + '" sizes="(min-width: 1024px) 380px, 92vw"' : "") +
    ' alt="' + escape(p.listAlt) + '"' + (im.width ? ' width="' + escape(im.width) + '"' : "") +
    (im.height ? ' height="' + escape(im.height) + '"' : "") +
    ' loading="lazy"' + (im.referrerpolicy ? ' referrerpolicy="' + escape(im.referrerpolicy) + '"' : "");
  return '        <li>\n' +
    '          <a class="hm-review" href="https://avhishek.in/card-reviews/' + escape(p.id) + '">\n' +
    '            <span class="hm-review-media"><img ' + attrs + '></span>\n' +
    '            <span class="hm-review-meta"><span class="hm-review-tag">' + escape(p.category) + '</span> <time datetime="' + p.date + '">' + formatDate(p.date) + '</time> <span aria-hidden="true">·</span> ' + p.readTime + ' min read</span>\n' +
    '            <span class="hm-review-title">' + escape(p.title) + '</span>\n' +
    '            <span class="hm-review-text">' + escape(p.excerpt) + '</span>\n' +
    '          </a>\n        </li>';
};
let home = read("home.html");
// The homepage row scrolls sideways, so it lists every review, newest first.
const homeBlock = '      <ul class="hm-reviews" id="hm-reviews" aria-label="Card reviews">\n' + posts.map(reviewItem).join("\n") + '\n      </ul>';
const homeRegex = /<ul class="hm-reviews"[^>]*>[\s\S]*?<\/ul>/g;
if ([...home.matchAll(homeRegex)].length!==1) throw new Error("Expected exactly one homepage review list");
home = home.replace(homeRegex, homeBlock.trimStart());
const shortName = (p) => ({
  "slice-business-credit-card":"Slice Business",
  "eternal-sbi-card":"Eternal SBI Card",
  "hsbc-live-plus":"HSBC Live+",
  "rbl-jalsa-credit-card":"RBL Jalsa Card",
  "kredit-pe-yes-bank-max-credit-card":"Kredit.Pe YES BANK Max",
  "sbi-debit-card-rewardz":"SBI Rewardz guide"
}[p.id] || p.title.replace(/ Credit Card$/," Card"));
const footer = '          <div class="gf-column gf-column-latest">\n' +
  '            <h2 class="gf-heading">Latest reviews</h2>\n            <ul>\n' +
  top.map(p => '              <li><a href="https://avhishek.in/card-reviews/' + escape(p.id) + '">' + escape(shortName(p)) + (p.category === "Pre-launch" ? ' <span class="gf-tag">Pre-launch</span>' : "") + '</a></li>').join("\n") +
  '\n            </ul>\n          </div>';
const footerRegex = /^[ \t]*<div class="gf-column gf-column-latest">[\s\S]*?<\/div>/gm;
if ([...home.matchAll(footerRegex)].length!==1) throw new Error("Expected exactly one latest reviews footer");
home = home.replace(footerRegex, footer);
write("home.html", home);

// The static review listing remains useful to crawlers and before React boots.
let listing = read("card-reviews.html");
const staticList = '        <ul class="reviews-static-list">\n' +
  posts.map(p => '          <li>\n            <article>\n              <p class="reviews-static-meta">' + escape(p.category) + '</p>\n              <h2><a href="/card-reviews/' + escape(p.id) + '">' + escape(p.title) + '</a></h2>\n              <p>' + escape(p.excerpt) + '</p>\n              <p class="reviews-static-byline"><strong>Abhishek Meena</strong><span><time datetime="' + p.date + '">' + longDate(p.date) + '</time> · ' + p.readTime + ' min read</span></p>\n            </article>\n          </li>').join("\n") +
  '\n        </ul>';
const staticRegex = /^[ \t]*<ul class="reviews-static-list">[\s\S]*?<\/ul>/gm;
if ([...listing.matchAll(staticRegex)].length!==1) throw new Error("Expected exactly one static listing");
listing = listing.replace(staticRegex, staticList);
const schemaRegex = /<script type="application\/ld\+json">(\{[\s\S]*?\})<\/script>/;
const schemaMatch = listing.match(schemaRegex);
if (!schemaMatch) throw new Error("Reviews JSON-LD missing");
const schema = JSON.parse(schemaMatch[1]);
const collection = schema["@graph"].find(x => x["@type"] === "CollectionPage");
if (!collection) throw new Error("Reviews CollectionPage JSON-LD missing");
collection.hasPart = posts.map(p => ({ "@type":"Article",headline:p.title,url:"https://avhishek.in/card-reviews/"+p.id }));
listing = listing.replace(schemaMatch[0], '<script type="application/ld+json">' + JSON.stringify(schema) + '</script>');
if (cache) {
  const bundle = read("assets/card-reviews-react.js");
  const hash = createHash("sha256").update(bundle).digest("hex").slice(0,8);
  const rx = /assets\/card-reviews-react\.js\?v=[^"]+/g;
  if ([...listing.matchAll(rx)].length!==1) throw new Error("Review bundle version reference missing");
  listing = listing.replace(rx, "assets/card-reviews-react.js?v="+hash);
}
write("card-reviews.html", listing);

if (changed.length) {
  console.log((check ? "Outdated: " : "Updated: ") + changed.join(", "));
  if (check) process.exitCode=1;
} else console.log("Card review metadata is in sync (" + posts.length + " reviews).");
