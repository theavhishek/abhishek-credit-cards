/* /movie-offers logic shared by the page, the bake script and the tests: dates, labels, search words,
 * per-offer figures, the savings calculator and data validation. No DOM access in this file. */
(function (root) {
  const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const KINDS = { bogo: "Buy 1 Get 1", percent: "% off", flat: "Flat off", free: "Free tickets", cashback: "Cashback", rewards: "Reward points", voucher: "Voucher" };
  const INSTANT = new Set(["bogo", "percent", "flat", "free"]);
  const CATEGORIES = { movies: "Movies", events: "Events", activities: "Activities", fnb: "Food and drinks" };
  const NETWORKS = { visa: "Visa", mastercard: "Mastercard", rupay: "RuPay", amex: "American Express", diners: "Diners Club" };
  const STATUSES = {
    verified: "Terms checked", app: "Terms checked in the app", listed: "Listed, terms not checked",
    upcoming: "Starts soon", expired: "Expired", needs: "Needs checking",
  };
  const PER = { month: "a month", "billing-cycle": "a billing cycle", quarter: "a quarter", "half-year": "every 6 months", year: "a year", campaign: "in the offer period" };
  const SPEND_PERIODS = new Set(["prev-month", "month", "billing-cycle", "prev-quarter", "prev-3-months", "half-year", "year"]);
  const ENDING_SOON_DAYS = 30;

  // Search aliases: extra words added to an offer when its text contains the key.
  const CARD_ALIASES = {
    mmt: "makemytrip", makemytrip: "mmt", ltn: "lifetime", hpcl: "hindustan petroleum", indianoil: "iocl indian oil",
    sapphiro: "saphiro sapphire", emeralde: "emerald", millennia: "millenia millennium", eternal: "zomato blinkit",
    "live+": "live plus", "cashback+": "cashback plus", "fun+": "fun plus", "elite+": "elite plus", "zenith+": "zenith plus",
    travelone: "travel one", "my zone": "myzone", "privé": "prive", "american express": "amex", "diners club": "diners",
    rupay: "ru pay", "first select": "firstselect", "first wealth": "firstwealth", "first millennia": "firstmillennia",
    "airtel axis": "airtel", "pvr inox co-brand": "pvr kotak", digismart: "digi smart", "league platinum": "league",
  };
  const PLATFORM_WORDS = { bms: "bookmyshow bms book my show", district: "district zomato district", pvr: "pvr inox pvrinox" };
  const KIND_WORDS = { bogo: "bogo buy 1 get 1 1+1 buy one get one", percent: "percent discount", flat: "flat", free: "free ticket", cashback: "cashback", rewards: "points rewards" };

  const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const isISO = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));

  /** Today's date in India as YYYY-MM-DD. Offers start and end on Indian dates. */
  function todayIST(now = new Date()) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  }
  const addDays = (iso, n) => new Date(Date.parse(iso + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
  const weekday = (iso) => new Date(iso + "T00:00:00Z").getUTCDay();
  const fmtDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };

  /** Status as shown on a given day: past `end` → expired, before `start` → upcoming. */
  function effectiveStatus(o, today) {
    if (o.status === "expired" || (o.end && o.end < today)) return "expired";
    if (o.start && o.start > today) return "upcoming";
    return o.status;
  }
  const isChecked = (status) => status === "verified" || status === "app";
  const isShown = (status) => status !== "expired" && status !== "needs";
  const endingSoon = (o, today) => !!o.end && o.end >= today && o.end <= addDays(today, ENDING_SOON_DAYS);

  function daysText(days) {
    if (!days?.length || days.length === 7) return null;
    const s = [...days].sort((a, b) => a - b).join();
    if (s === "0,6") return "Sat and Sun";
    if (s === "1,2,3,4,5") return "Mon to Fri";
    if (days.length === 1) return DAY_LONG[days[0]] + "s";
    return days.map((d) => DAY[d]).join(", ");
  }
  function usesText(o) {
    if (o.uses) {
      const { count, per } = o.uses;
      if (o.kind === "free" && count === 1 && per !== "campaign") {
        const n = o.tiers?.length ? Math.max(...o.tiers.map((t) => t.freeTickets)) : o.freeTickets || 1;
        return `Up to ${n} free ticket${n > 1 ? "s" : ""} ${PER[per]}`;
      }
      if (per === "campaign") return count === 1 ? "Once in the offer period" : `${count} times in the offer period`;
      const n = count === 1 ? "Once" : count === 2 ? "Twice" : `${count} times`;
      return `${n} ${PER[per]}`;
    }
    return o.limitText || null;
  }

  /** Most you can save on one booking, from the stated caps. null when the source states no cap. */
  function maxPerBooking(o) {
    if (o.kind === "flat") return o.flat ?? null;
    if (o.kind === "free") return o.capTicket != null ? o.capTicket * (o.freeTickets || 1) : null;
    if (o.capTxn != null) return o.capTxn;
    if (o.monthCap != null && (o.kind === "percent" || o.kind === "cashback")) return o.monthCap;
    if (o.kind === "bogo" && o.capTicket != null) return o.capTicket * (o.freeTickets || 1);
    return null;
  }
  /** Most you can get in one month, when the terms make that clear. */
  function maxPerMonth(o) {
    if (o.conflict) return null;
    if (o.monthCap != null) return o.monthCap;
    const per = maxPerBooking(o);
    if (per == null || !o.uses) return null;
    if (o.uses.per === "month" || o.uses.per === "billing-cycle") return per * o.uses.count;
    return null;
  }

  /** Short headline figure for an offer card, e.g. "Up to ₹500 off". */
  function headline(o) {
    const max = maxPerBooking(o);
    switch (o.kind) {
      case "bogo":
        if (o.capTicket != null && o.capTxn == null && (o.freeTickets || 1) > 1) return `Up to ${inr(o.capTicket)} off a free ticket`;
        return max != null ? `Up to ${inr(max)} off` : "1 ticket free";
      case "percent": return o.percent != null ? `${o.percent}% off` : null;
      case "flat": return o.flat != null ? `${inr(o.flat)} off` : null;
      case "free": { const n = o.tiers?.length ? Math.max(...o.tiers.map((t) => t.freeTickets)) : o.freeTickets || 1; return `${n} free ticket${n > 1 ? "s" : ""}`; }
      case "cashback": return o.percent != null ? `${o.percent}% back` : o.capTxn != null ? `Up to ${inr(o.capTxn)} back` : null;
      default: return null;
    }
  }

  function searchWords(o, data) {
    const iss = data.issuers[o.issuer] || { name: o.issuer };
    const base = [iss.name, ...(iss.aliases || []), o.cards.join(" "), o.benefit, PLATFORM_WORDS[o.platform], KIND_WORDS[o.kind] || "",
      o.cardType, o.network ? NETWORKS[o.network] : "", (o.category || []).map((c) => CATEGORIES[c]).join(" "), o.code || ""].join(" ");
    const t = norm(base);
    const extra = Object.entries(CARD_ALIASES).filter(([k]) => t.includes(k)).map(([, v]) => v);
    return norm([t, ...extra].join(" ").replace(/\+/g, " plus ")).replace(/\s+/g, " ").trim();
  }
  /** Query terms, normalised the same way as searchWords. Every term must match. */
  const queryTerms = (q) => {
    const digits = binQuery(q);
    return digits ? [digits] : norm(q).replace(/\+/g, " plus ").split(/\s+/).filter(Boolean);
  };
  /** A search made only of digits (spaces and dashes allowed) is a BIN search: returns its first 9 digits, or "" if fewer than 6. */
  function binQuery(q) {
    const s = String(q || "").replace(/[\s-]/g, "");
    return /^\d{6,}$/.test(s) ? s.slice(0, 9) : "";
  }
  /** True when a card starting with `digits` is in the offer's BIN list (exact) or could be (the typed digits are shorter than a listed BIN). */
  const binMatch = (bins, digits) => !!digits && (bins || []).some((b) => digits.startsWith(b) || b.startsWith(digits));
  /** True only when the typed digits cover a whole listed BIN, so the card is certainly in the list. */
  const binExact = (bins, digits) => !!digits && (bins || []).some((b) => digits.startsWith(b));
  /** More digits than a BIN needs (10 or more): likely a full card number. */
  const binTooLong = (q) => /^\d{10,}$/.test(String(q || "").replace(/[\s-]/g, ""));

  /**
   * Savings for one offer on one booking.
   * booking = { price, tickets, platform ("" for any), category (default movies), date (YYYY-MM-DD show date), today }
   * Returns null when the offer can't apply at all (other platform, welcome gift, not checked, expired),
   * otherwise { eligible, reason, total, discount, payable, pctSaved, instant, conditional, conditions[] }.
   * Never assumes earlier spend or unused monthly uses: those become conditions, not exclusions.
   */
  function evaluate(o, booking) {
    const { price, tickets, platform, date, category = "movies", today = todayIST() } = booking;
    if (platform && o.platform !== platform) return null;
    if (category && !(o.category || []).includes(category)) return null;
    if (o.scope === "welcome") return null;
    const day = date || today;
    const st = effectiveStatus(o, day);
    if (!isChecked(st)) return null;
    if (o.start && o.start > day) return null;
    const total = price * tickets;
    const out = { offer: o, total, discount: 0, payable: total, pctSaved: 0, instant: INSTANT.has(o.kind), eligible: true, reason: null, conditional: false, conditions: [] };
    const no = (reason) => Object.assign(out, { eligible: false, reason });

    if (o.days?.length && o.days.length < 7) {
      if (date && !o.days.includes(weekday(date))) return no(`Only ${daysText(o.days)}`);
      if (!date) out.conditions.push(`Only ${daysText(o.days)}`);
    }
    if (o.minTickets && tickets < o.minTickets) return no(`Needs ${o.minTickets} tickets in one booking`);
    if (o.minAmount && total < o.minAmount) return no(`Booking must be at least ${inr(o.minAmount)}`);

    let d = null;
    switch (o.kind) {
      case "bogo": {
        const free = Math.min(o.freeTickets || 1, Math.floor(tickets / 2));
        if (free < 1) return no("Needs 2 tickets in one booking");
        d = free * price;
        if (o.capTicket != null) d = Math.min(d, free * o.capTicket);
        if (o.capTxn != null) d = Math.min(d, o.capTxn);
        if (o.capTicket == null && o.capTxn == null) { out.conditional = true; out.conditions.push("No cap on the free ticket stated in the terms"); }
        break;
      }
      case "percent":
        if (o.percent == null) return no("Discount % not stated");
        d = (total * o.percent) / 100;
        if (o.capTxn != null) d = Math.min(d, o.capTxn);
        if (o.monthCap != null) d = Math.min(d, o.monthCap);
        if (o.capTxn == null && o.monthCap == null) out.conditions.push("No cap stated in the terms");
        break;
      case "flat":
        if (o.flat == null) return no("Amount not stated");
        d = Math.min(o.flat, total);
        break;
      case "free": {
        let n = o.freeTickets || 1;
        if (o.tiers?.length) n = Math.max(...o.tiers.map((t) => t.freeTickets));
        n = Math.min(n, tickets);
        d = n * (o.capTicket != null ? Math.min(price, o.capTicket) : price);
        if (o.tiers?.length > 1 && n > Math.min(...o.tiers.map((t) => t.freeTickets))) {
          const t = o.tiers.find((x) => x.freeTickets >= n);
          out.conditions.push(`${n} free tickets need ${inr(t.spend)} spend`);
        }
        break;
      }
      case "cashback":
        if (o.percent == null) { d = null; break; }
        d = (total * o.percent) / 100;
        if (o.capTxn != null) d = Math.min(d, o.capTxn);
        if (o.monthCap != null) d = Math.min(d, o.monthCap);
        break;
      default:
        d = null;
    }
    if (d == null) { out.discount = null; out.payable = total; out.conditions.push("Value can’t be worked out from the terms"); }
    else {
      out.discount = Math.round(d);
      out.payable = out.instant ? total - out.discount : total;
      out.pctSaved = total ? (out.discount / total) * 100 : 0;
    }
    if (o.spend) { out.conditional = true; out.conditions.unshift(`Needs spend: ${o.spend.text}`); }
    const u = usesText(o);
    if (u) out.conditions.push(u);
    if (o.cinemas) out.conditions.push(o.cinemas);
    if (o.channel === "online") out.conditions.push("Online bookings only");
    if (o.channel === "counter") out.conditions.push("At the cinema counter only");
    if (o.bins?.length || /BIN/.test(o.terms || "")) { out.conditional = true; out.conditions.push("Only some card BIN ranges"); }
    if (o.conflict) { out.conditional = true; out.conditions.push("The terms contradict each other, see Full terms"); }
    if (!out.instant) out.conditions.push(o.kind === "cashback" ? "Paid back later, not taken off the price" : "Points, not a discount");
    return out;
  }

  /** Rank every offer for a booking: instant savings first, biggest first, unconditional before conditional. */
  function rank(offers, booking, { includeLater = false, hideConditional = false } = {}) {
    const all = offers.map((o) => evaluate(o, booking)).filter(Boolean);
    const fits = all.filter((r) => r.eligible && r.discount > 0 && (includeLater || r.instant) && !(hideConditional && r.conditional));
    fits.sort((a, b) => (b.instant - a.instant) || (b.discount - a.discount) || (a.conditional - b.conditional)
      || a.offer.issuer.localeCompare(b.offer.issuer));
    return { results: fits, considered: all.length, notFitting: all.filter((r) => !r.eligible).length };
  }

  /** Data checks. Returns { errors: [], warnings: [] }; errors fail the build. */
  /** Official card image for an offer's first card, or null. */
  function cardArt(o, data) {
    const a = data.cardArt && o.cards && data.cardArt[`${o.issuer}|${o.cardType}|${o.cards[0]}`];
    return a ? { src: `/assets/movie-offers/cards/${a.file}`, shape: a.shape } : null;
  }

  function validate(data, today = todayIST()) {
    const errors = [], warnings = [];
    const E = (o, m) => errors.push(`${o.id || "(no id)"}: ${m}`);
    const W = (o, m) => warnings.push(`${o.id || "(no id)"}: ${m}`);
    const ids = new Set(), sigs = new Map();
    for (const o of data.offers) {
      for (const k of ["id", "platform", "issuer", "cards", "cardType", "kind", "category", "benefit", "status", "source", "accessed"])
        if (o[k] == null || (Array.isArray(o[k]) && !o[k].length)) E(o, `missing ${k}`);
      if (o.id && !/^[a-z0-9-]+$/.test(o.id)) E(o, "id must be kebab-case");
      if (ids.has(o.id)) E(o, "duplicate id"); ids.add(o.id);
      const sig = [o.platform, o.issuer, [...(o.cards || [])].sort().join("|"), o.kind, o.benefit, o.scope || ""].join("~");
      if (sigs.has(sig)) E(o, `duplicate of ${sigs.get(sig)}`); else sigs.set(sig, o.id);
      if (!data.platforms[o.platform]) E(o, `unknown platform ${o.platform}`);
      if (!data.issuers[o.issuer]) E(o, `unknown issuer ${o.issuer}`);
      if (!["credit", "debit", "prepaid"].includes(o.cardType)) E(o, "cardType must be credit, debit or prepaid");
      if (o.network && !NETWORKS[o.network]) E(o, `unknown network ${o.network}`);
      if (!KINDS[o.kind]) E(o, `unknown kind ${o.kind}`);
      for (const c of o.category || []) if (!CATEGORIES[c]) E(o, `unknown category ${c}`);
      if (!STATUSES[o.status]) E(o, `unknown status ${o.status}`);
      const iss = data.issuers[o.issuer];
      if (iss) for (const c of o.cards || []) if (norm(c).startsWith(norm(iss.name) + " ")) E(o, `card "${c}" repeats the issuer name`);
      for (const k of ["start", "end", "accessed", "verified"]) if (o[k] != null && !isISO(o[k])) E(o, `${k} is not a valid date`);
      if (o.start && o.end && o.start > o.end) E(o, "start is after end");
      if (o.verified && o.verified > today) E(o, "verified date is in the future");
      if (o.verified && o.accessed && o.accessed < o.verified) E(o, "accessed is before verified");
      if (o.source && !/^https:\/\/[^\s]+$/.test(o.source.url || "")) E(o, "source.url must be an https URL");
      if (o.source && !["bank", "platform", "app", "notice"].includes(o.source.type)) E(o, "source.type must be bank, platform, app or notice");
      if (isChecked(o.status) && !o.verified) E(o, "verified/app offers need a verified date");
      if (o.status === "app" && o.source?.type !== "app") E(o, "app status needs source.type app");
      if (o.status === "listed") {
        for (const k of ["percent", "flat", "capTxn", "capTicket", "monthCap", "quarterCap", "code", "minTickets", "minAmount"])
          if (o[k] != null) E(o, `listed offers can’t carry figures (${k})`);
        if (o.verified) E(o, "listed offers have no verified date");
      }
      if (o.bins != null) {
        if (!Array.isArray(o.bins) || !o.bins.length || o.bins.some((b) => typeof b !== "string" || !/^\d{6,9}$/.test(b))) E(o, "bins must be a list of 6 to 9 digit strings");
        else if (new Set(o.bins).size !== o.bins.length) E(o, "bins has duplicates");
      }
      if (o.kind === "percent" && isChecked(o.status) && o.percent == null) E(o, "percent offer without percent");
      if (o.kind === "flat" && isChecked(o.status) && o.flat == null) E(o, "flat offer without flat amount");
      if (o.kind === "flat" && o.capTxn != null && o.flat != null && o.capTxn !== o.flat) E(o, "flat and capTxn conflict");
      if (o.percent != null && (o.percent <= 0 || o.percent > 100)) E(o, "percent out of range");
      if (o.capTxn != null && o.monthCap != null && o.capTxn > o.monthCap) E(o, "capTxn is above monthCap");
      if (o.monthCap != null && o.uses && (o.uses.per === "month" || o.uses.per === "billing-cycle")) {
        const per = maxPerBooking({ ...o, monthCap: undefined });
        if (per != null && per * o.uses.count < o.monthCap) E(o, `monthCap ${o.monthCap} is more than ${o.uses.count} × ${per}`);
      }
      if (o.uses && (!(o.uses.count > 0) || !PER[o.uses.per])) E(o, "uses needs a positive count and a known period");
      if (o.conflict != null && (typeof o.conflict !== "string" || !o.conflict.trim())) E(o, "conflict must be a sentence");
      if (o.spend && o.spend.period && !SPEND_PERIODS.has(o.spend.period)) E(o, `unknown spend period ${o.spend.period}`);
      if (o.spend && !o.spend.text) E(o, "spend needs text");
      if (o.days && (!o.days.length || o.days.some((d) => !(d >= 0 && d <= 6)))) E(o, "days must be 0-6");
      if (o.channel && !["online", "counter", "both"].includes(o.channel)) E(o, "channel must be online, counter or both");
      for (const c of o.changes || []) if (!isISO(c.date) || !c.text) E(o, "changes need a date and text");
      if (o.status !== "expired" && o.end && o.end < today) W(o, `ended ${o.end}; set status "expired" (it is hidden already)`);
      if (o.status === "upcoming" && !(o.start > today)) W(o, "upcoming but start is not in the future");
      if (isChecked(o.status) && o.verified && o.verified < addDays(today, -90)) W(o, `terms last checked ${o.verified}, over 90 days ago`);
    }
    for (const [k, a] of Object.entries(data.cardArt || {})) {
      const [iss, type, card] = k.split("|");
      const bad = (m) => errors.push(`cardArt ${k}: ${m}`);
      if (!data.issuers[iss]) bad(`unknown issuer ${iss}`);
      if (!["credit", "debit", "prepaid"].includes(type) || !card) bad("key must be issuer|cardType|card");
      if (!a || !/^[a-z0-9-]+\.webp$/.test(a.file || "")) bad("file must be a .webp name");
      if (!a || !["landscape", "portrait"].includes(a.shape)) bad("shape must be landscape or portrait");
    }
    return { errors, warnings };
  }

  const api = {
    KINDS, CATEGORIES, NETWORKS, STATUSES, DAY_LONG, ENDING_SOON_DAYS, INSTANT,
    inr, esc, norm, fmtDate, todayIST, addDays, weekday, effectiveStatus, isChecked, isShown, endingSoon,
    daysText, usesText, maxPerBooking, maxPerMonth, headline, searchWords, queryTerms, binQuery, binMatch, binExact, binTooLong, evaluate, rank, validate, cardArt,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MovieOffersCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
