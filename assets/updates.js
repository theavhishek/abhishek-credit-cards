// /updates: tabs, search, filters, paging and sharing for the news and offers feed.
// The page ships with the current items already in the HTML; this script loads
// the full index (summaries only) and re-renders with the same markup from
// updates-core.js, so nothing jumps.
(() => {
  const core = window.UpdatesCore;
  const root = document.querySelector("[data-updates]");
  if (!core || !root) return;

  const PAGE = 20;
  const $ = (selector) => root.querySelector(selector);
  const feed = $("#up-feed");
  const tabs = [...root.querySelectorAll(".up-tab")];
  const search = $("#up-q");
  const panel = $("#up-filters");
  const filterBtn = $("#up-filter-btn");
  const filterCount = $("#up-filter-count");
  const cat = $("#up-cat");
  const bank = $("#up-bank");
  const show = $("#up-show");
  const count = $("#up-count");
  const chips = $("#up-chips");
  const moreBtn = $("#up-more-btn");

  const SHOW_LABEL = { archive: "Ended and archived", all: "Everything" };
  const params = new URLSearchParams(location.search);
  const state = {
    view: ["news", "offers", "devaluations"].includes(params.get("view")) ? params.get("view") : "all",
    q: params.get("q") || "",
    cat: core.CATEGORIES[params.get("category")] ? params.get("category") : "",
    bank: params.get("bank") || "",
    show: ["archive", "all"].includes(params.get("show")) ? params.get("show") : "current",
  };
  let items = null;
  let limit = PAGE;

  // The HTML can be a few days old: correct offer labels and drop ended offers now.
  core.refreshDom(feed);
  feed.querySelectorAll('.up-offer:not([data-status="active"]):not([data-status="upcoming"])').forEach((el) => {
    el.closest("li").hidden = true;
  });
  feed.querySelectorAll(".up-day").forEach((day) => {
    if (!day.querySelector(".up-day-items > li:not([hidden])")) day.hidden = true;
  });

  /* ---------- Controls ---------- */

  const activeFilters = () => (state.cat ? 1 : 0) + (state.bank ? 1 : 0) + (state.show !== "current" ? 1 : 0);

  function fillCategories() {
    const used = new Set(items.map((item) => item.category));
    const options = Object.entries(core.CATEGORIES).filter(([key, c]) =>
      used.has(key) && (state.view === "all" ||
        (state.view === "devaluations" ? key === "devaluation" : c.type === (state.view === "news" ? "news" : "offer"))));
    if (state.cat && !options.some(([key]) => key === state.cat)) state.cat = "";
    cat.innerHTML = '<option value="">All categories</option>' +
      options.map(([key, c]) => `<option value="${key}">${core.esc(c.plural)}</option>`).join("");
    cat.value = state.cat;
  }

  function fillBanks() {
    const names = [...new Set(items.flatMap((item) => [item.issuer, item.merchant]).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "en-IN"));
    if (state.bank && !names.includes(state.bank)) state.bank = "";
    bank.innerHTML = '<option value="">All banks and brands</option>' +
      names.map((name) => `<option value="${core.esc(name)}">${core.esc(name)}</option>`).join("");
    bank.value = state.bank;
  }

  function syncControls() {
    tabs.forEach((tab) => tab.setAttribute("aria-pressed", String(tab.dataset.view === state.view)));
    if (search.value !== state.q) search.value = state.q;
    show.value = state.show;
    if (items) { fillCategories(); bank.value = state.bank; }
    const n = activeFilters();
    filterCount.textContent = n ? String(n) : "";
    filterBtn.setAttribute("aria-label", n ? `Filters, ${n} active` : "Filters");
  }

  function writeUrl() {
    const p = new URLSearchParams();
    if (state.view !== "all") p.set("view", state.view);
    if (state.q) p.set("q", state.q);
    if (state.cat) p.set("category", state.cat);
    if (state.bank) p.set("bank", state.bank);
    if (state.show !== "current") p.set("show", state.show);
    const qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? `?${qs}` : "") + location.hash);
  }

  /* ---------- Rendering ---------- */

  const x = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 7l10 10M17 7 7 17"/></svg>';

  function countText(n) {
    const noun = state.view === "news" ? (n === 1 ? "news item" : "news items")
      : state.view === "offers" ? (n === 1 ? "offer" : "offers")
      : state.view === "devaluations" ? (n === 1 ? "devaluation" : "devaluations")
      : (n === 1 ? "update" : "updates");
    const scope = state.show === "archive" ? " ended or archived" : state.show === "current" ? " current" : "";
    return `${n.toLocaleString("en-IN")}${scope} ${noun}`;
  }

  function renderChips() {
    const list = [];
    if (state.q) list.push(["q", `“${state.q}”`]);
    if (state.cat) list.push(["cat", core.CATEGORIES[state.cat].plural]);
    if (state.bank) list.push(["bank", state.bank]);
    if (state.show !== "current") list.push(["show", SHOW_LABEL[state.show]]);
    chips.innerHTML = list.map(([key, label]) =>
      `<button type="button" class="up-chip" data-remove="${key}" aria-label="Remove filter: ${core.esc(label)}">${core.esc(label)}${x}</button>`).join("") +
      (list.length > 1 ? '<button type="button" class="up-clear" data-clear>Clear all</button>' : "");
  }

  function emptyState(now) {
    if (!items.length) {
      return `<div class="up-empty"><h2>Nothing new right now</h2><p>New card launches, devaluations and offers appear here once they’re checked against their source.</p></div>`;
    }
    const wider = state.show === "current" && items.some((item) => core.matches(item, { ...state, show: "all" }, now));
    return `<div class="up-empty">
      <h2>No ${state.view === "offers" ? "offers" : state.view === "news" ? "news" : state.view === "devaluations" ? "devaluations" : "updates"} match</h2>
      <p>${wider ? "Nothing current matches, but some ended or unverified items do." : "Try a bank, card or merchant name, or clear the filters."}</p>
      ${wider ? '<button type="button" class="up-btn up-btn-solid" data-show-all>Include ended offers</button>' : ""}
      <button type="button" class="up-btn" data-clear>Clear filters</button>
    </div>`;
  }

  function render() {
    const now = Date.now();
    const list = items.filter((item) => core.matches(item, state, now));
    const shown = list.slice(0, limit);
    feed.innerHTML = shown.length ? core.renderFeed(shown, { now }) : emptyState(now);
    moreBtn.hidden = list.length <= limit;
    moreBtn.textContent = `Show ${Math.min(PAGE, list.length - limit)} more`;
    count.textContent = countText(list.length);
    renderChips();
    syncControls();
  }

  function update(changes, { resetPage = true, url = true } = {}) {
    Object.assign(state, changes);
    if (resetPage) limit = PAGE;
    if (items) render(); else syncControls();
    if (url) writeUrl();
  }

  /* ---------- Events ---------- */

  tabs.forEach((tab) => tab.addEventListener("click", () => update({ view: tab.dataset.view })));

  let timer;
  search.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => update({ q: search.value.trim() }), 120);
  });
  search.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && search.value) { search.value = ""; update({ q: "" }); }
  });

  filterBtn.addEventListener("click", () => {
    const open = filterBtn.getAttribute("aria-expanded") !== "true";
    filterBtn.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
  });
  cat.addEventListener("change", () => update({ cat: cat.value }));
  bank.addEventListener("change", () => update({ bank: bank.value }));
  show.addEventListener("change", () => update({ show: show.value }));

  moreBtn.addEventListener("click", () => {
    limit += PAGE;
    render();
  });

  root.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove]");
    if (remove) {
      const key = remove.dataset.remove;
      update({ [key]: key === "show" ? "current" : "" });
      (chips.querySelector("button") || search).focus();
      return;
    }
    if (event.target.closest("[data-clear]")) {
      update({ q: "", cat: "", bank: "", show: "current" });
      search.focus();
      return;
    }
    if (event.target.closest("[data-show-all]")) update({ show: "all" });
  });

  /* ---------- Share ---------- */

  const ICONS = {
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41Z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M11.94 0A12 12 0 1 0 12 24 12 12 0 0 0 11.94 0Zm4.97 7.22c.1 0 .32.03.46.14.12.1.16.23.17.33.02.09.04.3.02.47-.18 1.9-.96 6.5-1.36 8.63-.17.9-.5 1.2-.82 1.23-.7.06-1.22-.46-1.9-.9-1.06-.7-1.65-1.13-2.68-1.8-1.18-.78-.42-1.21.26-1.91.17-.18 3.25-2.98 3.3-3.23.01-.03.02-.15-.05-.21-.07-.06-.18-.04-.25-.03-.1.03-1.8 1.14-5.06 3.35-.48.33-.91.49-1.3.48-.43-.01-1.25-.24-1.87-.44-.75-.25-1.35-.38-1.3-.79.03-.22.33-.44.9-.66 3.5-1.53 5.83-2.53 7-3.02 3.33-1.38 4.02-1.62 4.48-1.63Z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14.23 10.16 22.98 0h-2.07l-7.6 8.82L7.25 0H.26l9.17 13.34L.26 24h2.07l8.02-9.32L16.75 24h6.99zm-2.83 3.3-.93-1.33L3.08 1.56h3.18l5.97 8.53.93 1.33 7.75 11.09h-3.18z"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>',
  };
  let openMenu = null;

  function closeMenu(returnFocus) {
    if (!openMenu) return;
    const { menu, button } = openMenu;
    menu.remove();
    button.setAttribute("aria-expanded", "false");
    if (returnFocus) button.focus();
    openMenu = null;
  }

  function menuFor(button) {
    const url = button.dataset.shareUrl;
    const title = button.dataset.shareTitle;
    const links = core.shareLinks(url, title);
    const menu = document.createElement("div");
    menu.className = "up-sharemenu";
    menu.id = `share-${Math.random().toString(36).slice(2, 8)}`;
    menu.setAttribute("role", "group");
    menu.setAttribute("aria-label", `Share: ${title}`);
    const a = (href, icon, label) => `<a href="${core.esc(href)}" target="_blank" rel="noopener noreferrer">${icon}${label}<span class="sr-only"> (opens in a new tab)</span></a>`;
    menu.innerHTML = a(links.whatsapp, ICONS.whatsapp, "WhatsApp") + a(links.telegram, ICONS.telegram, "Telegram") + a(links.x, ICONS.x, "X") +
      `<button type="button" data-copy>${ICONS.link}<span>Copy link</span></button>`;
    menu.querySelector("[data-copy]").addEventListener("click", (event) => {
      const label = event.currentTarget.querySelector("span");
      navigator.clipboard?.writeText(url).then(() => { label.textContent = "Link copied"; }, () => { label.textContent = url; });
    });
    return menu;
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".up-share");
    if (!button) {
      if (openMenu && !openMenu.menu.contains(event.target)) closeMenu(false);
      return;
    }
    if (openMenu && openMenu.button === button) { closeMenu(true); return; }
    closeMenu(false);
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      navigator.share({ title: button.dataset.shareTitle, url: button.dataset.shareUrl }).catch(() => {});
      return;
    }
    const menu = menuFor(button);
    button.after(menu);
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-controls", menu.id);
    openMenu = { menu, button };
    menu.querySelector("a").focus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && openMenu) closeMenu(true);
  });
  document.addEventListener("focusin", (event) => {
    if (openMenu && !openMenu.menu.contains(event.target) && event.target !== openMenu.button) closeMenu(false);
  });

  /* ---------- Load the index ---------- */

  syncControls();
  if (activeFilters()) { filterBtn.setAttribute("aria-expanded", "true"); panel.hidden = false; }

  fetch(root.dataset.index)
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(response.status))))
    .then((data) => {
      items = data.items || [];
      fillBanks();
      // A shared link to an item that is no longer current: widen the view so it shows.
      const slug = decodeURIComponent(location.hash.slice(1));
      const target = slug && items.find((item) => item.slug === slug);
      if (target && !core.matches(target, state, Date.now())) Object.assign(state, { view: "all", q: "", cat: "", bank: "", show: "all" });
      if (target) {
        const index = items.filter((item) => core.matches(item, state, Date.now())).indexOf(target);
        while (index >= limit) limit += PAGE;
      }
      render();
      if (target) document.getElementById(slug)?.scrollIntoView({ block: "start" });
    })
    .catch(() => {
      // Keep the static list; the controls can't filter without the index.
      root.querySelector(".up-toolbar").hidden = true;
      $("#up-results-bar").hidden = true;
    });
})();
