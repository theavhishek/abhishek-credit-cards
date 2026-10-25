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

  /* ---------- Merchant category codes (ISO 18245, as card networks publish them) ----------
     Only the names of standard codes; nothing here says what a card earns. */
  const MCC_GROUPS = {
    grocery: "Groceries", dining: "Dining", fuel: "Fuel", utility: "Utilities and bills", telecom: "Phone and internet",
    travel: "Travel", transport: "Transport", shopping: "Shopping", electronics: "Electronics", fashion: "Fashion",
    health: "Health", education: "Education", entertainment: "Entertainment", digital: "Digital goods",
    government: "Government", insurance: "Insurance", rent: "Rent", jewellery: "Jewellery", home: "Home",
    auto: "Automotive", services: "Services", finance: "Wallets and money transfer", gaming: "Betting and gaming", other: "Other",
  };
  const MCC = {
    "4111": ["Local and suburban commuter transport", "transport"], "4112": ["Passenger railways", "travel"],
    "4121": ["Taxis and ride-hailing", "transport"], "4131": ["Bus lines", "travel"], "4214": ["Freight and trucking", "services"],
    "4215": ["Courier services", "services"], "4411": ["Cruise lines", "travel"], "4511": ["Airlines", "travel"],
    "4582": ["Airports and terminals", "travel"], "4722": ["Travel agencies and tour operators", "travel"],
    "4784": ["Tolls and bridge fees", "transport"], "4789": ["Transportation services", "transport"],
    "4812": ["Telecom equipment and phone sales", "telecom"], "4814": ["Telecom services", "telecom"],
    "4816": ["Computer network and information services", "telecom"], "4829": ["Money transfer", "finance"],
    "4899": ["Cable, satellite and pay TV", "telecom"], "4900": ["Utilities: electricity, gas, water", "utility"],
    "5013": ["Motor vehicle supplies and parts", "auto"], "5045": ["Computers and peripherals", "electronics"],
    "5094": ["Precious stones, metals and jewellery (wholesale)", "jewellery"], "5111": ["Stationery and office supplies", "shopping"],
    "5122": ["Drugs and druggists’ sundries", "health"], "5200": ["Home supply warehouse stores", "home"],
    "5211": ["Building materials and hardware", "home"], "5251": ["Hardware stores", "home"],
    "5261": ["Nurseries and garden supplies", "home"], "5300": ["Wholesale clubs", "shopping"],
    "5309": ["Duty-free stores", "shopping"], "5310": ["Discount stores", "shopping"], "5311": ["Department stores", "shopping"],
    "5331": ["Variety stores", "shopping"], "5399": ["General merchandise", "shopping"],
    "5411": ["Grocery stores and supermarkets", "grocery"], "5422": ["Meat and seafood shops", "grocery"],
    "5441": ["Sweet and confectionery shops", "grocery"], "5451": ["Dairy product stores", "grocery"],
    "5462": ["Bakeries", "grocery"], "5499": ["Convenience and specialty food stores", "grocery"],
    "5511": ["Car dealers (new and used)", "auto"], "5521": ["Used car dealers", "auto"], "5532": ["Tyre stores", "auto"],
    "5533": ["Auto parts and accessories", "auto"], "5541": ["Fuel stations", "fuel"], "5542": ["Automated fuel dispensers", "fuel"],
    "5571": ["Motorcycle dealers", "auto"], "5611": ["Men’s clothing", "fashion"], "5621": ["Women’s clothing", "fashion"],
    "5631": ["Women’s accessories", "fashion"], "5641": ["Children’s clothing", "fashion"], "5651": ["Family clothing stores", "fashion"],
    "5655": ["Sports and riding apparel", "fashion"], "5661": ["Shoe stores", "fashion"], "5691": ["Men’s and women’s clothing", "fashion"],
    "5699": ["Apparel and accessories", "fashion"], "5712": ["Furniture and home furnishings", "home"],
    "5719": ["Home furnishing specialty stores", "home"], "5722": ["Household appliances", "electronics"],
    "5732": ["Electronics stores", "electronics"], "5734": ["Computer software stores", "electronics"],
    "5735": ["Music stores", "entertainment"], "5811": ["Caterers", "dining"], "5812": ["Restaurants", "dining"],
    "5813": ["Bars, pubs and nightclubs", "dining"], "5814": ["Fast food and quick service restaurants", "dining"],
    "5815": ["Digital goods: books, films, music", "digital"], "5816": ["Digital goods: games", "digital"],
    "5817": ["Digital goods: apps", "digital"], "5818": ["Digital goods: large merchants", "digital"],
    "5912": ["Pharmacies and chemists", "health"], "5921": ["Liquor stores", "shopping"], "5932": ["Antique shops", "shopping"],
    "5941": ["Sporting goods", "shopping"], "5942": ["Book stores", "shopping"], "5943": ["Stationery stores", "shopping"],
    "5944": ["Jewellery, watches and silverware", "jewellery"], "5945": ["Toys and games", "shopping"],
    "5946": ["Camera and photo supplies", "electronics"], "5947": ["Gift and souvenir shops", "shopping"],
    "5948": ["Luggage and leather goods", "fashion"], "5949": ["Fabric and sewing stores", "fashion"],
    "5960": ["Direct marketing: insurance", "insurance"], "5964": ["Direct marketing: catalogue merchants", "shopping"],
    "5965": ["Direct marketing: catalogue and retail", "shopping"], "5966": ["Direct marketing: outbound telemarketing", "shopping"],
    "5967": ["Direct marketing: inbound teleservices", "shopping"], "5968": ["Direct marketing: subscriptions", "shopping"],
    "5969": ["Direct marketing: other", "shopping"], "5970": ["Artist and craft supplies", "shopping"],
    "5977": ["Cosmetics stores", "fashion"], "5983": ["Fuel dealers: fuel oil, LPG, wood", "fuel"],
    "5992": ["Florists", "shopping"], "5993": ["Tobacco shops", "shopping"], "5994": ["News dealers", "shopping"],
    "5995": ["Pet shops and pet food", "shopping"], "5999": ["Miscellaneous retail", "shopping"],
    "6010": ["Manual cash disbursement", "finance"], "6011": ["ATM cash withdrawal", "finance"],
    "6012": ["Financial institutions: merchandise and services", "finance"], "6051": ["Quasi-cash: wallets, forex, crypto", "finance"],
    "6211": ["Securities brokers", "finance"], "6300": ["Insurance", "insurance"], "6513": ["Rent and real-estate agents", "rent"],
    "6540": ["Stored-value card and wallet loads", "finance"], "7011": ["Hotels and resorts", "travel"],
    "7032": ["Camps and recreation", "travel"], "7210": ["Laundry and cleaning", "services"], "7216": ["Dry cleaners", "services"],
    "7230": ["Salons and barbers", "services"], "7298": ["Health and beauty spas", "services"],
    "7311": ["Advertising services", "services"], "7372": ["Software and IT services", "services"],
    "7399": ["Business services", "services"], "7512": ["Car rental", "travel"], "7523": ["Parking", "transport"],
    "7538": ["Car servicing and repair", "auto"], "7542": ["Car washes", "auto"], "7832": ["Cinemas", "entertainment"],
    "7841": ["Video rental and streaming", "entertainment"], "7922": ["Theatre and event tickets", "entertainment"],
    "7941": ["Sports clubs and stadiums", "entertainment"], "7991": ["Tourist attractions", "entertainment"],
    "7993": ["Video game arcades", "entertainment"], "7994": ["Gaming cafés", "entertainment"],
    "7995": ["Betting, lottery and casino", "gaming"], "7996": ["Amusement parks", "entertainment"],
    "7997": ["Gyms, clubs and memberships", "entertainment"], "7999": ["Recreation services", "entertainment"],
    "8011": ["Doctors", "health"], "8021": ["Dentists", "health"], "8042": ["Optometrists", "health"], "8043": ["Opticians", "health"],
    "8062": ["Hospitals", "health"], "8071": ["Medical and dental labs", "health"], "8099": ["Medical services", "health"],
    "8111": ["Legal services", "services"], "8211": ["Schools", "education"], "8220": ["Colleges and universities", "education"],
    "8241": ["Correspondence schools", "education"], "8244": ["Business and secretarial schools", "education"],
    "8249": ["Vocational and trade schools", "education"], "8299": ["Coaching and educational services", "education"],
    "8351": ["Child care", "education"], "8398": ["Charities", "services"], "8641": ["Associations and clubs", "services"],
    "8661": ["Religious organisations", "services"], "8699": ["Membership organisations", "services"],
    "8931": ["Accounting and bookkeeping", "services"], "8999": ["Professional services", "services"],
    "9211": ["Court costs", "government"], "9222": ["Fines", "government"], "9311": ["Tax payments", "government"],
    "9399": ["Government services", "government"], "9402": ["Postal services", "government"],
  };

  // A code from the QR becomes { code, name, group, groupLabel } or a "missing" record with the reason.
  function mccInfo(raw) {
    const code = String(raw || "").trim();
    if (!code) return { code: "", missing: "none" };
    if (code === "0000") return { code, missing: "placeholder" };
    if (!/^\d{4}$/.test(code)) return { code, missing: "invalid" };
    const n = Number(code);
    let entry = MCC[code];
    if (!entry && n >= 3000 && n <= 3350) entry = ["Airlines", "travel"];
    if (!entry && n >= 3351 && n <= 3441) entry = ["Car rental", "travel"];
    if (!entry && n >= 3501 && n <= 3999) entry = ["Hotels and resorts", "travel"];
    if (!entry) return { code, name: "Not in the standard list this page knows", group: "other", groupLabel: MCC_GROUPS.other, unknown: true };
    return { code, name: entry[0], group: entry[1], groupLabel: MCC_GROUPS[entry[1]] };
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
      mcc: mccInfo(p.mc),
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
      mcc: mccInfo(get("52")),
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

  return { parse, crc16, mccInfo };
});
