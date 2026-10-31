// Newsletter signup: adds an email to Resend Contacts (and, if set, a segment).
// Vercel runs this file as a serverless function at /api/subscribe.
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY     required. A Resend API key with "Full access" (contacts need it).
//   RESEND_SEGMENT_ID  optional. The segment new subscribers join (send broadcasts to it).
//
// Unsubscribing is handled by Resend: every broadcast carries
// {{{RESEND_UNSUBSCRIBE_URL}}}, which opens Resend's hosted unsubscribe page and
// marks the contact unsubscribed. Contacts stay exportable as CSV from Resend.
"use strict";

const API = "https://api.resend.com";
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const ALLOWED_HOSTS = /^(?:avhishek\.in|www\.avhishek\.in|cards\.avhishek\.in|[a-z0-9-]+\.vercel\.app|localhost|127\.0\.0\.1)$/i;

// Best effort per-instance limit; Resend's own rate limit is the real backstop.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function limited(ip, now = Date.now()) {
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX_PER_WINDOW;
}

function originAllowed(req) {
  const source = req.headers.origin || req.headers.referer;
  if (!source) return true; // plain form posts from some browsers send neither
  try {
    return ALLOWED_HOSTS.test(new URL(source).hostname);
  } catch {
    return false;
  }
}

function readBody(req) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return Object.fromEntries(new URLSearchParams(body));
    }
  }
  return body;
}

async function resend(path, method, key, payload) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { ok: res.ok, status: res.status, data };
}

async function addContact(email, key, segmentId) {
  const created = await resend("/contacts", "POST", key, {
    email,
    unsubscribed: false,
    ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
  });
  if (created.ok) return true;

  // Already a contact (maybe unsubscribed earlier): opt them back in.
  const message = String(created.data?.message || created.data?.name || "").toLowerCase();
  const exists = created.status === 409 || message.includes("exist");
  if (!exists) {
    console.error("resend create contact failed", created.status, created.data?.name || "");
    return false;
  }
  const encoded = encodeURIComponent(email);
  const updated = await resend(`/contacts/${encoded}`, "PATCH", key, { unsubscribed: false });
  if (!updated.ok) {
    console.error("resend update contact failed", updated.status, updated.data?.name || "");
    return false;
  }
  if (segmentId) {
    const joined = await resend(`/contacts/${encoded}/segments/${encodeURIComponent(segmentId)}`, "POST", key);
    if (!joined.ok && joined.status !== 409) {
      console.error("resend add to segment failed", joined.status, joined.data?.name || "");
    }
  }
  return true;
}

module.exports = async function handler(req, res) {
  const wantsJson = String(req.headers.accept || "").includes("application/json")
    || String(req.headers["content-type"] || "").includes("application/json");

  const reply = (status, code, message) => {
    if (wantsJson) {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify({ ok: status < 300, code, message }));
      return;
    }
    // No-JS form post: send them back to the page with the result in the URL.
    let back = "/updates";
    try {
      const ref = new URL(req.headers.referer || "");
      if (ALLOWED_HOSTS.test(ref.hostname)) back = ref.pathname;
    } catch {}
    res.statusCode = 303;
    res.setHeader("Location", `${back}?newsletter=${code}#newsletter`);
    res.setHeader("Cache-Control", "no-store");
    res.end();
  };

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reply(405, "error", "Use the signup form.");
  }
  if (!originAllowed(req)) return reply(403, "error", "Signups only work from avhishek.in.");

  const body = readBody(req);
  // Honeypot: real people never see or fill this field.
  if (body.company) return reply(200, "subscribed", "You’re subscribed.");

  const email = String(body.email || "").trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return reply(400, "invalid", "Enter a valid email address.");
  }

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return reply(429, "busy", "Too many tries. Please wait a few minutes.");

  const key = process.env.RESEND_API_KEY;
  if (!key) return reply(503, "closed", "Signups open soon. Please check back.");

  try {
    const ok = await addContact(email, key, process.env.RESEND_SEGMENT_ID || "");
    if (!ok) return reply(502, "error", "Something went wrong. Please try again.");
  } catch (err) {
    console.error("resend request failed", err && err.name);
    return reply(502, "error", "Something went wrong. Please try again.");
  }
  // Same answer for new and existing subscribers, so the form can't be used to check who's on the list.
  return reply(200, "subscribed", "You’re subscribed.");
};

module.exports._test = { limited, hits, EMAIL_RE };
