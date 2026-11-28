/* Homepage "What's new" bento: reviews marquee, animated updates list, support beam, updates calendar.
   Every visual is decorative (aria-hidden); each tile's link text carries the content. */
(() => {
  const root = document.querySelector(".hm-bento");
  if (!root) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const LABELS = { devaluation: "Devaluation", revaluation: "Revaluation", launch: "Card launch", cashback: "Cashback deal", "spend-offer": "Spend-based offer", announcement: "Announcement" };
  const shortDate = (key) => { const [, m, d] = key.split("-").map(Number); return `${d} ${MONTHS[m - 1]}`; };

  /* Pause every loop while the section is off screen. */
  let visible = false;
  const onShow = [];
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    root.classList.toggle("is-live", visible);
    if (visible) onShow.forEach((fn) => fn());
  }, { rootMargin: "120px 0px" }).observe(root);

  /* 1. Reviews marquee, built from the "Latest reviews" row so it stays in sync with the reviews build. */
  const marquee = root.querySelector("[data-bt-marquee]");
  const reviews = [...document.querySelectorAll("#hm-reviews .hm-review")].slice(0, 8).map((a) => {
    const img = a.querySelector(".hm-review-media img");
    const meta = a.querySelector(".hm-review-meta");
    const read = meta ? (meta.textContent.match(/(\d+)\s*min read/) || [])[1] : "";
    return {
      title: (a.querySelector(".hm-review-title") || {}).textContent || "",
      tag: (a.querySelector(".hm-review-tag") || {}).textContent || "",
      read,
      src: img ? img.currentSrc || img.getAttribute("src") : "",
    };
  }).filter((r) => r.title);
  if (marquee && reviews.length) {
    const fig = (r) => `<span class="bt-review">${r.src ? `<img src="${esc(r.src)}" alt="" width="160" height="90" loading="lazy" decoding="async">` : ""}<span class="bt-review-title">${esc(r.title)}</span><span class="bt-review-meta">${esc(r.tag)}${r.read ? ` · ${esc(r.read)} min read` : ""}</span></span>`;
    const track = reviews.map(fig).join("");
    marquee.innerHTML = `<span class="bt-marquee-track">${track}</span><span class="bt-marquee-track">${track}</span>`;
    marquee.style.setProperty("--bt-duration", `${Math.max(24, reviews.length * 5)}s`);
  }

  /* 2-4 need the updates index (same file the site search uses). */
  fetch("/assets/updates-index.json", { credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => {
      const items = (data.items || []).filter((i) => i.published && i.title)
        .sort((a, b) => (a.published < b.published ? 1 : -1));
      if (!items.length) return;
      buildList(items.slice(0, 8));
      buildCalendar(items);
    })
    .catch(() => {});

  function buildList(items) {
    const list = root.querySelector("[data-bt-list]");
    if (!list) return;
    const row = (i) => {
      const cat = LABELS[i.category] ? i.category : "news";
      const label = LABELS[i.category] || (i.type === "offer" ? "Offer" : "News");
      return `<span class="bt-note" data-cat="${esc(cat)}"><span class="bt-note-dot"></span><span class="bt-note-body"><span class="bt-note-head"><b>${esc(label)}</b><span>${esc(i.issuer || "")} · ${shortDate(i.published)}</span></span><span class="bt-note-title">${esc(i.title)}</span></span></span>`;
    };
    if (reduce.matches) {
      list.innerHTML = items.slice(0, 4).map(row).join("");
      return;
    }
    // Oldest of the batch first, so the newest lands on top last; then keep cycling.
    const queue = items.slice().reverse();
    let n = 0, timer = 0;
    const MAX = 5;
    const push = () => {
      const tmp = document.createElement("span");
      tmp.innerHTML = row(queue[n % queue.length]);
      const el = tmp.firstChild;
      el.classList.add("is-new");
      list.prepend(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("is-new")));
      while (list.children.length > MAX) list.lastElementChild.remove();
      n += 1;
    };
    const tick = () => {
      clearTimeout(timer);
      if (!visible || document.hidden) return;
      push();
      timer = setTimeout(tick, 2200);
    };
    for (let k = 0; k < 3; k += 1) push();
    onShow.push(() => { timer = setTimeout(tick, 1200); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden && visible) tick(); });
    if (visible) timer = setTimeout(tick, 1200);
  }

  function buildCalendar(items) {
    const cal = root.querySelector("[data-bt-cal]");
    if (!cal) return;
    const latest = items[0].published;
    const [y, m] = latest.split("-").map(Number);
    const days = new Set(items.map((i) => i.published).filter((k) => k.startsWith(latest.slice(0, 7))).map((k) => Number(k.slice(8))));
    const first = new Date(y, m - 1, 1);
    const lead = (first.getDay() + 6) % 7; // weeks start on Monday
    const count = new Date(y, m, 0).getDate();
    const monthName = first.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    let cells = "";
    for (let k = 0; k < lead; k += 1) cells += "<span></span>";
    for (let d = 1; d <= count; d += 1) {
      const cls = [days.has(d) ? "has-dot" : "", d === Number(latest.slice(8)) ? "is-sel" : ""].filter(Boolean).join(" ");
      cells += `<span${cls ? ` class="${cls}"` : ""}>${d}</span>`;
    }
    cal.innerHTML = `<span class="bt-cal-head">${esc(monthName)}</span><span class="bt-cal-week"><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span></span><span class="bt-cal-days">${cells}</span>`;
    const link = root.querySelector("[data-bt-cal-link]");
    if (link) link.href = `https://avhishek.in/updates?date=${latest}`;
  }

  /* 3. Animated beams: curved paths from each bank into the hub, then from the hub to "you". */
  const beam = root.querySelector("[data-bt-beam]");
  if (beam) {
    const svg = beam.querySelector(".bt-beam-lines");
    const hub = beam.querySelector("[data-beam-hub]");
    const you = beam.querySelector("[data-beam-to]");
    const froms = [...beam.querySelectorAll("[data-beam-from]")];
    const centre = (el, box) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
    };
    // Leaves each node level, then bends into the target (a soft S like Magic UI's beams).
    const curve = (a, b) => {
      const mx = (a.x + b.x) / 2;
      const f = (n) => n.toFixed(1);
      return `M${f(a.x)},${f(a.y)} C${f(mx)},${f(a.y)} ${f(mx)},${f(b.y)} ${f(b.x)},${f(b.y)}`;
    };
    const draw = () => {
      const box = beam.getBoundingClientRect();
      if (!box.width) return;
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      svg.setAttribute("width", box.width);
      svg.setAttribute("height", box.height);
      const h = centre(hub, box);
      const paths = froms.map((el, k) => ({ d: curve(centre(el, box), h), delay: k * 0.35 }));
      paths.push({ d: curve(h, centre(you, box)), delay: 0.9, out: true });
      svg.innerHTML = paths.map((p) => `<path class="bt-beam-base" d="${p.d}"/><path class="bt-beam-pulse${p.out ? " is-out" : ""}" d="${p.d}" pathLength="100" style="animation-delay:${p.delay}s"/>`).join("");
    };
    draw();
    new ResizeObserver(draw).observe(beam);
    froms.concat(hub).forEach((el) => { const img = el.querySelector("img"); if (img && !img.complete) img.addEventListener("load", draw, { once: true }); });
  }
})();
