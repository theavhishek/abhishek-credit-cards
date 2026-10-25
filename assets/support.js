(() => {
  const D = window.SUPPORT_CONTACTS || {};
  const $ = (s) => document.querySelector(s);
  const esc = (v = "") => String(v).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
  const arr = (v) => Array.isArray(v) ? v : (v ? [v] : []);

  const bankDomains = {"Axis Bank": "axis.bank.in", "Kotak Mahindra Bank": "kotak.com", "SBI Card": "sbicard.com", "IDFC FIRST Bank": "idfcfirstbank.com", "ICICI Bank": "icicibank.com", "BOBCARD": "bobcard.co.in", "YES BANK": "yesbank.in", "HDFC Bank": "hdfcbank.com", "Punjab National Bank": "pnbindia.in", "Indian Bank": "indianbank.in", "Bank of India": "bankofindia.co.in", "Canara Bank": "canarabank.com", "OneCard": "getonecard.app", "RBL Bank": "rblbank.com", "IndusInd Bank": "indusind.com", "Equitas Small Finance Bank": "equitasbank.com", "AU Small Finance Bank": "aubank.in", "HSBC India": "hsbc.co.in", "American Express": "americanexpress.com", "SBM Bank India": "sbmbank.co.in", "Unity Small Finance Bank": "theunitybank.com", "CSB Bank": "csb.co.in", "Federal Bank": "federalbank.co.in", "Standard Chartered Bank": "sc.com", "Union Bank of India": "unionbankofindia.co.in"};
  const portfolioOrder = ["Axis Bank", "Kotak Mahindra Bank", "SBI Card", "IDFC FIRST Bank", "ICICI Bank", "BOBCARD", "YES BANK", "HDFC Bank", "Punjab National Bank", "Indian Bank", "Bank of India", "Canara Bank", "OneCard", "RBL Bank", "IndusInd Bank", "Equitas Small Finance Bank", "AU Small Finance Bank", "HSBC India", "American Express", "SBM Bank India", "Unity Small Finance Bank", "CSB Bank"];
  const extraBanks = Object.keys(D).filter(b => !portfolioOrder.includes(b));
  const banks = [...portfolioOrder, ...extraBanks];

  const rows = $("#supportRows");
  const search = $("#supportSearch");
  const empty = $("#supportEmpty");
  const count = $("#supportCount");
  const year = $("#year");
  const themeSwitch = $("#themeSwitch");
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  if (count) count.textContent = `${banks.length} banks`;
  if (year) year.textContent = new Date().getFullYear();

  function setTheme(theme, persist = true) {
    const dark = theme === "dark";
    document.documentElement.dataset.theme = theme;
    if (themeSwitch) {
      themeSwitch.checked = !dark;
      themeSwitch.setAttribute("aria-label", dark ? "Switch to day mode" : "Switch to night mode");
    }
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
      m.setAttribute("content", dark ? "#000000" : "#eef1f3");
    });
    if (persist) localStorage.setItem("abhishek-card-stack-theme", theme);
  }
  setTheme(document.documentElement.dataset.theme || "light", false);
  themeSwitch?.addEventListener("change", () => setTheme(themeSwitch.checked ? "light" : "dark"));

  function initials(name) {
    return name.replace(/Small Finance Bank/gi,"SFB").replace(/Bank/gi,"").trim()
      .split(/\s+/).map(x => x[0]).join("").slice(0,2).toUpperCase();
  }

  function logoMarkup(bank) {
    const domain = bankDomains[bank];
    const fallback = initials(bank);
    const png = domain ? window.BANK_LOGO_PNG?.[domain] : "";
    if (!png) return `<span class="support-bank-fallback" style="display:grid">${esc(fallback)}</span>`;
    return `<img class="support-bank-img" src="${esc(png)}" alt="" aria-hidden="true" loading="lazy" decoding="async"><span class="support-bank-fallback">${esc(fallback)}</span>`;
  }

  function installLogoFallbacks() {
    rows?.querySelectorAll(".support-bank-img").forEach(img => {
      img.addEventListener("error", () => {
        img.hidden = true;
        const fallback = img.nextElementSibling;
        if (fallback) fallback.style.display = "grid";
      }, { once: true });
    });
  }

  function phoneLink(value) {
    const tel = String(value).replace(/[^\d+]/g,"");
    return `<a class="support-link-value" href="tel:${esc(tel)}">${esc(value)}</a>`;
  }
  function mailLink(value) {
    return `<a class="support-link-value" href="mailto:${esc(value)}">${esc(value)}</a>`;
  }
  function block(values, type, label = "") {
    const items = arr(values);
    if (!items.length) return "";
    return `<div class="support-contact-block">
      ${label ? `<span class="support-contact-label">${esc(label)}</span>` : ""}
      ${items.map(type === "phone" ? phoneLink : mailLink).join("")}
    </div>`;
  }
  function emptyValue() {
    return '<span class="support-empty-value" aria-label="Not listed">—</span>';
  }
  function helplineCell(entry) {
    const parts = [block(entry.care,"phone")];
    for (const extra of (entry.helplineExtras || [])) parts.push(block(extra.values,"phone",extra.label));
    const html = parts.filter(Boolean).join("");
    return html ? `<div class="support-cell-stack">${html}</div>` : emptyValue();
  }
  function emailCell(entry, level) {
    const parts = [block(entry[`l${level}Email`],"mail")];
    if (level === 1) for (const extra of (entry.l1Extras || [])) parts.push(block(extra.emails,"mail",extra.label));
    if (level === 3) for (const extra of (entry.extras || [])) parts.push(block(extra.emails,"mail",extra.label));
    const html = parts.filter(Boolean).join("");
    return html ? `<div class="support-cell-stack">${html}</div>` : emptyValue();
  }
  function row(bank) {
    const c = D[bank] || {};
    return `<tr>
      <th scope="row"><div class="support-bank"><span class="support-bank-logo">${logoMarkup(bank)}</span><span class="support-bank-copy"><strong>${esc(bank)}</strong><span>Credit card support</span></span></div></th>
      <td>${helplineCell(c)}</td>
      <td>${emailCell(c,1)}</td>
      <td>${emailCell(c,2)}</td>
      <td>${emailCell(c,3)}</td>
    </tr>`;
  }
  function render() {
    if (!rows) return;
    const q = (search?.value || "").trim().toLowerCase();
    const filtered = banks.filter(bank =>
      !q || bank.toLowerCase().includes(q) || JSON.stringify(D[bank] || {}).toLowerCase().includes(q)
    );
    rows.innerHTML = filtered.map(row).join("");
    installLogoFallbacks();
    if (empty) empty.hidden = filtered.length > 0;
    const table = rows.closest("table");
    if (table) table.hidden = filtered.length === 0;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get("q") || sessionStorage.getItem("support_search_query") || "";
  if (initialQuery && search) {
    search.value = initialQuery;
  }

  const refreshBtn = $("#refreshDirectory");
  refreshBtn?.addEventListener("click", () => {
    refreshBtn.style.opacity = "0.7";
    refreshBtn.style.pointerEvents = "none";
    const q = (search?.value || "").trim();
    if (q) {
      sessionStorage.setItem("support_search_query", q);
    } else {
      sessionStorage.removeItem("support_search_query");
    }
    const url = new URL(window.location.href);
    url.searchParams.set("t", Date.now());
    if (q) {
      url.searchParams.set("q", q);
    } else {
      url.searchParams.delete("q");
    }
    window.location.href = url.toString();
  });

  search?.addEventListener("input", render);
  render();

  const navbarShell = document.querySelector("#navbarShell") || document.querySelector(".topbar-shell");
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
})();
