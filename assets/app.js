(() => {
  const $ = (s) => document.querySelector(s);
  const source = window.PORTFOLIO_DATA || { meta: {}, cards: [] };
  const cards = source.cards || [];
  const esc = (v = "") => String(v).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));

  const root = document.documentElement;
  const themeSwitch = $("#themeSwitch");
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function setTheme(theme, persist = true) {
    const dark = theme === "dark";
    root.dataset.theme = theme;
    if (themeSwitch) {
      themeSwitch.checked = !dark;
      themeSwitch.setAttribute("aria-label", dark ? "Switch to day mode" : "Switch to night mode");
    }
    themeMeta?.setAttribute("content", dark ? "#101214" : "#f3f5f6");
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
          if (window.scrollY > 20) {
            navbarShell.classList.add("scrolled");
          } else {
            navbarShell.classList.remove("scrolled");
          }
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
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  setText("#statCards", cards.length);
  setText("#statBanks", new Set(cards.map(c => c.bank)).size);
  setText("#statRupay", cards.filter(c => c.network === "RuPay").length);
  setText("#statPartner", cards.filter(c => c.tag === "❤️").length);
  setText("#updatedText", `Updated ${(meta.updated || "September 2026").replace("September","Sep")}`);
  setText("#year", new Date().getFullYear());

  const bankFilter = $("#bankFilter"), networkFilter = $("#networkFilter"), search = $("#searchInput");
  const board = $("#stackBoard"), empty = $("#emptyState"), count = $("#resultCount");
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
  function filteredCards() {
    const q = (search?.value || "").trim().toLowerCase();
    return cards.filter(card => {
      const haystack = [card.bank,card.card,card.network,card.rewardType,card.annualFee,card.tag,...(card.bestFor||[])].filter(Boolean).join(" ").toLowerCase();
      return (!q || haystack.includes(q)) && (!bankFilter || bankFilter.value === "all" || card.bank === bankFilter.value) && (!networkFilter || networkFilter.value === "all" || card.network === networkFilter.value) && matchesQuick(card);
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
    return `<button class="card-row" type="button" data-card-index="${cards.indexOf(card)}"><span class="card-copy"><span class="card-title-line"><strong class="card-name">${esc(card.card)}</strong>${card.network?`<span class="network">${esc(card.network)}</span>`:""}</span><span class="card-meta-line"><span>${esc(card.rewardType||"Rewards")}</span>${tags(card)}</span></span><span class="fee-pill ${fee.cls}">${fee.label}</span><svg class="card-chevron" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>`;
  }
  function bankGroup(group) {
    const short = bankShort[group.bank] || group.bank;
    return `<section class="bank-group"><div class="bank-group-head"><span class="bank-logo-wrap">${logoMarkup(group.bank)}</span><span class="bank-heading-copy"><strong>${esc(group.bank)}</strong><span>${group.cards.length} ${group.cards.length===1?"card":"cards"}</span></span><span class="bank-short">${esc(short)}</span></div><div class="bank-cards">${group.cards.map(cardRow).join("")}</div></section>`;
  }
  function render() {
    const list = filteredCards(), groups = groupCards(list), [left,right] = splitGroups(groups);
    if (board) {
      board.innerHTML = `<div class="stack-column">${left.map(bankGroup).join("")}</div><div class="stack-column">${right.map(bankGroup).join("")}</div>`;
      board.hidden = list.length === 0;
      installLogoFallbacks(board);
    }
    if (empty) empty.hidden = list.length > 0;
    if (count) count.textContent = `${list.length} card${list.length===1?"":"s"}`;
  }
  function reset() {
    if (search) search.value="";
    if (bankFilter) bankFilter.value="all";
    if (networkFilter) networkFilter.value="all";
    quick="all";
    quickButtons.forEach(b => { const active=b.dataset.quick==="all"; b.classList.toggle("active",active); b.setAttribute("aria-pressed",String(active)); });
    render();
  }
  search?.addEventListener("input",render);
  bankFilter?.addEventListener("change",render);
  networkFilter?.addEventListener("change",render);
  $("#clearFilters")?.addEventListener("click",reset);
  $("#emptyReset")?.addEventListener("click",reset);
  quickButtons.forEach(button => button.addEventListener("click",()=>{
    quick=button.dataset.quick;
    quickButtons.forEach(b=>{const active=b===button;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});
    render();
  }));

  const dialog=$("#cardDialog"), content=$("#dialogContent"), close=$("#dialogClose");
  let lastTrigger=null;
  board?.addEventListener("click",(event)=>{
    const trigger=event.target.closest("[data-card-index]");
    if(!trigger || !dialog || !content) return;
    const card=cards[Number(trigger.dataset.cardIndex)], fee=feeInfo(card);
    lastTrigger=trigger;
    content.innerHTML=`<div class="dialog-body"><div class="dialog-bank"><span class="bank-logo-wrap">${logoMarkup(card.bank)}</span><span>${esc(card.bank)}</span></div><h2 class="dialog-title" id="dialogTitle">${esc(card.card)}</h2><div class="dialog-tags">${card.network?`<span class="mini-tag">${esc(card.network)}</span>`:""}${tags(card)}</div><div class="detail-grid"><div class="detail"><span>Status</span><strong>${esc(card.status||"Active")}</strong></div><div class="detail"><span>Network</span><strong>${esc(card.network||"Not specified")}</strong></div><div class="detail"><span>Fee status</span><strong>${esc(fee.detail)}</strong></div><div class="detail"><span>Reward style</span><strong>${esc(card.rewardType||"Not specified")}</strong></div></div>${(card.bestFor||[]).length?`<div class="best-for"><span>Useful for</span><div>${card.bestFor.map(x=>`<span class="use-tag">${esc(x)}</span>`).join("")}</div></div>`:""}</div>`;
    installLogoFallbacks(content);
    dialog.showModal();
    close?.focus();
  });
  close?.addEventListener("click",()=>dialog?.close());
  dialog?.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
  function initHeadlineTextAnimate() {
    const h1 = document.querySelector(".hero-copy h1");
    if (!h1 || h1.dataset.textAnimateBound) return;
    h1.dataset.textAnimateBound = "1";
    const plainText = h1.textContent.replace(/\s+/g, " ").trim();
    h1.setAttribute("aria-label", plainText);

    let charIndex = 0;
    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const frag = document.createDocumentFragment();
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          const span = document.createElement("span");
          span.className = "text-animate-char";
          span.style.setProperty("--char-index", charIndex++);
          span.textContent = ch === " " ? "\u00A0" : ch;
          frag.appendChild(span);
        }
        return frag;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === "BR") {
          return node.cloneNode(true);
        }
        const clone = node.cloneNode(false);
        Array.from(node.childNodes).forEach(child => {
          clone.appendChild(processNode(child));
        });
        return clone;
      }
      return node.cloneNode(true);
    }

    const fragment = document.createDocumentFragment();
    Array.from(h1.childNodes).forEach(child => {
      fragment.appendChild(processNode(child));
    });

    h1.replaceChildren(fragment);
    h1.classList.add("text-animate-ready");
  }

  initHeadlineTextAnimate();

  const heroCard = document.querySelector(".cardholder-titanium");
  if (heroCard) {
    heroCard.addEventListener("mousemove", (e) => {
      const rect = heroCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;
      heroCard.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    heroCard.addEventListener("mouseleave", () => {
      heroCard.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
  }

  render();
})();
