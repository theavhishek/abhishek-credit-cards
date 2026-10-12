// Review page behaviour: cap calculator, table of contents state and section highlighting.
(() => {
  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const money = (value) => inr.format(Math.round(value));

  /* ---------- Cap calculator ---------- */
  // Pages with their own calculator mark it with data-calc and load their own script.
  const calc = document.querySelector(".rv-calc:not([data-calc])");
  if (calc) {
    const rate = 0.1;
    const cap = 1200;
    const capSpend = cap / rate;            // ₹12,000
    const waiverSpend = 200000;             // yearly eligible spend for renewal-fee reversal
    const input = calc.querySelector("#calc-spend");
    const max = Number(input.max) || 30000;
    const out = calc.querySelector("#calc-spend-out");
    const earnBar = calc.querySelector("#calc-earn-bar");
    const overBar = calc.querySelector("#calc-over-bar");
    const cashbackEl = calc.querySelector("#calc-cashback");
    const wastedEl = calc.querySelector("#calc-wasted");
    const yearlyEl = calc.querySelector("#calc-yearly");
    const note = calc.querySelector("#calc-note");
    const capPct = (capSpend / max) * 100;
    let noteTimer;

    const describe = (spend, cashback, wasted) => {
      const yearlySpend = spend * 12;
      let first;
      if (spend === 0) {
        first = "Move the slider to see what you would earn.";
        return first;
      } else if (wasted > 0) {
        first = `${money(wasted)} of your ${money(spend)} earns no extra cashback this cycle. Put that part on another card.`;
      } else if (spend === capSpend) {
        first = `At ${money(spend)} a month you use the full cap. Anything more should go on another card.`;
      } else {
        first = `You earn ${money(cashback)}. Another ${money(capSpend - spend)} of 10% spend would reach the cap.`;
      }
      const second = yearlySpend > waiverSpend
        ? ` This spend alone, ${money(yearlySpend)} a year, is more than the ₹2,00,000 needed to get the renewal fee reversed.`
        : ` The renewal fee is reversed only above ₹2,00,000 of eligible spend a year; this covers ${money(yearlySpend)} of it.`;
      return first + second;
    };

    const update = () => {
      const spend = Number(input.value);
      const cashback = Math.min(spend * rate, cap);
      const wasted = Math.max(spend - capSpend, 0);
      const earnPct = (Math.min(spend, capSpend) / max) * 100;
      const overPct = (wasted / max) * 100;

      out.value = money(spend);
      out.textContent = money(spend);
      input.setAttribute("aria-valuetext", money(spend));
      earnBar.style.inlineSize = `${earnPct}%`;
      overBar.style.insetInlineStart = `${capPct}%`;
      overBar.style.inlineSize = `${overPct}%`;
      cashbackEl.textContent = money(cashback);
      wastedEl.textContent = money(wasted);
      yearlyEl.textContent = money(cashback * 12);

      // Announce the summary once the user pauses, not on every step.
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => { note.textContent = describe(spend, cashback, wasted); }, 350);
    };

    input.hidden = false;
    input.addEventListener("input", update);
    update();
  }

  /* ---------- Scrollable tables ---------- */
  // Table wrappers are focusable only while they actually scroll sideways.
  const wraps = [...document.querySelectorAll(".rv-table-wrap")];
  const syncWraps = () => wraps.forEach((wrap) => {
    if (wrap.scrollWidth > wrap.clientWidth + 1) wrap.setAttribute("tabindex", "0");
    else wrap.removeAttribute("tabindex");
  });
  if (wraps.length) {
    syncWraps();
    window.addEventListener("resize", syncWraps, { passive: true });
  }

  /* ---------- Table of contents ---------- */
  const tocBox = document.querySelector(".rv-toc-box");
  const tocSummary = tocBox?.querySelector("summary");
  const wide = window.matchMedia("(min-width: 960px)");
  const syncToc = () => {
    if (!tocBox) return;
    if (wide.matches) {
      tocBox.open = true;
      tocSummary.setAttribute("tabindex", "-1");
    } else {
      tocBox.open = false;
      tocSummary.removeAttribute("tabindex");
    }
  };
  tocSummary?.addEventListener("click", (event) => { if (wide.matches) event.preventDefault(); });
  wide.addEventListener?.("change", syncToc);
  syncToc();

  // Collapse the mobile list after choosing a section.
  tocBox?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    if (!wide.matches) tocBox.open = false;
  }));

  /* ---------- Highlight the section in view ---------- */
  const links = [...document.querySelectorAll(".rv-toc a[href^='#']")];
  const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const visible = new Map();
    const mark = () => {
      const current = sections.find((section) => visible.get(section));
      if (!current) return;
      links.forEach((link) => {
        if (link.getAttribute("href") === `#${current.id}`) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visible.set(entry.target, entry.isIntersecting));
      mark();
    }, { rootMargin: "-120px 0px -55% 0px" });
    sections.forEach((section) => observer.observe(section));
  }
})();
