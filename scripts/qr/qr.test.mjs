// Tests for assets/qr-parse.js (what the QR scanner shows for each kind of code)
// and an end-to-end decode through assets/jsqr.js. Run: pnpm test:qr
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Q = require("../../assets/qr-parse.js");
const jsQR = require("../../assets/jsqr.js");
const qrcode = require("qrcode-generator");

const value = (r, label) => (r.fields.find((f) => f.label === label) || {}).value;

test("UPI payment with name, amount and note", () => {
  const r = Q.parse("upi://pay?pa=shop.name@okbank&pn=Asha%20Stores&am=250.5&cu=INR&tn=Order+42");
  assert.equal(r.type, "upi");
  assert.equal(r.title, "Asha Stores");
  assert.equal(r.subtitle, "shop.name@okbank");
  assert.equal(value(r, "UPI ID"), "shop.name@okbank");
  assert.equal(value(r, "Amount"), "₹250.50");
  assert.equal(value(r, "Note"), "Order 42");
  assert.equal(r.copy.value, "shop.name@okbank");
  assert.equal(r.open.phoneOnly, true);
  assert.ok(r.notes.some((n) => n.tone === "warn" && /fixed in the code/.test(n.text)));
});

test("UPI without amount, odd case and missing slash", () => {
  const r = Q.parse("UPI://pay?PA=9876543210@upi");
  assert.equal(r.type, "upi");
  assert.equal(r.title, "9876543210@upi");
  assert.match(value(r, "Amount"), /Not set/);
});

test("UPI with a broken or missing UPI ID can't be opened", () => {
  const bad = Q.parse("upi://pay?pa=not-a-vpa&pn=X");
  assert.equal(bad.open, null);
  assert.ok(bad.notes.some((n) => /doesn’t look like a valid/.test(n.text)));
  const none = Q.parse("upi://pay?pn=X");
  assert.equal(none.copy, null);
  assert.ok(none.notes.some((n) => /no UPI ID/.test(n.text)));
});

test("UPI mandate is flagged as AutoPay", () => {
  const r = Q.parse("upi://mandate?pa=biller@bank&pn=Biller&am=99");
  assert.equal(r.label, "UPI AutoPay request");
  assert.ok(r.notes.some((n) => /AutoPay/.test(n.text)));
});

test("CRC16 is CCITT-FALSE", () => {
  assert.equal(Q.crc16("123456789"), "29B1");
});

function emv(tags) {
  const enc = (id, v) => id + String(v.length).padStart(2, "0") + v;
  const body = tags.map(([id, v]) => enc(id, v)).join("") + "6304";
  return body + Q.crc16(body);
}

test("Bharat QR: merchant, city, UPI ID and checksum", () => {
  const upiTemplate = "0010A000000524" + "0115merchant@okbank";
  const text = emv([["00", "01"], ["01", "11"], ["26", upiTemplate], ["52", "5411"], ["53", "356"], ["54", "120.00"], ["58", "IN"], ["59", "Fresh Mart"], ["60", "Jaipur"]]);
  const r = Q.parse(text);
  assert.equal(r.type, "bharatqr");
  assert.equal(r.title, "Fresh Mart");
  assert.equal(value(r, "UPI ID"), "merchant@okbank");
  assert.equal(value(r, "Amount"), "₹120");
  assert.equal(value(r, "Checksum"), "Valid");
  const tampered = Q.parse(text.replace("Fresh Mart", "Fresh Mark"));
  assert.equal(value(tampered, "Checksum"), "Doesn’t match");
});

test("Links: https, http, @ trick, punycode, IP, short links", () => {
  const ok = Q.parse("https://www.example.com/path?q=1");
  assert.equal(ok.type, "url");
  assert.equal(ok.title, "example.com");
  assert.equal(ok.open.href, "https://www.example.com/path?q=1");
  assert.equal(ok.notes.filter((n) => n.tone === "warn").length, 0);
  assert.ok(Q.parse("http://example.com").notes.some((n) => /isn’t secure/.test(n.text)));
  const trick = Q.parse("https://mybank.com@evil.example/login");
  assert.equal(trick.title, "evil.example");
  assert.ok(trick.notes.some((n) => /really opens evil\.example/.test(n.text)));
  assert.ok(Q.parse("https://xn--pple-43d.com").notes.some((n) => /special characters/.test(n.text)));
  assert.ok(Q.parse("http://192.168.1.10/pay").notes.some((n) => /IP address/.test(n.text)));
  assert.ok(Q.parse("https://bit.ly/abc").notes.some((n) => /short link/.test(n.text)));
  assert.equal(Q.parse("www.example.com").open.href, "https://www.example.com/");
});

test("Unsafe schemes stay plain text", () => {
  for (const t of ["javascript:alert(1)", "data:text/html,<b>x</b>", "intent://scan/#Intent;scheme=zxing;end"]) {
    const r = Q.parse(t);
    assert.equal(r.type, "text", t);
    assert.equal(r.open, null, t);
  }
});

test("Wi-Fi with escapes", () => {
  const r = Q.parse("WIFI:T:WPA;S:Home\\;Net;P:pa\\:ss\\\\word;H:true;;");
  assert.equal(r.type, "wifi");
  assert.equal(r.title, "Home;Net");
  assert.equal(value(r, "Password"), "pa:ss\\word");
  assert.equal(value(r, "Hidden network"), "Yes");
  assert.equal(Q.parse("WIFI:S:Cafe;T:nopass;;").subtitle, "Open (no password)");
});

test("Contacts: vCard and MECARD", () => {
  const v = Q.parse("BEGIN:VCARD\r\nVERSION:3.0\r\nN:Meena;Abhishek;;;\r\nTEL;TYPE=CELL:+91 98765 43210\r\nEMAIL:a@example.com\r\nORG:Example;Team\r\nEND:VCARD");
  assert.equal(v.type, "contact");
  assert.equal(v.title, "Abhishek Meena");
  assert.equal(value(v, "Phone"), "+91 98765 43210");
  assert.equal(value(v, "Organisation"), "Example, Team");
  assert.ok(v.vcard.startsWith("BEGIN:VCARD"));
  const m = Q.parse("MECARD:N:Meena,Abhishek;TEL:9876543210;EMAIL:a@example.com;;");
  assert.equal(m.title, "Abhishek Meena");
  assert.match(m.vcard, /TEL:9876543210/);
});

test("Email, phone, SMS and location", () => {
  const e = Q.parse("mailto:help@example.com?subject=Hi%20there");
  assert.equal(e.type, "email");
  assert.equal(value(e, "Subject"), "Hi there");
  const p = Q.parse("tel:+91-98765-43210");
  assert.equal(p.open.href, "tel:+919876543210");
  const s = Q.parse("SMSTO:+919876543210:START");
  assert.equal(s.type, "sms");
  assert.equal(value(s, "Message"), "START");
  const g = Q.parse("geo:26.9124,75.7873");
  assert.equal(g.type, "geo");
  assert.match(g.open.href, /^https:\/\/www\.openstreetmap\.org\//);
  assert.equal(Q.parse("geo:200,10").type, "text");
});

test("Plain text keeps the raw value", () => {
  const r = Q.parse("Hello: this is a note\nsecond line");
  assert.equal(r.type, "text");
  assert.equal(r.notes.length, 0);
  assert.equal(r.copy.value, "Hello: this is a note\nsecond line");
  assert.match(r.subtitle, /2 lines/);
});

test("jsQR decodes a generated UPI code end to end", () => {
  const text = "upi://pay?pa=shop.name@okbank&pn=Asha%20Stores&cu=INR";
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const scale = 6;
  const margin = 4 * scale;
  const size = n * scale + margin * 2;
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const mx = Math.floor((x - margin) / scale);
      const my = Math.floor((y - margin) / scale);
      if (mx >= 0 && my >= 0 && mx < n && my < n && qr.isDark(my, mx)) {
        const i = (y * size + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = 0;
      }
    }
  }
  const out = jsQR(data, size, size);
  assert.ok(out, "jsQR found the code");
  assert.equal(out.data, text);
  assert.equal(Q.parse(out.data).title, "Asha Stores");
});

test("MCC from UPI and Bharat QR codes", () => {
  assert.deepEqual(Q.parse("upi://pay?pa=shop@okbank&mc=5411").mcc, { code: "5411", name: "Grocery stores and supermarkets", group: "grocery", groupLabel: "Groceries" });
  assert.equal(Q.parse("upi://pay?pa=friend@ybl&mc=0000").mcc.missing, "placeholder");
  assert.equal(Q.parse("upi://pay?pa=shop@paytm").mcc.missing, "none");
  assert.equal(Q.parse("upi://pay?pa=shop@paytm&mc=54A1").mcc.missing, "invalid");
  assert.equal(Q.mccInfo("3005").name, "Airlines");
  assert.equal(Q.mccInfo("3400").name, "Car rental");
  assert.equal(Q.mccInfo("3640").name, "Hotels and resorts");
  assert.equal(Q.mccInfo("1234").unknown, true);
  const text = emv([["00", "01"], ["26", "0010A000000524" + "0115merchant@okbank"], ["52", "5812"], ["53", "356"], ["58", "IN"], ["59", "Cafe"], ["60", "Pune"]]);
  assert.equal(Q.parse(text).mcc.name, "Restaurants");
  assert.equal(Q.parse("https://example.com").mcc, undefined);
});
