window.SUPPORT_CONTACTS = {"Axis Bank":{"care":["1800-209-5577","1800-103-5577","1860-500-5555","1860-419-5555"],"l1Email":["customer.services@axisbank.com","creditcards@axisbank.com"],"l2Email":["nodal.officer@axisbank.com"],"l3Email":["pno@axisbank.com"]},"AU Small Finance Bank":{"care":["1800-1200-1200"],"l1Email":["creditcard.support@aubank.in"],"l2Email":["grievance.officer@aubank.in"],"l3Email":[]},"American Express":{"care":["+91-124-2801800","1800-419-3646"],"l1Email":["support@aexp.com"],"l2Email":["Manager-Customerservicesindia@aexp.com"],"l3Email":["Head-Customerservicesindia@aexp.com"],"extras":[{"label":"L4","emails":["AEBCNodalOfficer@aexp.com"]}]},"BOBCARD":{"care":["1800-258-4455"],"l1Email":["ccb@bobcards.com"],"l2Email":["grievance@bobcards.com"],"l3Email":["cs.ho@bankofbaroda.com"]},"Bank of India":{"care":["1800-220-229"],"l1Email":["creditcard@bankofindia.co.in"],"l2Email":["cc.nodalofficer@bankofindia.co.in"],"l3Email":[]},"Federal Bank":{"care":["1800-425-1199","1800-420-1199"],"helplineExtras":[{"label":"Intl","values":["+91-484-2630994","+91-484-2630995"]}],"l1Email":["creditcards@federalbank.co.in"],"l2Email":["creditcardescalation@federalbank.co.in"],"l3Email":["support@federalbank.co.in"]},"HDFC Bank":{"care":["1800-1600","1800-2600"],"helplineExtras":[{"label":"Intl","values":["+91-22-61606160"]}],"l1Email":["customerservices.cards@hdfcbank.com"],"l2Email":["escalation.cc@hdfcbank.com","priorityredressal.creditcards@hdfcbank.com"],"l3Email":["grievance.redressalcc@hdfcbank.com"]},"HSBC India":{"care":["1800-267-3456","1800-121-2208"],"helplineExtras":[{"label":"Premier","values":["1800-266-3456"]}],"l1Email":["cardsupport@hsbc.co.in"],"l2Email":["complaints.india@hsbc.co.in"],"l3Email":["nodalofficerinm@hsbc.co.in"]},"ICICI Bank":{"care":["1800-1080"],"l1Email":["customer.care@icicibank.com"],"l2Email":["headcreditcards@icicibank.com"],"l3Email":["headservicequality@icicibank.com"],"extras":[{"label":"L4","emails":["pno@icicibank.com"]}]},"IDFC FIRST Bank":{"care":["1800-10-888"],"l1Email":["banker@idfcfirstbank.com"],"l2Email":["nodaldesk@idfcfirstbank.com"],"l3Email":["pno@idfcfirstbank.com"]},"IndusInd Bank":{"care":["1860-267-7777","022-44066666"],"l1Email":["reachus@indusind.com"],"l1Extras":[{"label":"Premium","emails":["premium.care@indusind.com"]},{"label":"Legend / Pioneer","emails":["priority.care@indusind.com"]},{"label":"Celesta","emails":["celesta.care@indusind.com"]}],"l2Email":["head.cardservices@indusind.com"],"l3Email":["nodal.officer@indusind.com"]},"Kotak Mahindra Bank":{"care":["1860-266-2666"],"l1Email":["service.cards@kotak.com"],"l2Email":["nodalofficer@kotak.com"],"l3Email":["pno@kotak.com"]},"Punjab National Bank":{"care":["1800-180-2345"],"l1Email":["creditcardpnb@pnb.co.in"],"l2Email":["pno@pnb.co.in"],"l3Email":[]},"RBL Bank":{"care":["+91-22-6232-7777","7119-0900"],"l1Email":["cardservices@rblbank.com"],"l2Email":["headcardservice@rblbank.com"],"l3Email":["principalnodalofficer@rblbank.com"]},"SBI Card":{"care":["1800-180-1290","1860-500-1290"],"l1Email":["customercare@sbicard.com"],"l2Email":["nodalofficer@sbicard.com"],"l3Email":["PrincipalNodalOfficer@sbicard.com"],"extras":[{"label":"L4","emails":["CustomerServiceHead@sbicard.com"]}]},"Standard Chartered Bank":{"care":["1800-267-3456","1800-121-2208"],"l1Email":["customer.care@sc.com"],"l2Email":["Head.Service@sc.com"],"l3Email":["Principal.NodalOfficer@sc.com"]},"Union Bank of India":{"care":["1800-22-3222"],"l1Email":["creditcard@unionbankofindia.bank"],"l2Email":["cardgrievance@unionbankofindia.bank"],"l3Email":[]},"YES BANK":{"care":["1800-103-1212"],"helplineExtras":[{"label":"YES FIRST / Premia","values":["1800-103-6000"]}],"l1Email":["yestouchcc@yesbank.in","yestouch@yesbank.in"],"l2Email":["head.grievanceredressal@yesbank.in"],"l3Email":["principal.nodalofficer@yesbank.in"]}};

(() => {
  const D = window.SUPPORT_CONTACTS || {};
  const banks = ["Axis Bank", "AU Small Finance Bank", "American Express", "BOBCARD", "Bank of India", "Federal Bank", "HDFC Bank", "HSBC India", "ICICI Bank", "IDFC FIRST Bank", "IndusInd Bank", "Kotak Mahindra Bank", "Punjab National Bank", "RBL Bank", "SBI Card", "Standard Chartered Bank", "Union Bank of India", "YES BANK", "Indian Bank", "Canara Bank", "OneCard", "Equitas Small Finance Bank", "SBM Bank India", "Unity Small Finance Bank", "CSB Bank"];
  const logos = {"Axis Bank":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/axis.svg","Kotak Mahindra Bank":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/kotak.svg","SBI Card":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/sbi.svg","IDFC FIRST Bank":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/idfc.svg","ICICI Bank":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/icici.svg","BOBCARD":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/bob.svg","YES BANK":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/yes.svg","HDFC Bank":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/hdfc.svg","Punjab National Bank":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/pnb.svg","Indian Bank":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/indian.svg","Bank of India":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/boi.svg","Canara Bank":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/canara.svg","RBL Bank":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/rbl.svg","IndusInd Bank":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/indus.svg","AU Small Finance Bank":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/ausfb.svg","HSBC India":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/international-bank/hsbc.svg","American Express":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/international-bank/american-express.svg","CSB Bank":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/csb.svg","Federal Bank":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/federal.svg","Standard Chartered Bank":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/international-bank/standard.svg","Union Bank of India":"https://cdn.jsdelivr.net/gh/auraveni/global-bank-logos@main/assets/bank/indian-bank/ubi.svg"};
  const $ = (s) => document.querySelector(s);
  const esc = (v = "") => String(v).replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const arr = (v) => Array.isArray(v) ? v : (v ? [v] : []);

  const root = document.documentElement;
  const sw = $("#themeSwitch");
  const meta = document.querySelector('meta[name="theme-color"]');
  function setTheme(theme, save = true) {
    const dark = theme === "dark";
    root.dataset.theme = theme;
    if (sw) {
      sw.checked = !dark;
      sw.setAttribute("aria-checked", String(!dark));
      sw.setAttribute("aria-label", dark ? "Switch to day mode" : "Switch to night mode");
    }
    meta?.setAttribute("content", dark ? "#101214" : "#f3f5f6");
    if (save) localStorage.setItem("abhishek-card-stack-theme", theme);
  }
  setTheme(root.dataset.theme || "light", false);
  sw?.addEventListener("change", () => setTheme(sw.checked ? "light" : "dark"));
  $("#year").textContent = new Date().getFullYear();

  const initials = (name) => name.replace(/Small Finance Bank/gi,"SFB").replace(/Bank/gi,"").trim().split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
  const rows = $("#supportRows");
  const search = $("#supportSearch");
  const empty = $("#supportEmpty");
  $("#supportCount").textContent = `${banks.length} banks`;

  const phoneLink = (value) => {
    const tel = String(value).replace(/[^\d+]/g,"");
    return `<a class="support-link-value" href="tel:${esc(tel)}">${esc(value)}</a>`;
  };
  const mailLink = (value) => `<a class="support-link-value" href="mailto:${esc(value)}">${esc(value)}</a>`;
  const block = (values,type,label="") => {
    const items = arr(values);
    if (!items.length) return "";
    const links = items.map(type==="phone" ? phoneLink : mailLink).join("");
    return `<div class="support-contact-block">${label?`<span class="support-contact-label">${esc(label)}</span>`:""}${links}</div>`;
  };
  const emptyValue = () => '<span class="support-empty-value">—</span>';

  function helplineCell(c) {
    const parts = [block(c.care,"phone")];
    for (const extra of (c.helplineExtras || [])) parts.push(block(extra.values,"phone",extra.label));
    const html = parts.filter(Boolean).join("");
    return html ? `<div class="support-cell-stack">${html}</div>` : emptyValue();
  }
  function emailCell(c, level) {
    const parts = [block(c[`l${level}Email`],"mail")];
    if (level === 1) for (const extra of (c.l1Extras || [])) parts.push(block(extra.emails,"mail",extra.label));
    if (level === 3) for (const extra of (c.extras || [])) parts.push(block(extra.emails,"mail",extra.label));
    const html = parts.filter(Boolean).join("");
    return html ? `<div class="support-cell-stack">${html}</div>` : emptyValue();
  }
  function bankCell(bank) {
    const logo = logos[bank] || "";
    return `<div class="support-bank"><span class="support-bank-logo">${logo?`<img src="${esc(logo)}" alt="" loading="lazy">`:""}<span class="support-bank-fallback">${esc(initials(bank))}</span></span><span class="support-bank-copy"><strong>${esc(bank)}</strong><span>Credit card support</span></span></div>`;
  }
  function row(bank) {
    const c = D[bank] || {};
    return `<tr><th scope="row">${bankCell(bank)}</th><td>${helplineCell(c)}</td><td>${emailCell(c,1)}</td><td>${emailCell(c,2)}</td><td>${emailCell(c,3)}</td></tr>`;
  }
  function fallbacks() {
    rows.querySelectorAll(".support-bank-logo img").forEach((img) => img.addEventListener("error", () => {
      img.hidden = true;
      const fallback = img.nextElementSibling;
      if (fallback) fallback.style.display = "grid";
    }, {once:true}));
  }
  function render() {
    const q = (search.value || "").trim().toLowerCase();
    const filtered = banks.filter((bank) => !q || bank.toLowerCase().includes(q) || JSON.stringify(D[bank]||{}).toLowerCase().includes(q));
    rows.innerHTML = filtered.map(row).join("");
    fallbacks();
    empty.hidden = filtered.length > 0;
    rows.closest("table").hidden = filtered.length === 0;
  }
  search.addEventListener("input", render);
  render();
})();
