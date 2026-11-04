"use strict";

const { createHmac, createHash, randomUUID, timingSafeEqual } = require("node:crypto");
const sharedHeader = require("../lib/store-header");

const PRODUCTS = Object.freeze({
  "amazon-shopping": { name: "Amazon Shopping Voucher", short: "Amazon Shopping", className: "amazon-shopping", logo: "/assets/email/brands/amazon.png" },
  "amazon-pay": { name: "Amazon Pay Gift Card", short: "Amazon Pay", className: "amazon-pay", logo: "/assets/email/brands/amazon-pay.png" },
  flipkart: { name: "Flipkart Gift Card", short: "Flipkart", className: "flipkart", logo: "/assets/email/brands/flipkart.png" },
});
const VALUES = Object.freeze([1000, 2000, 2500, 3000, 4000, 5000, 10000]);
const COOKIE = "avh_store_session";
const SESSION_MS = 12 * 60 * 60 * 1000;
const attempts = new Map();

function safeEqual(a, b) {
  const first = createHash("sha256").update(String(a)).digest();
  const second = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(first, second);
}

function sign(value, secret) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function tokenValid(req, secret) {
  if (!secret) return false;
  const raw = String(req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  if (!raw) return false;
  const token = raw.slice(COOKIE.length + 1);
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const value = token.slice(0, dot);
  if (!safeEqual(token.slice(dot + 1), sign(value, secret))) return false;
  try {
    const data = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    return data.scope === "store" && Number.isFinite(data.exp) && data.exp > Date.now();
  } catch { return false; }
}

function cookieSecurity(req) {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0];
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const protocol = String(req.headers["x-forwarded-proto"] || (local ? "http" : "https")).split(",")[0];
  return protocol === "https" ? "; Secure" : "";
}

function cookieFor(req, secret) {
  const value = Buffer.from(JSON.stringify({ scope: "store", exp: Date.now() + SESSION_MS })).toString("base64url");
  return `${COOKIE}=${value}.${sign(value, secret)}; Path=/store; HttpOnly; SameSite=Strict; Max-Age=43200${cookieSecurity(req)}`;
}

function setHeaders(res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  res.setHeader("X-Frame-Options", "DENY");
}

function sameOrigin(req) {
  const source = req.headers.origin;
  if (!source) return false;
  try {
    const url = new URL(source);
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0];
    return url.host === host && (url.protocol === "https:" || /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host));
  } catch { return false; }
}

function bodyOf(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const raw = String(req.body || "");
  if (raw.length > 4096) return {};
  if (String(req.headers["content-type"] || "").includes("application/json")) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

function htmlFrame(inner, { locked = false } = {}) {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <meta name="theme-color" content="#f5f5f7">
  <title>Private gift card store | Avhishek</title>
  <link rel="preload" as="font" type="font/woff2" href="/assets/geist-sans-vf.woff2" crossorigin>
  <link rel="stylesheet" href="/assets/font.css?v=5">
  <link rel="stylesheet" href="/assets/site.css?v=2">
  <link rel="stylesheet" href="/assets/plane-switch-home.css?v=3">
  <link rel="stylesheet" href="/assets/brand-wordmark.css?v=2">
  <link rel="stylesheet" href="/assets/header.css?v=9">
  <link rel="stylesheet" href="/assets/arc-tabs.css?v=5">
  <link rel="stylesheet" href="/assets/motion.css?v=4">
  <link rel="stylesheet" href="/assets/site-search.css?v=2">
  <link rel="stylesheet" href="/assets/store.css?v=2">
  <script>try{const saved=localStorage.getItem('abhishek-card-stack-theme');const dark=window.matchMedia?.('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=saved||(dark?'dark':'light')}catch{}</script>
</head>
<body class="store-page unified-navbar ${locked ? "store-locked" : "store-open"}">
  <a class="skip-link" href="#store-main">Skip to content</a>
  ${sharedHeader}
  <main id="store-main">${inner}</main>
  <script type="module" src="/assets/arc-tabs.js?v=7"></script>
  <script src="/assets/motion.js?v=6" defer></script>
  <script src="/assets/site-search.js?v=2" defer></script>
  <script src="/assets/store.js?v=2" defer></script>
</body>
</html>`;
}

function lockedPage(message = "", unavailable = false) {
  return htmlFrame(`<div class="st-gate-wrap st-shell"><section class="st-gate" aria-labelledby="gate-title">
    <div class="st-gate-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
    <p class="st-gate-kicker">An invitation only space</p>
    <h1 id="gate-title">Your private gift card store.</h1>
    <p class="st-gate-lead">Enter your four digit PIN to browse Amazon and Flipkart gift cards.</p>
    ${unavailable ? '<p class="st-alert" role="status">Store access is being set up. Please check back later.</p>' : `<form method="post" action="/store" class="st-pin-form">
      <input type="hidden" name="action" value="unlock">
      <label for="storePin">Access PIN</label>
      <div class="st-pin-control"><input id="storePin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" required aria-describedby="pinNote${message ? ' pinError' : ''}" placeholder="••••"><button type="submit">Unlock store <span aria-hidden="true">↗</span></button></div>
      <p id="pinNote" class="st-pin-note">This store is available only to people with the PIN.</p>
      ${message ? `<p class="st-error" id="pinError" role="alert">${message}</p>` : ""}
    </form>`}
  </section></div>`, { locked: true });
}

function cardMarkup(id, product, selected = false) {
  return `<button class="st-product${selected ? " is-selected" : ""}" type="button" data-product="${id}" aria-pressed="${selected}">
    <span class="st-card-art st-card-${product.className}" aria-hidden="true"><span class="st-card-logo"><img src="${product.logo}" alt="" width="96" height="96" decoding="async"></span><span class="st-card-art-copy">${product.short}</span><span class="st-card-art-foot">Gift card</span></span>
    <span class="st-product-info"><span><strong>${product.name}</strong><small>Digital voucher · INR</small></span><span class="st-product-pick" aria-hidden="true">${selected ? "✓" : "+"}</span></span>
  </button>`;
}

function catalogPage(checkoutReady) {
  const cards = Object.entries(PRODUCTS).map(([id, product], index) => cardMarkup(id, product, index === 0)).join("");
  const values = VALUES.map((value, index) => `<button type="button" class="st-value${index === 0 ? " is-selected" : ""}" data-value="${value}" aria-pressed="${index === 0}">₹${value.toLocaleString("en-IN")}</button>`).join("");
  return htmlFrame(`<div class="st-shell st-content">
    <section class="st-hero" aria-labelledby="store-title"><div><p class="st-eyebrow"><span class="st-eyebrow-dot"></span>Private access</p><h1 id="store-title">Gift cards, <span>your choice.</span></h1><p>Choose an Amazon or Flipkart gift card and its value. Review the details before checkout.</p></div><form method="post" action="/store" class="st-lock-form"><input type="hidden" name="action" value="lock"><button class="st-lock" type="submit">Lock store</button></form></section>
    ${checkoutReady ? "" : '<div class="st-setup-note" role="status"><span class="st-setup-dot"></span><span>The catalog is ready. Checkout will open after the payment gateway and voucher delivery are connected.</span></div>'}
    <div class="st-layout"><section class="st-catalog" aria-labelledby="catalog-title"><div class="st-section-head"><div><p class="st-step">01 / Gift card</p><h2 id="catalog-title">Choose a voucher</h2></div><span>3 options</span></div><div class="st-products">${cards}</div></section>
    <section class="st-checkout" aria-labelledby="checkout-title"><div class="st-section-head"><div><p class="st-step">02 / Value & details</p><h2 id="checkout-title">Make it yours</h2></div></div><div class="st-checkout-panel">
      <p class="st-field-title">Choose a value</p><div class="st-values" role="group" aria-label="Gift card value">${values}</div>
      <label class="st-email-label" for="deliveryEmail">Email for voucher delivery</label><input id="deliveryEmail" name="email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com"${checkoutReady ? "" : " disabled"}>
      <p class="st-email-hint">Your gift card will be delivered after payment is confirmed.</p>
      <div class="st-summary"><div><span>Gift card</span><strong id="summaryProduct">Amazon Shopping Voucher</strong></div><div><span>Value</span><strong id="summaryValue">₹1,000</strong></div><div class="st-total"><span>Total</span><strong id="summaryTotal">₹1,000</strong></div></div>
      <button id="storeCheckout" class="st-pay" type="button"${checkoutReady ? "" : " disabled"}>${checkoutReady ? "Continue to secure checkout" : "Checkout not available yet"}<span aria-hidden="true">↗</span></button>
      <p class="st-pay-note">Payments are processed through the configured YouPI gateway. Check the voucher and amount before paying.</p><p id="storeMessage" class="st-checkout-message" role="status" aria-live="polite"></p>
    </div></section></div><p class="st-footer-note">Private access · Gift cards are sold at face value in Indian rupees.</p>
  </div>`);
}

function sendHtml(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(body);
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function checkoutReady() {
  return process.env.STORE_CHECKOUT_ENABLED === "true" && process.env.STORE_FULFILLMENT_READY === "true" &&
    Boolean(process.env.YOUPI_API_URL && process.env.YOUPI_CHECKOUT_URL && process.env.YOUPI_MERCHANT_ID && process.env.YOUPI_MERCHANT_KEY);
}

async function createCheckout(body, res) {
  const product = PRODUCTS[body.product];
  const amount = Number(body.value);
  const email = String(body.email || "").trim();
  if (!product || !VALUES.includes(amount) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return sendJson(res, 400, { error: "Choose a voucher, value and valid delivery email." });
  }
  if (!checkoutReady()) return sendJson(res, 503, { error: "Checkout is not available yet." });
  let apiUrl, checkoutOrigin;
  try {
    apiUrl = new URL(process.env.YOUPI_API_URL);
    checkoutOrigin = new URL(process.env.YOUPI_CHECKOUT_URL).origin;
    if (apiUrl.protocol !== "https:" || !checkoutOrigin.startsWith("https://")) throw new Error("HTTPS required");
  } catch { return sendJson(res, 503, { error: "Checkout configuration is incomplete." }); }
  const orderId = `AVH-${body.product}-${amount}-${randomUUID()}`;
  try {
    const response = await fetch(new URL("/api/v1/payments", apiUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Merchant-Id": process.env.YOUPI_MERCHANT_ID, "X-Merchant-Key": process.env.YOUPI_MERCHANT_KEY },
      body: JSON.stringify({ orderId, amount: amount.toFixed(2), currency: "INR", returnUrl: "https://avhishek.in/store", metadata: { product: body.product, denomination: amount, deliveryEmail: email } }),
      signal: AbortSignal.timeout(10000),
    });
    const payment = await response.json();
    if (!response.ok) throw new Error(`Gateway ${response.status}`);
    const checkoutUrl = new URL(payment.checkoutUrl);
    if (checkoutUrl.protocol !== "https:" || checkoutUrl.origin !== checkoutOrigin) throw new Error("Unexpected checkout URL");
    return sendJson(res, 200, { checkoutUrl: checkoutUrl.href, orderId });
  } catch (error) {
    console.error("Store checkout unavailable:", error.message);
    return sendJson(res, 502, { error: "Checkout could not start. No payment was taken. Please try later." });
  }
}

module.exports = async function handler(req, res) {
  setHeaders(res);
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].toLowerCase();
  if (host === "cards.avhishek.in") return sendHtml(res, 404, "Not found");
  const pin = process.env.STORE_PIN;
  const secret = process.env.STORE_SESSION_SECRET;
  if (req.method === "GET") return sendHtml(res, 200, tokenValid(req, secret) ? catalogPage(checkoutReady()) : lockedPage("", !pin || !secret));
  if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return sendJson(res, 405, { error: "Method not allowed." }); }
  if (!sameOrigin(req)) return sendJson(res, 403, { error: "Request origin was not accepted." });
  const body = bodyOf(req);
  if (body.action === "lock") {
    res.setHeader("Set-Cookie", `${COOKIE}=; Path=/store; HttpOnly; SameSite=Strict; Max-Age=0${cookieSecurity(req)}`);
    res.writeHead(303, { Location: "/store" }); return res.end();
  }
  if (body.action === "checkout") {
    if (!tokenValid(req, secret)) return sendJson(res, 401, { error: "Store access has expired. Unlock the store again." });
    return createCheckout(body, res);
  }
  if (body.action !== "unlock") return sendJson(res, 400, { error: "Invalid request." });
  if (!pin || !secret) return sendHtml(res, 503, lockedPage("", true));
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((time) => now - time < 15 * 60 * 1000);
  if (recent.length >= 5) { res.setHeader("Retry-After", "900"); return sendHtml(res, 429, lockedPage("Too many attempts. Try again in 15 minutes.")); }
  if (!/^\d{4}$/.test(String(body.pin || "")) || !safeEqual(body.pin, pin)) {
    recent.push(now); attempts.set(ip, recent);
    if (attempts.size > 5000) attempts.clear();
    return sendHtml(res, 403, lockedPage("That PIN did not work. Please try again."));
  }
  attempts.delete(ip);
  res.setHeader("Set-Cookie", cookieFor(req, secret));
  res.writeHead(303, { Location: "/store" });
  res.end();
};

module.exports._test = { PRODUCTS, VALUES, tokenValid, checkoutReady };
