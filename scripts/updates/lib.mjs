// Content loading for the /updates section: a small frontmatter parser, a
// small Markdown renderer and the validator. No dependencies, so the build
// runs with plain Node.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
export const core = require("../../assets/updates-core.js");

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
export const CONTENT_DIR = path.join(ROOT, "content/updates");
export const FIXTURE_DIR = path.join(CONTENT_DIR, "_fixtures");

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(["archive", "feed", "index"]);
const MIN_PAGE_WORDS = 150;

const TOP_KEYS = new Set([
  "type", "title", "summary", "category", "published", "updated", "issuer", "merchant", "cards", "tags",
  "confirmation", "sources", "link", "related", "image", "imageAlt", "page", "archived", "draft", "offer",
]);
const OFFER_KEYS = new Set(["value", "cap", "minSpend", "starts", "ends", "eligibility", "code", "link", "terms", "verified"]);
const SOURCE_KEYS = new Set(["label", "url", "kind"]);

/* ---------- Frontmatter (a small, strict YAML subset) ---------- */

class ParseError extends Error {}

function scalar(raw) {
  const value = raw.trim();
  if (value === "" || value === "~" || value === "null") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (value.startsWith("[")) {
    if (!value.endsWith("]")) throw new ParseError(`List is missing its closing ]: ${value}`);
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    const out = [];
    let cur = "", quote = null;
    for (const ch of inner) {
      if (quote) { if (ch === quote) quote = null; else cur += ch; continue; }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === ",") { out.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    out.push(cur.trim());
    return out.filter((s) => s !== "");
  }
  if ((value.startsWith('"') && value.endsWith('"') && value.length > 1)) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  if ((value.startsWith("'") && value.endsWith("'") && value.length > 1)) return value.slice(1, -1).replace(/''/g, "'");
  if (value === "|" || value === ">") throw new ParseError("Multi-line values (| or >) aren't supported; keep the value on one line.");
  return value;
}

function indentOf(line) { return line.length - line.trimStart().length; }

function splitPair(text, lineNo) {
  const m = /^([A-Za-z][A-Za-z0-9_-]*):(?:\s+(.*)|\s*)$/.exec(text);
  if (!m) throw new ParseError(`Line ${lineNo}: expected "key: value", got "${text}"`);
  return [m[1], m[2] ?? ""];
}

export function parseFrontmatter(source) {
  const text = source.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  if (!text.startsWith("---\n")) throw new ParseError("File must start with a --- line.");
  const end = text.indexOf("\n---", 4);
  if (end === -1) throw new ParseError("Frontmatter is missing its closing --- line.");
  const afterEnd = text.indexOf("\n", end + 1);
  const head = text.slice(4, end);
  const body = afterEnd === -1 ? "" : text.slice(afterEnd + 1);
  const lines = head.split("\n").map((raw, i) => ({ raw, no: i + 2 }))
    .filter(({ raw }) => raw.trim() !== "" && !raw.trimStart().startsWith("#"));
  lines.forEach(({ raw, no }) => { if (/^\t| \t/.test(raw)) throw new ParseError(`Line ${no}: use spaces, not tabs.`); });

  let i = 0;
  function parseMap(indent) {
    const out = {};
    while (i < lines.length && indentOf(lines[i].raw) === indent && !lines[i].raw.trimStart().startsWith("- ")) {
      const { raw, no } = lines[i];
      const [key, rest] = splitPair(raw.trim(), no);
      if (Object.prototype.hasOwnProperty.call(out, key)) throw new ParseError(`Line ${no}: "${key}" appears twice.`);
      i++;
      if (rest.trim() === "" && i < lines.length && indentOf(lines[i].raw) > indent) {
        const childIndent = indentOf(lines[i].raw);
        out[key] = lines[i].raw.trimStart().startsWith("- ") ? parseList(childIndent) : parseMap(childIndent);
      } else {
        out[key] = scalar(rest);
      }
    }
    if (i < lines.length && indentOf(lines[i].raw) > indent) throw new ParseError(`Line ${lines[i].no}: unexpected indentation.`);
    return out;
  }
  function parseList(indent) {
    const out = [];
    while (i < lines.length && indentOf(lines[i].raw) === indent && lines[i].raw.trimStart().startsWith("- ")) {
      const { raw, no } = lines[i];
      const itemText = raw.trimStart().slice(2);
      i++;
      if (/^[A-Za-z][A-Za-z0-9_-]*:(\s|$)/.test(itemText)) {
        const [key, rest] = splitPair(itemText.trim(), no);
        const obj = { [key]: scalar(rest) };
        const childIndent = indent + 2;
        if (i < lines.length && indentOf(lines[i].raw) === childIndent) Object.assign(obj, parseMap(childIndent));
        out.push(obj);
      } else {
        out.push(scalar(itemText));
      }
    }
    return out;
  }
  const data = parseMap(0);
  if (i < lines.length) throw new ParseError(`Line ${lines[i].no}: couldn't read "${lines[i].raw.trim()}".`);
  return { data, body };
}

/* ---------- Markdown (paragraphs, ## and ### headings, lists, quotes, links) ---------- */

const esc = core.esc;

export function slugify(text) {
  return String(text).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function safeUrl(url) {
  return /^(https:\/\/|\/(?!\/)|#|mailto:)/.test(url) ? url : null;
}

export function inline(text, problems) {
  const codes = [];
  let out = esc(text).replace(/`([^`]+)`/g, (_, code) => { codes.push(`<code>${code}</code>`); return `\u0000${codes.length - 1}\u0000`; });
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const raw = href.replace(/&amp;/g, "&");
    if (!safeUrl(raw)) { problems?.push(`Link "${raw}" must start with https://, / or #.`); return label; }
    const ext = core.isExternal(raw);
    return `<a href="${href}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}${ext ? '<span class="sr-only"> (opens in a new tab)</span>' : ""}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[\s(])[*_]([^*_\s][^*_]*?)[*_](?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");
  return out.replace(/\u0000(\d+)\u0000/g, (_, n) => codes[n]);
}

export function renderMarkdown(source, problems = []) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  const headings = [];
  let para = [];
  let list = null;
  let quote = [];
  const flushPara = () => { if (para.length) { html.push(`<p>${inline(para.join(" "), problems)}</p>`); para = []; } };
  const flushList = () => { if (list) { html.push(`<${list.tag}>${list.items.map((t) => `<li>${inline(t, problems)}</li>`).join("")}</${list.tag}>`); list = null; } };
  const flushQuote = () => { if (quote.length) { html.push(`<blockquote class="up-quote"><p>${inline(quote.join(" "), problems)}</p></blockquote>`); quote = []; } };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushAll(); continue; }
    let m;
    if ((m = /^(#{1,6})\s+(.*)$/.exec(line))) {
      flushAll();
      if (m[1].length === 1) { problems.push("Use ## for headings in the body; the title is the page's only top heading."); continue; }
      if (m[1].length > 3) { problems.push(`Heading "${m[2]}" is too deep; use ## or ###.`); continue; }
      const id = slugify(m[2]);
      if (m[1].length === 2) headings.push({ id, text: m[2] });
      html.push(`<h${m[1].length} id="${id}">${inline(m[2], problems)}</h${m[1].length}>`);
    } else if ((m = /^\s*[-*]\s+(.*)$/.exec(line))) {
      flushPara(); flushQuote();
      if (!list || list.tag !== "ul") { flushList(); list = { tag: "ul", items: [] }; }
      list.items.push(m[1]);
    } else if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(line))) {
      flushPara(); flushQuote();
      if (!list || list.tag !== "ol") { flushList(); list = { tag: "ol", items: [] }; }
      list.items.push(m[1]);
    } else if ((m = /^>\s?(.*)$/.exec(line))) {
      flushPara(); flushList();
      quote.push(m[1]);
    } else if (/^!\[/.test(line.trim())) {
      flushAll();
      problems.push("Images in the body aren't supported yet; use the image field instead.");
    } else if (/^<[a-z!/]/i.test(line.trim())) {
      flushAll();
      problems.push(`Raw HTML isn't allowed in the body: "${line.trim().slice(0, 40)}"`);
    } else if (list && /^\s{2,}\S/.test(raw)) {
      list.items[list.items.length - 1] += " " + line.trim();
    } else {
      flushList(); flushQuote();
      para.push(line.trim());
    }
  }
  flushAll();
  return { html: html.join("\n"), headings };
}

export function wordCount(markdown) {
  const text = markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[#>*_`-]/g, " ");
  return (text.match(/[\p{L}\p{N}₹%][\p{L}\p{N}₹%,.'’]*/gu) || []).length;
}

/* ---------- Image size (for width/height attributes) ---------- */

export function imageSize(file) {
  const buf = fs.readFileSync(file);
  if (buf.slice(0, 8).toString("hex") === "89504e470d0a1a0a") return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") {
    const chunk = buf.slice(12, 16).toString();
    if (chunk === "VP8X") return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    if (chunk === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") { const b = buf.readUInt32LE(21); return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 }; }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off < buf.length) {
      if (buf[off] !== 0xff) { off++; continue; }
      const marker = buf[off + 1];
      const len = buf.readUInt16BE(off + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: buf.readUInt16BE(off + 7), height: buf.readUInt16BE(off + 5) };
      }
      off += 2 + len;
    }
  }
  return null;
}

/* ---------- Bank links (support and bill-payment pages) ---------- */

export function bankAnchors() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "assets/support-data.js"), "utf8"), sandbox);
  const support = new Set(Object.keys(sandbox.window.SUPPORT_CONTACTS || {}).map((name) => `bank-${slugify(name)}`));
  const payHtml = fs.readFileSync(path.join(ROOT, "pay-credit-card-bill.html"), "utf8");
  const pay = new Set([...payHtml.matchAll(/id="(bank-[a-z0-9-]+)"/g)].map((m) => m[1]));
  return { support, pay };
}

/* ---------- Loading and validation ---------- */

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".md") && !name.startsWith("_") && name.toLowerCase() !== "readme.md")
    .sort()
    .map((name) => path.join(dir, name));
}

function isHttps(url) { return typeof url === "string" && /^https:\/\/[^\s]+$/.test(url); }

function localFileFor(urlPath) {
  const clean = urlPath.split(/[?#]/)[0];
  const candidates = [clean, `${clean}.html`, path.posix.join(clean, "index.html")];
  if (clean === "/") candidates.push("/home.html");
  if (clean === "/bank-support") candidates.push("/support.html");
  return candidates.map((c) => path.join(ROOT, c)).find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
}

// Fixture files may use {{today}}, {{today+7}} or {{today-3}} so the sample
// offers always cover every status. Never used for real content.
function expandRelativeDates(text, now) {
  return text.replace(/\{\{today([+-]\d+)?\}\}/g, (_, delta) => core.istDayKey(now + (Number(delta) || 0) * 864e5));
}

export function loadItems({ fixtures = false, drafts = false, now = Date.now() } = {}) {
  const files = listFiles(CONTENT_DIR).map((file) => ({ file, fixture: false }));
  if (fixtures) listFiles(FIXTURE_DIR).forEach((file) => files.push({ file, fixture: true }));
  const errors = [];
  const warnings = [];
  const items = [];
  const anchors = bankAnchors();

  for (const { file, fixture } of files) {
    const rel = path.relative(ROOT, file);
    const fail = (msg) => errors.push(`${rel}: ${msg}`);
    const warn = (msg) => warnings.push(`${rel}: ${msg}`);
    let parsed;
    try {
      let text = fs.readFileSync(file, "utf8");
      if (fixture) text = expandRelativeDates(text, now);
      parsed = parseFrontmatter(text);
    } catch (err) {
      fail(err.message);
      continue;
    }
    const d = parsed.data;
    const slug = path.basename(file, ".md");
    const before = errors.length;

    if (!SLUG_RE.test(slug)) fail(`File name "${slug}.md" must be lowercase words joined by hyphens (it becomes the URL).`);
    if (RESERVED_SLUGS.has(slug)) fail(`"${slug}" is reserved; choose another file name.`);
    for (const key of Object.keys(d)) if (!TOP_KEYS.has(key)) fail(`Unknown field "${key}". Check the spelling against docs/publishing-updates.md.`);

    for (const key of ["type", "title", "summary", "category", "published"]) {
      if (d[key] == null || d[key] === "") fail(`"${key}" is required.`);
    }
    if (d.type && !["news", "offer"].includes(d.type)) fail(`"type" must be news or offer.`);
    const cat = core.CATEGORIES[d.category];
    if (d.category && !cat) fail(`Unknown category "${d.category}". Use one of: ${Object.keys(core.CATEGORIES).join(", ")}.`);
    if (cat && d.type && cat.type !== d.type) fail(`Category "${d.category}" is for ${cat.type} items, but type is ${d.type}.`);
    for (const key of ["title", "summary", "issuer", "merchant", "imageAlt", "link"]) {
      if (d[key] != null && typeof d[key] !== "string") fail(`"${key}" must be text.`);
    }
    if (typeof d.title === "string" && d.title.length > 110) fail(`"title" is ${d.title.length} characters; keep it under 110.`);
    if (typeof d.summary === "string") {
      if (d.summary.length > 260) fail(`"summary" is ${d.summary.length} characters; keep it under 260.`);
      if (d.summary.length < 40) warn(`"summary" is very short (${d.summary.length} characters).`);
    }
    for (const key of ["published", "updated"]) {
      if (d[key] != null && !core.isValidDate(d[key])) fail(`"${key}" must look like 2026-10-14 or 2026-10-14 18:30 (IST).`);
    }
    if (core.isValidDate(d.published) && core.toMs(d.published, "start") > now + 864e5) fail(`"published" is in the future.`);
    if (core.isValidDate(d.published) && core.isValidDate(d.updated) && core.toMs(d.updated, "start") < core.toMs(d.published, "start")) {
      fail(`"updated" is earlier than "published".`);
    }
    for (const key of ["cards", "tags", "related"]) {
      if (d[key] != null && (!Array.isArray(d[key]) || d[key].some((v) => typeof v !== "string"))) fail(`"${key}" must be a list, like [one, two].`);
    }
    for (const key of ["page", "archived", "draft"]) {
      if (d[key] != null && typeof d[key] !== "boolean") fail(`"${key}" must be true or false.`);
    }

    // Sources
    const sources = d.sources == null ? [] : d.sources;
    if (!Array.isArray(sources)) fail(`"sources" must be a list of label/url/kind entries.`);
    else sources.forEach((s, n) => {
      if (!s || typeof s !== "object") { fail(`sources[${n + 1}] must have label, url and kind.`); return; }
      for (const key of Object.keys(s)) if (!SOURCE_KEYS.has(key)) fail(`sources[${n + 1}]: unknown field "${key}".`);
      if (!s.label) fail(`sources[${n + 1}] needs a label.`);
      if (!isHttps(s.url)) fail(`sources[${n + 1}] needs an https:// url.`);
      if (!core.SOURCE_KINDS[s.kind]) fail(`sources[${n + 1}] kind must be official, report or community.`);
    });
    const hasOfficial = Array.isArray(sources) && sources.some((s) => s && s.kind === "official");

    if (d.type === "news") {
      if (!sources.length) fail(`News needs at least one source.`);
      if (!core.CONFIRMATION[d.confirmation]) fail(`"confirmation" must be official, reported or unconfirmed.`);
      if (d.confirmation === "official" && !hasOfficial) fail(`"confirmation: official" needs a source with kind: official.`);
      if (d.offer != null) fail(`News items can't have an "offer" block; use type: offer.`);
    }

    // Offer block
    let offer = null;
    if (d.type === "offer") {
      if (d.confirmation != null) fail(`Offers don't use "confirmation"; the status comes from the offer dates and "verified".`);
      if (!d.offer || typeof d.offer !== "object" || Array.isArray(d.offer)) {
        fail(`Offers need an "offer:" block.`);
      } else {
        offer = { ...d.offer };
        for (const key of Object.keys(offer)) if (!OFFER_KEYS.has(key)) fail(`offer: unknown field "${key}".`);
        for (const key of ["value", "cap", "minSpend", "eligibility", "code"]) {
          if (offer[key] != null && typeof offer[key] !== "string") fail(`offer.${key} must be text.`);
        }
        for (const key of ["starts", "verified"]) {
          if (offer[key] != null && !core.isValidDate(offer[key])) fail(`offer.${key} must look like 2026-10-14 or 2026-10-14 18:30 (IST).`);
        }
        if (offer.ends != null && offer.ends !== "ongoing" && !core.isValidDate(offer.ends)) fail(`offer.ends must be a date, a date and time, or "ongoing".`);
        if (offer.ends == null) warn(`offer.ends is empty, so this offer will show as "Needs verification", never as active.`);
        if (core.isValidDate(offer.starts) && core.isValidDate(offer.ends) && core.toMs(offer.ends, "end") < core.toMs(offer.starts, "start")) {
          fail(`offer.ends is before offer.starts.`);
        }
        if (core.isValidDate(offer.verified) && core.toMs(offer.verified, "start") > now + 864e5) fail(`offer.verified is in the future.`);
        for (const key of ["link", "terms"]) if (offer[key] != null && !isHttps(offer[key])) fail(`offer.${key} must be an https:// link.`);
        if (offer.verified && !offer.terms && !offer.link) fail(`A verified offer needs the official offer.link or offer.terms it was checked against.`);
        if (!sources.length && !offer.link && !offer.terms) fail(`Offers need offer.link, offer.terms or a source.`);
      }
    }

    // Links and image
    if (d.link != null && typeof d.link === "string") {
      if (d.link.startsWith("/")) { if (!localFileFor(d.link)) fail(`"link" points to ${d.link}, which doesn't exist in the repo.`); }
      else if (!isHttps(d.link)) fail(`"link" must be a site path like /card-reviews/hsbc-live-plus or an https:// URL.`);
    }
    let image = null;
    if (d.image != null) {
      if (typeof d.image !== "string" || !d.image.startsWith("/assets/")) fail(`"image" must be a file under /assets/, like /assets/updates/my-image.webp.`);
      else {
        const abs = path.join(ROOT, d.image);
        if (!fs.existsSync(abs)) fail(`"image" ${d.image} doesn't exist.`);
        else {
          const size = imageSize(abs);
          if (!size) fail(`Couldn't read the size of ${d.image}; use JPEG, PNG or WebP.`);
          else {
            image = { src: d.image, ...size, alt: d.imageAlt || "" };
            // Optional smaller copy for the feed: <name>-thumb.webp next to the image.
            const thumb = d.image.replace(/\.[a-z]+$/i, "-thumb.webp");
            if (thumb !== d.image && fs.existsSync(path.join(ROOT, thumb))) image.thumb = thumb;
          }
        }
        if (!d.imageAlt) fail(`"imageAlt" is required when there's an image (describe what it shows).`);
      }
    }

    // Body and page
    const bodyProblems = [];
    const body = parsed.body.trim();
    const rendered = body ? renderMarkdown(body, bodyProblems) : { html: "", headings: [] };
    bodyProblems.forEach(fail);
    const words = body ? wordCount(body) : 0;
    const page = d.page == null ? words >= MIN_PAGE_WORDS : d.page;
    if (d.page === true && words < MIN_PAGE_WORDS) fail(`"page: true" needs a body of at least ${MIN_PAGE_WORDS} words (has ${words}); short items stay in the feed.`);
    if (body && !page) warn(`Has a body of ${words} words but no page of its own; only the summary is shown.`);

    if (errors.length > before) continue;
    if (d.draft && !drafts && !fixture) continue;

    const bankId = d.issuer ? `bank-${slugify(d.issuer)}` : null;
    items.push({
      slug,
      file: rel,
      fixture,
      draft: !!d.draft,
      type: d.type,
      title: d.title,
      summary: d.summary,
      category: d.category,
      published: d.published,
      updated: d.updated || null,
      issuer: d.issuer || null,
      merchant: d.merchant || null,
      cards: d.cards || [],
      tags: d.tags || [],
      confirmation: d.type === "news" ? d.confirmation : null,
      sources: Array.isArray(sources) ? sources : [],
      link: d.link || null,
      related: d.related || [],
      image,
      page,
      archived: !!d.archived,
      offer,
      words,
      bodyHtml: rendered.html,
      headings: rendered.headings,
      support: bankId && anchors.support.has(bankId) ? bankId : null,
      pay: bankId && anchors.pay.has(bankId) ? bankId : null,
    });
  }

  // Cross-item checks: duplicates and related slugs.
  const byTitle = new Map();
  const byOffer = new Map();
  for (const item of items) {
    const key = core.normalise(item.title);
    if (byTitle.has(key)) errors.push(`${item.file}: same title as ${byTitle.get(key)}. Edit the existing file instead of adding a duplicate.`);
    else byTitle.set(key, item.file);
    if (item.offer && (item.offer.link || item.offer.terms)) {
      const okey = `${item.offer.terms || item.offer.link}|${item.offer.ends}`;
      if (byOffer.has(okey)) errors.push(`${item.file}: same offer terms and end date as ${byOffer.get(okey)}. Edit the existing file instead.`);
      else byOffer.set(okey, item.file);
    }
  }
  const slugs = new Set(items.map((i) => i.slug));
  for (const item of items) {
    for (const rel of item.related) if (!slugs.has(rel)) errors.push(`${item.file}: related "${rel}" doesn't match any published update.`);
  }

  return { items: core.sortItems(items), errors, warnings };
}
