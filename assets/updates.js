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
  const dateBtn = $("#up-date-btn");
  const dateLabel = $("#up-date-label");
  const cal = $("#up-cal");

  /* ---------- Dates (calendar filter on the published day) ---------- */

  const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dateOf = (key) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (key, n) => { const d = dateOf(key); d.setDate(d.getDate() + n); return keyOf(d); };
  const todayKey = () => keyOf(new Date());
  const fmt = (key, opts) => dateOf(key).toLocaleDateString("en-IN", opts);
  const DAY_FMT = { day: "numeric", month: "short", year: "numeric" };

  function readDates(p) {
    let from = p.get("date") || p.get("from") || "";
    let to = p.get("date") || p.get("to") || from;
    if (!DAY_RE.test(from) || !DAY_RE.test(to)) return { from: "", to: "" };
    if (to < from) [from, to] = [to, from];
    return { from, to };
  }

  // "4 Nov 2026", "4–11 Nov 2026", "28 Oct – 4 Nov 2026", "28 Dec 2025 – 4 Jan 2026"
  function rangeText(from, to) {
    if (!from) return "";
    if (from === to) return fmt(from, DAY_FMT);
    const a = dateOf(from), b = dateOf(to);
    if (a.getFullYear() !== b.getFullYear()) return `${fmt(from, DAY_FMT)} – ${fmt(to, DAY_FMT)}`;
    if (a.getMonth() !== b.getMonth()) return `${fmt(from, { day: "numeric", month: "short" })} – ${fmt(to, DAY_FMT)}`;
    return `${a.getDate()}–${fmt(to, DAY_FMT)}`;
  }

  const inDates = (item, st) => !st.from || (item.published >= st.from && item.published <= st.to);
  const matchesAll = (item, st, now) => core.matches(item, st, now) && inDates(item, st);

  const SHOW_LABEL = { archive: "Ended and archived", all: "Everything" };
  const params = new URLSearchParams(location.search);
  const state = {
    view: ["news", "offers", "devaluations"].includes(params.get("view")) ? params.get("view") : "all",
    q: params.get("q") || "",
    cat: core.CATEGORIES[params.get("category")] ? params.get("category") : "",
    bank: params.get("bank") || "",
    show: ["archive", "all"].includes(params.get("show")) ? params.get("show") : "current",
    ...readDates(params),
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
    dateLabel.textContent = "Date";
    dateBtn.classList.toggle("is-set", Boolean(state.from));
    dateBtn.setAttribute("aria-label", state.from ? `Date: ${rangeText(state.from, state.to)}` : "Filter by date");
  }

  function writeUrl() {
    const p = new URLSearchParams();
    if (state.view !== "all") p.set("view", state.view);
    if (state.q) p.set("q", state.q);
    if (state.cat) p.set("category", state.cat);
    if (state.bank) p.set("bank", state.bank);
    if (state.show !== "current") p.set("show", state.show);
    if (state.from && state.from === state.to) p.set("date", state.from);
    else if (state.from) { p.set("from", state.from); p.set("to", state.to); }
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
    if (state.from) list.push(["date", rangeText(state.from, state.to)]);
    chips.innerHTML = list.map(([key, label]) =>
      `<button type="button" class="up-chip" data-remove="${key}" aria-label="Remove filter: ${core.esc(label)}">${core.esc(label)}${x}</button>`).join("") +
      (list.length > 1 ? '<button type="button" class="up-clear" data-clear>Clear all</button>' : "");
  }

  function emptyState(now) {
    if (!items.length) {
      return `<div class="up-empty"><h2>Nothing new right now</h2><p>New card launches, devaluations and offers appear here once they’re checked against their source.</p></div>`;
    }
    const wider = state.show === "current" && items.some((item) => matchesAll(item, { ...state, show: "all" }, now));
    return `<div class="up-empty">
      <h2>No ${state.view === "offers" ? "offers" : state.view === "news" ? "news" : state.view === "devaluations" ? "devaluations" : "updates"} match</h2>
      <p>${wider ? "Nothing current matches, but some ended or unverified items do." : state.from ? "Nothing was posted on these dates. Days with a dot in the calendar have updates." : "Try a bank, card or merchant name, or clear the filters."}</p>
      ${wider ? '<button type="button" class="up-btn up-btn-solid" data-show-all>Include ended offers</button>' : ""}
      <button type="button" class="up-btn" data-clear>Clear filters</button>
    </div>`;
  }

  function render() {
    const now = Date.now();
    const list = items.filter((item) => matchesAll(item, state, now));
    const shown = list.slice(0, limit);
    feed.innerHTML = shown.length ? core.renderFeed(shown, { now }) : emptyState(now);
    moreBtn.hidden = list.length <= limit;
    moreBtn.textContent = `Show ${Math.min(PAGE, list.length - limit)} more`;
    count.textContent = countText(list.length);
    renderChips();
    syncControls();
    renderCalendar();
  }

  function update(changes, { resetPage = true, url = true } = {}) {
    Object.assign(state, changes);
    if (resetPage) limit = PAGE;
    if (items) render(); else { syncControls(); renderCalendar(); }
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
      update(key === "date" ? { from: "", to: "" } : { [key]: key === "show" ? "current" : "" });
      (chips.querySelector("button") || search).focus();
      return;
    }
    if (event.target.closest("[data-clear]")) {
      update({ q: "", cat: "", bank: "", show: "current", from: "", to: "" });
      search.focus();
      return;
    }
    if (event.target.closest("[data-show-all]")) update({ show: "all" });
  });

  /* ---------- Calendar ----------
     Tap a day to see what was posted that day; tap a second day to stretch it into a range;
     a third tap starts again. Days with a dot have updates for the current tab and filters. */

  const CHEVRON = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; // weeks start on Monday
  const weekday = (key) => (dateOf(key).getDay() + 6) % 7; // 0 = Monday
  // Day colours follow the feed badges. A day is filled in its main kind's colour (the first in this
  // list it has); any other kinds posted that day show as small dots under the number.
  const KINDS = [
    ["devaluation", "Devaluation"],
    ["launch", "Card launch"],
    ["spend-offer", "Spend offer"],
    ["announcement", "Announcement"],
    ["cashback", "Cashback"],
    ["news", "Other news"],
    ["offer", "Other offer"],
  ];
  const kindOf = (item) => (KINDS.some(([k]) => k === item.category) ? item.category : item.type === "offer" ? "offer" : "news");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let month = null; // first day of the shown month, as a key
  let focusKey = null; // the day that holds the grid's single tab stop
  let slide = 0; // -1 or 1 while the month changes, for the slide-in

  const monthKey = (key) => `${key.slice(0, 7)}-01`;
  const shiftMonth = (key, n) => { const d = dateOf(key); return keyOf(new Date(d.getFullYear(), d.getMonth() + n, 1)); };
  const firstMonth = () => monthKey(items && items.length ? items.reduce((min, it) => (it.published < min ? it.published : min), todayKey()) : todayKey());
  const lastMonth = () => monthKey(todayKey());

  function postedDays() {
    const now = Date.now();
    const days = new Map();
    (items || []).forEach((item) => {
      if (!core.matches(item, state, now)) return;
      const day = days.get(item.published) || { n: 0, kinds: new Set() };
      day.n += 1;
      day.kinds.add(kindOf(item));
      days.set(item.published, day);
    });
    return days;
  }

  function renderCalendar(refocus) {
    if (cal.hidden) return;
    const today = todayKey();
    if (!month) month = monthKey(state.to || today);
    if (!focusKey || monthKey(focusKey) !== month) focusKey = state.to && monthKey(state.to) === month ? state.to : month === monthKey(today) ? today : month;
    const days = postedDays();
    const start = dateOf(month);
    const lead = weekday(month);
    const total = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push("");
    for (let d = 1; d <= total; d++) cells.push(`${month.slice(0, 8)}${pad(d)}`);
    while (cells.length % 7) cells.push("");

    const rows = [];
    for (let r = 0; r < cells.length; r += 7) {
      rows.push(`<tr>${cells.slice(r, r + 7).map((key) => {
        if (!key) return '<td role="gridcell"></td>';
        const info = days.get(key);
        const n = info ? info.n : 0;
        const kinds = info ? KINDS.map(([k]) => k).filter((k) => info.kinds.has(k)) : [];
        const dots = kinds.slice(1, 4).map((k) => `<span class="up-cal-dot" data-kind="${k}"></span>`).join("");
        const future = key > today;
        const picked = state.from && (key === state.from || key === state.to);
        const between = state.from && key > state.from && key < state.to;
        const cls = ["up-cal-cell",
          between && "is-between",
          state.from && state.from !== state.to && key === state.from && "is-start",
          state.from && state.from !== state.to && key === state.to && "is-end"].filter(Boolean).join(" ");
        const kindNames = kinds.map((k) => KINDS.find(([kk]) => kk === k)[1].toLowerCase()).join(", ");
        const label = `${fmt(key, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}, ${n ? `${n} ${n === 1 ? "update" : "updates"}: ${kindNames}` : "no updates"}${key === today ? ", today" : ""}`;
        return `<td role="gridcell" class="${cls}" aria-selected="${Boolean(picked || between)}"><button type="button" class="up-cal-day${picked ? " is-picked" : ""}${key === today ? " is-today" : ""}${n ? " has-posts" : ""}"${kinds.length ? ` data-kind="${kinds[0]}"` : ""} data-day="${key}" tabindex="${key === focusKey ? 0 : -1}" aria-label="${label}"${future ? " disabled" : ""}><span class="up-cal-num">${Number(key.slice(8))}</span>${dots ? `<span class="up-cal-dots" aria-hidden="true">${dots}</span>` : ""}</button></td>`;
      }).join("")}</tr>`);
    }

    const monthKinds = new Set();
    days.forEach((info, key) => { if (monthKey(key) === month) info.kinds.forEach((k) => monthKinds.add(k)); });
    const legend = KINDS.filter(([k]) => monthKinds.has(k))
      .map(([k, label]) => `<li><span class="up-cal-dot" data-kind="${k}"></span>${label}</li>`).join("");
    const canPrev = month > firstMonth();
    const canNext = month < lastMonth();
    const summary = state.from ? rangeText(state.from, state.to) : "All dates";
    const hint = !state.from ? "Tap a day, or two days for a range" : state.from === state.to ? "Tap another day to make a range" : "Tap any day to start again";
    cal.innerHTML = `<div class="up-cal-card">
      <div class="up-cal-top">
        <h2 class="up-cal-title" id="up-cal-title">Posted on</h2>
        <div class="up-cal-nav">
          <button type="button" class="up-cal-arrow" data-month="-1" aria-label="Previous month"${canPrev ? "" : " disabled"}>${CHEVRON("m15 18-6-6 6-6")}</button>
          <p class="up-cal-month" aria-live="polite">${fmt(month, { month: "long", year: "numeric" })}</p>
          <button type="button" class="up-cal-arrow" data-month="1" aria-label="Next month"${canNext ? "" : " disabled"}>${CHEVRON("m9 18 6-6-6-6")}</button>
        </div>
      </div>
      <table class="up-cal-grid${slide ? ` is-sliding" style="--up-cal-from:${slide * 14}px` : ""}" role="grid" aria-label="${fmt(month, { month: "long", year: "numeric" })}">
        <thead><tr>${WEEKDAYS.map((w) => `<th scope="col" abbr="${w}"><span aria-hidden="true">${w.slice(0, 2)}</span></th>`).join("")}</tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
      ${legend ? `<ul class="up-cal-legend" aria-label="Colour key">${legend}</ul>` : '<p class="up-cal-legend up-cal-muted">Nothing posted this month</p>'}
      <div class="up-cal-summary">
        <span class="up-cal-muted">Showing</span>
        <strong>${summary}</strong>
      </div>
      <div class="up-cal-foot">
        <span class="up-cal-muted up-cal-hint">${hint}</span>
        ${state.from ? '<button type="button" class="up-cal-link" data-cal-clear>Clear dates</button>' : ""}
        <button type="button" class="up-cal-done" data-cal-done>Done</button>
      </div>
    </div>`;
    slide = 0;
    if (refocus) cal.querySelector(`[data-day="${focusKey}"]`)?.focus();
  }

  function pickDay(key) {
    let next;
    if (!state.from || state.from !== state.to) next = { from: key, to: key };
    else next = key < state.from ? { from: key, to: state.from } : { from: state.from, to: key };
    focusKey = key;
    update(next);
    cal.querySelector(`[data-day="${key}"]`)?.focus();
  }

  function goMonth(n, keepFocusOnDay) {
    const target = shiftMonth(month, n);
    if (target < firstMonth() || target > lastMonth()) return false;
    slide = reduceMotion.matches ? 0 : n;
    month = target;
    if (!keepFocusOnDay) focusKey = null;
    return true;
  }

  function openCalendar(open) {
    dateBtn.setAttribute("aria-expanded", String(open));
    cal.hidden = !open;
    if (open) { month = null; focusKey = null; renderCalendar(); }
  }

  dateBtn.addEventListener("click", () => openCalendar(dateBtn.getAttribute("aria-expanded") !== "true"));

  cal.addEventListener("click", (event) => {
    const day = event.target.closest("[data-day]");
    if (day && !day.disabled) { pickDay(day.dataset.day); return; }
    const arrow = event.target.closest("[data-month]");
    if (arrow && !arrow.disabled) {
      if (goMonth(Number(arrow.dataset.month))) renderCalendar();
      cal.querySelector(`[data-month="${arrow.dataset.month}"]:not([disabled])`)?.focus();
      return;
    }
    if (event.target.closest("[data-cal-clear]")) {
      update({ from: "", to: "" });
      cal.querySelector("[data-cal-done]")?.focus();
      return;
    }
    if (event.target.closest("[data-cal-done]")) { openCalendar(false); dateBtn.focus(); }
  });

  cal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { openCalendar(false); dateBtn.focus(); return; }
    const day = event.target.closest("[data-day]");
    if (!day) return;
    const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next = null;
    if (steps[event.key]) next = addDays(day.dataset.day, steps[event.key]);
    else if (event.key === "Home") next = addDays(day.dataset.day, -weekday(day.dataset.day));
    else if (event.key === "End") next = addDays(day.dataset.day, 6 - weekday(day.dataset.day));
    else if (event.key === "PageUp" || event.key === "PageDown") {
      const d = dateOf(day.dataset.day);
      const moved = new Date(d.getFullYear(), d.getMonth() + (event.key === "PageUp" ? -1 : 1), 1);
      const last = new Date(moved.getFullYear(), moved.getMonth() + 1, 0).getDate();
      moved.setDate(Math.min(d.getDate(), last));
      next = keyOf(moved);
    }
    if (!next) return;
    event.preventDefault();
    if (next > todayKey()) next = todayKey();
    if (monthKey(next) < firstMonth()) return;
    if (monthKey(next) !== month) goMonth(monthKey(next) < month ? -1 : 1, true);
    month = monthKey(next);
    focusKey = next;
    renderCalendar(true);
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
  if (state.from) openCalendar(true);

  fetch(root.dataset.index)
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(response.status))))
    .then((data) => {
      items = data.items || [];
      fillBanks();
      // A shared link to an item that is no longer current: widen the view so it shows.
      const slug = decodeURIComponent(location.hash.slice(1));
      const target = slug && items.find((item) => item.slug === slug);
      if (target && !matchesAll(target, state, Date.now())) Object.assign(state, { view: "all", q: "", cat: "", bank: "", show: "all", from: "", to: "" });
      if (target) {
        const index = items.filter((item) => matchesAll(item, state, Date.now())).indexOf(target);
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
