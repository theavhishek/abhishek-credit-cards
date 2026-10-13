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
  const info = svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>');

  /* ---------- Markup ---------- */
  function fieldValue(f, bank) {
    if (f.pattern) {
      const parts = f.pattern.map(p => typeof p === "string"
        ? `<span class="py-lit">${esc(p)}</span>`
        : `<span class="py-ph">${esc(p.ph)}</span>`).join("");
      return `<span class="py-pattern">${parts}</span>`
        + (f.example ? `<span class="py-example">For example <span class="py-mono">${esc(f.example)}</span></span>` : "")
        + (f.note ? `<span class="py-example">${esc(f.note)}</span>` : "");
    }
    if (f.value) {
      const mono = f.label === "IFSC" ? " py-mono" : "";
      return `<span class="py-value-row"><span class="py-value${mono}">${esc(f.value)}</span>`
        + (f.copy ? `<button class="sp-copy py-copy" type="button" data-copy="${esc(f.value)}" aria-label="Copy ${esc(shortNames[bank] || bank)} ${esc(f.label)} ${esc(f.value)}">${copyIcons}</button>` : "")
        + `</span>`;
    }
    return `<span class="py-text">${esc(f.text)}</span>`;
  }

  function method(m, bank) {
    const fields = (m.fields || []).length
      ? `<dl class="py-fields">${m.fields.map(f => `<div class="py-field"><dt>${esc(f.label)}</dt><dd>${fieldValue(f, bank)}</dd></div>`).join("")}</dl>` : "";
    const time = m.time
      ? `<p class="py-time${m.speed ? ` is-${m.speed}` : ""}">${clock}<span>${esc(m.time)}</span></p>` : "";
    const wide = (m.fields || []).length ? " is-wide" : "";
    return `<li class="py-method py-kind-${esc(m.kind)}${wide}">
      <div class="py-method-head">
        <span class="py-kind" aria-hidden="true">${kindIcon[m.kind] || kindIcon.other}</span>
        <h3 class="py-method-title">${esc(m.title)}</h3>
      </div>
      ${m.how ? `<p class="py-how">${esc(m.how)}</p>` : ""}
      ${fields}
      ${time}
    </li>`;
  }

  function summaryMeta(entry) {
    const kinds = [...new Set((entry.methods || []).map(m => m.kind))];
    const transfer = ["upi", "imps", "neft", "bbps"].filter(k => kinds.includes(k) && (entry.methods.some(m => m.kind === k && (m.fields || []).length) || k === "bbps"));
    if (transfer.length) return transfer.map(k => kindLabel[k]).join(" · ") + " details";
    if ((entry.methods || []).length) return "Bank channels only";
    return "Check your statement";
  }

  function bankCard(bank) {
    const e = DATA[bank] || {};
    const notes = [
      e.caution ? `<p class="py-callout is-caution">${warn}<span>${esc(e.caution)}</span></p>` : "",
      e.note ? `<p class="py-callout">${info}<span>${esc(e.note)}</span></p>` : "",
      e.older ? `<p class="py-older">${esc(e.older)}</p>` : ""
    ].join("");
    const list = (e.methods || []).length ? `<ul class="py-methods">${e.methods.map(m => method(m, bank)).join("")}</ul>` : "";
    const sources = (e.sources || []).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}${external}<span class="sr-only"> (opens in a new tab)</span></a>`).join("");
    return `<details class="sp-bank py-bank" id="${slug(bank)}" data-bank="${esc(bank)}">
      <summary class="sp-bank-summary">
        ${logo(bank, "sp-bank-logo")}
        <span class="sp-bank-name"><strong>${esc(bank)}</strong><span>${esc(summaryMeta(e))}</span></span>
        ${chevron}
      </summary>
      <div class="sp-bank-body py-body">
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
  const listHTML = (subset = banks) => subset.map(bankCard).join("");

  if (isNode) {
    module.exports = { pickerHTML, listHTML, banks };
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
  const matches = (bank, q) => !q || q.split(" ").every(t => haystack[bank].includes(t));

  function render() {
    const q = norm((search?.value || "").trim());
    const shown = banks.filter(b => matches(b, q));
    list.innerHTML = listHTML(shown);
    const autoOpen = q && shown.length <= 2;
    list.querySelectorAll(".sp-bank").forEach(card => { card.open = autoOpen || open.has(card.dataset.bank); });
    if (count) count.textContent = q ? `${shown.length} of ${banks.length} banks` : `${banks.length} banks`;
    if (empty) empty.hidden = shown.length > 0;
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
