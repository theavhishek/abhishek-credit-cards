/* /movie-offers: renders and filters window.MOVIE_OFFERS.
 * Both lists are baked into movie-offers.html by scripts/movie-offers/bake.mjs (pnpm build:movies),
 * so the page reads without JavaScript; this script only adds the tabs, filters and search. */
(function () {
  const LOGOS = {
    "AU Small Finance Bank": "aubl.svg", "SBI Card": "sbin.svg", "Axis Bank": "utib.svg", "BOBCARD": "barb.svg",
    "Bank of Baroda": "barb.svg", "Bank of India": "bkid.svg", "Canara Bank": "cnrb.svg", "CSB Bank": "csbk.svg",
    "DBS Bank": "dbs.svg", "Federal Bank": "fdrl.svg", "HDFC Bank": "hdfc.svg", "HSBC": "hsbc.svg",
    "ICICI Bank": "icic.svg", "IDFC FIRST Bank": "idfb.svg", "Indian Bank": "idib.svg", "IndusInd Bank": "indb.svg",
    "Kotak Mahindra Bank": "kkbk.svg", "Punjab National Bank": "punb.svg", "RBL Bank": "ratn.svg",
    "SBM Bank": "sbm.png", "Standard Chartered": "scbl.svg", "Union Bank of India": "ubin.svg", "YES Bank": "yesb.svg",
    "Bandhan Bank": "bdbl.svg", "City Union Bank": "ciub.svg", "DCB Bank": "dcbl.svg", "IDBI Bank": "ibkl.svg",
    "Indian Overseas Bank": "ioba.svg", "J&K Bank": "jaka.svg", "Visa": "visa.svg",
  };
  // A network is shown only when every card the offer names carries it in its name
  // (e.g. "Sapphiro Visa", "Tiara RuPay"); otherwise the offer isn't tied to one network.
  const NETWORKS = [["visa", "Visa", /\bvisa\b/i], ["mastercard", "Mastercard", /\bmastercard\b/i], ["rupay", "RuPay", /\brupay\b/i],
    ["amex", "American Express", /\bamerican express\b|\bamex\b/i], ["diners", "Diners Club", /\bdiners\b/i]];
  const networkOf = (o) => {
    if (o.network) return NETWORKS.find(([k]) => k === o.network) || null;
    // Network programmes listed as the "bank" (Visa, RuPay) count as that network.
    const hit = NETWORKS.filter(([, , re]) => re.test(o.bank) || o.cards.every((n) => re.test(n)));
    return hit.length === 1 ? hit[0] : null;
  };
  const PLATFORM_ORDER = { bms: 0, district: 1, pvr: 2 };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const fmtDate = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}`;
  };
  const host = (url) => {
    const h = (url.match(/^https?:\/\/([^\/]+)/) || [])[1] || "";
    if (h.includes("bookmyshow")) return "BookMyShow";
    if (h.includes("district")) return "District";
    return null;
  };

  function logoHTML(bank) {
    const file = LOGOS[bank];
    if (file) return `<span class="mo-logo" aria-hidden="true"><img src="/assets/bank-logos/${file}" alt="" width="28" height="28" loading="lazy" decoding="async"></span>`;
    return `<span class="mo-logo mo-logo--text" aria-hidden="true">${esc(bank.charAt(0))}</span>`;
  }

  function itemHTML(o, data) {
    const p = data.platforms[o.platform];
    const until = o.validTill ? fmtDate(o.validTill) : null;
    const inr = (n) => n && `₹${Number(n).toLocaleString("en-IN")}`;
    const facts = [
      ["How often", o.limit], ["Min. tickets", o.minTickets], ["Min. booking", inr(o.minOrder)], ["Max a month", inr(o.monthCap)],
      ["Spend needed", o.spend], ["Days", o.days], ["Promo code", o.code],
      ["Valid", o.validFrom && until ? `${fmtDate(o.validFrom)} to ${until}` : until && `Till ${until}`],
    ].filter(([, v]) => v);
    const factsHTML = facts.length
      ? `<dl class="mo-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd${k === "Promo code" ? ' class="mo-code"' : ""}>${esc(v)}</dd></div>`).join("")}</dl>`
      : "";
    const cards = o.cards.join(", ");
    const net = networkOf(o);
    const words = [o.bank, cards, o.benefit, p.name, o.cardType, net ? net[1] : ""].join(" ").toLowerCase();
    const where = o.sourceLabel ? `in ${o.sourceLabel}` : `on ${host(o.source) || o.bank}`;
    const label = o.status === "checked" ? "Terms checked" : "Listed, terms not checked yet";
    return `<li class="mo-item" data-platform="${o.platform}" data-type="${o.type}" data-card="${o.cardType}"${net ? ` data-network="${net[0]}"` : ""} data-bank="${esc(o.bank)}"${o.validTill ? ` data-until="${o.validTill}"` : ""} data-words="${esc(words)}">
      ${logoHTML(o.bank)}
      <div class="mo-body">
        <p class="mo-meta"><span class="mo-type mo-type--${o.type}">${esc(data.types[o.type])}</span><span>${esc(p.name)}</span><span>${o.cardType === "debit" ? "Debit card" : "Credit card"}</span>${net ? `<span>${net[1]}</span>` : ""}</p>
        <h3 class="mo-card"><span class="mo-bank">${esc(o.bank)}</span> ${esc(cards)}</h3>
        <p class="mo-benefit">${esc(o.benefit)}</p>
        ${factsHTML}
        ${o.note ? `<p class="mo-note">${esc(o.note)}</p>` : ""}
        <p class="mo-src"><a href="${esc(o.source)}" target="_blank" rel="noopener noreferrer">Terms ${esc(where)}<span class="sr-only"> (opens in a new tab)</span></a><span aria-hidden="true">·</span>${label} ${fmtDate(o.checked)}</p>
      </div>
    </li>`;
  }

  function sortOffers(offers) {
    return offers.slice().sort((a, b) =>
      a.bank.localeCompare(b.bank) || PLATFORM_ORDER[a.platform] - PLATFORM_ORDER[b.platform] || a.cards[0].localeCompare(b.cards[0]));
  }

  const listHTML = (data, status) =>
    sortOffers(data.offers.filter((o) => o.status === status)).map((o) => itemHTML(o, data)).join("");

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
    const groups = [...root.querySelectorAll(".mo-group")].map((g) => ({ el: g, items: [...g.querySelectorAll(".mo-item")] }));
    const tabs = [...root.querySelectorAll(".mo-tab")];
    const q = root.querySelector("#mo-q");
    const bank = root.querySelector("#mo-bank");
    const type = root.querySelector("#mo-type");
    const card = root.querySelector("#mo-card");
    const network = root.querySelector("#mo-network");
    const count = root.querySelector("#mo-count");
    const empty = root.querySelector("#mo-empty");
    const today = new Date().toISOString().slice(0, 10);
    let platform = "all";

    const apply = () => {
      const words = (q.value || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
      let total = 0;
      for (const g of groups) {
        let shown = 0;
        for (const el of g.items) {
          const ok = (platform === "all" || el.dataset.platform === platform)
            && (!bank.value || el.dataset.bank === bank.value)
            && (!type.value || el.dataset.type === type.value)
            && (!card.value || el.dataset.card === card.value)
            && (!network.value || el.dataset.network === network.value)
            && (!el.dataset.until || el.dataset.until >= today)
            && words.every((w) => el.dataset.words.includes(w));
          el.hidden = !ok;
          if (ok) shown++;
        }
        g.el.hidden = shown === 0;
        total += shown;
      }
      count.textContent = `${total} ${total === 1 ? "offer" : "offers"}`;
      empty.hidden = total !== 0;
    };

    tabs.forEach((t) => t.addEventListener("click", () => {
      platform = t.dataset.platform;
      tabs.forEach((x) => x.setAttribute("aria-pressed", String(x === t)));
      apply();
    }));
    q.addEventListener("input", apply);
    [bank, type, card, network].forEach((s) => s.addEventListener("change", apply));
    root.querySelector("#mo-reset")?.addEventListener("click", () => {
      q.value = ""; bank.value = ""; type.value = ""; card.value = ""; network.value = "";
      tabs[0].click();
    });
    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
