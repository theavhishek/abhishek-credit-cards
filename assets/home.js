// Hero card field (PartyLabs hero layout): the card faces float at five depths around the copy.
// Each breakpoint has its own hand-placed layout, [x%, y%, depth 0..1, rotation°]; the nearest
// spots take the first cards in the markup. On arrival the cards fly out from the headline,
// nearest first; on a desktop mouse they shift with the pointer by depth. Reduced motion keeps
// the field still.
(() => {
  const field = document.querySelector("[data-hm-field]");
  const hero = field?.closest(".hm-hero");
  if (!field || !hero) return;
  const cards = [...field.querySelectorAll(".hm-fc")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const LAYOUTS = {
    desktop: { u: 0.092, max: 150, spots: [
      [7, 18, 0.9, -10], [93, 20, 0.95, 10], [12, 62, 1, 7], [89, 64, 0.85, -8], [20, 36, 0.6, 12],
      [81, 40, 0.65, -12], [5, 88, 0.75, -6], [96, 86, 0.7, 9], [22, 85, 0.5, -14], [79, 88, 0.5, 12],
      [26, 9, 0.4, -8], [73, 8, 0.4, 8], [2, 42, 0.42, 6], [98, 46, 0.45, -6], [38, 19, 0.26, -6],
      [62, 18, 0.26, 8], [16, 4, 0.28, 10], [85, 3, 0.3, -10], [36, 97, 0.26, 6], [63, 98, 0.26, -8], [50, 2, 0.22, 4],
      [1, 70, 0.34, -8], [99, 70, 0.34, 8]
    ] },
    tablet: { u: 0.15, max: 140, spots: [
      [10, 13, 0.9, -10], [90, 14, 0.85, 12], [8, 86, 0.85, 10], [91, 85, 0.9, -10], [30, 7, 0.45, 8],
      [70, 8, 0.5, -8], [3, 50, 0.5, 6], [97, 52, 0.5, -8], [28, 94, 0.45, -6], [72, 95, 0.45, 8],
      [50, 3, 0.3, -4], [50, 99, 0.3, 6], [18, 30, 0.3, 10], [82, 32, 0.3, -12]
    ] },
    mobile: { u: 0.27, max: 130, spots: [
      [14, 9, 0.85, -10], [86, 10, 0.9, 10], [50, 5, 0.4, 6], [32, 13, 0.3, -8], [68, 14, 0.3, 8],
      [13, 92, 0.85, 10], [86, 91, 0.8, -10], [50, 96, 0.4, -6], [32, 88, 0.3, 8], [68, 87, 0.3, -8]
    ] }
  };
  const pick = (w, h) => (w < 640 ? "mobile" : w < 1024 || h > w * 1.05 ? "tablet" : "desktop");

  let current = "";
  let first = true;
  const place = () => {
    const w = field.clientWidth;
    const h = field.clientHeight;
    const name = pick(w, h);
    const L = LAYOUTS[name];
    field.style.setProperty("--unit", `${(Math.min(w * L.u, L.max) * Math.max(0.72, Math.min(1.1, h / 860))).toFixed(1)}px`);
    if (name === current) return;
    current = name;
    // nearest spots get the first (best) cards
    const order = L.spots.map((s, i) => i).sort((a, b) => L.spots[b][2] - L.spots[a][2]);
    cards.forEach((card, i) => {
      const spot = L.spots[order[i]];
      card.hidden = !spot;
      if (!spot) return;
      const [x, y, d, r] = spot;
      const set = (k, v) => card.style.setProperty(k, v);
      set("--x", `${x}%`); set("--y", `${y}%`); set("--d", d); set("--r", `${r}deg`);
      set("--o", (0.28 + d * 0.72).toFixed(2));
      set("--b", finePointer && d < 0.6 ? `${((0.6 - d) * 6).toFixed(1)}px` : "0px");
      set("--s", (0.55 + d * 0.5).toFixed(2));
      set("--z", Math.round(d * 10));
      set("--dur", `${7 + (i % 5) * 1.3}s`);
      set("--delay", `-${(i * 0.7).toFixed(1)}s`);
      set("--amp", `${(4 + d * 7).toFixed(1)}px`);
      set("--w", `calc(var(--unit) * ${((0.55 + d * 0.65) * 0.78).toFixed(3)})`);
      card.classList.toggle("is-near", d > 0.65);
      card.dataset.dist = Math.hypot(x - 50, (y - 50) * 1.3);
    });
    field.classList.add("is-ready");
    if (reduce) return;
    // fly out from the headline into place, nearest the headline first
    const shown = cards.filter(c => !c.hidden).sort((a, b) => a.dataset.dist - b.dataset.dist);
    shown.forEach((card, n) => {
      const x = parseFloat(card.style.getPropertyValue("--x"));
      const y = parseFloat(card.style.getPropertyValue("--y"));
      const dx = ((50 - x) * 0.6 * w / 100) * 0.35;
      const dy = ((50 - y) * 0.6 * h / 100) * 0.35;
      card.querySelector(".hm-fc-in").animate([
        { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.55)`, filter: finePointer ? "blur(10px)" : "none" },
        { opacity: 1, transform: "none", filter: "none" }
      ], { duration: first ? 1400 : 800, delay: (first ? 350 : 0) + n * 35, easing: EASE, fill: "backwards" });
    });
    first = false;
  };
  place();
  let t = 0;
  new ResizeObserver(() => { clearTimeout(t); t = setTimeout(place, 120); }).observe(field);

  // pointer parallax: one rAF loop easing toward the pointer, asleep when settled or off screen
  if (reduce || !finePointer) return;
  let tx = 0, ty = 0, mx = 0, my = 0, raf = 0, visible = true;
  const loop = () => {
    mx += (tx - mx) * 0.06;
    my += (ty - my) * 0.06;
    field.style.setProperty("--mx", mx.toFixed(4));
    field.style.setProperty("--my", my.toFixed(4));
    raf = Math.abs(tx - mx) + Math.abs(ty - my) > 0.0005 ? requestAnimationFrame(loop) : 0;
  };
  const wake = () => { if (!raf && visible) raf = requestAnimationFrame(loop); };
  addEventListener("pointermove", e => {
    const r = field.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5;
    ty = (e.clientY - r.top) / r.height - 0.5;
    wake();
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { tx = 0; ty = 0; wake(); });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake(); }).observe(hero);
})();

// Homepage: live counts and one search across banks, cards, reviews and tools.
(() => {
  const cards = window.PORTFOLIO_DATA?.cards || [];
  const contacts = window.SUPPORT_CONTACTS || {};
  const supportBanks = Object.keys(contacts);
  const payMethods = window.PAY_METHODS || {};

  /* ---------- Live counts ---------- */
  const counts = {
    "cards": cards.length,
    "card-banks": new Set(cards.map(card => card.bank)).size,
    "support-banks": supportBanks.length,
    "support-banks-rest": Math.max(supportBanks.length - 7, 0),
    "pay-banks": Object.keys(payMethods).length
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
    { title: "Pay your credit card bill", sub: "NEFT, IMPS and UPI details for every bank", href: "https://avhishek.in/pay-credit-card-bill", words: "pay payment bill neft imps rtgs upi ifsc billdesk bbps bharat connect transfer" },
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

  // Bill payment details
  Object.entries(payMethods).forEach(([bank, entry]) => {
    const fields = (entry.methods || []).flatMap(m => m.fields || []);
    const ifsc = fields.find(f => f.label === "IFSC");
    const upi = fields.find(f => f.label === "UPI ID");
    const upiText = upi ? upi.pattern.map(p => typeof p === "string" ? p : "…").join("").replace(/…+/g, "…") : "";
    const sub = ifsc ? `IFSC ${ifsc.value}${upi ? ` · UPI ${upiText}` : ""}` : upi ? `UPI ${upiText}` : "How to pay";
    items.push({
      group: "Pay bill",
      title: bank,
      sub,
      href: `https://avhishek.in/pay-credit-card-bill#${slug(bank)}`,
      logo: marks[bank] ? `assets/bank-logos/${marks[bank]}` : "",
      hay: `${bank} ${shortNames[bank] || ""} pay payment bill neft imps upi ifsc ${fields.map(f => f.value || "").join(" ")} ${upiText}`.toLowerCase()
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

  const groupOrder = ["Bank support", "Pay bill", "My cards", "Reviews", "Tools", "Pages"];
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

// Latest reviews: arrow buttons scroll the row by one card; they show only when the row overflows.
(() => {
  const row = document.getElementById("hm-reviews");
  const wrap = document.querySelector(".hm-scroll-btns");
  if (!row || !wrap) return;
  const [prev, next] = wrap.querySelectorAll(".hm-scroll-btn");
  const step = () => {
    const card = row.querySelector("li");
    return card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(row).columnGap || "0") : row.clientWidth;
  };
  const sync = () => {
    const max = row.scrollWidth - row.clientWidth;
    wrap.hidden = max <= 2;
    prev.disabled = row.scrollLeft <= 2;
    next.disabled = row.scrollLeft >= max - 2;
  };
  [prev, next].forEach(button => button.addEventListener("click", () => {
    row.scrollBy({ left: Number(button.dataset.dir) * step() });
  }));
  row.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  sync();
})();
