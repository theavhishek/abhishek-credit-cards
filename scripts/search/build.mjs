// Builds assets/search-index.json for the site search (assets/site-search.js): the main pages and tools,
// every card review, each bank's support, pay-bill and UPI ID entry (read from the baked HTML) and the
// cards in my collection (assets/data.js).
// News and offers are not in here: the search reads assets/updates-index.json at runtime, so a new
// update is searchable as soon as pnpm build:updates runs.
// Run after adding a page, a review or a bank: pnpm build:search (add --check to only compare).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const SITE = "https://avhishek.in";
const OUT = "assets/search-index.json";

const decode = (s) => s
  .replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim();
const meta = (html, page) => {
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!title || !description) throw new Error(`${page} has no <title> or meta description`);
  return { title: decode(title).replace(/\s*\|\s*Avhishek$/, ""), description: decode(description) };
};

// Main pages and tools. t is the result title; w adds words people type that the page text may not use.
const pages = [
  { file: "pay-credit-card-bill.html", t: "Pay your card bill", u: "/pay-credit-card-bill", k: "tool", w: "neft imps ifsc upi bill payment pay" },
  { file: "credit-card-upi-id.html", t: "Card bill UPI ID", u: "/credit-card-upi-id", k: "tool", w: "upi id vpa qr code generator bill payment" },
  { file: "calculator/loan-emi.html", t: "Loan EMI calculator", u: "/calculator/loan-emi", k: "tool", w: "emi loan interest prepayment amortization calculator" },
  { file: "calculator/no-cost-emi.html", t: "No-Cost EMI calculator", u: "/calculator/no-cost-emi", k: "tool", w: "no cost emi interest gst processing fee calculator" },
  { file: "support.html", t: "Bank support", u: "/bank-support", k: "page", w: "customer care helpline phone number email complaint nodal officer ombudsman" },
  { file: "card-reviews.html", t: "Card reviews", u: "/card-reviews", k: "page", w: "reviews cashback rewards fees" },
  { file: "updates.html", t: "Updates", u: "/updates", k: "page", w: "news offers devaluations launches" },
  { file: "portfolio.html", t: "My card collection", u: "https://cards.avhishek.in/", k: "page", w: "portfolio cards collection lifetime free rupay" },
  { file: "home.html", t: "Home", u: "/", k: "page", w: "avhishek home" },
  { file: "disclaimer.html", t: "Disclaimer", u: "/disclaimer", k: "page", w: "affiliate disclosure privacy" },
];

// Short names people search by that a bank's full name doesn't contain.
const aliases = {
  "American Express": "amex",
  "BOBCARD": "bank of baroda bob",
  "SBI Card": "state bank of india",
  "AU Small Finance Bank": "au bank",
  "Equitas Small Finance Bank": "equitas bank",
  "Punjab National Bank": "pnb",
};

const entries = [];
const abs = (u) => (u.startsWith("http") ? u : SITE + u);

for (const page of pages) {
  const { description } = meta(read(page.file), page.file);
  entries.push({ k: page.k, t: page.t, d: description, u: abs(page.u), w: page.w });
}

for (const file of readdirSync(new URL("card-reviews/", root)).filter((f) => f.endsWith(".html")).sort()) {
  const html = read(`card-reviews/${file}`);
  const { title, description } = meta(html, file);
  const h1 = decode(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, "") ?? title);
  entries.push({ k: "review", t: h1.replace(/:\s*the full review$/i, " review"), d: description, u: abs(`/card-reviews/${file.replace(/\.html$/, "")}`), w: "review" });
}

// Banks, from the baked bank cards: <details ... id="bank-…" data-bank="Name">
const banks = (file) => [...read(file).matchAll(/<details class="sp-bank[^"]*" id="(bank-[^"]+)" data-bank="([^"]+)"/g)]
  .map(([, id, name]) => ({ id, name: decode(name) }));
const bankWords = (name) => [name, aliases[name] ?? ""].join(" ").trim();

for (const { id, name } of banks("support.html")) {
  entries.push({ k: "support", t: `${name} customer care`, d: "Helpline numbers, complaint emails and nodal officer contacts.", u: abs(`/bank-support#${id}`), w: `${bankWords(name)} support helpline phone email complaint` });
}
for (const { id, name } of banks("pay-credit-card-bill.html")) {
  entries.push({ k: "pay", t: `${name} bill payment`, d: "NEFT, IMPS and UPI details for paying this card’s bill.", u: abs(`/pay-credit-card-bill#${id}`), w: `${bankWords(name)} pay bill neft imps ifsc` });
}
// UPI ID tool banks: <input type="radio" name="bank" value="slug"> … <span class="ui-pick-name">Name</span>
for (const [, slug, name] of read("credit-card-upi-id.html").matchAll(/name="bank" value="([^"]+)"[^>]*>[\s\S]*?<span class="ui-pick-name">([^<]+)<\/span>/g)) {
  const bank = decode(name);
  entries.push({ k: "upi", t: `${bank} UPI ID`, d: "Your card’s bill-payment UPI ID, with a QR code.", u: abs(`/credit-card-upi-id?bank=${slug}`), w: `${bankWords(bank)} ${slug.replace(/-/g, " ")} upi id vpa qr` });
}

// Cards in my collection (assets/data.js): each opens the portfolio filtered to that card (?q=).
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(read("assets/data.js"), ctx);
const cards = new Map();
for (const card of ctx.window.PORTFOLIO_DATA.cards) {
  const key = `${card.bank} ${card.card}`;
  const seen = cards.get(key);
  if (seen) { if (!seen.networks.includes(card.network)) seen.networks.push(card.network); continue; }
  cards.set(key, { ...card, networks: [card.network] });
}
for (const [key, card] of cards) {
  const name = card.card.toLowerCase().includes(card.bank.toLowerCase()) ? card.card : key;
  entries.push({ k: "card", t: name, d: `In my card collection · ${card.networks.join(", ")}`, u: `https://cards.avhishek.in/?q=${encodeURIComponent(key)}`, w: `${bankWords(card.bank)} ${(card.bestFor ?? []).join(" ")}` });
}

// Newest reviews for the desktop Reviews hover menu, from the generated review list.
const grid = read("src/card-reviews/blog-grid-data.ts");
const posts = JSON.parse(grid.slice(grid.indexOf("= [", grid.indexOf("blogPosts")) + 2, grid.lastIndexOf("]") + 1));
const reviews = posts
  .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  .map((post) => ({
    t: post.title,
    u: abs(`/card-reviews/${post.id}`),
    date: post.date,
    min: post.readTime,
    img: post.image?.srcset?.split(",").map((s) => s.trim().split(" ")[0]).find((src) => src.endsWith(".webp")) ?? post.image?.src ?? "",
  }));

const json = JSON.stringify({ entries, reviews }) + "\n";
if (process.argv.includes("--check")) {
  if (json !== read(OUT)) { console.error(`${OUT} is out of date: run pnpm build:search`); process.exit(1); }
  console.log(`${OUT} is up to date`);
} else {
  writeFileSync(new URL(OUT, root), json);
  console.log(`Wrote ${OUT} (${entries.length} entries)`);
}
