(() => {
  const contacts = window.SUPPORT_CONTACTS || {};

  // Current Axis Bank escalation contacts.
  if (contacts["Axis Bank"]) {
    contacts["Axis Bank"].l1Email = (contacts["Axis Bank"].l1Email || []).map(email =>
      email === "customer.services@axisbank.com" ? "email.services@axis.bank.in" : email
    );
    contacts["Axis Bank"].l3Email = (contacts["Axis Bank"].l3Email || []).map(email =>
      email.toLowerCase() === "pno@axisbank.com" ? "PNO@axis.bank.in" : email
    );
  }

  // Current IDFC FIRST Bank regional nodal contact.
  if (contacts["IDFC FIRST Bank"]) {
    contacts["IDFC FIRST Bank"].l2Email = ["RNO@idfcfirstbank.com"];
  }

  // Current ICICI Bank escalation contacts.
  if (contacts["ICICI Bank"]) {
    contacts["ICICI Bank"].l1Email = ["customer.care@icici.bank.in"];
    contacts["ICICI Bank"].l3Email = ["pno@icici.bank.in"];
    contacts["ICICI Bank"].extras = (contacts["ICICI Bank"].extras || [])
      .map(group => ({
        ...group,
        emails: (group.emails || []).filter(email => email.toLowerCase() !== "pno@icicibank.com")
      }))
      .filter(group => group.emails.length);
  }

  // Current BOBCARD escalation contacts.
  if (contacts["BOBCARD"]) {
    contacts["BOBCARD"].l1Email = ["crm@bobcard.co.in", "escalations@bobcard.co.in"];
    contacts["BOBCARD"].l2Email = ["nodal@bobcard.co.in"];
    contacts["BOBCARD"].l3Email = ["pno@bobcard.co.in"];
  }

  const list = document.querySelector("#supportCards");
  const search = document.querySelector("#supportSearch");
  const empty = document.querySelector("#supportEmpty");
  const count = document.querySelector("#supportCount");
  if (!list) return;

  const order = ["Axis Bank", "Kotak Mahindra Bank", "SBI Card", "IDFC FIRST Bank", "ICICI Bank", "BOBCARD", "YES BANK", "HDFC Bank", "Punjab National Bank", "Indian Bank", "Bank of India", "Canara Bank", "OneCard", "RBL Bank", "IndusInd Bank", "Equitas Small Finance Bank", "AU Small Finance Bank", "HSBC India", "American Express", "SBM Bank India", "Unity Small Finance Bank", "CSB Bank"];
  const banks = [...order, ...Object.keys(contacts).filter(bank => !order.includes(bank))];
  const marks = {
    "Axis Bank":"utib", "Kotak Mahindra Bank":"kkbk", "SBI Card":"sbin",
    "IDFC FIRST Bank":"idfb", "ICICI Bank":"icic", "BOBCARD":"barb",
    "YES BANK":"yesb", "HDFC Bank":"hdfc", "Punjab National Bank":"punb",
    "Indian Bank":"idib", "Bank of India":"bkid", "Canara Bank":"cnrb",
    "RBL Bank":"ratn", "IndusInd Bank":"indb", "AU Small Finance Bank":"aubl",
    "HSBC India":"hsbc", "American Express":"americanexpress", "CSB Bank":"csbk",
    "Federal Bank":"fdrl", "Standard Chartered Bank":"scbl", "Union Bank of India":"ubin", "DBS Bank":"dbs", "OneCard":"onecard"
  };
  const remoteMarks = {
    "Equitas Small Finance Bank":"equitasbank.com",
    "SBM Bank India":"sbmbank.co.in", "Unity Small Finance Bank":"theunitybank.com"
  };
  const esc = (value = "") => String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[char]));
  const arr = value => Array.isArray(value) ? value : value ? [value] : [];
  const initials = name => name.replace(/Small Finance Bank/gi, "SFB").replace(/Bank/gi, "").trim().split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();

  function logo(bank) {
    const local = marks[bank] ? `assets/bank-logos/${marks[bank]}.svg` : "";
    const remote = bank === "Equitas Small Finance Bank" ? "https://www.equitasbank.com/strapi-dev/uploads/Group_2_cad9c29024.svg" : window.BANK_LOGO_PNG?.[remoteMarks[bank]] || "";
    const src = local || remote;
    return `<span class="support-bank-logo">${src ? `<img class="support-bank-img" src="${esc(src)}" alt="" loading="lazy" decoding="async">` : ""}
      <span class="support-bank-fallback" ${src ? 'hidden' : ""} aria-hidden="true">${esc(initials(bank))}</span></span>`;
  }

  function contactCount(entry) {
    const numbers = arr(entry.care).length + arr(entry.helplineExtras).reduce((total, group) => total + arr(group.values).length, 0);
    const emails = [entry.l1Email, entry.l2Email, entry.l3Email].reduce((total, values) => total + arr(values).length, 0)
      + [...arr(entry.l1Extras), ...arr(entry.extras)].reduce((total, group) => total + arr(group.emails).length, 0);
    return `${numbers} ${numbers === 1 ? "number" : "numbers"} · ${emails} ${emails === 1 ? "email" : "emails"}`;
  }

  const emailHrefOverrides = {
    "nodal@bobcard.co.in":"nodal@bobcard.co.in",
    "pno@bobcard.co.in":"pno@bobcard.co.in"
  };
  const copyIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
  function chip(value, kind) {
    const target = kind === "email" ? (emailHrefOverrides[value] || value) : value;
    const href = kind === "phone" ? `tel:${String(value).replace(/[^\d+]/g, "")}` : `mailto:${target}`;
    return `<span class="support-contact-chip">
      <a href="${esc(href)}">${esc(value)}</a>
      <button class="support-copy" type="button" data-copy="${esc(value)}" aria-label="Copy ${kind === "phone" ? "phone number" : "email address"} ${esc(value)}" title="Copy ${esc(value)}">${copyIcon}</button>
    </span>`;
  }

  function group(values, kind, label = "") {
    const items = arr(values);
    if (!items.length) return "";
    return `<div class="support-contact-group">${label ? `<span class="support-group-label">${esc(label)}</span>` : ""}
      <div class="support-chip-row">${items.map(value => chip(value, kind)).join("")}</div></div>`;
  }
  function section(label, blocks) {
    const content = blocks.filter(Boolean).join("");
    return `<section class="support-contact-section"><h2>${label}</h2>
      ${content || '<span class="support-unlisted">Not listed</span>'}</section>`;
  }
  function bankCard(bank, open) {
    const entry = contacts[bank] || {};
    const phone = [group(entry.care, "phone"), ...arr(entry.helplineExtras).map(item => group(item.values, "phone", item.label))];
    const level1 = [group(entry.l1Email, "email"), ...arr(entry.l1Extras).map(item => group(item.emails, "email", item.label))];
    const level2Label = bank === "IDFC FIRST Bank" ? "Level 2 · Regional Nodal Officer" : "Level 2 · Nodal officer";
    const level3 = [group(entry.l3Email, "email"), ...arr(entry.extras).map(item => group(item.emails, "email", item.label))];
    return `<details class="support-bank-card" data-bank="${esc(bank)}" ${open ? "open" : ""}>
      <summary class="support-bank-summary">
        ${logo(bank)}
        <span class="support-bank-copy"><strong>${esc(bank)}</strong><span>${contactCount(entry)}</span></span>
        <svg class="support-chevron" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <div class="support-bank-content">
        ${section("Helpline", phone)}
        ${section("Level 1 · Customer care", level1)}
        ${section(level2Label, [group(entry.l2Email, "email")])}
        ${section("Level 3 · Principal nodal officer", level3)}
      </div>
    </details>`;
  }

  const expanded = new Set([banks[0]]);
  list.addEventListener("toggle", event => {
    const card = event.target;
    if (!(card instanceof HTMLDetailsElement)) return;
    if (card.open) expanded.add(card.dataset.bank);
    else expanded.delete(card.dataset.bank);
  }, true);

  function render() {
    const query = (search?.value || "").trim().toLowerCase();
    const filtered = banks.filter(bank => !query || bank.toLowerCase().includes(query) || JSON.stringify(contacts[bank] || {}).toLowerCase().includes(query));
    list.innerHTML = filtered.map(bank => bankCard(bank, !!query || expanded.has(bank))).join("");
    count.textContent = query ? `${filtered.length} of ${banks.length} banks` : `${banks.length} banks`;
    empty.hidden = filtered.length > 0;
    list.querySelectorAll(".support-bank-img").forEach(img => img.addEventListener("error", () => {
      img.hidden = true;
      img.nextElementSibling.hidden = false;
    }, { once: true }));
  }
  search?.addEventListener("input", render);
  render();

  const announcement = document.createElement("div");
  announcement.className = "sr-only";
  announcement.setAttribute("role", "status");
  list.after(announcement);
  list.addEventListener("click", async event => {
    const button = event.target.closest(".support-copy");
    if (!button) return;
    const value = button.dataset.copy;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const input = document.createElement("textarea");
        input.value = value;
        document.body.append(input);
        input.select();
        if (!document.execCommand("copy")) throw new Error("Copy failed");
        input.remove();
      }
      announcement.textContent = `Copied ${value}`;
      button.classList.add("copied");
      setTimeout(() => button.classList.remove("copied"), 1400);
    } catch {
      announcement.textContent = "Copy failed. Select the contact details to copy them.";
    }
  });
})();