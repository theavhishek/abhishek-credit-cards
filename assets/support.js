window.SUPPORT_CONTACTS = {
  "Axis Bank": {
    "care": ["1800-209-5577", "1800-103-5577", "1860-500-5555", "1860-419-5555"],
    "l1Email": ["customer.services@axisbank.com", "creditcards@axisbank.com"],
    "l2Email": ["nodal.officer@axisbank.com"],
    "l3Email": ["pno@axisbank.com"]
  },
  "AU Small Finance Bank": {
    "care": ["1800-1200-1200"],
    "l1Email": ["creditcard.support@aubank.in"],
    "l2Email": ["grievance.officer@aubank.in"],
    "l3Email": []
  },
  "American Express": {
    "care": ["+91-124-2801800", "1800-419-3646"],
    "l1Email": ["support@aexp.com"],
    "l2Email": ["Manager-Customerservicesindia@aexp.com"],
    "l3Email": ["Head-Customerservicesindia@aexp.com"],
    "extras": [{"label":"L4","emails":["AEBCNodalOfficer@aexp.com"]}]
  },
  "BOBCARD": {
    "care": ["1800-258-4455"],
    "l1Email": ["ccb@bobcards.com"],
    "l2Email": ["grievance@bobcards.com"],
    "l3Email": ["cs.ho@bankofbaroda.com"]
  },
  "Bank of India": {
    "care": ["1800-220-229"],
    "l1Email": ["creditcard@bankofindia.co.in"],
    "l2Email": ["cc.nodalofficer@bankofindia.co.in"],
    "l3Email": []
  },
  "Federal Bank": {
    "care": ["1800-425-1199", "1800-420-1199"],
    "helplineExtras": [{"label":"Intl","values":["+91-484-2630994", "+91-484-2630995"]}],
    "l1Email": ["creditcards@federalbank.co.in"],
    "l2Email": ["creditcardescalation@federalbank.co.in"],
    "l3Email": ["support@federalbank.co.in"]
  },
  "HDFC Bank": {
    "care": ["1800-1600", "1800-2600"],
    "helplineExtras": [{"label":"Intl","values":["+91-22-61606160"]}],
    "l1Email": ["customerservices.cards@hdfcbank.com"],
    "l2Email": ["escalation.cc@hdfcbank.com", "priorityredressal.creditcards@hdfcbank.com"],
    "l3Email": ["grievance.redressalcc@hdfcbank.com"]
  },
  "HSBC India": {
    "care": ["1800-267-3456", "1800-121-2208"],
    "helplineExtras": [{"label":"Premier","values":["1800-266-3456"]}],
    "l1Email": ["cardsupport@hsbc.co.in"],
    "l2Email": ["complaints.india@hsbc.co.in"],
    "l3Email": ["nodalofficerinm@hsbc.co.in"]
  },
  "ICICI Bank": {
    "care": ["1800-1080"],
    "l1Email": ["customer.care@icicibank.com"],
    "l2Email": ["headcreditcards@icicibank.com"],
    "l3Email": ["headservicequality@icicibank.com"],
    "extras": [{"label":"L4","emails":["pno@icicibank.com"]}]
  },
  "IDFC FIRST Bank": {
    "care": ["1800-10-888"],
    "l1Email": ["banker@idfcfirstbank.com"],
    "l2Email": ["nodaldesk@idfcfirstbank.com"],
    "l3Email": ["pno@idfcfirstbank.com"]
  },
  "IndusInd Bank": {
    "care": ["1860-267-7777", "022-44066666"],
    "l1Email": ["reachus@indusind.com"],
    "l1Extras": [
      {"label":"Premium","emails":["premium.care@indusind.com"]},
      {"label":"Legend / Pioneer","emails":["priority.care@indusind.com"]},
      {"label":"Celesta","emails":["celesta.care@indusind.com"]}
    ],
    "l2Email": ["head.cardservices@indusind.com"],
    "l3Email": ["nodal.officer@indusind.com"]
  },
  "Kotak Mahindra Bank": {
    "care": ["1860-266-2666"],
    "l1Email": ["service.cards@kotak.com"],
    "l2Email": ["nodalofficer@kotak.com"],
    "l3Email": ["pno@kotak.com"]
  },
  "Punjab National Bank": {
    "care": ["1800-180-2345"],
    "l1Email": ["creditcardpnb@pnb.co.in"],
    "l2Email": ["pno@pnb.co.in"],
    "l3Email": []
  },
  "RBL Bank": {
    "care": ["+91-22-6232-7777", "7119-0900"],
    "l1Email": ["cardservices@rblbank.com"],
    "l2Email": ["headcardservice@rblbank.com"],
    "l3Email": ["principalnodalofficer@rblbank.com"]
  },
  "SBI Card": {
    "care": ["1800-180-1290", "1860-500-1290"],
    "l1Email": ["customercare@sbicard.com"],
    "l2Email": ["nodalofficer@sbicard.com"],
    "l3Email": ["PrincipalNodalOfficer@sbicard.com"],
    "extras": [{"label":"L4","emails":["CustomerServiceHead@sbicard.com"]}]
  },
  "Standard Chartered Bank": {
    "care": ["1800-267-3456", "1800-121-2208"],
    "l1Email": ["customer.care@sc.com"],
    "l2Email": ["Head.Service@sc.com"],
    "l3Email": ["Principal.NodalOfficer@sc.com"]
  },
  "Union Bank of India": {
    "care": ["1800-22-3222"],
    "l1Email": ["creditcard@unionbankofindia.bank"],
    "l2Email": ["cardgrievance@unionbankofindia.bank"],
    "l3Email": []
  },
  "YES BANK": {
    "care": ["1800-103-1212"],
    "helplineExtras": [{"label":"YES FIRST / Premia","values":["1800-103-6000"]}],
    "l1Email": ["yestouchcc@yesbank.in", "yestouch@yesbank.in"],
    "l2Email": ["head.grievanceredressal@yesbank.in"],
    "l3Email": ["principal.nodalofficer@yesbank.in"]
  }
};

(() => {
  const D = window.SUPPORT_CONTACTS || {};
  const cards = (window.PORTFOLIO_DATA && window.PORTFOLIO_DATA.cards) || [];
  const portfolioBanks = [...new Set(cards.map((c) => c.bank).filter(Boolean))];
  const banks = [...new Set([...Object.keys(D), ...portfolioBanks])];

  const bankDomains = {
    "Axis Bank":"axis.bank.in",
    "Kotak Mahindra Bank":"kotak.com",
    "SBI Card":"sbicard.com",
    "IDFC FIRST Bank":"idfcfirstbank.com",
    "ICICI Bank":"icicibank.com",
    "BOBCARD":"bobcard.co.in",
    "YES BANK":"yesbank.in",
    "HDFC Bank":"hdfcbank.com",
    "Punjab National Bank":"pnbindia.in",
    "Indian Bank":"indianbank.in",
    "Bank of India":"bankofindia.co.in",
    "Canara Bank":"canarabank.com",
    "OneCard":"getonecard.app",
    "RBL Bank":"rblbank.com",
    "IndusInd Bank":"indusind.com",
    "Equitas Small Finance Bank":"equitasbank.com",
    "AU Small Finance Bank":"aubank.in",
    "HSBC India":"hsbc.co.in",
    "American Express":"americanexpress.com",
    "SBM Bank India":"sbmbank.co.in",
    "Unity Small Finance Bank":"theunitybank.com",
    "CSB Bank":"csb.co.in",
    "Federal Bank":"federalbank.co.in",
    "Standard Chartered Bank":"sc.com",
    "Union Bank of India":"unionbankofindia.co.in"
  };

  const esc = (v = "") => String(v).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));

  const arr = (value) => Array.isArray(value) ? value : (value ? [value] : []);

  const initials = (name) => name
    .replace(/Small Finance Bank/gi, "SFB")
    .replace(/Bank/gi, "")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const populatedCount = Object.values(D).filter((entry) =>
    arr(entry.care).length || arr(entry.l1Email).length || arr(entry.l2Email).length || arr(entry.l3Email).length
  ).length;

  const style = document.createElement("style");
  style.textContent = `
    .support-directory{padding:76px 0 90px;border-top:1px solid var(--line);background:color-mix(in srgb,var(--surface-soft) 56%,var(--page))}
    .support-table-card{overflow:hidden;border:1px solid var(--line);border-radius:14px;background:var(--surface);box-shadow:0 1px 2px rgba(16,24,40,.04),0 1px 3px rgba(16,24,40,.06)}
    .support-card-header{min-height:88px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid var(--line)}
    .support-card-heading{min-width:0}.support-title-row{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}.support-title-row h2{margin:0;font-size:18px;line-height:1.25;letter-spacing:-.025em;font-weight:650}
    .support-count-badge{display:inline-flex;min-height:22px;align-items:center;padding:2px 8px;border:1px solid var(--line);border-radius:999px;background:var(--surface-soft);color:var(--muted);font-size:9px;font-weight:650;white-space:nowrap}
    .support-card-heading p{margin:5px 0 0;color:var(--muted);font-size:10px;line-height:1.55}
    .support-search-wrap{width:min(320px,38vw);height:40px;display:flex;align-items:center;gap:8px;padding:0 11px;border:1px solid var(--line);border-radius:9px;background:var(--surface)}
    .support-search-wrap svg{width:15px;height:15px;flex:0 0 auto;fill:none;stroke:var(--soft);stroke-width:1.8;stroke-linecap:round}.support-search{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--text);font:inherit;font-size:11px}.support-search::placeholder{color:var(--soft)}
    .support-table-scroll{width:100%;overflow:auto;overscroll-behavior-inline:contain;scrollbar-width:thin}.support-table{width:100%;min-width:1260px;border-collapse:collapse;table-layout:fixed}.support-table th,.support-table td{padding:12px 18px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.support-table tbody tr:last-child th,.support-table tbody tr:last-child td{border-bottom:0}
    .support-table thead th{position:sticky;top:0;z-index:4;height:42px;background:var(--surface-soft);color:var(--muted);font-size:9px;font-weight:650;line-height:1.2;white-space:nowrap}.support-table thead th:first-child{left:0;z-index:6}.support-table tbody th{position:sticky;left:0;z-index:2;background:var(--surface)}.support-table tbody tr:hover th,.support-table tbody tr:hover td{background:color-mix(in srgb,var(--surface-soft) 72%,var(--surface))}
    .support-table th:nth-child(1){width:250px}.support-table th:nth-child(2){width:240px}.support-table th:nth-child(3),.support-table th:nth-child(4),.support-table th:nth-child(5){width:255px}
    .support-bank{display:flex;align-items:center;gap:11px;min-width:0}.support-bank-logo{width:34px;height:34px;flex:0 0 auto;display:grid;place-items:center;overflow:hidden;border:1px solid var(--line);border-radius:50%;background:#fff}.support-bank-logo img{width:24px;height:24px;object-fit:contain}.support-bank-fallback{display:none;width:100%;height:100%;place-items:center;background:var(--surface-soft);color:var(--muted);font-size:9px;font-weight:700}
    .support-bank-copy{min-width:0;line-height:1.25}.support-bank-copy strong{display:block;overflow:hidden;color:var(--text);font-size:11px;font-weight:650;text-overflow:ellipsis;white-space:nowrap}.support-bank-copy span{display:block;margin-top:3px;color:var(--soft);font-size:8px;font-weight:500}
    .support-cell-stack{display:grid;gap:6px}.support-contact-block{display:grid;gap:3px;min-width:0}.support-contact-label{color:var(--soft);font-size:7.5px;font-weight:700;letter-spacing:.01em}.support-link-value{display:block;max-width:100%;overflow:hidden;color:var(--text);font-size:9.5px;font-weight:550;text-overflow:ellipsis;white-space:nowrap}.support-link-value:hover{text-decoration:underline}.support-empty-value{display:inline-flex;min-height:22px;align-items:center;padding:2px 8px;border-radius:999px;background:var(--surface-soft);color:var(--soft);font-size:8px;font-weight:600}
    .support-no-results{padding:40px 20px;text-align:center;color:var(--muted);font-size:11px}.support-footnote{padding:11px 18px;border-top:1px solid var(--line);background:var(--surface-soft);color:var(--soft);font-size:8.5px;line-height:1.5}
    @media(max-width:760px){.support-directory{padding:56px 0 70px}.support-card-header{min-height:0;padding:15px;display:block}.support-title-row h2{font-size:17px}.support-card-heading p{font-size:9.5px}.support-search-wrap{width:100%;height:44px;margin-top:13px}.support-search{font-size:16px}.support-table{min-width:1060px}.support-table th,.support-table td{padding:11px 12px}.support-table th:nth-child(1){width:205px}.support-table th:nth-child(2){width:205px}.support-table th:nth-child(3),.support-table th:nth-child(4),.support-table th:nth-child(5){width:215px}.support-bank-logo{width:32px;height:32px}.support-bank-logo img{width:22px;height:22px}.support-bank-copy strong{font-size:10.5px}.support-link-value{font-size:9px}.support-footnote{padding:10px 14px}}
  `;
  document.head.appendChild(style);

  const nav = document.querySelector(".topbar-actions");
  if (nav && !nav.querySelector('[href="#support"]')) {
    const link = document.createElement("a");
    link.href = "#support";
    link.className = "collection-link";
    link.textContent = "Support";
    nav.insertBefore(link, nav.querySelector(".plane-switch") || null);
  }

  const main = document.querySelector("main");
  if (!main || document.querySelector("#support")) return;

  const section = document.createElement("section");
  section.className = "support-directory";
  section.id = "support";
  section.innerHTML = `
    <div class="shell">
      <div class="support-table-card">
        <div class="support-card-header">
          <div class="support-card-heading">
            <div class="support-title-row">
              <h2>Bank support directory</h2>
              <span class="support-count-badge">${banks.length} banks</span>
              <span class="support-count-badge">${populatedCount} with details</span>
            </div>
            <p>Customer care and escalation contacts in one place.</p>
          </div>
          <label class="support-search-wrap" for="supportSearch">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20.5 20.5-4.1-4.1m1.7-5.2a6.9 6.9 0 1 1-13.8 0 6.9 6.9 0 0 1 13.8 0Z"></path></svg>
            <span class="sr-only">Search support directory</span>
            <input class="support-search" id="supportSearch" type="search" placeholder="Search bank, email or number" autocomplete="off">
          </label>
        </div>
        <div class="support-table-scroll" tabindex="0" aria-label="Scrollable bank support directory">
          <table class="support-table">
            <thead><tr><th scope="col">Bank</th><th scope="col">Helpline</th><th scope="col">Level 1 support</th><th scope="col">Level 2 support</th><th scope="col">Level 3 support</th></tr></thead>
            <tbody id="supportRows"></tbody>
          </table>
        </div>
        <div class="support-no-results" id="supportEmpty" hidden>No matching bank found.</div>
        <div class="support-footnote">Contacts can change. Verify critical details on the issuer's official website before sending sensitive information. Escalation flow: Level 1 → Level 2 / Nodal Officer → Level 3 / Principal Nodal Officer → RBI Ombudsman.</div>
      </div>
    </div>`;
  main.appendChild(section);

  const rows = section.querySelector("#supportRows");
  const search = section.querySelector("#supportSearch");
  const empty = section.querySelector("#supportEmpty");
  const tableScroll = section.querySelector(".support-table-scroll");

  const phoneLink = (value) => {
    const tel = String(value).replace(/[^\d+]/g, "");
    return `<a class="support-link-value" href="tel:${esc(tel)}">${esc(value)}</a>`;
  };
  const mailLink = (value) => `<a class="support-link-value" href="mailto:${esc(value)}">${esc(value)}</a>`;
  const listBlock = (values, type, label = "") => {
    const items = arr(values);
    if (!items.length) return "";
    const links = items.map(type === "phone" ? phoneLink : mailLink).join("");
    return `<div class="support-contact-block">${label ? `<span class="support-contact-label">${esc(label)}</span>` : ""}${links}</div>`;
  };
  const emptyValue = () => '<span class="support-empty-value">Not added</span>';
  const helplineCell = (entry) => {
    const blocks = [listBlock(entry.care, "phone")];
    for (const extra of (entry.helplineExtras || [])) blocks.push(listBlock(extra.values, "phone", extra.label));
    const html = blocks.filter(Boolean).join("");
    return html ? `<div class="support-cell-stack">${html}</div>` : emptyValue();
  };
  const emailCell = (entry, level) => {
    const key = `l${level}Email`;
    const blocks = [listBlock(entry[key], "mail")];
    if (level === 1) for (const extra of (entry.l1Extras || [])) blocks.push(listBlock(extra.emails, "mail", extra.label));
    if (level === 3) for (const extra of (entry.extras || [])) blocks.push(listBlock(extra.emails, "mail", extra.label));
    const html = blocks.filter(Boolean).join("");
    return html ? `<div class="support-cell-stack">${html}</div>` : emptyValue();
  };
  const bankCell = (bank) => {
    const domain = bankDomains[bank];
    const logo = domain ? `https://logo.clearbit.com/${domain}?size=128` : "";
    const fallback = initials(bank);
    return `<div class="support-bank"><span class="support-bank-logo">${logo ? `<img src="${esc(logo)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}<span class="support-bank-fallback">${esc(fallback)}</span></span><span class="support-bank-copy"><strong>${esc(bank)}</strong><span>Credit card support</span></span></div>`;
  };
  const row = (bank) => {
    const c = D[bank] || {};
    return `<tr><th scope="row">${bankCell(bank)}</th><td>${helplineCell(c)}</td><td>${emailCell(c, 1)}</td><td>${emailCell(c, 2)}</td><td>${emailCell(c, 3)}</td></tr>`;
  };

  function attachLogoFallbacks() {
    rows.querySelectorAll(".support-bank-logo img").forEach((img) => {
      img.addEventListener("error", () => {
        img.hidden = true;
        const fallback = img.nextElementSibling;
        if (fallback) fallback.style.display = "grid";
      }, { once: true });
    });
  }

  function render() {
    const q = (search.value || "").trim().toLowerCase();
    const filtered = banks.filter((bank) => !q || bank.toLowerCase().includes(q) || JSON.stringify(D[bank] || {}).toLowerCase().includes(q));
    rows.innerHTML = filtered.map(row).join("");
    attachLogoFallbacks();
    empty.hidden = filtered.length > 0;
    tableScroll.hidden = filtered.length === 0;
  }

  search.addEventListener("input", render);
  render();
})();
