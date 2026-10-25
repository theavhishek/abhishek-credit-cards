/* ==========================================================================
   QR content parser for the QR scanner (/qr-scanner).
   Turns the text inside a QR code into something a person can check before
   acting on it: UPI and Bharat QR payments, links, Wi-Fi, contacts, email,
   phone, SMS and map points. Pure functions, no DOM: the page uses
   window.QR_PARSE, and scripts/qr/qr.test.mjs tests the same file in Node.
   Only http(s), mailto, tel, sms, upi and geo get an "open" target; anything
   else is shown as text and never made clickable.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.QR_PARSE = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const SHORTENERS = new Set(["bit.ly", "tinyurl.com", "t.co", "goo.gl", "rb.gy", "cutt.ly", "is.gd", "shorturl.at", "tiny.cc", "ow.ly", "rebrand.ly", "t.ly", "s.id", "v.gd"]);
  const VPA_RE = /^[a-z0-9._-]{2,256}@[a-z][a-z0-9.-]{1,64}$/i;

  function decode(value) {
    try { return decodeURIComponent(value.replace(/\+/g, " ")); } catch { return value; }
  }

  function query(qs) {
    const out = {};
    for (const pair of String(qs || "").split("&")) {
      if (!pair) continue;
      const i = pair.indexOf("=");
      const key = decode(i < 0 ? pair : pair.slice(0, i)).trim().toLowerCase();
      if (!key || key in out) continue;
      out[key] = decode(i < 0 ? "" : pair.slice(i + 1)).trim();
    }
    return out;
  }

  function rupees(value) {
    const n = Number(value);
    return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  }

  const validAmount = (am) => /^\d+(\.\d{1,2})?$/.test(am || "") && Number(am) > 0;

  function field(label, value, opts) {
    return Object.assign({ label, value: String(value) }, opts || {});
  }

  /* ---------- UPI: upi://pay?pa=…&pn=…&am=… ---------- */
  function parseUpi(text) {
    const m = /^upi:\/\/([a-z]+)\/?(?:\?(.*))?$/is.exec(text);
    if (!m) return null;
    const action = m[1].toLowerCase();
    const p = query(m[2]);
    const vpa = p.pa || "";
    const vpaOk = VPA_RE.test(vpa);
    const fields = [];
    const notes = [];
    if (vpa) fields.push(field("UPI ID", vpa, { mono: true, copy: true }));
    if (p.pn) fields.push(field("Name in the QR", p.pn));
    if (p.am) fields.push(field("Amount", validAmount(p.am) ? rupees(p.am) : p.am, { mono: true }));
    else fields.push(field("Amount", "Not set: you type it in your app"));
    if (p.cu && p.cu.toUpperCase() !== "INR") fields.push(field("Currency", p.cu));
    if (p.tn) fields.push(field("Note", p.tn));
    if (p.mc && p.mc !== "0000") fields.push(field("Merchant category code", p.mc, { mono: true }));
    if (p.tr) fields.push(field("Reference", p.tr, { mono: true }));
    if (p.tid) fields.push(field("Transaction ID", p.tid, { mono: true }));

    if (action === "mandate") notes.push({ tone: "warn", text: "This is an AutoPay (mandate) request. Approving it lets the payee take money from your account again later, not just once." });
    if (!vpa) notes.push({ tone: "warn", text: "This UPI code has no UPI ID in it, so your app can’t pay it." });
    else if (!vpaOk) notes.push({ tone: "warn", text: "The UPI ID in this code doesn’t look like a valid one. Don’t pay it unless you trust where it came from." });
    if (p.am && validAmount(p.am)) notes.push({ tone: "warn", text: `The amount is fixed in the code at ${rupees(p.am)}. Check it in your app before you enter your PIN.` });
    notes.push({ tone: "info", text: "Scanning a UPI code can only send money from your account. You never need to scan a code or enter your UPI PIN to receive money." });
    if (p.pn) notes.push({ tone: "info", text: "Anyone can type any name into a QR. Your UPI app shows the name registered to this UPI ID; if it differs, stop." });

    return {
      type: "upi",
      label: action === "mandate" ? "UPI AutoPay request" : "UPI payment",
      title: p.pn || vpa || "UPI code",
      subtitle: p.pn && vpa ? vpa : "",
      fields,
      notes,
      copy: vpa ? { value: vpa, label: "Copy UPI ID" } : null,
      open: vpaOk ? { href: text, label: "Pay in a UPI app", phoneOnly: true } : null,
    };
  }

  /* ---------- Bharat QR / EMVCo merchant codes ("000201…") ---------- */
  function crc16(str) {
    let crc = 0xffff;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  function tlv(str) {
    const out = [];
    let i = 0;
    while (i < str.length) {
      const id = str.slice(i, i + 2);
      const len = Number(str.slice(i + 2, i + 4));
      if (!/^\d\d$/.test(id) || !/^\d\d$/.test(str.slice(i + 2, i + 4)) || i + 4 + len > str.length) return null;
      out.push({ id, value: str.slice(i + 4, i + 4 + len), at: i });
      i += 4 + len;
    }
    return out;
  }

  function parseEmv(text) {
    if (!text.startsWith("000201")) return null;
    const tags = tlv(text);
    if (!tags) return null;
    const get = (id) => (tags.find((t) => t.id === id) || {}).value;
    let vpa = "";
    for (const t of tags) {
      const n = Number(t.id);
      if (n < 26 || n > 51) continue;
      for (const sub of tlv(t.value) || []) if (!vpa && VPA_RE.test(sub.value)) vpa = sub.value;
    }
    const name = get("59") || "";
    const city = get("60") || "";
    const amount = get("54") || "";
    const currency = get("53");
    const fields = [];
    const notes = [];
    if (name) fields.push(field("Merchant", name));
    if (city) fields.push(field("City", city));
    if (vpa) fields.push(field("UPI ID", vpa, { mono: true, copy: true }));
    if (amount) fields.push(field("Amount", currency === "356" && validAmount(amount) ? rupees(amount) : amount, { mono: true }));
    else fields.push(field("Amount", "Not set: you type it in your app"));
    if (get("52") && get("52") !== "0000") fields.push(field("Merchant category code", get("52"), { mono: true }));

    const crcTag = tags.find((t) => t.id === "63");
    if (crcTag) {
      const ok = crc16(text.slice(0, crcTag.at + 4)) === crcTag.value.toUpperCase();
      fields.push(field("Checksum", ok ? "Valid" : "Doesn’t match"));
      if (!ok) notes.push({ tone: "warn", text: "This code’s checksum doesn’t match its contents, so it may have been edited or damaged. Don’t pay it." });
    }
    if (amount) notes.push({ tone: "warn", text: "The amount is fixed in the code. Check it in your app before you enter your PIN." });
    notes.push({ tone: "info", text: "Scanning a payment code can only send money from your account. You never need to scan a code or enter your UPI PIN to receive money." });

    return {
      type: "bharatqr",
      label: "Bharat QR payment",
      title: name || vpa || "Merchant payment code",
      subtitle: [city, vpa && name ? vpa : ""].filter(Boolean).join(" · "),
      fields,
      notes,
      copy: vpa ? { value: vpa, label: "Copy UPI ID" } : null,
      open: null,
    };
  }

  /* ---------- Links ---------- */
  function parseUrl(text) {
    let raw = text;
    if (/^www\.[^\s]+\.[a-z]{2,}(\/\S*)?$/i.test(raw)) raw = "https://" + raw;
    if (!/^https?:\/\/\S+$/i.test(raw)) return null;
    let url;
    try { url = new URL(raw); } catch { return null; }
    const host = url.hostname.toLowerCase();
    const display = host.replace(/^www\./, "");
    const notes = [];
    if (url.username || url.password) notes.push({ tone: "warn", text: `The link has text before an “@”, a trick used to disguise where it goes. It really opens ${display}.` });
    if (url.protocol === "http:") notes.push({ tone: "warn", text: "This link isn’t secure (http, not https). Don’t enter passwords or card details on the page it opens." });
    if (/(^|\.)xn--/.test(host)) notes.push({ tone: "warn", text: "The site name uses special characters that can imitate a familiar name. Check it letter by letter." });
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[")) notes.push({ tone: "warn", text: "This link points to a bare IP address instead of a site name. Real banks and shops don’t do that." });
    if (SHORTENERS.has(display)) notes.push({ tone: "warn", text: "This is a short link, which hides where it finally goes. Open it only if you trust who gave you the code." });
    notes.push({ tone: "info", text: "Check the site name above before you open it. A bank or shop link should be on that company’s own domain." });
    return {
      type: "url",
      label: url.protocol === "http:" ? "Link (not secure)" : "Link",
      title: display,
      subtitle: "",
      fields: [field("Full link", url.href, { mono: true, copy: true })],
      notes,
      copy: { value: url.href, label: "Copy link" },
      open: { href: url.href, label: "Open link", external: true },
    };
  }

  /* ---------- Wi-Fi: WIFI:T:WPA;S:name;P:pass;; ---------- */
  function splitEscaped(body, sep) {
    const parts = [];
    let cur = "";
    for (let i = 0; i < body.length; i++) {
      const ch = body[i];
      if (ch === "\\" && i + 1 < body.length) { cur += body[++i]; continue; }
      if (ch === sep) { parts.push(cur); cur = ""; continue; }
      cur += ch;
    }
    if (cur) parts.push(cur);
    return parts;
  }

  function keyed(body) {
    const out = {};
    for (const part of splitEscaped(body, ";")) {
      const i = part.indexOf(":");
      if (i < 1) continue;
      const k = part.slice(0, i).toUpperCase();
      if (!(k in out)) out[k] = part.slice(i + 1);
    }
    return out;
  }

  function parseWifi(text) {
    if (!/^WIFI:/i.test(text)) return null;
    const f = keyed(text.slice(5));
    const security = (f.T || "").toUpperCase();
    const secLabel = !security || security === "NOPASS" ? "Open (no password)" : security === "WEP" ? "WEP (old and weak)" : security.replace("SAE", "WPA3");
    const fields = [field("Network name", f.S || "(hidden name)")];
    fields.push(field("Security", secLabel));
    if (f.P) fields.push(field("Password", f.P, { mono: true, copy: true }));
    if (/^true$/i.test(f.H || "")) fields.push(field("Hidden network", "Yes"));
    const notes = [{ tone: "info", text: "Your phone’s camera app can join this network straight from the code. Or copy the password and join from Wi-Fi settings." }];
    if (!f.P && security !== "" && security !== "NOPASS") notes.unshift({ tone: "warn", text: "The code says the network is protected but has no password in it." });
    return {
      type: "wifi",
      label: "Wi-Fi network",
      title: f.S || "Wi-Fi network",
      subtitle: secLabel,
      fields,
      notes,
      copy: f.P ? { value: f.P, label: "Copy password" } : null,
      open: null,
    };
  }

  /* ---------- Contacts: vCard and MECARD ---------- */
  function contact(name, list, raw) {
    const fields = list.filter(([, v]) => v).map(([k, v, mono]) => field(k, v, { mono: !!mono, copy: true }));
    const phone = list.find(([k]) => k === "Phone");
    return {
      type: "contact",
      label: "Contact card",
      title: name || "Contact",
      subtitle: "",
      fields,
      notes: [],
      copy: phone && phone[1] ? { value: phone[1], label: "Copy number" } : null,
      open: null,
      vcard: raw,
    };
  }

  function parseVcard(text) {
    if (!/^BEGIN:VCARD/i.test(text)) return null;
    const lines = text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "").split(/\r?\n/);
    const props = {};
    for (const line of lines) {
      const i = line.indexOf(":");
      if (i < 1) continue;
      const key = line.slice(0, i).split(";")[0].toUpperCase();
      const val = line.slice(i + 1).replace(/\\n/gi, ", ").replace(/\\([,;\\])/g, "$1").trim();
      if (val && !(key in props)) props[key] = val;
    }
    const n = props.N ? props.N.split(";").filter(Boolean).reverse().join(" ") : "";
    return contact(props.FN || n, [
      ["Phone", props.TEL, true],
      ["Email", props.EMAIL],
      ["Organisation", (props.ORG || "").replace(/;+/g, ", ")],
      ["Job title", props.TITLE],
      ["Website", props.URL],
      ["Address", (props.ADR || "").split(";").filter(Boolean).join(", ")],
    ], text);
  }

  function parseMecard(text) {
    if (!/^MECARD:/i.test(text)) return null;
    const f = keyed(text.slice(7));
    const name = (f.N || "").split(",").filter(Boolean).reverse().join(" ");
    const vcard = ["BEGIN:VCARD", "VERSION:3.0", `FN:${name}`, f.TEL && `TEL:${f.TEL}`, f.EMAIL && `EMAIL:${f.EMAIL}`, f.URL && `URL:${f.URL}`, f.ADR && `ADR:;;${f.ADR}`, "END:VCARD"].filter(Boolean).join("\r\n");
    return contact(name, [["Phone", f.TEL, true], ["Email", f.EMAIL], ["Website", f.URL], ["Address", f.ADR], ["Note", f.NOTE]], vcard);
  }

  /* ---------- Email, phone, SMS, location ---------- */
  function parseMailto(text) {
    const m = /^mailto:([^?]*)(?:\?(.*))?$/is.exec(text);
    if (m) {
      const to = decode(m[1]);
      const q = query(m[2]);
      const fields = [field("To", to, { mono: true, copy: true })];
      if (q.subject) fields.push(field("Subject", q.subject));
      if (q.body) fields.push(field("Message", q.body));
      return { type: "email", label: "Email", title: to || "Email", subtitle: "", fields, notes: [], copy: to ? { value: to, label: "Copy address" } : null, open: { href: text, label: "Write email" } };
    }
    const mm = /^MATMSG:/i.test(text) && keyed(text.slice(7));
    if (!mm) return null;
    const fields = [field("To", mm.TO || "", { mono: true, copy: true })];
    if (mm.SUB) fields.push(field("Subject", mm.SUB));
    if (mm.BODY) fields.push(field("Message", mm.BODY));
    const href = `mailto:${encodeURIComponent(mm.TO || "")}?subject=${encodeURIComponent(mm.SUB || "")}&body=${encodeURIComponent(mm.BODY || "")}`;
    return { type: "email", label: "Email", title: mm.TO || "Email", subtitle: "", fields, notes: [], copy: mm.TO ? { value: mm.TO, label: "Copy address" } : null, open: { href, label: "Write email" } };
  }

  function parseTel(text) {
    const m = /^tel:([+\d\s().-]{3,})$/i.exec(text);
    if (!m) return null;
    const num = m[1].trim();
    return { type: "phone", label: "Phone number", title: num, subtitle: "", fields: [field("Number", num, { mono: true, copy: true })], notes: [], copy: { value: num, label: "Copy number" }, open: { href: "tel:" + num.replace(/[^\d+]/g, ""), label: "Call", phoneOnly: true } };
  }

  function parseSms(text) {
    const m = /^(?:smsto|sms):([+\d\s().-]{3,})(?::([\s\S]*)|\?body=([\s\S]*))?$/i.exec(text);
    if (!m) return null;
    const num = m[1].trim();
    const body = m[2] != null ? m[2] : m[3] != null ? decode(m[3]) : "";
    const fields = [field("To", num, { mono: true, copy: true })];
    if (body) fields.push(field("Message", body, { copy: true }));
    const notes = body ? [{ tone: "info", text: "Read the message before you send it. Codes that send texts to short numbers can sign you up for paid services." }] : [];
    return { type: "sms", label: "Text message", title: num, subtitle: "", fields, notes, copy: { value: num, label: "Copy number" }, open: { href: `sms:${num.replace(/[^\d+]/g, "")}${body ? "?body=" + encodeURIComponent(body) : ""}`, label: "Open in Messages", phoneOnly: true } };
  }

  function parseGeo(text) {
    const m = /^geo:(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/i.exec(text);
    if (!m) return null;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    const point = `${lat}, ${lng}`;
    return { type: "geo", label: "Location", title: point, subtitle: "", fields: [field("Coordinates", point, { mono: true, copy: true })], notes: [], copy: { value: point, label: "Copy coordinates" }, open: { href: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`, label: "Open map", external: true } };
  }

  function parseText(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    return {
      type: "text",
      label: "Text",
      title: "Plain text",
      subtitle: `${text.length.toLocaleString("en-IN")} characters${lines.length > 1 ? ` · ${lines.length} lines` : ""}`,
      fields: [],
      notes: /^[a-z][a-z0-9+.-]*:\S+$/i.test(text.trim()) ? [{ tone: "info", text: "This looks like a link for an app this page doesn’t open. Copy it only if you know what it is." }] : [],
      copy: { value: text, label: "Copy text" },
      open: null,
    };
  }

  const PARSERS = [parseUpi, parseEmv, parseUrl, parseWifi, parseVcard, parseMecard, parseMailto, parseTel, parseSms, parseGeo];

  function parse(input) {
    const text = String(input == null ? "" : input).replace(/^﻿/, "");
    const trimmed = text.trim();
    for (const fn of PARSERS) {
      const result = fn(trimmed);
      if (result) return Object.assign(result, { raw: text });
    }
    return Object.assign(parseText(text), { raw: text });
  }

  return { parse, crc16 };
});
