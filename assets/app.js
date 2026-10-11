(() => {
  const $ = (s) => document.querySelector(s);
  const source = window.PORTFOLIO_DATA || { meta: {}, cards: [] };
  const cards = source.cards || [];
  const esc = (v = "") => String(v).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));

  const root = document.documentElement;
  const themeSwitch = $("#themeSwitch");

  function setTheme(theme, persist = true) {
    const dark = theme === "dark";
    root.dataset.theme = theme;
    if (themeSwitch) {
      themeSwitch.checked = !dark;
      themeSwitch.setAttribute("aria-label", dark ? "Switch to day mode" : "Switch to night mode");
    }
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
      m.setAttribute("content", dark ? "#000000" : "#eef1f3");
    });
    if (persist) localStorage.setItem("abhishek-card-stack-theme", theme);
  }
  setTheme(root.dataset.theme || "light", false);
  themeSwitch?.addEventListener("change", () => setTheme(themeSwitch.checked ? "light" : "dark"));

  const navbarShell = $("#navbarShell") || document.querySelector(".topbar-shell");
  if (navbarShell) {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          navbarShell.classList.toggle("scrolled", window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  }

  const bankLogoFiles = {
    "Axis Bank":"utib.svg","Kotak Mahindra Bank":"kkbk.svg","SBI Card":"sbin.svg",
    "IDFC FIRST Bank":"idfb.svg","ICICI Bank":"icic.svg","BOBCARD":"barb.svg",
    "YES BANK":"yesb.svg","HDFC Bank":"hdfc.svg","Punjab National Bank":"punb.svg",
    "Indian Bank":"idib.svg","Bank of India":"bkid.svg","Canara Bank":"cnrb.svg",
    "OneCard":"onecard.svg","RBL Bank":"ratn.svg","IndusInd Bank":"indb.svg",
    "AU Small Finance Bank":"aubl.svg","HSBC India":"hsbc.svg",
    "American Express":"americanexpress.svg","Unity Small Finance Bank":"unity-custom.png",
    "CSB Bank":"csbk.svg"
  };
  const remainingLogoSources = {
    "Equitas Small Finance Bank":"https://www.equitasbank.com/strapi-dev/uploads/Group_2_cad9c29024.svg",
    "SBM Bank India":"https://www.google.com/s2/favicons?domain=www.sbmbank.co.in&sz=256"
  };
  const bankShort = {
    "Axis Bank":"AXIS","Kotak Mahindra Bank":"KOTAK","SBI Card":"SBI CARD","IDFC FIRST Bank":"IDFC FIRST",
    "ICICI Bank":"ICICI","BOBCARD":"BOBCARD","YES BANK":"YES BANK","HDFC Bank":"HDFC",
    "Punjab National Bank":"PNB","Indian Bank":"INDIAN BANK","Bank of India":"BOI","Canara Bank":"CANARA",
    "OneCard":"ONECARD","RBL Bank":"RBL","IndusInd Bank":"INDUSIND","Equitas Small Finance Bank":"EQUITAS",
    "AU Small Finance Bank":"AU SFB","HSBC India":"HSBC","American Express":"AMEX","SBM Bank India":"SBM",
    "Unity Small Finance Bank":"UNITY","CSB Bank":"CSB"
  };

  function logoMarkup(bankName) {
    const src = bankLogoFiles[bankName]
      ? `assets/bank-logos/${bankLogoFiles[bankName]}`
      : remainingLogoSources[bankName];
    const fallback = (bankShort[bankName] || bankName).replace(/[^A-Za-z0-9]/g,"").slice(0,2).toUpperCase();
    if (!src) return `<span class="logo-fallback" style="display:grid">${esc(fallback)}</span>`;
    return `<img class="bank-logo" alt="" src="${esc(src)}" loading="lazy" decoding="async"><span class="logo-fallback">${esc(fallback)}</span>`;
  }

  function installLogoFallbacks(scope = document) {
    scope.querySelectorAll(".bank-logo").forEach((img) => {
      if (img.dataset.logoBound) return;
      img.dataset.logoBound = "1";
      img.addEventListener("error", () => {
        img.hidden = true;
        const fallback = img.nextElementSibling;
        if (fallback) fallback.style.display = "grid";
      });
      if (img.complete && img.naturalWidth === 0) img.dispatchEvent(new Event("error"));
    });
  }

  const meta = source.meta || {};
  function formatUpdatedDate(str) {
    if (!str) return "Sep 2026";
    const months = {
      January:"Jan", February:"Feb", March:"Mar", April:"Apr", May:"May", June:"Jun",
      July:"Jul", August:"Aug", September:"Sep", October:"Oct", November:"Nov", December:"Dec"
    };
    return str.replace(/^[A-Za-z]+/, m => months[m] || m);
  }

  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  setText("#updatedText", `Updated ${formatUpdatedDate(meta.updated || "September 2026")}`);
  setText("#year", new Date().getFullYear());

  setText("#statCards", cards.length);
  setText("#statBanks", new Set(cards.map(c => c.bank)).size);
  setText("#statRupay", cards.filter(c => c.network === "RuPay").length);
  setText("#statPartner", cards.filter(c => c.tag === "❤️").length);

  const bankFilter = $("#bankFilter");
  const networkFilter = $("#networkFilter");
  const search = $("#searchInput");
  const board = $("#stackBoard");
  const empty = $("#emptyState");
  const count = $("#resultCount");
  const quickButtons = [...document.querySelectorAll("[data-quick]")];
  let quick = "all";

  [...new Set(cards.map(c => c.bank))].sort().forEach(name => {
    if (!bankFilter) return;
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    bankFilter.appendChild(option);
  });

  function feeInfo(card) {
    if (card.annualFee === "LTF") return {label:"LTF", cls:"fee-ltf", detail:"Lifetime free"};
    if (card.tag === "Paid") return {label:"Paid", cls:"fee-paid", detail:"Annual fee applicable"};
    if (card.tag === "Waiver") return {label:"Waiver", cls:"fee-waiver", detail:"Fee waiver available"};
    return {label:"—", cls:"fee-unknown", detail:"Fee not specified"};
  }

  function tags(card) {
    return `${card.tag === "❤️" ? '<span class="mini-tag partner-tag">Partner</span>' : ""}${card.tag === "Secured" ? '<span class="mini-tag secured-tag">Secured</span>' : ""}`;
  }

  function matchesQuick(card) {
    if (quick === "ltf") return card.annualFee === "LTF";
    if (quick === "rupay") return card.network === "RuPay";
    if (quick === "partner") return card.tag === "❤️";
    if (quick === "cashback") return card.rewardType === "Cashback";
    return true;
  }

  const bankAliases = {
    "Punjab National Bank":["pnb"],
    "SBI Card":["sbi"],
    "BOBCARD":["bob","bank of baroda"],
    "American Express":["amex"],
    "Standard Chartered Bank":["scb"],
    "IDFC FIRST Bank":["idfc"],
    "AU Small Finance Bank":["au","au sfb"],
    "Bank of India":["boi"],
    "State Bank of India":["sbi"]
  };

  function filteredCards() {
    const q = (search?.value || "").trim().toLowerCase();
    return cards.filter(card => {
      const haystack = [card.bank,...(bankAliases[card.bank] || []),card.card,card.network,card.rewardType,card.annualFee,card.tag,...(card.bestFor||[])].filter(Boolean).join(" ").toLowerCase();
      return (!q || haystack.includes(q)) &&
        (!bankFilter || bankFilter.value === "all" || card.bank === bankFilter.value) &&
        (!networkFilter || networkFilter.value === "all" || card.network === networkFilter.value) &&
        matchesQuick(card);
    });
  }

  function groupCards(list) {
    const groups = [];
    list.forEach(card => {
      const last = groups[groups.length - 1];
      if (!last || last.bank !== card.bank) groups.push({bank:card.bank,cards:[card]});
      else last.cards.push(card);
    });
    return groups;
  }

  function splitGroups(groups) {
    if (groups.length < 2) return [groups, []];
    const left = [], right = [];
    let leftH = 0, rightH = 0;
    groups.forEach(g => {
      const h = 75 + g.cards.length * 62;
      if (leftH <= rightH) {
        left.push(g);
        leftH += h;
      } else {
        right.push(g);
        rightH += h;
      }
    });
    return [left, right];
  }

  function cardRow(card) {
    const fee = feeInfo(card);
    return `<div class="card-row"><span class="card-copy"><span class="card-title-line"><strong class="card-name">${esc(card.card)}</strong>${card.network?`<span class="network">${esc(card.network)}</span>`:""}</span><span class="card-meta-line"><span>${esc(card.rewardType||"Rewards")}</span>${tags(card)}</span></span><span class="fee-pill ${fee.cls}">${fee.label}</span></div>`;
  }

  function bankGroup(group) {
    const short = bankShort[group.bank] || group.bank;
    return `<section class="bank-group"><div class="bank-group-head"><span class="bank-logo-wrap">${logoMarkup(group.bank)}</span><span class="bank-heading-copy"><strong>${esc(group.bank)}</strong><span>${group.cards.length} ${group.cards.length===1?"card":"cards"}</span></span><span class="bank-short">${esc(short)}</span></div><div class="bank-cards">${group.cards.map(cardRow).join("")}</div></section>`;
  }

  function render(isInitial = false) {
    if (isInitial && board && board.children.length > 0 && !(search?.value || "").trim() && (!bankFilter || bankFilter.value === "all") && (!networkFilter || networkFilter.value === "all") && quick === "all") {
      installLogoFallbacks(board);
      const updatedSuffix = meta.updated ? ` · Updated ${formatUpdatedDate(meta.updated)}` : "";
      if (count) count.textContent = `${cards.length} cards${updatedSuffix}`;
      return;
    }
    const list = filteredCards();
    const groups = groupCards(list);
    const [left,right] = splitGroups(groups);
    if (board) {
      board.innerHTML = `<div class="stack-column">${left.map(bankGroup).join("")}</div><div class="stack-column">${right.map(bankGroup).join("")}</div>`;
      board.hidden = list.length === 0;
      installLogoFallbacks(board);
    }
    if (empty) empty.hidden = list.length > 0;
    const updatedSuffix = meta.updated ? ` · Updated ${formatUpdatedDate(meta.updated)}` : "";
    if (count) count.textContent = `${list.length} card${list.length===1?"":"s"}${updatedSuffix}`;
    const clearFilters = $("#clearFilters");
    if (clearFilters) {
      clearFilters.disabled = !((search?.value || "").trim() || bankFilter?.value !== "all" || networkFilter?.value !== "all" || quick !== "all");
    }
  }

  function reset() {
    if (search) search.value = "";
    if (bankFilter) bankFilter.value = "all";
    if (networkFilter) networkFilter.value = "all";
    quick = "all";
    quickButtons.forEach(b => {
      const active = b.dataset.quick === "all";
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    render();
  }

  search?.addEventListener("input", render);
  bankFilter?.addEventListener("change", render);
  networkFilter?.addEventListener("change", render);
  $("#clearFilters")?.addEventListener("click", reset);
  $("#emptyReset")?.addEventListener("click", reset);
  quickButtons.forEach(button => button.addEventListener("click", () => {
    quick = button.dataset.quick;
    quickButtons.forEach(b => {
      const active = b === button;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    render();
  }));

  render(true);
})();
