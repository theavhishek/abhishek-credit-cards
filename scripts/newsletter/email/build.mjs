// node build.mjs deals-YYYY-MM-DD.json  ->  writes the matching .html email
import fs from "node:fs";
const src = process.argv[2];
// Images must be absolute URLs on the live site. ASSET_BASE=file:///... for local previews.
const BASE = process.env.ASSET_BASE || "https://avhishek.in";
const FONT = "Geist,-apple-system,'Segoe UI',Roboto,Arial,sans-serif";
const d = JSON.parse(fs.readFileSync(src, "utf8"));
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const deals = [...d.deals].sort((a, b) => b.discount - a.discount);
const best = deals[0];
const ORANGE = "#fc6e20";

const row = (x, i) => {
  const save = (x.value * x.discount) / 100;
  const pay = x.value - save;
  const top = i === 0;
  return `
<tr><td style="padding:0 0 10px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card" style="border:1px solid ${top ? "#fdd3bb" : "#e8e8ed"};border-radius:16px;background:${top ? "#fff7f2" : "#ffffff"}">
    <tr>
      <td style="padding:16px 0 16px 18px;width:44px" valign="middle">
        ${x.logo
          ? `<img src="${BASE}/assets/email/brands/${x.logo}.png" width="44" height="44" alt="${esc(x.brand)}" style="display:block;width:44px;height:44px;border-radius:12px;border:1px solid #e8e8ed">`
          : `<div class="mono" style="width:44px;height:44px;border-radius:12px;background:#f2f2f7;color:#1d1d1f;font:700 18px/44px ${FONT};text-align:center">${esc(x.brand[0])}</div>`}
      </td>
      <td style="padding:16px 12px" valign="middle">
        <div class="t1" style="font:650 16px/1.3 Geist,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1d1d1f">${esc(x.brand)}${x.note ? ` <span class="t2" style="font-weight:500;color:#6e6e73">· ${esc(x.note)}</span>` : ""}</div>
        <div class="t2" style="font:400 13px/1.45 Geist,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#6e6e73;padding-top:3px"><span style="white-space:nowrap">${inr(x.value)} card</span> · <span style="white-space:nowrap">pay ${inr(pay)}</span> · <span style="white-space:nowrap">save ${inr(save)}</span></div>
      </td>
      <td style="padding:16px 18px 16px 0;text-align:right;white-space:nowrap" valign="middle">
        <span style="display:inline-block;padding:6px 11px;border-radius:999px;background:${top ? ORANGE : "#15803d"};color:#ffffff;font:700 14px/1 Geist,-apple-system,'Segoe UI',Roboto,Arial,sans-serif">${x.discount}% off</span>
      </td>
    </tr>
  </table>
</td></tr>`;
};

const ICON = { plus: ["+", ORANGE], ok: ["✓", "#15803d"], no: ["✕", "#dc2626"] };
const tip = (t) => `
<tr>
  <td valign="top" style="padding:0 12px 12px 0;width:24px"><div style="width:24px;height:24px;border-radius:999px;background:${ICON[t.kind][1]};color:#fff;font:700 13px/24px Arial,sans-serif;text-align:center">${ICON[t.kind][0]}</div></td>
  <td valign="top" class="t1" style="padding:2px 0 12px;font:400 14px/1.5 Geist,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1d1d1f">${t.text}</td>
</tr>`;

const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>${esc(d.title)} (${esc(d.shortDate)})</title>
<style>
  @font-face{font-family:Geist;src:url(${BASE}/assets/geist-sans-vf.woff2) format('woff2');font-weight:100 900;font-display:swap}
  body{margin:0;padding:0;background:#f5f5f7}
  a{color:inherit}
  @media (max-width:520px){ .wrap{padding:20px 12px !important} .h1{font-size:26px !important} }
  @media (prefers-color-scheme:dark){
    body,.bg{background:#000000 !important}
    .sheet{background:#111113 !important;border-color:#2c2c2e !important}
    .card{background:#1c1c1e !important;border-color:#2c2c2e !important}
    .tips{background:#1c1c1e !important;border-color:#2c2c2e !important}
    .mono{background:#2c2c2e !important;color:#f5f5f7 !important}
    .cta{background:#f5f5f7 !important;color:#111113 !important}
    .t1{color:#f5f5f7 !important} .t2{color:#a1a1a6 !important}
  }
</style>
</head>
<body class="bg" style="margin:0;padding:0;background:#f5f5f7;font-family:${FONT}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(best.brand)} at ${best.discount}% off tops today’s ${deals.length} CRED gift card deals. Pay via Razorpay for extra cashback.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg" style="background:#f5f5f7">
<tr><td align="center" class="wrap" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="sheet" style="max-width:560px;background:#ffffff;border:1px solid #e8e8ed;border-radius:24px">
  <tr><td style="padding:28px 28px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td class="t1" style="font:700 22px/1 Geist,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;letter-spacing:-0.03em;color:#1d1d1f">abhishek<span style="color:${ORANGE}">.</span></td>
      <td align="right"><span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#fff1e8;color:#c2410c;font:600 12px/1 Geist,-apple-system,'Segoe UI',Roboto,Arial,sans-serif">${esc(d.date)}</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 6px">
    <div style="font:600 13px/1 Geist,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#c2410c;letter-spacing:.02em">🚨 DEALS OF THE DAY</div>
    <h1 class="h1 t1" style="margin:10px 0 0;font:700 30px/1.15 Geist,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;letter-spacing:-0.03em;color:#1d1d1f">CRED gift card deals<span style="color:${ORANGE}">.</span></h1>
    <p class="t2" style="margin:10px 0 0;font:400 15px/1.5 Geist,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#6e6e73">${deals.length} gift cards on discount today. Best deal: <b class="t1" style="color:#1d1d1f">${esc(best.brand)} at ${best.discount}% off</b>.</p>
  </td></tr>
  <tr><td style="padding:20px 28px 8px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${deals.map(row).join("")}</table>
  </td></tr>
  <tr><td align="center" style="padding:6px 28px 26px">
    <a href="${d.appLink}" class="cta" style="display:inline-block;padding:15px 30px;border-radius:999px;background:#1d1d1f;color:#ffffff;text-decoration:none;font:650 16px/1 Geist,-apple-system,'Segoe UI',Roboto,Arial,sans-serif">Open deals in CRED →</a>
  </td></tr>
  <tr><td style="padding:0 28px 26px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="tips" style="background:#f5f5f7;border:1px solid #e8e8ed;border-radius:16px">
      <tr><td style="padding:18px 18px 6px">
        <div class="t1" style="font:650 15px/1.3 Geist,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1d1d1f;padding-bottom:12px">💳 Stack more cashback</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${d.tips.map(tip).join("")}</table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td class="t2" style="padding:0 28px 28px;font:400 12px/1.55 Geist,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#86868b">
    Prices and discounts change through the day; check the final amount in the CRED app before you pay. “Pay” and “save” assume the full listed discount.
  </td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
  <tr><td align="center" style="padding:28px 16px 0">
    <a href="https://avhishek.in/" style="text-decoration:none"><img src="${BASE}/assets/icon-192.png" width="44" height="44" alt="avhishek.in" style="display:block;width:44px;height:44px;border-radius:12px;margin:0 auto"></a>
    <div class="t1" style="padding-top:10px;font:700 18px/1 ${FONT};letter-spacing:-0.03em;color:#1d1d1f">abhishek<span style="color:${ORANGE}">.</span></div>
    <div class="t2" style="padding-top:6px;font:400 13px/1.5 ${FONT};color:#6e6e73">There’s more to your credit card.</div>
    <div style="padding-top:12px;font:600 13px/1 ${FONT}">
      <a href="https://avhishek.in/updates" class="t1" style="color:#1d1d1f;text-decoration:none">Updates</a>
      <span style="color:#c7c7cc">&nbsp;·&nbsp;</span>
      <a href="https://avhishek.in/card-reviews" class="t1" style="color:#1d1d1f;text-decoration:none">Reviews</a>
      <span style="color:#c7c7cc">&nbsp;·&nbsp;</span>
      <a href="https://avhishek.in/whatsapp" class="t1" style="color:#1d1d1f;text-decoration:none">WhatsApp</a>
      <span style="color:#c7c7cc">&nbsp;·&nbsp;</span>
      <a href="https://avhishek.in/telegram" class="t1" style="color:#1d1d1f;text-decoration:none">Telegram</a>
    </div>
  </td></tr>
  <tr><td align="center" class="t2" style="padding:18px 16px 0;font:400 12px/1.6 ${FONT};color:#86868b">
    You’re getting this because you subscribed on <a href="https://avhishek.in/updates" style="color:#6e6e73">avhishek.in</a>.<br>
    <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#6e6e73">Unsubscribe</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
const out = src.replace(/\.json$/, ".html");
fs.writeFileSync(out, html);
console.log("wrote", out);
