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

  // Current SBI Card escalation contacts.
  if (contacts["SBI Card"]) {
    contacts["SBI Card"].l4Email = ["CustomerServiceHead@sbicard.com"];
    delete contacts["SBI Card"].extras;
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

  function getCounts(entry) {
    const numbers = arr(entry.care).length + arr(entry.helplineExtras).reduce((total, group) => total + arr(group.values).length, 0);
    const emails = [entry.l1Email, entry.l2Email, entry.l3Email, entry.l4Email].reduce((total, values) => total + arr(values).length, 0)
      + [...arr(entry.l1Extras), ...arr(entry.extras)].reduce((total, group) => total + arr(group.emails).length, 0);
    return { numbers, emails };
  }

  function contactCount(entry) {
    const { numbers, emails } = getCounts(entry);
    if (numbers > 0 && emails === 0) {
      return `${numbers} ${numbers === 1 ? "number" : "numbers"}`;
    }
    if (numbers === 0 && emails > 0) {
      return `${emails} ${emails === 1 ? "email" : "emails"}`;
    }
    return `${numbers} ${numbers === 1 ? "number" : "numbers"} · ${emails} ${emails === 1 ? "email" : "emails"}`;
  }

  const emailHrefOverrides = {
    "nodal@bobcard.co.in":"nodal@bobcard.co.in",
    "pno@bobcard.co.in":"pno@bobcard.co.in"
  };
  const copyMarkup = `<span class="copy-icon-wrap" aria-hidden="true"><svg class="icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><svg class="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>`;
  function chip(value, kind) {
    const target = kind === "email" ? (emailHrefOverrides[value] || value) : value;
    const href = kind === "phone" ? `tel:${String(value).replace(/[^\d+]/g, "")}` : `mailto:${target}`;
    const titleAttr = kind === "email" ? ` title="${esc(value)}"` : "";
    const displayText = kind === "email" ? esc(value).replace(/@/g, "@<wbr>").replace(/\./g, ".<wbr>") : esc(value);
    return `<span class="support-contact-chip">
      <a href="${esc(href)}"${titleAttr}>${displayText}</a>
      <button class="support-copy" type="button" data-copy="${esc(value)}" aria-label="Copy ${kind === "phone" ? "phone number" : "email address"} ${esc(value)}" title="Copy ${esc(value)}">${copyMarkup}</button>
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
    const { numbers, emails } = getCounts(entry);

    let content = "";
    if (numbers === 0 && emails === 0) {
      content = `<div class="support-empty-placeholder">Details being verified — check back soon.</div>`;
    } else {
      const sections = [];
      const phone = [group(entry.care, "phone"), ...arr(entry.helplineExtras).map(item => group(item.values, "phone", item.label))];
      if (numbers > 0) {
        sections.push(section("Helpline", phone));
      }
      if (emails > 0) {
        const level1 = [group(entry.l1Email, "email"), ...arr(entry.l1Extras).map(item => group(item.emails, "email", item.label))];
        const level2Label = bank === "IDFC FIRST Bank" ? "Level 2 · Regional Nodal Officer" : "Level 2 · Nodal officer";
        const level3 = [group(entry.l3Email, "email"), ...arr(entry.extras).map(item => group(item.emails, "email", item.label))];
        sections.push(section("Level 1 · Customer care", level1));
        sections.push(section(level2Label, [group(entry.l2Email, "email")]));
        sections.push(section("Level 3 · Principal nodal officer", level3));
        if (arr(entry.l4Email).length) {
          const level4Label = bank === "SBI Card" ? "Level 4 · Customer service head" : "Level 4";
          sections.push(section(level4Label, [group(entry.l4Email, "email")]));
        }
      }
      content = sections.join("");
    }

    return `<details class="support-bank-card" data-bank="${esc(bank)}" ${open ? "open" : ""}>
      <summary class="support-bank-summary">
        ${logo(bank)}
        <span class="support-bank-copy"><strong>${esc(bank)}</strong><span>${contactCount(entry)}</span></span>
        <svg class="support-chevron" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <div class="support-bank-content">
        ${content}
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
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get("q") || sessionStorage.getItem("support_search_query") || "";
  if (initialQuery && search) {
    search.value = initialQuery;
  }

  search?.addEventListener("input", () => {
    const val = (search.value || "").trim();
    if (val) {
      sessionStorage.setItem("support_search_query", val);
    } else {
      sessionStorage.removeItem("support_search_query");
    }
    render();
  });
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