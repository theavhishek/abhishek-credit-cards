/* Credit card UPI ID generator (avhishek.in/credit-card-upi-id).
   Builds the UPI ID a bank publishes for card bill payments from window.PAY_METHODS,
   the same data as the pay page, so the two can't disagree. Only UPI methods with a
   `pattern` qualify. Everything runs in the browser: nothing typed here is stored,
   sent or put in the URL.
   The bank picker and the "other banks" list are baked into the HTML by
   `pnpm build:upi` (scripts/upi/bake.mjs) from pickerHTML()/othersHTML() below. */
(() => {
  const DATA = window.PAY_METHODS || {};
  const isNode = typeof document === "undefined";

  const order = ["ICICI Bank", "Axis Bank", "Equitas Small Finance Bank", "AU Small Finance Bank"];
  const marks = {
    "Axis Bank":"utib.svg", "Kotak Mahindra Bank":"kkbk.svg", "SBI Card":"sbin.svg", "IDFC FIRST Bank":"idfb.svg", "ICICI Bank":"icic.svg",
    "BOBCARD":"barb.svg", "YES BANK":"yesb.svg", "HDFC Bank":"hdfc.svg", "Punjab National Bank":"punb.svg", "Indian Bank":"idib.svg",
    "Bank of India":"bkid.svg", "Canara Bank":"cnrb.svg", "RBL Bank":"ratn.svg", "IndusInd Bank":"indb.svg", "AU Small Finance Bank":"aubl.svg",
    "HSBC India":"hsbc.svg", "American Express":"americanexpress.svg", "CSB Bank":"csbk.svg", "Federal Bank":"fdrl.svg",
    "Standard Chartered Bank":"scbl.svg", "Union Bank of India":"ubin.svg", "DBS Bank":"dbs.svg", "OneCard":"onecard.svg",
    "Equitas Small Finance Bank":"esfb.svg", "SBM Bank India":"sbm.png", "Unity Small Finance Bank":"unity-custom.png"
  };
  const shortNames = {
    "Axis Bank":"Axis Bank", "Kotak Mahindra Bank":"Kotak", "IDFC FIRST Bank":"IDFC FIRST", "ICICI Bank":"ICICI Bank",
    "HDFC Bank":"HDFC", "Punjab National Bank":"PNB", "Canara Bank":"Canara", "RBL Bank":"RBL", "IndusInd Bank":"IndusInd",
    "Equitas Small Finance Bank":"Equitas Bank", "AU Small Finance Bank":"AU Bank", "HSBC India":"HSBC", "American Express":"Amex",
    "SBM Bank India":"SBM", "Unity Small Finance Bank":"Unity", "CSB Bank":"CSB", "Federal Bank":"Federal",
    "Standard Chartered Bank":"Standard Chartered", "Union Bank of India":"Union Bank", "DBS Bank":"DBS"
  };

  const esc = (v = "") => String(v).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const slug = bank => bank.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const short = bank => shortNames[bank] || bank;
  const fmtDate = iso => {
    const d = new Date(iso + "T00:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  // A placeholder in a pattern becomes one input: the mobile number, the last N
  // card digits, or the full N-digit card number.
  const slotOf = ph => {
    if (/mobile/i.test(ph)) return { key: "mobile", len: 10, label: "Mobile number" };
    const last = ph.match(/last (\d+)/i);
    if (last) return { key: "card", len: +last[1], partial: true, label: `Last ${last[1]} digits` };
    const full = ph.match(/(\d+)-digit/);
    if (full) return { key: "card", len: +full[1], partial: false, label: `${full[1]}-digit card number` };
    return null;
  };

  const upiBanks = () => {
    const names = order.filter(b => DATA[b]);
    return names.flatMap(name => {
      const bank = DATA[name];
      const method = (bank.methods || []).find(m => m.kind === "upi" && m.fields && m.fields[0] && m.fields[0].pattern);
      if (!method) return [];
      const field = method.fields[0];
      const parts = field.pattern.map(p => typeof p === "string" ? { fixed: p } : { ph: p.ph, ...slotOf(p.ph) });
      if (parts.some(p => !p.fixed && !p.key)) return [];
      return [{ name, slug: slug(name), method, field, parts, keys: Object.fromEntries(field.keys || []), checked: bank.checked || window.PAY_CHECKED || "" }];
    });
  };
  const otherBanks = () => {
    const hasPublishedUpi = bank => (bank.methods || []).some(m => m.kind === "upi" && m.fields?.[0]?.pattern);
    return Object.keys(DATA).filter(b => !hasPublishedUpi(DATA[b])).sort((a, b) => short(a).localeCompare(short(b)));
  };

  const logo = bank => `<span class="ui-logo" aria-hidden="true"><img src="/assets/bank-logos/${esc(marks[bank] || "")}" alt="" width="28" height="28" decoding="async"></span>`;

  function pickerHTML() {
    return upiBanks().map((b, i) => `<label class="ui-pick">
        <input type="radio" name="bank" value="${esc(b.slug)}"${i === 0 ? " checked" : ""}>
        ${logo(b.name)}<span class="ui-pick-name">${esc(short(b.name))}</span>
      </label>`).join("");
  }
  function othersHTML() {
    return otherBanks().map(b => `<li><a href="/pay-credit-card-bill#bank-${esc(slug(b))}">${marks[b] ? `<img src="/assets/bank-logos/${esc(marks[b])}" alt="" width="20" height="20" loading="lazy" decoding="async">` : ""}${esc(short(b))}</a></li>`).join("");
  }

  if (isNode) {
    module.exports = { pickerHTML, othersHTML, upiBanks };
    return;
  }

  /* ---------- Browser ---------- */
  const $ = id => document.getElementById(id);
  const form = $("uiForm");
  if (!form) return;
  const banks = upiBanks();
  const bySlug = Object.fromEntries(banks.map(b => [b.slug, b]));
  const els = {
    mobileField: $("mobileField"), mobile: $("mobile"), mobileHint: $("mobileHint"), mobileErr: $("mobile-err"),
    cardField: $("cardField"), card: $("card"), cardLabel: $("cardLabel"), cardHint: $("cardHint"), cardErr: $("card-err"),
    amount: $("amount"), amountErr: $("amount-err"),
    vpa: $("vpa"), vpaState: $("vpaState"), bankName: $("bankName"), bankLogo: $("bankLogo"),
    qr: $("qr"), copy: $("btnCopy"), pay: $("btnPay"), save: $("btnSave"), status: $("status"),
    facts: $("bankFacts")
  };
  const digits = v => String(v || "").replace(/\D/g, "");
  const luhn = num => {
    let sum = 0;
    for (let i = 0; i < num.length; i++) {
      let d = +num[num.length - 1 - i];
      if (i % 2) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return sum % 10 === 0;
  };

  let bank = banks[0];
  let ready = "";

  function setBank(next, focus) {
    bank = next;
    const slots = bank.parts.filter(p => p.key);
    const mobile = slots.find(p => p.key === "mobile");
    const card = slots.find(p => p.key === "card");
    els.mobileField.hidden = !mobile;
    els.cardField.hidden = !card;
    if (card) {
      els.cardLabel.textContent = card.partial ? `Last ${card.len} digits of your card` : `Your ${card.len}-digit card number`;
      els.card.placeholder = card.partial ? "0".repeat(card.len).replace(/0/g, "•") : (card.len === 15 ? "3XXX XXXXXX XXXXX" : "XXXX XXXX XXXX XXXX");
      els.cardHint.textContent = bank.keys[card.ph] || "";
    }
    if (mobile) els.mobileHint.textContent = bank.keys[mobile.ph] || "The mobile number registered with your card.";
    els.card.value = "";
    els.cardErr.textContent = "";
    els.card.closest(".ce-input").classList.remove("is-invalid");
    els.bankName.textContent = bank.name;
    els.bankLogo.src = `/assets/bank-logos/${marks[bank.name] || ""}`;
    renderFacts();
    update();
    if (focus) (mobile ? els.mobile : els.card).focus({ preventScroll: true });
  }

  function values() {
    const out = { mobile: "", card: "", trimmed: false };
    let m = digits(els.mobile.value);
    if (m.length === 12 && m.startsWith("91")) m = m.slice(2);
    if (m.length === 11 && m.startsWith("0")) m = m.slice(1);
    out.mobile = m;
    const slot = bank.parts.find(p => p.key === "card");
    let c = digits(els.card.value);
    if (slot && slot.partial && c.length > slot.len) { c = c.slice(-slot.len); out.trimmed = true; }
    out.card = c;
    return out;
  }

  function check(v) {
    const errs = { mobile: "", card: "" };
    for (const p of bank.parts) {
      if (p.key === "mobile" && v.mobile && v.mobile.length === 10 && !/^[6-9]/.test(v.mobile)) errs.mobile = "Indian mobile numbers start with 6, 7, 8 or 9.";
      if (p.key === "mobile" && v.mobile.length > 10) errs.mobile = "That’s more than 10 digits. Leave out +91 or 0 at the start.";
      if (p.key === "card" && !p.partial && v.card.length === p.len) {
        if (p.len === 15 && !/^3[47]/.test(v.card)) errs.card = "Amex card numbers start with 34 or 37.";
        else if (!luhn(v.card)) errs.card = "This number doesn’t look like a valid card number. Check for a typo.";
      }
      if (p.key === "card" && !p.partial && v.card.length > p.len) errs.card = `That’s more than ${p.len} digits.`;
    }
    return errs;
  }

  function update() {
    const v = values();
    const errs = check(v);
    els.mobileErr.textContent = errs.mobile;
    els.mobile.closest(".ce-input").classList.toggle("is-invalid", !!errs.mobile);
    els.cardErr.textContent = errs.card;
    els.card.closest(".ce-input").classList.toggle("is-invalid", !!errs.card);
    const slot = bank.parts.find(p => p.key === "card");
    if (slot && slot.partial) {
      els.cardHint.textContent = v.trimmed
        ? `Only the last ${slot.len} digits are used. The rest of your card number isn’t needed.`
        : (bank.keys[slot.ph] || "");
    }

    let complete = !errs.mobile && !errs.card;
    els.vpa.innerHTML = bank.parts.map(p => {
      if (p.fixed) return `<span class="ui-seg is-fixed">${esc(p.fixed)}</span>`;
      const got = v[p.key].slice(0, p.len);
      if (got.length < p.len) complete = false;
      const rest = "•".repeat(Math.max(0, p.len - got.length));
      return `<span class="ui-seg is-slot${got.length === p.len ? " is-full" : ""}" data-label="${esc(p.label)}"><span class="ui-typed">${esc(got)}</span><span class="ui-rest">${rest}</span></span>`;
    }).join("");

    const amount = parseAmount();
    if (amount === null) complete = false;
    const id = complete ? bank.parts.map(p => p.fixed || v[p.key]).join("") : "";
    ready = id;
    els.vpa.classList.toggle("is-ready", !!id);
    els.vpa.setAttribute("aria-label", id ? `UPI ID ${id}` : "UPI ID, not complete yet");
    const need = bank.parts.filter(p => p.key && v[p.key].length < p.len).map(p => p.key === "mobile" ? "your mobile number" : p.partial ? `the last ${p.len} card digits` : "your card number");
    els.vpaState.textContent = id ? "Ready to pay" : (errs.mobile || errs.card) ? "Check the highlighted field" : `Add ${need.join(" and ")}`;
    els.vpaState.dataset.state = id ? "ready" : (errs.mobile || errs.card) ? "error" : "pending";
    [els.copy, els.save].forEach(b => { b.disabled = !id; });
    if (id) {
      els.pay.href = payLink(id, amount);
      els.pay.removeAttribute("aria-disabled");
    } else {
      els.pay.removeAttribute("href");
      els.pay.setAttribute("aria-disabled", "true");
    }
    drawQr(id ? payLink(id, amount) : "");
  }

  function parseAmount() {
    const raw = els.amount.value.replace(/[,₹\s]/g, "");
    els.amount.closest(".ce-input").classList.remove("is-invalid");
    els.amountErr.textContent = "";
    if (!raw) return 0;
    const n = Number(raw);
    if (!isFinite(n) || n <= 0 || !/^\d+(\.\d{1,2})?$/.test(raw)) {
      els.amountErr.textContent = "Enter an amount in rupees, like 2500 or 2500.50.";
      els.amount.closest(".ce-input").classList.add("is-invalid");
      return null;
    }
    return n;
  }

  function payLink(id, amount) {
    const q = [`pa=${encodeURIComponent(id)}`, `pn=${encodeURIComponent(bank.name + " Credit Card")}`];
    if (amount) q.push(`am=${amount.toFixed(2)}`);
    q.push("cu=INR", `tn=${encodeURIComponent("Credit card bill")}`);
    return "upi://pay?" + q.join("&");
  }

  function drawQr(text) {
    els.qr.classList.toggle("is-empty", !text);
    if (!text || typeof window.qrcode !== "function") {
      els.qr.innerHTML = `<span class="ui-qr-empty">Your QR code appears here once the UPI ID is complete.</span>`;
      return;
    }
    const qr = window.qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    els.qr.innerHTML = `<svg viewBox="-3 -3 ${n + 6} ${n + 6}" role="img" aria-label="UPI QR code for ${esc(ready)}" shape-rendering="crispEdges"><rect x="-3" y="-3" width="${n + 6}" height="${n + 6}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }

  // Same steps for every bank (Abhishek's wording), rather than each bank's own "how" line.
  const HOW = "Copy this UPI ID or scan the QR code in any UPI app, like PhonePe, Google Pay, Paytm, CRED or BHIM. Check the payee details, then pay.";

  // UPI card payments usually post almost instantly in practice; Amex is the exception and keeps
  // its own stated time. Where a bank states a longer time, that wording is still shown below.
  const STATED_TIME_ONLY = ["American Express"];
  function postingTime(m, speedCls) {
    if (STATED_TIME_ONLY.includes(bank.name)) {
      return m.time ? `<li class="ui-fact"><span class="ui-fact-k">Posting time</span><span class="ui-time${speedCls}">${esc(m.time)}</span></li>` : "";
    }
    const stated = m.time && !/not stated|instant/i.test(m.time) ? `<span class="ui-fact-sub">${esc(bank.name)} states: ${esc(m.time)}</span>` : "";
    return `<li class="ui-fact"><span class="ui-fact-k">Posting time</span><span><span class="ui-time is-fast">Almost instant</span>${stated}</span></li>`;
  }

  function renderFacts() {
    const m = bank.method;
    const src = m.src;
    const speedCls = m.speed ? ` is-${m.speed}` : "";
    const verify = "Before you pay, check that your UPI app shows " + bank.name + " (or its card division) as the payee. If it shows anyone else, don’t pay.";
    els.facts.innerHTML = [
      postingTime(m, speedCls),
      `<li class="ui-fact"><span class="ui-fact-k">How</span><span>${esc(HOW)}</span></li>`,
      m.note ? `<li class="ui-fact"><span class="ui-fact-k">Bank’s note</span><span>${esc(m.note)}</span></li>` : "",
      `<li class="ui-fact is-warn"><span class="ui-fact-k">Payee check</span><span>${esc(verify)}</span></li>`,
      src ? `<li class="ui-fact"><span class="ui-fact-k">Source</span><span><a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer">${esc(src.label)}<span class="sr-only"> (opens in a new tab)</span></a>, checked ${esc(fmtDate(bank.checked))}</span></li>` : ""
    ].join("");
  }

  async function copyId() {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(ready);
    } catch (e) {
      const t = document.createElement("textarea");
      t.value = ready; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch (_) { /* nothing else to try */ }
      t.remove();
    }
    flash(els.copy, "Copied. Paste it into Pay to UPI ID in your app.");
  }

  function saveQr() {
    const svg = els.qr.querySelector("svg");
    if (!svg) return;
    const size = 720;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = size; c.height = size + 96;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, size, size);
      ctx.fillStyle = "#111"; ctx.textAlign = "center";
      ctx.font = "600 26px Geist, system-ui, sans-serif";
      ctx.fillText(bank.name + " credit card bill", size / 2, size + 34);
      ctx.font = "500 24px 'Geist Mono', ui-monospace, monospace";
      ctx.fillText(ready, size / 2, size + 74, size - 40);
      const a = document.createElement("a");
      a.download = `upi-${bank.slug}.png`;
      a.href = c.toDataURL("image/png");
      a.click();
      flash(els.save, "QR saved. It shows part of your card number, so keep it to yourself.");
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  }

  let flashTimer;
  function flash(btn, msg) {
    btn.classList.add("is-done");
    els.status.textContent = msg;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { btn.classList.remove("is-done"); els.status.textContent = ""; }, 2600);
  }

  // Keep only digits while typing; only rewrite the value when it changed, so the caret stays put.
  const clean = (input, max) => () => {
    const next = digits(input.value).slice(0, max);
    if (next !== input.value) input.value = next;
    update();
  };
  els.mobile.addEventListener("input", clean(els.mobile, 13));
  els.card.addEventListener("input", clean(els.card, 19));
  els.amount.addEventListener("input", update);
  form.addEventListener("change", e => {
    if (e.target.name === "bank" && bySlug[e.target.value]) {
      setBank(bySlug[e.target.value], false);
      history.replaceState(null, "", `?bank=${e.target.value}`);
    }
  });
  form.addEventListener("submit", e => { e.preventDefault(); copyId(); });
  els.copy.addEventListener("click", copyId);
  els.save.addEventListener("click", saveQr);
  els.pay.addEventListener("click", e => { if (!ready) e.preventDefault(); });

  // Opening a UPI link only does something on a phone with a UPI app.
  if (window.matchMedia("(pointer: coarse)").matches) els.pay.hidden = false;

  const wanted = new URLSearchParams(location.search).get("bank");
  const start = bySlug[wanted] || banks[0];
  const radio = form.querySelector(`input[name="bank"][value="${start.slug}"]`);
  if (radio) radio.checked = true;
  setBank(start, false);
})();
