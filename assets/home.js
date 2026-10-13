// Homepage: live counts and one search across banks, cards, reviews and tools.
(() => {
  const cards = window.PORTFOLIO_DATA?.cards || [];
  const contacts = window.SUPPORT_CONTACTS || {};
  const supportBanks = Object.keys(contacts);

  /* ---------- Live counts ---------- */
  const counts = {
    "cards": cards.length,
    "card-banks": new Set(cards.map(card => card.bank)).size,
    "support-banks": supportBanks.length,
    "support-banks-rest": Math.max(supportBanks.length - 7, 0)
  };
  document.querySelectorAll("[data-count]").forEach(el => {
    const value = counts[el.dataset.count];
    if (value) el.textContent = el.dataset.countFormat === "tens-plus" && value >= 10
      ? `${Math.floor(value / 10) * 10}+`
      : String(value);
  });

  /* ---------- Search index ---------- */
  const input = document.querySelector("#homeSearch");
  const panel = document.querySelector("#homeResults");
  const status = document.querySelector("#homeSearchStatus");
  if (!input || !panel) return;

  const arr = value => Array.isArray(value) ? value : value ? [value] : [];
  const esc = (value = "") => String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
  const slug = bank => "bank-" + bank.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const shortNames = {
    "Axis Bank":"Axis", "Kotak Mahindra Bank":"Kotak", "IDFC FIRST Bank":"IDFC", "ICICI Bank":"ICICI", "HDFC Bank":"HDFC",
    "Punjab National Bank":"PNB", "Bank of India":"BOI", "Canara Bank":"Canara", "RBL Bank":"RBL", "IndusInd Bank":"IndusInd",
    "Equitas Small Finance Bank":"Equitas", "AU Small Finance Bank":"AU", "HSBC India":"HSBC", "American Express":"Amex",
    "SBM Bank India":"SBM", "Unity Small Finance Bank":"Unity", "CSB Bank":"CSB", "Federal Bank":"Federal",
    "Standard Chartered Bank":"Standard Chartered", "Union Bank of India":"Union Bank", "DBS Bank":"DBS", "BOBCARD":"Bank of Baroda"
  };
  const marks = {
    "Axis Bank":"utib.svg", "Kotak Mahindra Bank":"kkbk.svg", "SBI Card":"sbin.svg", "IDFC FIRST Bank":"idfb.svg", "ICICI Bank":"icic.svg",
    "BOBCARD":"barb.svg", "YES BANK":"yesb.svg", "HDFC Bank":"hdfc.svg", "Punjab National Bank":"punb.svg", "Indian Bank":"idib.svg",
    "Bank of India":"bkid.svg", "Canara Bank":"cnrb.svg", "RBL Bank":"ratn.svg", "IndusInd Bank":"indb.svg", "AU Small Finance Bank":"aubl.svg",
    "HSBC India":"hsbc.svg", "American Express":"americanexpress.svg", "CSB Bank":"csbk.svg", "Federal Bank":"fdrl.svg",
    "Standard Chartered Bank":"scbl.svg", "Union Bank of India":"ubin.svg", "DBS Bank":"dbs.svg", "OneCard":"onecard.svg",
    "Equitas Small Finance Bank":"esfb.svg", "SBM Bank India":"sbm.png", "Unity Small Finance Bank":"unity-custom.png"
  };
  const digits = value => String(value).replace(/\D/g, "");

  const items = [];
  // Tools
  [
    { title: "Bank support directory", sub: "Helplines and complaint emails for every bank", href: "https://avhishek.in/bank-support", words: "support helpline customer care complaint grievance nodal email directory" },
    { title: "Complaint escalation guide", sub: "Customer care, nodal officer, principal nodal officer, RBI", href: "https://avhishek.in/bank-support#how-to-escalate", words: "escalate escalation complaint rbi ombudsman cms nodal principal" }
  ].forEach(tool => items.push({ group: "Tools", ...tool, hay: `${tool.title} ${tool.words}`.toLowerCase() }));

  // Pages
  [
    { title: "My card collection", sub: "Every card Abhishek holds, grouped by bank", href: "https://cards.avhishek.in/", words: "cards collection portfolio stack ltf lifetime free" },
    { title: "Card reviews", sub: "All reviews", href: "https://avhishek.in/card-reviews", words: "reviews review" },
    { title: "Disclaimer and affiliate disclosure", sub: "How this site makes money", href: "https://avhishek.in/disclaimer", words: "disclaimer affiliate privacy disclosure" }
  ].forEach(page => items.push({ group: "Pages", ...page, hay: `${page.title} ${page.words}`.toLowerCase() }));

  // Reviews
  [
    { title: "Slice Business Credit Card", sub: "Launching December 2026, waitlist open", href: "https://avhishek.in/card-reviews/slice-business-credit-card", words: "slice business sole proprietor cashback forex lifetime free visa rupay" },
    { title: "Eternal SBI Credit Card", sub: "Pre-launch preview", href: "https://avhishek.in/card-reviews/eternal-sbi-card", words: "eternal sbi zomato blinkit district" },
    { title: "HSBC Live+ Credit Card", sub: "Review: 10% cashback, ₹1,200 cap", href: "https://avhishek.in/card-reviews/hsbc-live-plus", words: "hsbc live plus live+ cashback" }
  ].forEach(review => items.push({ group: "Reviews", ...review, hay: `${review.title} ${review.words}`.toLowerCase() }));

  // Banks (support contacts)
  supportBanks.forEach(bank => {
    const entry = contacts[bank] || {};
    const numbers = [...arr(entry.care), ...arr(entry.helplineExtras).flatMap(item => arr(item.values))];
    const emails = [entry.l1Email, entry.l2Email, entry.l3Email, entry.l4Email].flatMap(arr)
      .concat([...arr(entry.l1Extras), ...arr(entry.extras)].flatMap(item => arr(item.emails)));
    items.push({
      group: "Bank support",
      title: bank,
      sub: numbers[0] ? `Helpline ${numbers[0]}` : "Complaint emails",
      href: `https://avhishek.in/bank-support#${slug(bank)}`,
      logo: marks[bank] ? `assets/bank-logos/${marks[bank]}` : "",
      numbers,
      hay: `${bank} ${shortNames[bank] || ""} helpline support customer care nodal ${emails.join(" ")}`.toLowerCase()
    });
  });

  // Cards in the collection
  cards.forEach(card => {
    const label = card.bank === "BOBCARD" ? "BOBCARD" : (shortNames[card.bank] || card.bank.replace(/ Bank$/, ""));
    const name = `${label} ${card.card}`;
    const fee = card.annualFee === "LTF" ? "Lifetime free" : card.annualFee || "";
    items.push({
      group: "My cards",
      title: name,
      sub: [card.network, fee, card.rewardType].filter(Boolean).join(", "),
      href: `https://cards.avhishek.in/?q=${encodeURIComponent(card.card)}`,
      logo: marks[card.bank] ? `assets/bank-logos/${marks[card.bank]}` : "",
      hay: `${card.bank} ${shortNames[card.bank] || ""} ${card.card} ${card.network || ""} ${card.rewardType || ""} ${fee} ${arr(card.bestFor).join(" ")}`.toLowerCase()
    });
  });

  const groupOrder = ["Bank support", "My cards", "Reviews", "Tools", "Pages"];
  const perGroup = 4;

  function search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/);
    const qDigits = digits(q);
    const scored = [];
    for (const item of items) {
      let matchedNumber = "";
      if (qDigits.length >= 3 && item.numbers) {
        matchedNumber = item.numbers.find(n => digits(n).includes(qDigits)) || "";
      }
      const textHit = tokens.every(t => item.hay.includes(t));
      if (!textHit && !matchedNumber) continue;
      const title = item.title.toLowerCase();
      let score = 0;
      if (title.startsWith(q)) score += 6;
      else if (title.includes(q)) score += 4;
      if (tokens.every(t => title.includes(t))) score += 2;
      if (matchedNumber) score += 3;
      if (item.group === "Tools") score += 1;   // generic words ("nodal", "complaint") lead to the guide first
      scored.push({ ...item, score, sub: matchedNumber ? `Helpline ${matchedNumber}` : item.sub });
    }
    scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
    // Groups follow their best match; ties keep the default order.
    return groupOrder.map((group, index) => {
      const list = scored.filter(i => i.group === group).slice(0, perGroup);
      return { group, items: list, best: list.length ? list[0].score : -1, index };
    }).filter(g => g.items.length).sort((a, b) => b.best - a.best || a.index - b.index);
  }

  /* ---------- Combobox ---------- */
  let flat = [];
  let active = -1;
  const icon = {
    "Tools": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    "Pages": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    "Reviews": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>'
  };

  function render() {
    const query = input.value;
    const groups = search(query);
    flat = [];
    active = -1;
    if (!query.trim()) { close(); return; }
    if (!groups.length) {
      panel.innerHTML = `<p class="hm-noresult">Nothing matches “${esc(query.trim())}”. Try a bank name like “HDFC” or a card like “Millennia”.</p>`;
      open();
      if (status) status.textContent = "No results";
      return;
    }
    let html = "";
    let n = 0;
    groups.forEach(({ group, items: list }) => {
      html += `<div class="hm-group" role="group" aria-label="${esc(group)}"><p class="hm-group-label" aria-hidden="true">${esc(group)}</p>`;
      list.forEach(item => {
        const id = `hm-opt-${n++}`;
        flat.push({ id, href: item.href });
        const media = item.logo
          ? `<span class="hm-opt-logo"><img src="${esc(item.logo)}" alt="" loading="lazy"></span>`
          : `<span class="hm-opt-icon">${icon[group] || icon.Tools}</span>`;
        html += `<a class="hm-opt" id="${id}" role="option" aria-selected="false" href="${esc(item.href)}" tabindex="-1">
          ${media}<span class="hm-opt-text"><span class="hm-opt-title">${esc(item.title)}</span><span class="hm-opt-sub">${esc(item.sub)}</span></span>
        </a>`;
      });
      html += "</div>";
    });
    panel.innerHTML = html;
    open();
    const total = flat.length;
    if (status) status.textContent = `${total} result${total === 1 ? "" : "s"}. Use the up and down arrows to choose.`;
  }

  function open() { panel.hidden = false; input.setAttribute("aria-expanded", "true"); }
  function close() {
    panel.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    active = -1;
  }
  function setActive(index) {
    if (!flat.length) return;
    active = (index + flat.length) % flat.length;
    panel.querySelectorAll(".hm-opt").forEach(el => el.setAttribute("aria-selected", "false"));
    const el = document.getElementById(flat[active].id);
    el?.setAttribute("aria-selected", "true");
    el?.scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", flat[active].id);
  }

  input.addEventListener("input", render);
  input.addEventListener("focus", () => { if (input.value.trim()) render(); });
  input.addEventListener("keydown", event => {
    if (event.key === "ArrowDown") { event.preventDefault(); if (panel.hidden) render(); setActive(active + 1); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive(active - 1); }
    else if (event.key === "Enter") {
      const target = flat[active >= 0 ? active : 0];
      if (target) { event.preventDefault(); window.location.href = target.href; }
    } else if (event.key === "Escape") {
      if (!panel.hidden) { event.preventDefault(); close(); } else { input.value = ""; }
    }
  });
  document.addEventListener("pointerdown", event => {
    if (!event.target.closest(".hm-search")) close();
  });
  panel.addEventListener("pointermove", event => {
    const opt = event.target.closest(".hm-opt");
    if (!opt) return;
    const index = flat.findIndex(f => f.id === opt.id);
    if (index !== active) setActive(index);
  });

  // "Try" chips fill the search.
  document.querySelectorAll(".hm-try-chip").forEach(chip => chip.addEventListener("click", () => {
    input.value = chip.dataset.query || "";
    input.focus();
    render();
  }));

  // Press "/" anywhere to jump to the search (unless typing in a field).
  document.addEventListener("keydown", event => {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
    event.preventDefault();
    input.focus();
  });
})();
