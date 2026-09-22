window.SUPPORT_CONTACTS = {
  // Add official contacts here. Example:
  // "Axis Bank": { care: "1800xxxxxxx", l1Email: "support@bank.com", l2Email: "nodal@bank.com", l3Email: "pno@bank.com" },
};

(() => {
  const D = window.SUPPORT_CONTACTS || {};
  const cards = (window.PORTFOLIO_DATA && window.PORTFOLIO_DATA.cards) || [];
  const banks = [...new Set(cards.map(c => c.bank).filter(Boolean))];
  const esc = (v = "") => String(v).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

  const style = document.createElement("style");
  style.textContent = `.support-directory{padding:74px 0 88px;border-top:1px solid var(--line);background:color-mix(in srgb,var(--surface-soft) 52%,var(--page))}.support-head{display:flex;align-items:end;justify-content:space-between;gap:28px}.support-head h2{margin:0;font-size:40px;line-height:1.04;letter-spacing:-.045em;font-weight:650}.support-head p{max-width:700px;margin:10px 0 0;color:var(--muted);font-size:12px;line-height:1.65}.support-count{color:var(--muted);font-size:10px;font-weight:650;white-space:nowrap}.support-toolbar{margin-top:18px;display:grid;grid-template-columns:minmax(260px,1fr) auto;gap:12px;align-items:center}.support-search{width:100%;height:46px;padding:0 14px;border:1px solid var(--line);border-radius:11px;background:var(--surface);color:var(--text);font:inherit;font-size:14px;outline:0}.support-flow{color:var(--soft);font-size:9px;white-space:nowrap}.support-table-wrap{margin-top:14px;border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow:hidden;box-shadow:var(--shadow)}.support-table-scroll{width:100%;overflow:auto;overscroll-behavior-inline:contain;scrollbar-width:thin}.support-table{width:100%;min-width:1120px;border-collapse:separate;border-spacing:0;table-layout:fixed}.support-table th,.support-table td{padding:17px 18px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}.support-table th:last-child,.support-table td:last-child{border-right:0}.support-table tbody tr:last-child th,.support-table tbody tr:last-child td{border-bottom:0}.support-table thead th{position:sticky;top:0;z-index:4;background:var(--surface-soft);color:var(--muted);font-size:10px;font-weight:700;line-height:1.25;white-space:nowrap}.support-table thead th:first-child{left:0;z-index:6}.support-table tbody th{position:sticky;left:0;z-index:2;background:var(--surface);color:var(--text);font-size:12px;font-weight:650;line-height:1.3}.support-table tbody tr:nth-child(even) th,.support-table tbody tr:nth-child(even) td{background:color-mix(in srgb,var(--surface-soft) 52%,var(--surface))}.support-table tbody tr:hover th,.support-table tbody tr:hover td{background:var(--surface-soft)}.support-table th:nth-child(1){width:190px}.support-table th:nth-child(2){width:185px}.support-table th:nth-child(3),.support-table th:nth-child(4),.support-table th:nth-child(5){width:248px}.support-link-value{display:block;max-width:100%;color:var(--text);font-size:10px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.support-link-value:hover{text-decoration:underline}.support-missing{color:var(--soft);font-size:11px}.support-no-results{padding:38px 18px;text-align:center;color:var(--muted);font-size:11px}@media(max-width:760px){.support-directory{padding:56px 0 70px}.support-head{display:block}.support-head h2{font-size:30px}.support-count{display:block;margin-top:10px}.support-toolbar{grid-template-columns:1fr}.support-search{font-size:16px}.support-flow{white-space:normal;line-height:1.5}.support-table-wrap{border-radius:12px}.support-table{min-width:930px}.support-table th,.support-table td{padding:14px 12px}.support-table thead th{font-size:9px}.support-table th:nth-child(1){width:150px}.support-table th:nth-child(2){width:150px}.support-table th:nth-child(3),.support-table th:nth-child(4),.support-table th:nth-child(5){width:210px}.support-table tbody th{font-size:11px}.support-link-value{font-size:9px}}`;
  document.head.appendChild(style);

  const nav = document.querySelector(".topbar-actions");
  if (nav && !nav.querySelector('[href="#support"]')) {
    const a = document.createElement("a");
    a.href = "#support";
    a.className = "collection-link";
    a.textContent = "Support";
    nav.insertBefore(a, nav.querySelector(".plane-switch") || null);
  }

  const main = document.querySelector("main");
  if (!main || document.querySelector("#support")) return;

  const section = document.createElement("section");
  section.className = "support-directory";
  section.id = "support";
  section.innerHTML = `<div class="shell support-head"><div><h2>Bank support directory</h2><p>Helpline numbers and Level 1 to Level 3 escalation email IDs, kept in one simple table.</p></div><span class="support-count">${banks.length} banks · 3 escalation levels</span></div><div class="shell support-toolbar"><input class="support-search" id="supportSearch" type="search" placeholder="Search bank, email or helpline" autocomplete="off"><span class="support-flow">Level 1 → Level 2 → Level 3 → RBI Ombudsman</span></div><div class="shell support-table-wrap"><div class="support-table-scroll" tabindex="0" aria-label="Scrollable bank support table"><table class="support-table"><thead><tr><th scope="col">Bank name</th><th scope="col">Helpline number</th><th scope="col">Level 1 support mail</th><th scope="col">Level 2 support mail</th><th scope="col">Level 3 support mail</th></tr></thead><tbody id="supportRows"></tbody></table></div><div class="support-no-results" id="supportEmpty" hidden>No matching bank found.</div></div>`;
  main.appendChild(section);

  const rows = section.querySelector("#supportRows");
  const search = section.querySelector("#supportSearch");
  const empty = section.querySelector("#supportEmpty");
  const mail = v => v ? `<a class="support-link-value" href="mailto:${esc(v)}">${esc(v)}</a>` : '<span class="support-missing">—</span>';
  const phone = v => { if (!v) return '<span class="support-missing">—</span>'; const tel = String(v).replace(/[^\d+]/g, ""); return `<a class="support-link-value" href="tel:${esc(tel)}">${esc(v)}</a>`; };
  const row = bank => { const c = D[bank] || {}; return `<tr><th scope="row">${esc(bank)}</th><td>${phone(c.care)}</td><td>${mail(c.l1Email)}</td><td>${mail(c.l2Email)}</td><td>${mail(c.l3Email)}</td></tr>`; };

  function render() {
    const q = (search.value || "").trim().toLowerCase();
    const filtered = banks.filter(bank => !q || bank.toLowerCase().includes(q) || JSON.stringify(D[bank] || {}).toLowerCase().includes(q));
    rows.innerHTML = filtered.map(row).join("");
    empty.hidden = filtered.length > 0;
    rows.closest("table").hidden = filtered.length === 0;
  }

  search.addEventListener("input", render);
  render();
})();
