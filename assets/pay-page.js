/* Credit card bill payment page (avhishek.in/pay-credit-card-bill).
   Renders the bank picker and one card per bank from window.PAY_METHODS.
   The same render() output is baked into the HTML at build time, so the page
   works without JavaScript; this script adds search, copy and jump links. */
(() => {
  const DATA = window.PAY_METHODS || {};
  const CHECKED = window.PAY_CHECKED || "";
  const isNode = typeof document === "undefined";

  const order = ["Axis Bank", "Kotak Mahindra Bank", "SBI Card", "IDFC FIRST Bank", "ICICI Bank", "BOBCARD", "YES BANK", "HDFC Bank",
    "Punjab National Bank", "Indian Bank", "Bank of India", "Canara Bank", "OneCard", "RBL Bank", "IndusInd Bank",
    "Equitas Small Finance Bank", "AU Small Finance Bank", "HSBC India", "American Express", "SBM Bank India",
    "Unity Small Finance Bank", "CSB Bank", "Federal Bank", "Standard Chartered Bank", "Union Bank of India", "DBS Bank"];
  const banks = [...order.filter(b => DATA[b]), ...Object.keys(DATA).filter(b => !order.includes(b))];

  const marks = {
    "Axis Bank":"utib.svg", "Kotak Mahindra Bank":"kkbk.svg", "SBI Card":"sbin.svg", "IDFC FIRST Bank":"idfb.svg", "ICICI Bank":"icic.svg",
    "BOBCARD":"barb.svg", "YES BANK":"yesb.svg", "HDFC Bank":"hdfc.svg", "Punjab National Bank":"punb.svg", "Indian Bank":"idib.svg",
    "Bank of India":"bkid.svg", "Canara Bank":"cnrb.svg", "RBL Bank":"ratn.svg", "IndusInd Bank":"indb.svg", "AU Small Finance Bank":"aubl.svg",
    "HSBC India":"hsbc.svg", "American Express":"americanexpress.svg", "CSB Bank":"csbk.svg", "Federal Bank":"fdrl.svg",
    "Standard Chartered Bank":"scbl.svg", "Union Bank of India":"ubin.svg", "DBS Bank":"dbs.svg", "OneCard":"onecard.svg",
    "Equitas Small Finance Bank":"esfb.svg", "SBM Bank India":"sbm.png", "Unity Small Finance Bank":"unity-custom.png"
  };
  const shortNames = {
    "Axis Bank":"Axis", "Kotak Mahindra Bank":"Kotak", "IDFC FIRST Bank":"IDFC FIRST", "ICICI Bank":"ICICI",
    "HDFC Bank":"HDFC", "Punjab National Bank":"PNB", "Canara Bank":"Canara", "RBL Bank":"RBL", "IndusInd Bank":"IndusInd",
    "Equitas Small Finance Bank":"Equitas", "AU Small Finance Bank":"AU", "HSBC India":"HSBC", "American Express":"Amex",
    "SBM Bank India":"SBM", "Unity Small Finance Bank":"Unity", "CSB Bank":"CSB", "Federal Bank":"Federal",
    "Standard Chartered Bank":"Standard Chartered", "Union Bank of India":"Union Bank", "DBS Bank":"DBS"
  };

  const esc = (v = "") => String(v).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const slug = bank => "bank-" + bank.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const initials = name => name.replace(/Small Finance Bank/gi, "SFB").replace(/Bank/gi, "").trim().split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase();
  const logo = (bank, cls) => {
    const mark = marks[bank];
    return `<span class="${cls}" aria-hidden="true">${mark ? `<img src="/assets/bank-logos/${esc(mark)}" alt="" loading="lazy" decoding="async">` : ""}<span class="sp-logo-fallback"${mark ? " hidden" : ""}>${esc(initials(bank))}</span></span>`;
  };
  const fmtDate = iso => {
    const d = new Date(iso + "T00:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const svg = (body, w = 18) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const kindIcon = {
    upi: svg('<path d="m9 4 6 8-6 8"/><path d="m14 4 6 8-6 8"/>'),
    imps: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>'),
    neft: svg('<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>'),
    bbps: svg('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/>'),
    gateway: svg('<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M7 14h4"/>'),
    app: svg('<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18h2"/>'),
    other: svg('<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M10 21v-6h4v6"/>')
  };
  const kindLabel = { upi: "UPI", imps: "IMPS", neft: "NEFT", bbps: "BBPS", gateway: "Online", app: "Bank app", other: "Offline" };
  const copyIcons = '<span class="sp-copy-icons" aria-hidden="true"><svg class="sp-icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="13" height="13" x="8" y="8" rx="2.5"/><path d="M4 16V5a2 2 0 0 1 2-2h11"/></svg><svg class="sp-icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>';
  const chevron = '<svg class="sp-chevron" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
  const external = svg('<path d="M7 17 17 7M8 7h9v9"/>', 14);
  const clock = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 14);
  const warn = svg('<path d="M12 3 2.5 20h19Z"/><path d="M12 10v4.5M12 17.5h.01"/>');
  const VERIFY = "Before paying, verify the recipient details displayed by your UPI application. If the payee cannot be verified or appears incorrect, do not proceed. Use the bank’s official payment page or contact the bank for confirmation.";
  const info = svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>');

  /* ---------- Markup ---------- */
  function fieldValue(f, bank) {
    if (f.pattern) {
      const parts = f.pattern.map(p => typeof p === "string"
        ? `<span class="py-lit">${esc(p)}</span>`
        : `<span class="py-ph">${esc(p.ph)}</span>`).join("");
      return `<span class="py-pattern">${parts}</span>`
        + (f.example ? `<span class="py-example">For example <span class="py-mono">${esc(f.example)}</span></span>` : "")
        + (f.note ? `<span class="py-example">${esc(f.note)}</span>` : "")
        + (f.keys ? `<ul class="py-keys">${f.keys.map(([ph, text]) => `<li><span class="py-ph">${esc(ph)}</span><span>${esc(text)}</span></li>`).join("")}</ul>` : "");
    }
    if (f.value) {
      const mono = f.label === "IFSC" ? " py-mono" : "";
      return `<span class="py-value-row"><span class="py-value${mono}">${esc(f.value)}</span>`
        + (f.copy ? `<button class="sp-copy py-copy" type="button" data-copy="${esc(f.value)}" aria-label="Copy ${esc(shortNames[bank] || bank)} ${esc(f.label)} ${esc(f.value)}">${copyIcons}</button>` : "")
        + `</span>`;
    }
    return `<span class="py-text">${esc(f.text)}</span>`;
  }

  const NEG = /doesn.t publish|doesn.t take|not accepted/i;
  const KEYWORDS = ["upi", "imps", "neft", "bbps"];
  const hasFields = m => (m.fields || []).length > 0;
  /* A method matches a keyword by its kind, or by naming it in its title or text (unless it says it isn't offered). */
  const methodMatches = (m, k) => m.kind === k
    || (new RegExp("\\b" + k + "\\b", "i").test(`${m.title} ${m.how || ""}`) && !NEG.test(m.how || ""));
  const bankMatches = (e, k) => (k === "bbps" && (e.bbps || []).length > 0) || (e.methods || []).some(m => methodMatches(m, k));

  const timeChip = m => m.time
    ? `<p class="py-time${m.speed ? ` is-${m.speed}` : ""}">${clock}<span>${esc(m.time)}</span></p>` : "";
  const extras = m => `${m.note ? `<p class="py-note">${info}<span>${esc(m.note)}</span></p>` : ""}${m.verify ? `<p class="py-verify">${warn}<span>${esc(VERIFY)}</span></p>` : ""}${m.src ? `<p class="py-source"><a href="${esc(m.src.url)}" target="_blank" rel="noopener noreferrer">Official source: ${esc(m.src.label)}${external}<span class="sr-only"> (opens in a new tab)</span></a></p>` : ""}`;

  function method(m, bank, hit) {
    const fields = `<dl class="py-fields">${m.fields.map(f => `<div class="py-field"><dt>${esc(f.label)}</dt><dd>${fieldValue(f, bank)}</dd></div>`).join("")}</dl>`;
    return `<li class="py-method py-kind-${esc(m.kind)}${hit ? " is-match" : ""}">
      <div class="py-method-head">
        <span class="py-kind" aria-hidden="true">${kindIcon[m.kind] || kindIcon.other}</span>
        <h3 class="py-method-title">${esc(m.title)}</h3>
        ${timeChip(m)}
      </div>
      ${m.how ? `<p class="py-how">${esc(m.how)}</p>` : ""}
      ${fields}${extras(m)}
    </li>`;
  }

  function way(m, hit) {
    return `<li class="py-way py-kind-${esc(m.kind)}${hit ? " is-match" : ""}">
      <span class="py-kind" aria-hidden="true">${kindIcon[m.kind] || kindIcon.other}</span>
      <div class="py-way-main">
        <h3 class="py-method-title">${esc(m.title)}</h3>
        ${m.how ? `<p class="py-how">${esc(m.how)}</p>` : ""}
        ${extras(m)}
      </div>
      ${timeChip(m)}
    </li>`;
  }

  /* The one line of detail shown in a search result: the UPI ID format, the IFSC, or the method name. */
  function preview(e, k) {
    if (k === "bbps") return (e.bbps || []).map(b => typeof b === "string" ? b : b.n).join(" · ");
    const m = (e.methods || []).find(x => methodMatches(x, k) && hasFields(x)) || (e.methods || []).find(x => methodMatches(x, k));
    if (!m) return "";
    const want = k === "upi" ? /upi/i : /ifsc/i;
    const f = (m.fields || []).find(x => want.test(x.label)) || (m.fields || [])[0];
    if (f && f.pattern) return `${f.label}: ` + f.pattern.map(x => typeof x === "string" ? x : `‹${x.ph}›`).join("");
    if (f && f.value) return `${f.label}: ${f.value}`;
    const t = m.how ? `${m.title}: ${m.how}` : m.title;
    return t.length > 120 ? t.slice(0, 117).replace(/\s+\S*$/, "") + "…" : t;
  }
  const detailed = (e, k) => k === "bbps" || (e.methods || []).some(m => methodMatches(m, k) && hasFields(m));

  function summaryMeta(entry) {
    const kinds = [...new Set((entry.methods || []).map(m => m.kind))];
    const transfer = ["upi", "imps", "neft", "bbps"].filter(k => kinds.includes(k) && (entry.methods.some(m => m.kind === k && (m.fields || []).length) || k === "bbps"));
    if (transfer.length) return transfer.map(k => kindLabel[k]).join(" · ") + " details";
    if ((entry.methods || []).length) return "Bank channels only";
    return "Check your statement";
  }

  const billerPill = b => {
    const o = typeof b === "string" ? { n: b } : b;
    return `<li class="py-biller"><span>${esc(o.n)}</span>${o.by ? `<small>${esc(o.by)} card</small>` : ""}</li>`;
  };
  const bbpsOthersHTML = () => (window.PAY_BBPS_OTHERS || []).map(billerPill).join("");
  const bbpsRow = e => (e.bbps || []).length
    ? `<div class="py-live-row">
        <p class="py-live-title"><span class="py-live-icon" aria-hidden="true">${kindIcon.bbps}</span><strong>Live on BBPS</strong><span>Search for ${(e.bbps).length > 1 ? "any of these" : "this"} in PhonePe, Google Pay or CRED</span></p>
        <ul class="py-billers">${e.bbps.map(billerPill).join("")}</ul>
      </div>` : "";

  function bankCard(bank, kinds = []) {
    const e = DATA[bank] || {};
    const notes = [
      e.caution ? `<p class="py-callout is-caution">${warn}<span>${esc(e.caution)}</span></p>` : "",
      e.note ? `<p class="py-note">${info}<span>${esc(e.note)}</span></p>` : "",
      e.older ? `<p class="py-older">${esc(e.older)}</p>` : ""
    ].join("");
    const hit = m => kinds.length > 0 && kinds.every(k => methodMatches(m, k));
    const ordered = [...(e.methods || [])].sort((x, y) => hit(y) - hit(x));
    const detail = ordered.filter(hasFields), ways = ordered.filter(m => !hasFields(m));
    const list = (detail.length ? `<ul class="py-methods">${detail.map(m => method(m, bank, hit(m))).join("")}</ul>` : "")
      + (ways.length ? `<ul class="py-ways">${ways.map(m => way(m, hit(m))).join("")}</ul>` : "");
    const sources = (e.sources || []).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}${external}<span class="sr-only"> (opens in a new tab)</span></a>`).join("");
    const line = kinds.length ? preview(e, kinds[0]) : "";
    return `<details class="sp-bank py-bank" id="${slug(bank)}" data-bank="${esc(bank)}">
      <summary class="sp-bank-summary">
        ${logo(bank, "sp-bank-logo")}
        <span class="sp-bank-name"><strong>${esc(bank)}</strong>${line ? `<span class="py-preview">${esc(line)}</span>` : `<span class="py-meta"><span>${esc(summaryMeta(e))}</span>${(e.bbps || []).length ? '<span class="py-live">Live on BBPS</span>' : ""}</span>`}</span>
        ${chevron}
      </summary>
      <div class="sp-bank-body py-body">
        ${bbpsRow(e)}
        ${notes}
        ${list}
        <div class="py-foot">
          <p class="py-source"><span>Source, checked ${esc(fmtDate(CHECKED))}:</span> ${sources}</p>
          <a class="py-help" href="/bank-support#${slug(bank)}">Payment not showing? ${esc(shortNames[bank] || bank)} support</a>
        </div>
      </div>
    </details>`;
  }

  const pickerHTML = () => banks.map(bank => `<li><a class="sp-pick" href="#${slug(bank)}" data-bank="${esc(bank)}">
        ${logo(bank, "sp-pick-logo")}<span class="sp-pick-name">${esc(shortNames[bank] || bank)}</span>
      </a></li>`).join("");
  const listHTML = (subset = banks, kinds = []) => subset.map(b => bankCard(b, kinds)).join("");

  if (isNode) {
    module.exports = { pickerHTML, listHTML, banks, bbpsOthersHTML };
    return;
  }

  /* ---------- Interactions ---------- */
  const list = document.querySelector("#payCards");
  const picker = document.querySelector("#payPicker");
  const search = document.querySelector("#paySearch");
  const empty = document.querySelector("#payEmpty");
  const count = document.querySelector("#payCount");
  if (!list) return;

  function attachLogoFallbacks(scope) {
    scope.querySelectorAll("img").forEach(img => {
      const fail = () => { img.hidden = true; const fb = img.nextElementSibling; if (fb) fb.hidden = false; };
      if (img.complete && !img.naturalWidth) fail(); else img.addEventListener("error", fail, { once: true });
    });
  }

  const open = new Set();
  list.addEventListener("toggle", event => {
    const card = event.target;
    if (!(card instanceof HTMLDetailsElement)) return;
    if (card.open) open.add(card.dataset.bank); else open.delete(card.dataset.bank);
  }, true);

  const norm = s => s.toLowerCase().replace(/\s+/g, " ");
  const haystack = Object.fromEntries(banks.map(b => [b, norm(`${b} ${shortNames[b] || ""} ${JSON.stringify(DATA[b] || {})}`)]));
  const parse = q => {
    const tokens = q.split(" ").filter(Boolean);
    return { kinds: tokens.filter(t => KEYWORDS.includes(t)), words: tokens.filter(t => !KEYWORDS.includes(t)) };
  };
  const matches = (bank, { kinds, words }) => kinds.every(k => bankMatches(DATA[bank] || {}, k)) && words.every(t => haystack[bank].includes(t));
  const chips = [...document.querySelectorAll(".py-fchip")];

  function render() {
    const q = norm((search?.value || "").trim());
    const parsed = parse(q);
    const shown = banks.filter(b => matches(b, parsed));
    if (parsed.kinds.length) shown.sort((x, y) => detailed(DATA[y], parsed.kinds[0]) - detailed(DATA[x], parsed.kinds[0]));
    list.innerHTML = listHTML(shown, parsed.kinds);
    const autoOpen = q && shown.length <= 3;
    list.querySelectorAll(".sp-bank").forEach(card => { card.open = autoOpen || open.has(card.dataset.bank); });
    if (count) count.textContent = q ? `${shown.length} of ${banks.length} banks` : `${banks.length} banks`;
    if (empty) empty.hidden = shown.length > 0;
    chips.forEach(c => c.setAttribute("aria-pressed", String(q === c.dataset.q)));
    attachLogoFallbacks(list);
  }

  const readQuery = () => new URLSearchParams(window.location.search).get("q") || "";
  function writeQuery(value) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("q", value); else url.searchParams.delete("q");
    history.replaceState(null, "", url);
  }

  if (picker) attachLogoFallbacks(picker);
  if (search) {
    search.value = readQuery();
    search.addEventListener("input", () => { writeQuery(search.value.trim()); render(); });
  }
  chips.forEach(c => c.addEventListener("click", () => {
    const next = search.value.trim().toLowerCase() === c.dataset.q ? "" : c.dataset.q;
    search.value = next; writeQuery(next); render();
  }));
  if (search?.value) render(); else attachLogoFallbacks(list);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function openBank(id, smooth = true) {
    let card = document.getElementById(id);
    if (!card && search?.value) { search.value = ""; writeQuery(""); render(); card = document.getElementById(id); }
    if (!card) return;
    card.open = true;
    open.add(card.dataset.bank);
    card.scrollIntoView({ behavior: smooth && !reduceMotion.matches ? "smooth" : "auto", block: "start" });
    card.querySelector("summary")?.focus({ preventScroll: true });
    card.classList.remove("is-flash");
    void card.offsetWidth;
    card.classList.add("is-flash");
  }
  picker?.addEventListener("click", event => {
    const link = event.target.closest(".sp-pick");
    if (!link) return;
    event.preventDefault();
    const id = link.getAttribute("href").slice(1);
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
    openBank(id);
  });
  if (window.location.hash.startsWith("#bank-")) openBank(window.location.hash.slice(1), false);

  /* Copy */
  const announce = document.createElement("div");
  announce.className = "sr-only";
  announce.setAttribute("role", "status");
  list.after(announce);
  list.addEventListener("click", async event => {
    const button = event.target.closest(".sp-copy");
    if (!button) return;
    const value = button.dataset.copy;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const t = document.createElement("textarea");
        t.value = value; document.body.append(t); t.select();
        const ok = document.execCommand("copy"); t.remove();
        if (!ok) throw new Error("copy failed");
      }
      announce.textContent = `Copied ${value}`;
      button.classList.add("is-copied");
      setTimeout(() => button.classList.remove("is-copied"), 1400);
    } catch {
      announce.textContent = "Couldn’t copy. Select the text to copy it instead.";
    }
  });
})();
