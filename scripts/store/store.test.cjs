"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../../api/store.js");

function response() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    writeHead(status, headers = {}) { this.statusCode = status; for (const [name, value] of Object.entries(headers)) this.setHeader(name, value); },
    end(body = "") { this.body += body; },
  };
}

async function request(method, body, cookie = "") {
  const req = { method, body, headers: { host: "localhost:3110", origin: "http://localhost:3110", "x-forwarded-proto": "http", cookie } };
  const res = response();
  await handler(req, res);
  return res;
}

test("store requires a server validated PIN and hides the catalog before access", async () => {
  process.env.STORE_PIN = "4827";
  process.env.STORE_SESSION_SECRET = "local-test-secret-with-enough-length";
  const locked = await request("GET");
  assert.equal(locked.statusCode, 200);
  assert.match(locked.headers["x-robots-tag"], /noindex/);
  assert.match(locked.body, /Access PIN/);
  assert.doesNotMatch(locked.body, /Choose a voucher/);

  const wrong = await request("POST", { action: "unlock", pin: "1234" });
  assert.equal(wrong.statusCode, 403);
  assert.doesNotMatch(wrong.body, /Choose a voucher/);

  const unlocked = await request("POST", { action: "unlock", pin: "4827" });
  assert.equal(unlocked.statusCode, 303);
  assert.match(unlocked.headers["set-cookie"], /HttpOnly; SameSite=Strict/);
  const cookie = unlocked.headers["set-cookie"].split(";")[0];
  const catalog = await request("GET", null, cookie);
  assert.match(catalog.body, /Amazon Shopping Voucher/);
  assert.match(catalog.body, /Amazon Pay Gift Card/);
  assert.match(catalog.body, /Flipkart Gift Card/);
  assert.match(catalog.body, /₹10,000/);
  assert.match(catalog.body, /id="deliveryEmail"[^>]*placeholder="you@example.com"/);
  assert.doesNotMatch(catalog.body, /id="deliveryEmail"[^>]*disabled/);
  assert.match(catalog.body, /id="storeCheckout"[^>]*disabled/);
});

test("checkout rejects invalid products and stays closed without a gateway", async () => {
  process.env.STORE_PIN = "4827";
  process.env.STORE_SESSION_SECRET = "local-test-secret-with-enough-length";
  const unlocked = await request("POST", { action: "unlock", pin: "4827" });
  const cookie = unlocked.headers["set-cookie"].split(";")[0];
  const invalid = await request("POST", { action: "checkout", product: "amazon-shopping", value: 1, email: "test@example.com" }, cookie);
  assert.equal(invalid.statusCode, 400);
  const unavailable = await request("POST", { action: "checkout", product: "amazon-shopping", value: 1000, email: "test@example.com" }, cookie);
  assert.equal(unavailable.statusCode, 503);
  assert.match(unavailable.body, /not available yet/);
});
