/* /movie-offers: renders and filters window.MOVIE_OFFERS.
 * The list is also baked into movie-offers.html by scripts/movie-offers/bake.mjs (pnpm build:movies),
 * so the page reads without JavaScript; this script only adds the tabs, filters and search. */
(function () {
  const LOGOS = {
    "AU Small Finance Bank": "aubl.svg", "SBI Card": "sbin.svg", "Axis Bank": "utib.svg", "BOBCARD": "barb.svg",
    "Bank of India": "bkid.svg", "Canara Bank": "cnrb.svg", "DBS Bank": "dbs.svg", "Federal Bank": "fdrl.svg",
    "HDFC Bank": "hdfc.svg", "HSBC": "hsbc.svg", "ICICI Bank": "icic.svg", "IDFC FIRST Bank": "idfb.svg",
    "Indian Bank": "idib.svg", "IndusInd Bank": "indb.svg", "Kotak Mahindra Bank": "kkbk.svg",
    "Punjab National Bank": "punb.svg", "RBL Bank": "ratn.svg", "SBM Bank": "sbm.png",
    "Standard Chartered": "scbl.svg", "Union Bank of India": "ubin.svg", "YES BANK": "yesb.svg",
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const fmtDate = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}`;
  };

  function logoHTML(bank) {
    const file = LOGOS[bank];
    if (file) return `<span class="mo-logo" aria-hidden="true"><img src="/assets/bank-logos/${file}" alt="" width="28" height="28" loading="lazy" decoding="async"></span>`;
    return `<span class="mo-logo mo-logo--text" aria-hidden="true">${esc(bank.charAt(0))}</span>`;
  }

  function itemHTML(o, data) {
    const p = data.platforms[o.platform];
    const facts = [
      ["Max off", o.cap], ["How often", o.limit], ["Rules", o.rules],
      ["Valid till", o.validTill && fmtDate(o.validTill)],
    ].filter(([, v]) => v);
    const factsHTML = facts.length
      ? `<dl class="mo-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`
      : "";
    const words = [o.bank, o.cards, o.benefit, p.name].join(" ").toLowerCase();
    return `<li class="mo-item" data-platform="${o.platform}" data-type="${o.type}" data-bank="${esc(o.bank)}"${o.validTill ? ` data-until="${o.validTill}"` : ""} data-words="${esc(words)}">
      ${logoHTML(o.bank)}
      <div class="mo-body">
        <p class="mo-meta"><span class="mo-type mo-type--${o.type}">${esc(data.types[o.type])}</span><span>${esc(p.name)}</span></p>
        <h3 class="mo-card">${esc(o.cards)}</h3>
        <p class="mo-benefit">${esc(o.benefit)}</p>
        ${factsHTML}
        <p class="mo-src"><a href="${esc(o.source)}" target="_blank" rel="noopener noreferrer">Terms on ${esc(p.name)}<span class="sr-only"> (opens in a new tab)</span></a><span aria-hidden="true">·</span>Checked ${fmtDate(o.checked)}</p>
      </div>
    </li>`;
  }

  function sortOffers(offers) {
    return offers.slice().sort((a, b) => a.bank.localeCompare(b.bank) || a.cards.localeCompare(b.cards));
  }

  function listHTML(data) {
    return sortOffers(data.offers).map((o) => itemHTML(o, data)).join("");
  }

  function banksHTML(data) {
    const banks = [...new Set(data.offers.map((o) => o.bank))].sort((a, b) => a.localeCompare(b));
    return banks.map((b) => `<option value="${esc(b)}">${esc(b)}</option>`).join("");
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { listHTML, banksHTML };
  if (typeof document === "undefined") return;

  function init() {
    const root = document.querySelector("[data-movie-offers]");
    if (!root) return;
    document.documentElement.classList.add("mo-js");
    const items = [...root.querySelectorAll(".mo-item")];
    const tabs = [...root.querySelectorAll(".mo-tab")];
    const q = root.querySelector("#mo-q");
    const bank = root.querySelector("#mo-bank");
    const type = root.querySelector("#mo-type");
    const count = root.querySelector("#mo-count");
    const empty = root.querySelector("#mo-empty");
    const today = new Date().toISOString().slice(0, 10);
    let platform = "all";

    const apply = () => {
      const words = (q.value || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const el of items) {
        const ok = (platform === "all" || el.dataset.platform === platform)
          && (!bank.value || el.dataset.bank === bank.value)
          && (!type.value || el.dataset.type === type.value)
          && (!el.dataset.until || el.dataset.until >= today)
          && words.every((w) => el.dataset.words.includes(w));
        el.hidden = !ok;
        if (ok) shown++;
      }
      count.textContent = `${shown} ${shown === 1 ? "offer" : "offers"}`;
      empty.hidden = shown !== 0;
    };

    tabs.forEach((t) => t.addEventListener("click", () => {
      platform = t.dataset.platform;
      tabs.forEach((x) => x.setAttribute("aria-pressed", String(x === t)));
      apply();
    }));
    q.addEventListener("input", apply);
    bank.addEventListener("change", apply);
    type.addEventListener("change", apply);
    root.querySelector("#mo-reset")?.addEventListener("click", () => {
      q.value = ""; bank.value = ""; type.value = "";
      tabs[0].click();
    });
    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
