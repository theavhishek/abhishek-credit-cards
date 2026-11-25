/* /movie-offers: renders, filters, sorts and calculates over window.MOVIE_OFFERS.
 * The offer lists are baked into movie-offers.html by scripts/movie-offers/bake.mjs (pnpm build:movies),
 * so the page reads without JavaScript. In the browser this script adds filters, sorting, search,
 * shareable URLs, promo-code copy and the savings calculator. Logic lives in movie-offers-core.js. */
(function () {
  const C = typeof module !== "undefined" && module.exports ? require("./movie-offers-core.js") : window.MovieOffersCore;
  const { esc, inr, fmtDate } = C;
  const PLATFORM_ORDER = { bms: 0, district: 1, pvr: 2 };
  const CARD_TYPE = { credit: "Credit card", debit: "Debit card" };

  function logoHTML(iss) {
    if (iss.logo) return `<span class="mo-logo" aria-hidden="true"><img src="/assets/bank-logos/${iss.logo}" alt="" width="28" height="28" loading="lazy" decoding="async"></span>`;
    return `<span class="mo-logo mo-logo--text" aria-hidden="true">${esc(iss.name.charAt(0))}</span>`;
  }

  function factsHTML(o, today) {
    const per = C.maxPerMonth(o);
    const facts = [
      ["Max off a booking", (o.kind === "percent" || o.kind === "cashback") && o.capTxn != null ? inr(o.capTxn) : null],
      ["Per free ticket", o.kind === "free" && o.capTicket != null ? `Up to ${inr(o.capTicket)}` : null],
      ["How often", C.usesText(o)],
      ["Monthly benefit", per != null && !(o.uses && o.uses.per === "month" && o.uses.count === 1 && per === C.maxPerBooking(o)) ? `Up to ${inr(per)}` : null],
      ["Minimum tickets", o.minTickets && `${o.minTickets} ${o.minTickets === 1 ? "ticket" : "tickets"}`],
      ["Minimum booking", o.minAmount && inr(o.minAmount)],
      ["Spend needed", o.spend && o.spend.text],
      ["Days", C.daysText(o.days)],
      ["Valid till", o.end && fmtDate(o.end)],
    ].filter(([, v]) => v != null && v !== "");
    if (!facts.length) return "";
    const cls = (k) => (k === "Spend needed" ? "mo-fact--warn mo-fact--wide" : k === "Valid till" && C.endingSoon(o, today) ? "mo-fact--soon" : "");
    return `<dl class="mo-facts">${facts.map(([k, v]) => `<div${cls(k) ? ` class="${cls(k)}"` : ""}><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
  }

  function sourceText(o, data) {
    if (o.source.label) return `in ${o.source.label}`;
    if (o.source.type === "platform") return `on ${data.platforms[o.platform].name}`;
    return `on ${data.issuers[o.issuer].name}’s site`;
  }

  function itemHTML(o, data, today) {
    const iss = data.issuers[o.issuer];
    const p = data.platforms[o.platform];
    const st = C.effectiveStatus(o, today);
    const head = st === "listed" ? null : C.headline(o);
    const cats = (o.category || []).map((c) => C.CATEGORIES[c]).join(", ");
    const cardLine = [CARD_TYPE[o.cardType], o.network && C.NETWORKS[o.network]].filter(Boolean).join(" · ");
    const changes = (o.changes || []).map((c) => `<p class="mo-change"><strong>From ${fmtDate(c.date)}:</strong> ${esc(c.text)}${c.url ? ` <a href="${esc(c.url)}">What’s changing</a>` : ""}</p>`).join("");
    const code = o.code ? `<div class="mo-code-row"><p><span class="mo-code-label">Promo code</span><code class="mo-code">${esc(o.code)}</code></p><button type="button" class="mo-copy" data-code="${esc(o.code)}" aria-label="Copy promo code ${esc(o.code)}" hidden><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg><span class="mo-copy-t">Copy</span></button></div>` : "";
    const more = [
      o.terms && `<p>${esc(o.terms)}</p>`,
      o.cinemas && `<p>Cinemas: ${esc(o.cinemas)}</p>`,
      o.channel && `<p>Booking: ${{ online: "online only", counter: "at the cinema counter only", both: "online or at the cinema counter" }[o.channel]}</p>`,
      o.start && `<p>Starts ${fmtDate(o.start)}</p>`,
      o.scope === "welcome" && "<p>One-time welcome gift for new cardholders.</p>",
      (o.reviews || []).map((s) => `<p><a href="/card-reviews/${esc(s)}">Read my review of this card</a></p>`).join(""),
      st === "listed" && `<p>Only the headline is listed so far. Check the full terms ${sourceText(o, data)} before you book.</p>`,
    ].filter(Boolean).join("");
    const statusText = st === "listed" ? `Seen ${fmtDate(o.accessed)}` : st === "upcoming" ? `Starts ${fmtDate(o.start)}` : `Checked ${fmtDate(o.verified)}`;
    const maxB = C.maxPerBooking(o), maxM = C.maxPerMonth(o);
    const attrs = {
      id: o.id, platform: o.platform, kind: o.kind, card: o.cardType, network: o.network || "", issuer: o.issuer,
      cat: (o.category || []).join(" "), status: st, one: o.minTickets === 1 && o.kind !== "bogo" ? "1" : "",
      spend: o.spend ? "1" : "", days: o.days ? o.days.join(" ") : "", channel: o.channel || "", end: o.end || "",
      max: maxB ?? "", month: maxM ?? "", checked: o.verified || "", sort: `${iss.name} ${o.cards[0]}`.toLowerCase(),
      words: C.searchWords(o, data),
    };
    const pill = { verified: "Verified terms", app: "Terms from the app", listed: "Headline only", upcoming: "Upcoming" }[st] || C.STATUSES[st];
    const sub = [CARD_TYPE[o.cardType], o.network && C.NETWORKS[o.network], p.name, cats !== "Movies" && cats, o.scope === "welcome" && "Welcome gift"].filter(Boolean).join(" · ");
    return `<li class="mo-item" ${Object.entries(attrs).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")}>
      <article class="mo-offer">
        <header class="mo-head">
          ${logoHTML(iss)}
          <div class="mo-head-text">
            <h3 class="mo-card"><span class="mo-bank">${esc(iss.name)}</span> ${esc(o.cards.join(", "))}</h3>
            <p class="mo-meta">${esc(sub)}</p>
          </div>
          <span class="mo-pill mo-pill--${st}">${esc(pill)}</span>
        </header>
        <p class="mo-type mo-type--${o.kind}">${esc(C.KINDS[o.kind])}</p>
        ${head ? `<p class="mo-save mo-save--${o.kind}">${esc(head)}</p>` : ""}
        <p class="mo-benefit">${esc(o.benefit)}</p>
        ${factsHTML(o, today)}
        ${code}
        ${changes}
        ${more ? `<details class="mo-more"><summary>Full terms</summary><div class="mo-more-body">${more}</div></details>` : ""}
        <footer class="mo-src"><span class="mo-status mo-status--${st}">${esc(statusText)}</span><a href="${esc(o.source.url)}" target="_blank" rel="noopener noreferrer">Terms ${esc(sourceText(o, data))}<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg><span class="sr-only"> (opens in a new tab)</span></a></footer>
      </article>
    </li>`;
  }

  const byDefault = (data) => (a, b) =>
    data.issuers[a.issuer].name.localeCompare(data.issuers[b.issuer].name) || PLATFORM_ORDER[a.platform] - PLATFORM_ORDER[b.platform] || a.cards[0].localeCompare(b.cards[0]);

  /** Baked lists. group "checked" = verified/app/upcoming, "listed" = headline only. Expired and needs-checking are left out. */
  function listHTML(data, group, today = C.todayIST()) {
    return data.offers
      .filter((o) => {
        const st = C.effectiveStatus(o, today);
        if (!C.isShown(st)) return false;
        return group === "listed" ? st === "listed" : st !== "listed";
      })
      .sort(byDefault(data))
      .map((o) => itemHTML(o, data, today)).join("");
  }
  function banksHTML(data) {
    return Object.entries(data.issuers).sort((a, b) => a[1].name.localeCompare(b[1].name))
      .map(([id, i]) => `<option value="${esc(id)}">${esc(i.name)}</option>`).join("");
  }

  /** Compact offer card for the homepage and card reviews (styles in movie-offers-embed.css). Links to the filtered offers page. */
  function miniHTML(o, data, today = C.todayIST()) {
    const iss = data.issuers[o.issuer];
    const st = C.effectiveStatus(o, today);
    const head = st === "listed" ? null : C.headline(o);
    const facts = st === "listed" ? ["Headline only, terms not checked yet"] : [(o.kind === "percent" || o.kind === "cashback") && o.capTxn != null && `Up to ${inr(o.capTxn)} a booking`, C.usesText(o), o.minAmount && `Min. booking ${inr(o.minAmount)}`, o.minTickets > 1 && `${o.minTickets} tickets min.`, o.spend && "Spend condition", o.end && `Till ${fmtDate(o.end)}`].filter(Boolean);
    const href = `/movie-offers?platform=${encodeURIComponent(o.platform)}&bank=${encodeURIComponent(o.issuer)}`;
    return `<li class="mox-item"${o.end ? ` data-end="${esc(o.end)}"` : ""}><a class="mox-card" href="${href}">
      <span class="mox-head">${logoHTML(iss).replace('class="mo-logo', 'class="mox-logo')}<span class="mox-name"><strong>${esc(iss.name)} ${esc(o.cards.join(", "))}</strong><span>${esc([data.platforms[o.platform].name, C.KINDS[o.kind], ...(o.category || []).filter((c) => c !== "movies").map((c) => C.CATEGORIES[c])].join(" · "))}</span></span></span>
      <span class="mox-save${head ? "" : " mox-save--plain"}">${esc(head || o.benefit)}</span>
      <span class="mox-facts">${facts.map(esc).join(" · ")}</span>
      ${o.code ? `<span class="mox-code">Code <code>${esc(o.code)}</code></span>` : ""}
    </a></li>`;
  }
  /** Homepage pick: per platform, the biggest checked instant movie offers with no spend condition, one per bank (2 each). */
  function homePicks(data, today = C.todayIST(), perPlatform = 2) {
    const seen = new Set();
    const pool = data.offers
      .filter((o) => ["verified", "app"].includes(C.effectiveStatus(o, today)) && ["bogo", "percent", "flat", "free"].includes(o.kind)
        && o.scope !== "welcome" && !o.spend && (o.category || []).includes("movies") && C.maxPerBooking(o) != null && !C.endingSoon(o, today))
      .sort((a, b) => C.maxPerBooking(b) - C.maxPerBooking(a) || a.id.localeCompare(b.id));
    const picks = [];
    for (const p of Object.keys(data.platforms)) {
      let n = 0;
      for (const o of pool) {
        if (n === perPlatform) break;
        if (o.platform !== p || seen.has(o.issuer)) continue;
        seen.add(o.issuer); picks.push(o); n++;
      }
    }
    return picks;
  }
  const reviewOffers = (data, slug, today = C.todayIST()) =>
    data.offers.filter((o) => (o.reviews || []).includes(slug) && C.isShown(C.effectiveStatus(o, today))).sort(byDefault(data));

  if (typeof module !== "undefined" && module.exports) module.exports = { listHTML, banksHTML, itemHTML, miniHTML, homePicks, reviewOffers };
  if (typeof document === "undefined") return;

  /* ---------------- Browser ---------------- */
  const FILTERS = [
    // [url key, element id]
    ["q", "mo-q"], ["bank", "mo-bank"], ["card", "mo-card"], ["net", "mo-network"],
    ["kind", "mo-type"], ["for", "mo-cat"], ["day", "mo-day"], ["book", "mo-channel"],
    ["one", "mo-one"], ["nospend", "mo-nospend"], ["checked", "mo-checked"], ["soon", "mo-soon"],
  ];
  const MORE = ["for", "day", "book", "one", "nospend", "checked", "soon"];
  const num = (v) => (v === "" || v == null ? -1 : Number(v));
  const SORTS = {
    default: null,
    discount: (a, b) => num(b.dataset.max) - num(a.dataset.max),
    month: (a, b) => num(b.dataset.month) - num(a.dataset.month),
    recent: (a, b) => (b.dataset.checked || "").localeCompare(a.dataset.checked || ""),
    ending: (a, b) => (a.dataset.end || "9999").localeCompare(b.dataset.end || "9999"),
    az: (a, b) => a.dataset.sort.localeCompare(b.dataset.sort),
  };

  function init() {
    const root = document.querySelector("[data-movie-offers]");
    if (!root) return;
    const data = window.MOVIE_OFFERS;
    document.documentElement.classList.add("mo-js");
    const today = C.todayIST();
    const $ = (id) => document.getElementById(id);
    const groups = [...root.querySelectorAll(".mo-group")].map((g) => {
      const list = g.querySelector(".mo-list");
      return { el: g, list, original: [...list.children] };
    });
    const tabs = [...root.querySelectorAll(".mo-tab")];
    const els = Object.fromEntries(FILTERS.map(([k, id]) => [k, $(id)]));
    const sortEl = $("mo-sort");
    const count = $("mo-count"), chips = $("mo-chips"), empty = $("mo-empty"), moreBtn = $("mo-more-btn"), morePanel = $("mo-more-panel");
    const calc = {
      form: $("mo-calc-form"), price: $("mo-c-price"), tickets: $("mo-c-tickets"), platform: $("mo-c-platform"),
      cat: $("mo-c-cat"), date: $("mo-c-date"), later: $("mo-c-later"), cond: $("mo-c-cond"), out: $("mo-calc-out"),
    };
    let platform = "all";

    // Offers baked as active drop off on the day after they end (Asia/Kolkata).
    for (const g of groups) g.original.forEach((el) => { if (el.dataset.end && el.dataset.end < today) el.dataset.gone = "1"; });
    root.querySelectorAll(".mo-copy").forEach((b) => (b.hidden = !navigator.clipboard));

    const val = (k) => {
      const el = els[k];
      if (!el) return "";
      return el.type === "checkbox" ? (el.checked ? "1" : "") : el.value.trim();
    };
    const label = (k) => {
      const el = els[k];
      if (k === "q") return `“${el.value.trim()}”`;
      if (el.type === "checkbox") return el.closest("label").textContent.trim();
      return el.options[el.selectedIndex].text;
    };

    function matches(el) {
      const d = el.dataset;
      if (d.gone) return false;
      if (platform !== "all" && d.platform !== platform) return false;
      if (val("bank") && d.issuer !== val("bank")) return false;
      if (val("card") && d.card !== val("card")) return false;
      if (val("net") && d.network !== val("net")) return false;
      if (val("kind")) {
        const k = val("kind");
        if (k === "later" ? !(d.kind === "cashback" || d.kind === "rewards") : d.kind !== k) return false;
      }
      if (val("for") && !d.cat.split(" ").includes(val("for"))) return false;
      if (val("day") && d.days && !d.days.split(" ").includes(val("day"))) return false;
      if (val("book") && d.channel && d.channel !== "both" && d.channel !== val("book")) return false;
      if (val("one") && d.one !== "1") return false;
      if (val("nospend") && d.spend === "1") return false;
      if (val("checked") && d.status === "listed") return false;
      if (val("soon") && !(d.end && d.end >= today && d.end <= C.addDays(today, C.ENDING_SOON_DAYS))) return false;
      return C.queryTerms(val("q")).every((t) => d.words.includes(t));
    }

    function apply({ write = true } = {}) {
      const sort = SORTS[sortEl.value];
      let total = 0;
      for (const g of groups) {
        const ordered = sort ? [...g.original].sort((a, b) => sort(a, b) || SORTS.az(a, b)) : g.original;
        let shown = 0;
        const frag = document.createDocumentFragment();
        for (const el of ordered) {
          const ok = matches(el);
          el.hidden = !ok;
          if (ok) shown++;
          frag.append(el);
        }
        g.list.append(frag);
        g.el.hidden = shown === 0;
        total += shown;
      }
      count.textContent = `${total} ${total === 1 ? "offer" : "offers"}`;
      empty.hidden = total !== 0;
      renderChips();
      if (write) writeURL();
    }

    function renderChips() {
      const active = FILTERS.filter(([k]) => val(k)).map(([k]) => k);
      if (platform !== "all") active.unshift("platform");
      const extra = MORE.filter((k) => val(k)).length;
      moreBtn.querySelector(".mo-more-n").textContent = extra ? ` (${extra})` : "";
      chips.hidden = !active.length;
      chips.innerHTML = active.map((k) => {
        const text = k === "platform" ? data.platforms[platform].name : label(k);
        return `<button type="button" class="mo-chip" data-clear="${k}"><span>${esc(text)}</span><span class="sr-only"> (remove filter)</span><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`;
      }).join("") + (active.length > 1 ? `<button type="button" class="mo-chip mo-chip--all" data-clear="*">Clear all</button>` : "");
    }

    function clear(k) {
      if (k === "platform" || k === "*") setPlatform("all", false);
      for (const [key] of FILTERS) if (k === "*" || k === key) {
        const el = els[key];
        if (el.type === "checkbox") el.checked = false; else el.value = "";
      }
      if (k === "*") sortEl.value = "default";
      apply();
    }

    function setPlatform(p, run = true) {
      platform = p;
      tabs.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.platform === p)));
      if (calc.platform) { calc.platform.value = p === "all" ? "" : p; if (run) runCalc(); }
      if (run) apply();
    }

    function writeURL() {
      const u = new URLSearchParams();
      if (platform !== "all") u.set("platform", platform);
      for (const [k] of FILTERS) if (val(k)) u.set(k, val(k));
      if (sortEl.value !== "default") u.set("sort", sortEl.value);
      const qs = u.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    }
    function readURL() {
      const u = new URLSearchParams(location.search);
      const p = u.get("platform");
      if (p && data.platforms[p]) setPlatform(p, false);
      for (const [k] of FILTERS) {
        const v = u.get(k);
        if (v == null) continue;
        const el = els[k];
        if (el.type === "checkbox") el.checked = v === "1";
        else if (el.tagName === "SELECT") { if ([...el.options].some((o) => o.value === v)) el.value = v; }
        else el.value = v.slice(0, 80);
      }
      const s = u.get("sort");
      if (s && s in SORTS) sortEl.value = s;
      if (MORE.some((k) => val(k))) toggleMore(true);
    }
    function toggleMore(open) {
      morePanel.hidden = !open;
      moreBtn.setAttribute("aria-expanded", String(open));
    }

    tabs.forEach((t) => t.addEventListener("click", () => setPlatform(t.dataset.platform)));
    let typing;
    els.q.addEventListener("input", () => { clearTimeout(typing); typing = setTimeout(apply, 120); });
    for (const [k] of FILTERS) if (k !== "q") els[k].addEventListener("change", () => apply());
    sortEl.addEventListener("change", () => apply());
    moreBtn.addEventListener("click", () => toggleMore(morePanel.hidden));
    chips.addEventListener("click", (e) => { const b = e.target.closest("[data-clear]"); if (b) clear(b.dataset.clear); });
    $("mo-reset")?.addEventListener("click", () => clear("*"));

    root.addEventListener("click", async (e) => {
      const b = e.target.closest(".mo-copy");
      if (!b) return;
      try {
        await navigator.clipboard.writeText(b.dataset.code);
        const t = b.querySelector(".mo-copy-t");
        t.textContent = "Copied";
        b.classList.add("is-done");
        setTimeout(() => { t.textContent = "Copy"; b.classList.remove("is-done"); }, 1600);
      } catch { b.querySelector(".mo-copy-t").textContent = "Couldn’t copy"; }
    });

    /* ---------- Savings calculator ---------- */
    let calcLimit = 10;
    function runCalc() {
      if (!calc.form) return;
      const price = Number(calc.price.value), tickets = Math.round(Number(calc.tickets.value));
      if (!(price > 0) || !(tickets >= 1)) { calc.out.innerHTML = `<p class="mo-calc-note">Enter a ticket price and the number of tickets.</p>`; return; }
      const date = /^\d{4}-\d{2}-\d{2}$/.test(calc.date.value) ? calc.date.value : "";
      const booking = { price, tickets, platform: calc.platform.value, category: calc.cat.value, date, today };
      const { results, notFitting } = C.rank(data.offers, booking, { includeLater: calc.later.checked, hideConditional: calc.cond.checked });
      const total = price * tickets;
      const when = date ? ` on ${fmtDate(date)}` : "";
      if (!results.length) {
        calc.out.innerHTML = `<p class="mo-calc-sum">No offer with checked terms fits a ${tickets}-ticket booking of ${inr(total)}${when}. Try 2 tickets, another day or another platform.</p>`;
        return;
      }
      const rows = results.slice(0, calcLimit).map((r, i) => {
        const o = r.offer, iss = data.issuers[o.issuer];
        const save = r.instant ? `${inr(r.discount)} off` : `${inr(r.discount)} ${o.kind === "cashback" ? "back later" : "in points"}`;
        return `<li class="mo-r${r.conditional ? " mo-r--cond" : ""}">
          <span class="mo-r-n" aria-hidden="true">${i + 1}</span>
          <div class="mo-r-main">
            <p class="mo-r-card"><span class="mo-bank">${esc(iss.name)}</span> ${esc(o.cards.join(", "))}</p>
            <p class="mo-r-meta">${esc(data.platforms[o.platform].name)} · ${esc(C.KINDS[o.kind])}${o.code ? ` · Code <code class="mo-code">${esc(o.code)}</code>` : ""}</p>
            ${r.conditions.length ? `<p class="mo-r-cond">${r.conditions.map(esc).join(" · ")}</p>` : ""}
          </div>
          <dl class="mo-r-figs">
            <div class="mo-r-save"><dt>You save</dt><dd>${save}</dd></div>
            <div><dt>You pay</dt><dd>${inr(r.payable)}</dd></div>
            <div><dt>Saving</dt><dd>${r.pctSaved.toFixed(r.pctSaved < 10 ? 1 : 0)}%</dd></div>
          </dl>
        </li>`;
      }).join("");
      calc.out.innerHTML = `<p class="mo-calc-sum">${results.length} ${results.length === 1 ? "offer fits" : "offers fit"} a ${tickets}-ticket booking of <strong>${inr(total)}</strong>${when}.${notFitting ? ` ${notFitting} more don’t (too few tickets, wrong day or a minimum booking).` : ""}</p>
        <ol class="mo-r-list">${rows}</ol>
        ${results.length > calcLimit ? `<button type="button" class="mo-reset mo-calc-all" data-all>Show all ${results.length}</button>` : ""}
        <p class="mo-calc-note">Ticket prices only: convenience fees and taxes aren’t included. Offers with a spend condition only work if you met it, and each offer only works while you have uses left.</p>`;
    }
    if (calc.form) {
      calc.date.min = today;
      calc.form.addEventListener("input", () => { calcLimit = 10; runCalc(); });
      calc.form.addEventListener("submit", (e) => { e.preventDefault(); runCalc(); });
      calc.out.addEventListener("click", (e) => { if (e.target.closest("[data-all]")) { calcLimit = Infinity; runCalc(); } });
      $("mo-calc")?.addEventListener("toggle", (e) => { if (e.target.open) runCalc(); });
    }

    readURL();
    apply({ write: false });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
