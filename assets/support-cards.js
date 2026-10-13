(() => {
  const contacts = window.SUPPORT_CONTACTS || {};

  const list = document.querySelector("#supportCards");
  const picker = document.querySelector("#supportPicker");
  const search = document.querySelector("#supportSearch");
  const empty = document.querySelector("#supportEmpty");
  const count = document.querySelector("#supportCount");
  if (!list) return;

  const order = ["Axis Bank", "Kotak Mahindra Bank", "SBI Card", "IDFC FIRST Bank", "ICICI Bank", "BOBCARD", "YES BANK", "HDFC Bank", "Punjab National Bank", "Indian Bank", "Bank of India", "Canara Bank", "OneCard", "RBL Bank", "IndusInd Bank", "Equitas Small Finance Bank", "AU Small Finance Bank", "HSBC India", "American Express", "SBM Bank India", "Unity Small Finance Bank", "CSB Bank"];
  const banks = [...order, ...Object.keys(contacts).filter(bank => !order.includes(bank))].filter(bank => contacts[bank]);
  const marks = {
    "Axis Bank":"utib", "Kotak Mahindra Bank":"kkbk", "SBI Card":"sbin",
    "IDFC FIRST Bank":"idfb", "ICICI Bank":"icic", "BOBCARD":"barb",
    "YES BANK":"yesb", "HDFC Bank":"hdfc", "Punjab National Bank":"punb",
    "Indian Bank":"idib", "Bank of India":"bkid", "Canara Bank":"cnrb",
    "RBL Bank":"ratn", "IndusInd Bank":"indb", "AU Small Finance Bank":"aubl",
    "HSBC India":"hsbc", "American Express":"americanexpress", "CSB Bank":"csbk",
    "Federal Bank":"fdrl", "Standard Chartered Bank":"scbl", "Union Bank of India":"ubin", "DBS Bank":"dbs", "OneCard":"onecard",
    "Equitas Small Finance Bank":"esfb.svg", "SBM Bank India":"sbm.png", "Unity Small Finance Bank":"unity-custom.png"
  };
  const shortNames = {
    "Axis Bank":"Axis", "Kotak Mahindra Bank":"Kotak", "IDFC FIRST Bank":"IDFC FIRST", "ICICI Bank":"ICICI",
    "HDFC Bank":"HDFC", "Punjab National Bank":"PNB", "Bank of India":"Bank of India", "Canara Bank":"Canara",
    "RBL Bank":"RBL", "IndusInd Bank":"IndusInd", "Equitas Small Finance Bank":"Equitas", "AU Small Finance Bank":"AU",
    "HSBC India":"HSBC", "American Express":"Amex", "SBM Bank India":"SBM", "Unity Small Finance Bank":"Unity",
    "CSB Bank":"CSB", "Federal Bank":"Federal", "Standard Chartered Bank":"Standard Chartered",
    "Union Bank of India":"Union Bank", "DBS Bank":"DBS"
  };
  const extraLabels = { "Intl":"International", "L4":"Level 4" };
  const level4Labels = { "SBI Card":"Customer service head", "American Express":"Nodal officer" };

  const esc = (value = "") => String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[char]));
  const arr = value => Array.isArray(value) ? value : value ? [value] : [];
  const slug = bank => "bank-" + bank.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const initials = name => name.replace(/Small Finance Bank/gi, "SFB").replace(/Bank/gi, "").trim().split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  const logoSrc = bank => {
    const mark = marks[bank];
    if (!mark) return "";
    return `assets/bank-logos/${/\.(svg|png)$/.test(mark) ? mark : `${mark}.svg`}`;
  };
  const logo = (bank, cls) => {
    const src = logoSrc(bank);
    return `<span class="${cls}" aria-hidden="true">${src ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async">` : ""}<span class="sp-logo-fallback"${src ? " hidden" : ""}>${esc(initials(bank))}</span></span>`;
  };

  const icons = {
    phone: '<svg class="sp-row-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>',
    mail: '<svg class="sp-row-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>',
    copy: '<span class="sp-copy-icons" aria-hidden="true"><svg class="sp-icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="13" height="13" x="8" y="8" rx="2.5"/><path d="M4 16V5a2 2 0 0 1 2-2h11"/></svg><svg class="sp-icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>',
    chevron: '<svg class="sp-chevron" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    external: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>'
  };

  function getCounts(entry) {
    const numbers = arr(entry.care).length + arr(entry.helplineExtras).reduce((total, item) => total + arr(item.values).length, 0);
    const emails = [entry.l1Email, entry.l2Email, entry.l3Email, entry.l4Email].reduce((total, values) => total + arr(values).length, 0)
      + [...arr(entry.l1Extras), ...arr(entry.extras)].reduce((total, item) => total + arr(item.emails).length, 0);
    return { numbers, emails };
  }
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  function meta(entry) {
    const { numbers, emails } = getCounts(entry);
    return [numbers ? plural(numbers, "number") : "", emails ? plural(emails, "email") : ""].filter(Boolean).join(", ");
  }

  function row(value, kind) {
    const href = kind === "phone" ? `tel:${String(value).replace(/[^\d+]/g, "")}` : `mailto:${value}`;
    const shown = kind === "email"
      ? (() => {
          const [local = "", ...rest] = String(value).split("@");
          return `${esc(local).replace(/([.\-_])/g, "$1<wbr>")}@<wbr>${esc(rest.join("@"))}`;
        })()
      : esc(value);
    const noun = kind === "phone" ? "phone number" : "email address";
    return `<li class="sp-row">
      <a class="sp-row-link" href="${esc(href)}">${icons[kind === "phone" ? "phone" : "mail"]}<span class="sp-row-value">${shown}</span></a>
      <button class="sp-copy" type="button" data-copy="${esc(value)}" aria-label="Copy ${noun} ${esc(value)}">${icons.copy}</button>
    </li>`;
  }
  const rows = (values, kind) => arr(values).length ? `<ul class="sp-rows">${arr(values).map(value => row(value, kind)).join("")}</ul>` : "";
  const labelled = (label, values, kind) => arr(values).length
    ? `<div class="sp-subgroup"><p class="sp-sublabel">${esc(extraLabels[label] || label)}</p>${rows(values, kind)}</div>` : "";
  const notPublished = '<p class="sp-missing">Not published by the bank</p>';

  function step(n, title, body, modifier = "") {
    return `<li class="sp-step${modifier}"><span class="sp-step-num" aria-hidden="true">${n}</span>
      <div class="sp-step-body"><h4 class="sp-step-title"><span class="sr-only">Step ${n}: </span>${title}</h4>${body}</div></li>`;
  }

  function bankCard(bank) {
    const entry = contacts[bank] || {};
    const { numbers, emails } = getCounts(entry);
    let body;
    if (!numbers && !emails) {
      body = '<p class="sp-missing">Details are being verified. Check back soon.</p>';
    } else {
      const call = [rows(entry.care, "phone"), ...arr(entry.helplineExtras).map(item => labelled(item.label, item.values, "phone"))].join("");
      const level3Extras = arr(entry.extras).filter(item => item.label !== "L4");
      const level4 = [...arr(entry.l4Email), ...arr(entry.extras).filter(item => item.label === "L4").flatMap(item => arr(item.emails))];
      const steps = [
        step(1, "Customer care", [rows(entry.l1Email, "email"), ...arr(entry.l1Extras).map(item => labelled(item.label, item.emails, "email"))].join("") || notPublished),
        step(2, bank === "IDFC FIRST Bank" ? "Regional nodal officer" : "Nodal officer", rows(entry.l2Email, "email") || notPublished),
        step(3, "Principal nodal officer", [rows(entry.l3Email, "email"), ...level3Extras.map(item => labelled(item.label, item.emails, "email"))].join("") || notPublished)
      ];
      if (level4.length) steps.push(step(4, esc(level4Labels[bank] || "Senior escalation"), rows(level4, "email")));
      const rbiN = steps.length + 1;
      steps.push(step(rbiN, "RBI Ombudsman",
        `<p class="sp-step-note">If ${esc(shortNames[bank] || bank)} rejects your written complaint or doesn’t reply within 30 days.</p>
         <a class="sp-rbi-link" href="https://cms.rbi.org.in" target="_blank" rel="noopener noreferrer">File on cms.rbi.org.in${icons.external}<span class="sr-only"> (opens in a new tab)</span></a>`, " sp-step-rbi"));
      body = `<section class="sp-call" aria-label="Phone numbers for ${esc(bank)}">
          <h3 class="sp-col-title">Call</h3>${call || notPublished}
        </section>
        <section class="sp-write" aria-label="Complaint emails for ${esc(bank)}">
          <h3 class="sp-col-title">Write, in this order</h3>
          <ol class="sp-steps">${steps.join("")}</ol>
        </section>`;
    }
    return `<details class="sp-bank" id="${slug(bank)}" data-bank="${esc(bank)}">
      <summary class="sp-bank-summary">
        ${logo(bank, "sp-bank-logo")}
        <span class="sp-bank-name"><strong>${esc(bank)}</strong><span>${esc(meta(entry))}</span></span>
        ${icons.chevron}
      </summary>
      <div class="sp-bank-body">${body}</div>
    </details>`;
  }

  function attachLogoFallbacks(scope) {
    scope.querySelectorAll("img").forEach(img => img.addEventListener("error", () => {
      img.hidden = true;
      const fallback = img.nextElementSibling;
      if (fallback) fallback.hidden = false;
    }, { once: true }));
  }

  /* ---------- Logo picker ---------- */
  if (picker) {
    picker.innerHTML = banks.map(bank => `<li><a class="sp-pick" href="#${slug(bank)}" data-bank="${esc(bank)}">
        ${logo(bank, "sp-pick-logo")}<span class="sp-pick-name">${esc(shortNames[bank] || bank)}</span>
      </a></li>`).join("");
    attachLogoFallbacks(picker);
  }

  /* ---------- Directory ---------- */
  const open = new Set();
  list.addEventListener("toggle", event => {
    const card = event.target;
    if (!(card instanceof HTMLDetailsElement)) return;
    if (card.open) open.add(card.dataset.bank); else open.delete(card.dataset.bank);
  }, true);

  const matches = (bank, query) => !query || bank.toLowerCase().includes(query)
    || (shortNames[bank] || "").toLowerCase().includes(query)
    || JSON.stringify(contacts[bank] || {}).toLowerCase().includes(query);

  function render() {
    const query = (search?.value || "").trim().toLowerCase();
    const shown = banks.filter(bank => matches(bank, query));
    list.innerHTML = shown.map(bankCard).join("");
    const autoOpen = query && shown.length <= 3;
    list.querySelectorAll(".sp-bank").forEach(card => { card.open = autoOpen || open.has(card.dataset.bank); });
    if (count) count.textContent = query ? `${shown.length} of ${banks.length} banks` : `${banks.length} banks`;
    if (empty) empty.hidden = shown.length > 0;
    attachLogoFallbacks(list);
  }

  function readQuery() { return new URLSearchParams(window.location.search).get("q") || ""; }
  function writeQuery(value) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("q", value); else url.searchParams.delete("q");
    history.replaceState(null, "", url);
  }

  if (search) search.value = readQuery();
  search?.addEventListener("input", () => { writeQuery(search.value.trim()); render(); });
  window.addEventListener("popstate", () => { if (search) search.value = readQuery(); render(); });
  render();

  /* Jump to a bank from the picker or a #bank-… link. */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function openBank(id, smooth = true) {
    let card = document.getElementById(id);
    if (!card && search?.value) { search.value = ""; writeQuery(""); render(); card = document.getElementById(id); }
    if (!card) return;
    card.open = true;
    open.add(card.dataset.bank);
    const summary = card.querySelector("summary");
    card.scrollIntoView({ behavior: smooth && !reduceMotion.matches ? "smooth" : "auto", block: "start" });
    summary?.focus({ preventScroll: true });
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

  /* ---------- Copy buttons ---------- */
  const announcement = document.createElement("div");
  announcement.className = "sr-only";
  announcement.setAttribute("role", "status");
  list.after(announcement);
  list.addEventListener("click", async event => {
    const button = event.target.closest(".sp-copy");
    if (!button) return;
    const value = button.dataset.copy;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const input = document.createElement("textarea");
        input.value = value;
        document.body.append(input);
        input.select();
        const ok = document.execCommand("copy");
        input.remove();
        if (!ok) throw new Error("Copy failed");
      }
      announcement.textContent = `Copied ${value}`;
      button.classList.add("is-copied");
      setTimeout(() => button.classList.remove("is-copied"), 1400);
    } catch {
      announcement.textContent = "Couldn’t copy. Select the text to copy it instead.";
    }
  });
})();
