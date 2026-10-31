// pnpm test:newsletter — checks api/subscribe.js against a mocked Resend API.
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const handler = require("../../api/subscribe.js");

function fakeRes() {
  return {
    statusCode: 200, headers: {}, body: "",
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(b = "") { this.body = b; },
    json() { return JSON.parse(this.body); },
  };
}
function fakeReq(body, headers = {}) {
  return {
    method: "POST",
    body,
    headers: { "content-type": "application/json", accept: "application/json", origin: "https://avhishek.in", "x-forwarded-for": String(Math.random()), ...headers },
  };
}
function mockFetch(responses) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, method: init.method, body: init.body ? JSON.parse(init.body) : undefined, auth: init.headers.Authorization });
    const [status, data] = responses.shift() || [200, {}];
    return { ok: status < 300, status, json: async () => data };
  };
  return calls;
}

test.beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test";
  process.env.RESEND_SEGMENT_ID = "seg_1";
  handler._test.hits.clear();
});

test("adds a new contact to the segment", async () => {
  const calls = mockFetch([[200, { object: "contact", id: "c1" }]]);
  const res = fakeRes();
  await handler(fakeReq({ email: " Me@Example.com " }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().code, "subscribed");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.resend.com/contacts");
  assert.equal(calls[0].auth, "Bearer re_test");
  assert.deepEqual(calls[0].body, { email: "me@example.com", unsubscribed: false, segments: [{ id: "seg_1" }] });
});

test("re-subscribes an existing contact", async () => {
  const calls = mockFetch([[409, { name: "conflict", message: "Contact already exists" }], [200, {}], [200, {}]]);
  const res = fakeRes();
  await handler(fakeReq({ email: "me@example.com" }), res);
  assert.equal(res.json().code, "subscribed");
  assert.equal(calls[1].method, "PATCH");
  assert.equal(calls[1].url, "https://api.resend.com/contacts/me%40example.com");
  assert.deepEqual(calls[1].body, { unsubscribed: false });
  assert.equal(calls[2].url, "https://api.resend.com/contacts/me%40example.com/segments/seg_1");
});

test("rejects bad emails without calling Resend", async () => {
  for (const email of ["", "nope", "a@b", "a b@c.com", "x".repeat(250) + "@a.com"]) {
    const calls = mockFetch([]);
    const res = fakeRes();
    await handler(fakeReq({ email }), res);
    assert.equal(res.statusCode, 400, email);
    assert.equal(calls.length, 0);
  }
});

test("honeypot quietly succeeds without calling Resend", async () => {
  const calls = mockFetch([]);
  const res = fakeRes();
  await handler(fakeReq({ email: "bot@example.com", company: "Acme" }), res);
  assert.equal(res.json().code, "subscribed");
  assert.equal(calls.length, 0);
});

test("blocks other sites and GET", async () => {
  mockFetch([]);
  let res = fakeRes();
  await handler(fakeReq({ email: "me@example.com" }, { origin: "https://evil.example" }), res);
  assert.equal(res.statusCode, 403);
  res = fakeRes();
  await handler({ ...fakeReq({}), method: "GET" }, res);
  assert.equal(res.statusCode, 405);
});

test("says signups are closed when the key is missing", async () => {
  delete process.env.RESEND_API_KEY;
  const calls = mockFetch([]);
  const res = fakeRes();
  await handler(fakeReq({ email: "me@example.com" }), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.json().code, "closed");
  assert.equal(calls.length, 0);
});

test("reports Resend failures", async () => {
  mockFetch([[500, { name: "internal_server_error" }]]);
  const res = fakeRes();
  await handler(fakeReq({ email: "me@example.com" }), res);
  assert.equal(res.statusCode, 502);
});

test("rate limits repeated tries from one address", async () => {
  mockFetch(Array.from({ length: 10 }, () => [200, {}]));
  let last;
  for (let i = 0; i < 6; i++) {
    last = fakeRes();
    await handler(fakeReq({ email: "me@example.com" }, { "x-forwarded-for": "1.2.3.4" }), last);
  }
  assert.equal(last.statusCode, 429);
});

test("no-JS form post redirects back to the page", async () => {
  mockFetch([[200, {}]]);
  const res = fakeRes();
  await handler({ method: "POST", body: "email=me%40example.com", headers: { "content-type": "application/x-www-form-urlencoded", referer: "https://avhishek.in/updates", "x-forwarded-for": "9.9.9.9" } }, res);
  assert.equal(res.statusCode, 303);
  assert.equal(res.headers.location, "/updates?newsletter=subscribed#newsletter");
});
