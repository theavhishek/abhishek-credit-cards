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

  const bankDomains = {
    "Axis Bank":"axis.bank.in","Kotak Mahindra Bank":"kotak.com","SBI Card":"sbicard.com",
    "IDFC FIRST Bank":"idfcfirstbank.com","ICICI Bank":"icicibank.com","BOBCARD":"bobcard.co.in",
    "YES BANK":"yesbank.in","HDFC Bank":"hdfcbank.com","Punjab National Bank":"pnbindia.in",
    "Indian Bank":"indianbank.in","Bank of India":"bankofindia.co.in","Canara Bank":"canarabank.com",
    "OneCard":"getonecard.app","RBL Bank":"rblbank.com","IndusInd Bank":"indusind.com",
    "Equitas Small Finance Bank":"equitasbank.com","AU Small Finance Bank":"aubank.in",
    "HSBC India":"hsbc.co.in","American Express":"americanexpress.com","SBM Bank India":"sbmbank.co.in",
    "Unity Small Finance Bank":"theunitybank.com","CSB Bank":"csb.co.in"
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
    const domain = bankDomains[bankName];
    const fallback = (bankShort[bankName] || bankName).replace(/[^A-Za-z0-9]/g,"").slice(0,2).toUpperCase();
    if (!domain) return `<span class="logo-fallback" style="display:grid">${esc(fallback)}</span>`;
    return `<img class="bank-logo" alt="" data-domain="${esc(domain)}" data-logo-stage="0" src="https://${esc(domain)}/apple-touch-icon.png" loading="lazy" referrerpolicy="no-referrer"><span class="logo-fallback">${esc(fallback)}</span>`;
  }

  function installLogoFallbacks(scope = document) {
    scope.querySelectorAll(".bank-logo").forEach((img) => {
      if (img.dataset.logoBound) return;
      img.dataset.logoBound = "1";
      img.addEventListener("error", () => {
        const domain = img.dataset.domain;
        const stage = Number(img.dataset.logoStage || "0");
        if (stage === 0) {
          img.dataset.logoStage = "1";
          img.src = `https://${domain}/favicon.ico`;
          return;
        }
        if (stage === 1) {
          img.dataset.logoStage = "2";
          img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
          return;
        }
        img.hidden = true;
        const fallback = img.nextElementSibling;
        if (fallback) fallback.style.display = "grid";
      });
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
