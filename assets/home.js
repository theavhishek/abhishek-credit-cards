// Hero card field (PartyLabs hero layout): the card faces float at five depths around the copy.
// Each breakpoint has its own hand-placed layout, [x%, y%, depth 0..1, rotation°]; the nearest
// spots take the first cards in the markup. The spots are then settled for the actual screen:
// every card is kept clear of the copy, inside the hero and apart
// from its neighbours, and a card that can't fit is left out. On arrival the cards fly out from
// the headline, nearest first; on a desktop mouse they shift with the pointer by depth. Reduced
// motion keeps the field still.
(() => {
  const field = document.querySelector("[data-hm-field]");
  const hero = field?.closest(".hm-hero");
  const copy = hero?.querySelector(".hm-hero-copy");
  if (!field || !hero || !copy) return;
  const cards = [...field.querySelectorAll(".hm-fc")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const RATIO = 634 / 400;
  const LAYOUTS = {
    desktop: { u: 0.092, max: 150, spots: [
      [8, 26, 0.95, -9], [92, 28, 0.95, 9], [13, 72, 1, 7], [87, 72, 0.9, -8], [24, 48, 0.6, 11],
      [76, 50, 0.62, -11], [29, 14, 0.42, -7], [71, 12, 0.45, 7], [27, 86, 0.48, -12], [73, 88, 0.5, 12],
      [3, 50, 0.38, 6], [97, 52, 0.38, -6], [15, 8, 0.3, 10], [86, 7, 0.3, -10], [42, 9, 0.24, -5],
      [58, 92, 0.24, 6], [3, 94, 0.3, -8], [97, 94, 0.3, 8]
    ] },
    tablet: { u: 0.14, max: 130, spots: [
      [11, 12, 0.9, -9], [89, 14, 0.85, 10], [12, 88, 0.85, 9], [88, 87, 0.9, -9], [31, 16, 0.4, 7],
      [69, 8, 0.48, -7], [33, 85, 0.48, -6], [67, 93, 0.4, 7], [50, 10, 0.26, -4], [50, 90, 0.26, 5]
    ] },
    mobile: { u: 0.25, max: 112, spots: [
      [15, 11, 0.85, -9], [84, 12, 0.9, 9], [50, 8, 0.5, 4], [31, 17, 0.3, -7], [69, 18, 0.3, 8],
      [16, 90, 0.85, 8], [84, 89, 0.8, -9], [50, 93, 0.5, -4], [32, 84, 0.3, 7], [68, 84, 0.3, -7]
    ] }
  };
  const pick = (w, h) => (w < 640 ? "mobile" : w < 1024 || h > w * 1.05 ? "tablet" : "desktop");
  const sizeOf = d => (0.55 + d * 0.65) * 0.78; // card width in units

  // move the spots apart until no card touches the copy, the edges or a neighbour
  function settle(spots, w, h, unit) {
    const f = field.getBoundingClientRect();
    const pad = w < 640 ? 10 : 18;
    const blocks = [...copy.children].filter(el => el.offsetParent && !el.classList.contains("sr-only")).map(el => {
      const r = el.getBoundingClientRect();
      return { l: r.left - f.left - pad, t: r.top - f.top - pad, r: r.right - f.left + pad, b: r.bottom - f.top + pad };
    });
    const floor = h;
    const items = spots.map(([x, y, d, r]) => {
      const cw = unit * sizeOf(d), ch = cw * RATIO, a = Math.abs(r) * Math.PI / 180;
      const slack = 4 + d * 7 + (finePointer ? d * 12 : 0); // drift and parallax room
      return { x: x / 100 * w, y: y / 100 * h, d, hw: (cw * Math.cos(a) + ch * Math.sin(a)) / 2 + slack, hh: (cw * Math.sin(a) + ch * Math.cos(a)) / 2 + slack };
    });
    const gap = w < 640 ? 6 : 12;
    // a far card may tuck a little behind a much nearer one, the way the depth reads anyway
    const tuck = (a, c) => (Math.abs(a.d - c.d) >= 0.4 ? 0.72 : 1);
    for (let k = 0; k < 80; k++) {
      for (const c of items) {
        for (const b of blocks) {
          const ox = Math.min(c.x + c.hw, b.r) - Math.max(c.x - c.hw, b.l);
          const oy = Math.min(c.y + c.hh, b.b) - Math.max(c.y - c.hh, b.t);
          if (ox > 0 && oy > 0) {
            if (ox < oy) c.x += c.x < (b.l + b.r) / 2 ? -ox : ox;
            else c.y += c.y < (b.t + b.b) / 2 ? -oy : oy;
          }
        }
      }
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
        const a = items[i], c = items[j];
        const k2 = tuck(a, c);
        const ox = (a.hw + c.hw) * k2 + gap * (k2 === 1) - Math.abs(a.x - c.x);
        const oy = (a.hh + c.hh) * k2 + gap * (k2 === 1) - Math.abs(a.y - c.y);
        if (ox <= 0 || oy <= 0) continue;
        const wa = c.d / (a.d + c.d), wc = 1 - wa; // the nearer card moves less
        if (ox < oy) { const s = a.x < c.x ? -1 : 1; a.x += s * ox * wa; c.x -= s * ox * wc; }
        else { const s = a.y < c.y ? -1 : 1; a.y += s * oy * wa; c.y -= s * oy * wc; }
      }
      for (const c of items) {
        c.x = Math.min(Math.max(c.x, c.hw), w - c.hw);
        c.y = Math.min(Math.max(c.y, c.hh), floor - c.hh);
      }
    }
    // anything still sitting on the copy or a nearer card is left out
    return items.map((c, i) => {
      const hitsCopy = blocks.some(b => c.x + c.hw > b.l && c.x - c.hw < b.r && c.y + c.hh > b.t && c.y - c.hh < b.b);
      const hitsCard = items.some((o, j) => j !== i && o.d >= c.d && !o.out &&
        Math.abs(o.x - c.x) < (o.hw + c.hw) * tuck(o, c) - 2 && Math.abs(o.y - c.y) < (o.hh + c.hh) * tuck(o, c) - 2);
      c.out = hitsCopy || hitsCard || c.hh * 2 > floor;
      return c;
    });
  }

  let first = true;
  let lastKey = "";
  const place = () => {
    const w = field.clientWidth;
    const h = field.clientHeight;
    const key = `${w}x${h}`;
    if (key === lastKey) return;
    lastKey = key;
    const L = LAYOUTS[pick(w, h)];
    const unit = Math.min(w * L.u, L.max) * Math.max(0.72, Math.min(1.1, h / 860));
    field.style.setProperty("--unit", `${unit.toFixed(1)}px`);
    // nearest spots get the first (best) cards
    const spots = [...L.spots].sort((a, b) => b[2] - a[2]);
    // spots that fit this screen, nearest first; the cards fill them in order, so a spot that
    // can't fit drops the last card rather than one near the top of the list
    const fits = settle(spots, w, h, unit).map((s, i) => ({ ...s, spot: spots[i] })).filter(s => !s.out);
    cards.forEach((card, i) => {
      const s = fits[i];
      card.hidden = !s;
      if (card.hidden) return;
      const [, , d, r] = s.spot;
      const set = (k, v) => card.style.setProperty(k, v);
      set("--x", `${(s.x / w * 100).toFixed(2)}%`); set("--y", `${(s.y / h * 100).toFixed(2)}%`);
      set("--d", d); set("--r", `${r}deg`);
      set("--o", (0.6 + d * 0.4).toFixed(2));
      set("--b", finePointer && d < 0.35 ? `${((0.35 - d) * 6).toFixed(1)}px` : "0px");
      set("--s", (0.82 + d * 0.2).toFixed(2));
      set("--z", Math.round(d * 10));
      set("--dur", `${7 + (i % 5) * 1.3}s`);
      set("--delay", `-${(i * 0.7).toFixed(1)}s`);
      set("--amp", `${(4 + d * 7).toFixed(1)}px`);
      set("--w", `calc(var(--unit) * ${sizeOf(d).toFixed(3)})`);
      card.classList.toggle("is-near", d > 0.65);
      card.dataset.dist = Math.hypot(s.x / w * 100 - 50, (s.y / h * 100 - 50) * 1.3);
    });
    field.classList.add("is-ready");
    if (reduce || !first) return;
    first = false;
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
      ], { duration: 1400, delay: 350 + n * 35, easing: EASE, fill: "backwards" });
    });
  };
  // fonts change the copy's size, so place once they are in
  (document.fonts?.ready || Promise.resolve()).then(() => { lastKey = ""; place(); });
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
