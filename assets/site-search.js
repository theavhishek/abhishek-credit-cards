/* Site search and the Updates badge, on every page with the unified navbar.

   Search: the round button in the bar (beside the tab bar on phones) and the / or Ctrl/⌘ K keys open a
   search dialog over pages, tools, reviews, banks, my cards (assets/search-index.json, pnpm build:search)
   and news and offers (assets/updates-index.json, pnpm build:updates).

   Updates badge: the number of updates published in the last 5 days that this browser hasn't seen.
   Clicking Updates (or opening /updates) marks them seen in localStorage, so the badge only comes back
   when something newer is published. */
(() => {
  const SEARCH_INDEX = "/assets/search-index.json";
  const UPDATES_INDEX = "/assets/updates-index.json";
  const SITE = "https://avhishek.in";
  const SEEN_KEY = "avhishek-updates-seen";
  const RECENT_DAYS = 5;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const getJSON = (url) => fetch(url, { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
  let updatesPromise;
  const loadUpdates = () => (updatesPromise ||= getJSON(UPDATES_INDEX).then((d) => d.items || []).catch(() => []));

  /* ---------- Updates badge ---------- */
  const dayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const isRecent = (item) => {
    const [y, m, d] = String(item.published || "").split("-").map(Number);
    if (!y || !m || !d) return false;
    const age = Math.round((dayStart(new Date()) - new Date(y, m - 1, d).getTime()) / 864e5);
    return age >= 0 && age < RECENT_DAYS;
  };
  let memorySeen = [];
  const readSeen = () => {
    try { const list = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"); return Array.isArray(list) ? list : []; }
    catch { return memorySeen; }
  };
  const writeSeen = (slugs) => {
    const list = [...new Set([...readSeen(), ...slugs])].slice(-100);
    memorySeen = list;
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(list)); } catch {}
  };

  let unseen = 0;
  const badgeTargets = () => {
    const targets = [...document.querySelectorAll('body.unified-navbar .topbar-links > a[data-nav="updates"]')];
    // The desktop navbar is the uiarc tabs copy of the links (arc-tabs.js); find its Updates tab by label.
    document.querySelectorAll('.arc-tabs--nav [role="tab"]').forEach((tab) => {
      if (tab.textContent.trim() === "Updates") targets.push(tab);
    });
    return targets;
  };
  const paintBadge = () => {
    badgeTargets().forEach((el) => {
      if (unseen > 0) {
        el.dataset.badge = unseen > 9 ? "9+" : String(unseen);
        el.setAttribute("aria-label", `Updates, ${unseen} new`);
      } else if (el.dataset.badge) {
        delete el.dataset.badge;
        el.removeAttribute("aria-label");
      }
    });
  };

  const path = location.pathname.replace(/\.html$/, "").replace(/\/$/, "");
  const onHub = path === "/updates";
  const articleSlug = path.startsWith("/updates/") ? path.slice("/updates/".length) : "";
  let recentSlugs = [];

  loadUpdates().then((items) => {
    recentSlugs = items.filter(isRecent).map((item) => item.slug);
    // The updates page shows everything, so landing there counts as seeing it; an article counts for itself.
    if (onHub) writeSeen(recentSlugs);
    else if (articleSlug) writeSeen([articleSlug]);
    const seen = new Set(readSeen());
    unseen = recentSlugs.filter((slug) => !seen.has(slug)).length;
    paintBadge();
    if (!unseen) return;
    // The desktop tabs mount after this script, so paint the badge on them when they arrive.
    const actions = document.querySelector("body.unified-navbar .topbar-actions");
    if (!actions) return;
    const observer = new MutationObserver(() => {
      paintBadge();
      if (!unseen || document.querySelector(".arc-tabs--nav [role=\"tab\"][data-badge]")) observer.disconnect();
    });
    observer.observe(actions, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 10000);
  });

  // Clicking Updates clears the badge. The desktop tab clicks the original link, so one listener covers both.
  document.addEventListener("click", (event) => {
    if (!event.target.closest || !event.target.closest('a[data-nav="updates"]')) return;
    writeSeen(recentSlugs);
    unseen = 0;
    paintBadge();
  }, true);

  /* ---------- Search ---------- */
  const buttons = [...document.querySelectorAll(".site-search-btn")];
  if (!buttons.length) return;

  const icons = {
    review: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    update: '<path d="M4 21h15a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2"/><path d="M10 7h7M10 11h7M10 15h4"/>',
    support: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v5H6a2 2 0 0 1-2-2zM20 14h-3v5h1a2 2 0 0 0 2-2z"/>',
    pay: '<path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3M9 13c6.667 0 6.667-10 0-10"/>',
    upi: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3M21 14v.01M14 21h3M21 18v3h-1"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h3"/>',
    loan: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>',
    nocost: '<path d="M20 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7"/><path d="M3 10h17M16 19l5-5M16 14h.01M21 19h.01"/>',
    page: '<circle cx="12" cy="12" r="9.25"/><path d="m15.6 8.4-1.9 5.3-5.3 1.9 1.9-5.3z"/>',
  };
  const kindLabel = { tool: "Tool", page: "Page", review: "Review", support: "Bank support", pay: "Pay bill", upi: "UPI ID", card: "My cards" };
  const iconFor = (entry) => {
    if (entry.k === "tool") {
      if (entry.u.includes("upi-id")) return icons.upi;
      if (entry.u.includes("pay-credit")) return icons.pay;
      if (entry.u.includes("no-cost")) return icons.nocost;
      return icons.loan;
    }
    return icons[entry.k] || icons.page;
  };
  const svg = (paths) => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9+₹]+/g, " ").trim();

  const updateEntry = (item) => ({
    k: "update",
    t: item.title,
    d: item.summary,
    u: item.page ? `${SITE}/updates/${item.slug}` : `${SITE}/updates#${item.slug}`,
    w: [item.issuer, ...(item.cards || []), ...(item.tags || []), item.category, item.type].filter(Boolean).join(" "),
    label: item.category === "devaluation" ? "Devaluation" : item.type === "offer" ? "Offer" : "News",
    date: item.published || "",
  });
  const prepare = (entry, order) => ({ ...entry, order, nt: norm(entry.t).split(" "), nw: norm(entry.w).split(" "), nd: norm(entry.d).split(" ") });

  let entries = null;
  let entriesPromise;
  const loadEntries = () => (entriesPromise ||= Promise.all([
    getJSON(SEARCH_INDEX).then((d) => d.entries || []).catch(() => []),
    loadUpdates(),
  ]).then(([site, updates]) => {
    const sorted = [...updates].sort((a, b) => String(b.published).localeCompare(String(a.published)));
    entries = [...sorted.map(updateEntry), ...site].map(prepare);
    return entries;
  }));

  const kindBoost = { review: 1.5, tool: 1.5, update: 1, page: 0.8, support: 0.6, pay: 0.5, upi: 0.5, card: 0 };
  const search = (query) => {
    const tokens = norm(query).split(" ").filter(Boolean);
    if (!tokens.length) return [];
    const whole = norm(query);
    const scored = [];
    for (const entry of entries) {
      let score = 0;
      for (const token of tokens) {
        const has = (words) => words.some((word) => word.startsWith(token));
        if (entry.nt.includes(token)) score += 4;
        else if (has(entry.nt)) score += 3;
        else if (has(entry.nw)) score += 2;
        else if (has(entry.nd)) score += 1;
        else { score = 0; break; }
      }
      if (!score) continue;
      if (entry.nt.join(" ").startsWith(whole)) score += 3;
      scored.push({ entry, score: score + (kindBoost[entry.k] || 0) });
    }
    return scored.sort((a, b) => b.score - a.score || a.entry.order - b.entry.order).slice(0, 24).map((s) => s.entry);
  };

  const highlight = (text, query) => {
    const tokens = norm(query).split(" ").filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!tokens.length) return esc(text);
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${tokens.join("|")})`, "giu");
    let out = "";
    let last = 0;
    for (const m of String(text).matchAll(re)) {
      const start = m.index + m[1].length;
      out += esc(text.slice(last, start)) + "<mark>" + esc(m[2]) + "</mark>";
      last = start + m[2].length;
    }
    return out + esc(text.slice(last));
  };

  /* Dialog markup, built on first open. */
  let dialog, input, list, status, active = -1, options = [];
  const build = () => {
    dialog = document.createElement("dialog");
    dialog.className = "ss-dialog";
    dialog.setAttribute("aria-label", "Search avhishek.in");
    dialog.innerHTML = `
      <div class="ss-panel">
        <div class="ss-field">
          ${svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>')}
          <input class="ss-input" type="search" role="combobox" aria-expanded="true" aria-controls="ssResults" aria-autocomplete="list" aria-label="Search" placeholder="Search banks, cards, reviews, tools" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go">
          <button class="ss-close" type="button" aria-label="Close search"><kbd>Esc</kbd>${svg('<path d="M18 6 6 18M6 6l12 12"/>')}</button>
        </div>
        <div class="ss-results" id="ssResults" role="listbox" aria-label="Search results"></div>
        <p class="sr-only" role="status" aria-live="polite"></p>
      </div>`;
    document.body.appendChild(dialog);
    input = dialog.querySelector(".ss-input");
    list = dialog.querySelector(".ss-results");
    status = dialog.querySelector("[role=status]");

    let timer = 0;
    input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(render, 60); });
    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (options.length) setActive((active + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
      } else if (event.key === "Escape") {
        // A search field eats the first Escape to clear itself; close in one press instead.
        event.preventDefault();
        close();
      } else if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        if (options[active]) go(options[active], event);
      }
    });
    dialog.querySelector(".ss-close").addEventListener("click", close);
    // A tap outside the panel lands on the dialog itself (it fills the screen).
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
    list.addEventListener("click", (event) => {
      const option = event.target.closest("[role=option]");
      if (option && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) { event.preventDefault(); go(option, event); }
    });
    list.addEventListener("pointermove", (event) => {
      const option = event.target.closest("[role=option]");
      if (option) setActive(options.indexOf(option), false);
    });
    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("ss-open");
      buttons.forEach((b) => b.setAttribute("aria-expanded", "false"));
    });
  };

  const optionHTML = (entry, index, query) => {
    const label = entry.label || kindLabel[entry.k] || "";
    const icon = entry.k === "update" ? icons.update : iconFor(entry);
    return `<a class="ss-option" role="option" id="ss-opt-${index}" href="${esc(entry.u)}" tabindex="-1" aria-selected="false">
      <span class="ss-icon" data-kind="${esc(entry.k)}">${svg(icon)}</span>
      <span class="ss-text"><span class="ss-title">${highlight(entry.t, query)}</span><span class="ss-desc">${esc(entry.d || "")}</span></span>
      <span class="ss-kind"${entry.label === "Devaluation" ? ' data-cat="devaluation"' : ""}>${esc(label)}</span>
    </a>`;
  };

  const render = () => {
    const query = input.value.trim();
    if (!entries) {
      list.innerHTML = '<p class="ss-note">Loading…</p>';
      options = [];
      return;
    }
    let html = "";
    let count = 0;
    if (!query) {
      const latest = entries.filter((e) => e.k === "update").slice(0, 3);
      const tools = entries.filter((e) => e.k === "tool");
      const group = (title, items) => {
        if (!items.length) return "";
        const start = count;
        count += items.length;
        return `<div class="ss-group" role="group" aria-label="${esc(title)}"><p class="ss-heading" aria-hidden="true">${esc(title)}</p>${items.map((e, i) => optionHTML(e, start + i, "")).join("")}</div>`;
      };
      html = group("Latest updates", latest) + group("Tools", tools);
      status.textContent = "";
    } else {
      const found = search(query);
      count = found.length;
      html = found.map((e, i) => optionHTML(e, i, query)).join("") ||
        `<p class="ss-note">Nothing found for “${esc(query)}”. Try a bank, a card name or a tool, like “HDFC” or “EMI”.</p>`;
      status.textContent = count ? `${count} result${count === 1 ? "" : "s"}` : "No results";
    }
    list.innerHTML = html;
    options = [...list.querySelectorAll("[role=option]")];
    setActive(options.length ? 0 : -1, false);
  };

  const setActive = (index, scroll = true) => {
    if (options[active]) options[active].setAttribute("aria-selected", "false");
    active = index;
    const option = options[active];
    if (!option) { input.removeAttribute("aria-activedescendant"); return; }
    option.setAttribute("aria-selected", "true");
    input.setAttribute("aria-activedescendant", option.id);
    if (scroll) option.scrollIntoView({ block: "nearest" });
  };

  const go = (option, event) => {
    const url = new URL(option.href, location.href);
    if (event && (event.metaKey || event.ctrlKey)) { window.open(url.href, "_blank", "noopener"); return; }
    // Same page, another section (a bank on the page you're on): open and scroll to it.
    if (url.origin === location.origin && url.pathname.replace(/\.html$/, "") === location.pathname.replace(/\.html$/, "") && url.search === location.search && url.hash) {
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (target) {
        close();
        history.replaceState(null, "", url.hash);
        if (target.tagName === "DETAILS") target.open = true;
        target.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
        target.querySelector("summary")?.focus({ preventScroll: true });
        return;
      }
    }
    location.href = url.href;
  };

  const open = () => {
    if (!dialog) build();
    if (dialog.open) return;
    document.documentElement.classList.add("ss-open");
    buttons.forEach((b) => b.setAttribute("aria-expanded", "true"));
    dialog.showModal();
    input.focus();
    input.select();
    render();
    if (!entries) loadEntries().then(() => { if (dialog.open) render(); });
  };
  const close = () => { if (dialog?.open) dialog.close(); };

  buttons.forEach((button) => {
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", open);
    // Fetch the index as soon as someone reaches for the button.
    ["pointerenter", "focus", "touchstart"].forEach((type) => button.addEventListener(type, loadEntries, { once: true, passive: true }));
  });
  document.addEventListener("keydown", (event) => {
    const typing = event.target.closest?.("input, textarea, select, [contenteditable=''], [contenteditable='true']");
    if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) { event.preventDefault(); open(); }
    // The homepage's own search box keeps "/" (home.js); Ctrl/⌘ K still opens this one there.
    else if (event.key === "/" && !typing && !event.defaultPrevented && !document.getElementById("homeSearch") && !event.metaKey && !event.ctrlKey && !event.altKey) { event.preventDefault(); open(); }
  });
})();
