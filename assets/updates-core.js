/* ==========================================================================
   Updates core: shared by the browser (window.UpdatesCore) and the Node
   build script (require). One copy of the category list, the offer-status
   rules and the card markup, so the static HTML and the filtered view match.

   Offer status, always worked out in India time (Asia/Kolkata, UTC+05:30):
   - expired      the end date/time has passed
   - unverified   no verification date, no end date, or an ongoing offer
                  not re-checked in the last 30 days
   - upcoming     verified, but the start date is still ahead
   - active       verified and inside its validity window
   A missing end date never makes an offer active.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.UpdatesCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var SITE = "https://avhishek.in";
  var IST_OFFSET_MS = 330 * 60 * 1000;
  var DAY_MS = 24 * 60 * 60 * 1000;
  var ONGOING_RECHECK_DAYS = 30;

  var CATEGORIES = {
    launch: { label: "Card launch", plural: "Card launches", type: "news" },
    devaluation: { label: "Devaluation", plural: "Devaluations", type: "news" },
    banking: { label: "Banking update", plural: "Banking updates", type: "news" },
    regulatory: { label: "RBI and regulation", plural: "RBI and regulation", type: "news" },
    rewards: { label: "Rewards change", plural: "Rewards and benefits changes", type: "news" },
    announcement: { label: "Announcement", plural: "Announcements", type: "news" },
    "card-offer": { label: "Card offer", plural: "Credit card offers", type: "offer" },
    "gift-card": { label: "Gift card deal", plural: "Gift card deals", type: "offer" },
    cashback: { label: "Cashback deal", plural: "Cashback deals", type: "offer" },
    shopping: { label: "Shopping offer", plural: "Shopping offers", type: "offer" },
    travel: { label: "Travel offer", plural: "Travel offers", type: "offer" },
    limited: { label: "Limited-time offer", plural: "Limited-time promotions", type: "offer" }
  };

  var CONFIRMATION = {
    official: "Official",
    reported: "Reported",
    unconfirmed: "Unconfirmed"
  };

  var SOURCE_KINDS = {
    official: "official",
    report: "report",
    community: "community post"
  };

  var STATUS_LABEL = {
    active: "Active",
    upcoming: "Upcoming",
    expired: "Expired",
    unverified: "Needs verification"
  };

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  var DATE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/;

  /* ---------- Dates (all in IST) ---------- */

  function parts(value) {
    var m = DATE_RE.exec(String(value || "").trim());
    if (!m) return null;
    return { y: +m[1], mo: +m[2], d: +m[3], h: m[4] == null ? null : +m[4], mi: m[5] == null ? null : +m[5] };
  }

  function isValidDate(value) {
    var p = parts(value);
    if (!p) return false;
    if (p.mo < 1 || p.mo > 12 || p.d < 1 || p.d > 31) return false;
    if (p.h != null && (p.h > 23 || p.mi > 59)) return false;
    var probe = new Date(Date.UTC(p.y, p.mo - 1, p.d));
    return probe.getUTCMonth() === p.mo - 1 && probe.getUTCDate() === p.d;
  }

  // "2026-10-31" -> start or end of that day in IST; "2026-10-31 18:00" -> that minute in IST.
  function toMs(value, edge) {
    var p = parts(value);
    if (!p) return NaN;
    var h = p.h, mi = p.mi, s = 0, ms = 0;
    if (h == null) {
      if (edge === "end") { h = 23; mi = 59; s = 59; ms = 999; } else { h = 0; mi = 0; }
    } else if (edge === "end") {
      s = 59; ms = 999;
    }
    return Date.UTC(p.y, p.mo - 1, p.d, h, mi, s, ms) - IST_OFFSET_MS;
  }

  function istDayKey(ms) {
    var d = new Date(ms + IST_OFFSET_MS);
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
  }

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function fmtTime(p) {
    if (p.h == null) return "";
    var h = p.h % 12 || 12;
    return h + ":" + pad(p.mi) + " " + (p.h < 12 ? "am" : "pm");
  }

  function fmtDate(value, opts) {
    var p = parts(value);
    if (!p) return "";
    opts = opts || {};
    var out = p.d + " " + (opts.long ? MONTHS_LONG : MONTHS)[p.mo - 1] + " " + p.y;
    if (opts.time && p.h != null) out += ", " + fmtTime(p) + " IST";
    return out;
  }

  function fmtDay(value) {
    var p = parts(value);
    if (!p) return "";
    var wd = WEEKDAYS[new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay()];
    return wd + ", " + p.d + " " + MONTHS[p.mo - 1] + " " + p.y;
  }

  function isoDate(value) {
    var p = parts(value);
    if (!p) return "";
    var day = p.y + "-" + pad(p.mo) + "-" + pad(p.d);
    return p.h == null ? day : day + "T" + pad(p.h) + ":" + pad(p.mi) + "+05:30";
  }

  /* ---------- Offer status ---------- */

  function offerStatus(offer, now) {
    offer = offer || {};
    now = now == null ? Date.now() : now;
    var ongoing = offer.ends === "ongoing";
    var end = offer.ends && !ongoing ? toMs(offer.ends, "end") : NaN;
    if (!isNaN(end) && now > end) return "expired";
    if (!offer.verified || !isValidDate(offer.verified)) return "unverified";
    if (!ongoing && isNaN(end)) return "unverified";
    var start = offer.starts ? toMs(offer.starts, "start") : NaN;
    if (!isNaN(start) && now < start) return "upcoming";
    if (ongoing && now - toMs(offer.verified, "end") > ONGOING_RECHECK_DAYS * DAY_MS) return "unverified";
    return "active";
  }

  function validityText(offer) {
    offer = offer || {};
    var from = offer.starts ? fmtDate(offer.starts, { time: true }) : "";
    if (offer.ends === "ongoing") return from ? "From " + from + ", no end date announced" : "Ongoing, no end date announced";
    if (!offer.ends) return "End date not confirmed";
    var end = parts(offer.ends);
    if (!end) return "End date not confirmed";
    var to = fmtDate(offer.ends, { time: true });
    if (end.h == null) to += ", 11:59 pm IST";
    return from ? from + " to " + to : "Until " + to;
  }

  /* ---------- Helpers ---------- */

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isExternal(url) { return /^https?:\/\//i.test(url) && url.indexOf(SITE + "/") !== 0; }

  function linkAttrs(url) {
    return isExternal(url) ? ' target="_blank" rel="noopener noreferrer"' : "";
  }

  function newTab(url) {
    return isExternal(url) ? '<span class="sr-only"> (opens in a new tab)</span>' : "";
  }

  function categoryLabel(key) { return CATEGORIES[key] ? CATEGORIES[key].label : key; }

  function itemUrl(item) {
    return item.page ? SITE + "/updates/" + item.slug : SITE + "/updates#" + item.slug;
  }

  function itemHref(item) {
    if (item.page) return "/updates/" + item.slug;
    return item.link || "";
  }

  function shareLinks(url, title) {
    var text = title + " | via avhishek.in";
    return {
      whatsapp: "https://wa.me/?text=" + encodeURIComponent(text + "\n" + url),
      telegram: "https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text),
      x: "https://x.com/intent/post?text=" + encodeURIComponent(title) + "&url=" + encodeURIComponent(url) + "&via=the_avhishek"
    };
  }

  function isCurrent(item, now) {
    if (item.type === "offer") {
      var s = offerStatus(item.offer, now);
      return s === "active" || s === "upcoming";
    }
    return !item.archived;
  }

  function sortItems(items) {
    return items.slice().sort(function (a, b) {
      var d = toMs(b.published, "start") - toMs(a.published, "start");
      return d || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0);
    });
  }

  /* ---------- Markup ---------- */

  var ICON_SHARE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';

  function sourceLink(src) {
    if (!src) return "";
    var kind = src.kind && src.kind !== "official" ? " (" + SOURCE_KINDS[src.kind] + ")" : "";
    return 'Source: <a href="' + esc(src.url) + '"' + linkAttrs(src.url) + ">" + esc(src.label) + newTab(src.url) + "</a>" + esc(kind);
  }

  function metaLine(bits) {
    return '<p class="up-meta">' + bits.filter(Boolean).map(function (b) { return "<span>" + b + "</span>"; }).join("") + "</p>";
  }

  function shareButton(item) {
    return '<button type="button" class="up-share" data-share-url="' + esc(itemUrl(item)) + '" data-share-title="' + esc(item.title) +
      '" aria-label="Share: ' + esc(item.title) + '">' + ICON_SHARE + "</button>";
  }

  function renderTitle(item, level) {
    var href = itemHref(item);
    var inner = href ? '<a href="' + esc(href) + '"' + linkAttrs(href) + ">" + esc(item.title) + newTab(href) + "</a>" : esc(item.title);
    return "<h" + level + ' class="up-title">' + inner + "</h" + level + ">";
  }

  // The item's image beside the headline, so the feed can be scanned. The title
  // and summary carry the same facts, so the image is hidden from screen readers.
  function renderThumb(item) {
    var img = item.image;
    if (!img || !img.src) return "";
    var shape = img.height > img.width ? "is-portrait" : "is-landscape";
    var tag = '<img src="' + esc(img.thumb || img.src) + '" alt="" width="' + Number(img.width) + '" height="' + Number(img.height) + '" loading="lazy" decoding="async">';
    var href = itemHref(item);
    return href
      ? '<a class="up-thumb ' + shape + '" href="' + esc(href) + '"' + linkAttrs(href) + ' tabindex="-1" aria-hidden="true">' + tag + "</a>"
      : '<span class="up-thumb ' + shape + '" aria-hidden="true">' + tag + "</span>";
  }

  // With an image, the card is split into a head (beside the image) and a body.
  function withThumb(item, head, body) {
    var thumb = renderThumb(item);
    return thumb
      ? thumb + '<div class="up-item-head">' + head + '</div><div class="up-item-body">' + body + "</div>"
      : head + body;
  }

  function renderTerms(item) {
    var o = item.offer || {};
    var rows = [];
    function row(label, html, cls) { rows.push('<div' + (cls ? ' class="' + cls + '"' : "") + "><dt>" + label + "</dt><dd>" + html + "</dd></div>"); }
    row("Valid", esc(validityText(o)), "up-term-wide");
    if (o.cap) row("Maximum benefit", esc(o.cap));
    if (o.minSpend) row("Minimum spend", esc(o.minSpend));
    if (item.cards && item.cards.length) row("Cards", esc(item.cards.join(", ")));
    if (o.code) row("Code", '<code class="up-code">' + esc(o.code) + "</code>");
    if (o.eligibility) row("Who can use it", esc(o.eligibility), "up-term-wide");
    return '<dl class="up-terms">' + rows.join("") + "</dl>";
  }

  function renderItem(item, opts) {
    opts = opts || {};
    var now = opts.now == null ? Date.now() : opts.now;
    var level = opts.level || 3;
    var posted = '<time datetime="' + esc(isoDate(item.published)) + '">' + esc(fmtDate(item.published)) + "</time>";
    var updated = item.updated ? 'Updated <time datetime="' + esc(isoDate(item.updated)) + '">' + esc(fmtDate(item.updated)) + "</time>" : "";
    var who = [item.issuer, item.merchant].filter(Boolean).map(esc).join(" · ");
    var fixture = item.fixture ? '<span class="up-fixture">Sample data</span>' : "";

    if (item.type === "offer") {
      var o = item.offer || {};
      var status = offerStatus(o, now);
      var verified = o.verified && isValidDate(o.verified)
        ? "Checked against official terms on " + esc(fmtDate(o.verified))
        : "Not yet checked against official terms";
      var links = [];
      if (o.link) links.push('<a href="' + esc(o.link) + '"' + linkAttrs(o.link) + ">Offer page" + newTab(o.link) + "</a>");
      if (o.terms) links.push('<a href="' + esc(o.terms) + '"' + linkAttrs(o.terms) + ">Terms" + newTab(o.terms) + "</a>");
      return '<article class="up-item up-offer' + (item.image ? " has-thumb" : "") + '" id="' + esc(item.slug) + '" data-type="offer" data-status="' + status + '"' +
        ' data-starts="' + esc(o.starts || "") + '" data-ends="' + esc(o.ends || "") + '" data-verified="' + esc(o.verified || "") + '">' +
        withThumb(item,
          '<div class="up-item-top"><span class="up-kicker">' + esc(categoryLabel(item.category)) + "</span>" +
          '<span class="up-status">' + STATUS_LABEL[status] + "</span>" + fixture + "</div>" +
          (o.value ? '<p class="up-offer-value">' + esc(o.value) + "</p>" : "") +
          renderTitle(item, level),
          '<p class="up-summary">' + esc(item.summary) + "</p>" +
          renderTerms(item) +
          metaLine([who, "Posted " + posted, updated, verified]) +
          (links.length ? '<p class="up-links">' + links.join("") + "</p>" : "")) +
        shareButton(item) +
        "</article>";
    }

    var conf = item.confirmation || "official";
    return '<article class="up-item up-news' + (item.image ? " has-thumb" : "") + '" id="' + esc(item.slug) + '" data-type="news">' +
      withThumb(item,
        '<div class="up-item-top"><span class="up-kicker">' + esc(categoryLabel(item.category)) + "</span>" +
        '<span class="up-confirm" data-confirm="' + esc(conf) + '">' + CONFIRMATION[conf] + "</span>" + fixture + "</div>" +
        renderTitle(item, level),
        '<p class="up-summary">' + esc(item.summary) + "</p>" +
        metaLine([who, posted, updated, sourceLink(item.sources && item.sources[0])])) +
      shareButton(item) +
      "</article>";
  }

  // Items grouped under a heading per IST day of publication, newest first.
  function renderFeed(items, opts) {
    opts = opts || {};
    var out = [];
    var group = null;
    sortItems(items).forEach(function (item) {
      var key = istDayKey(toMs(item.published, "start"));
      if (!group || group.key !== key) {
        group = { key: key, items: [] };
        out.push(group);
      }
      group.items.push(item);
    });
    return out.map(function (g) {
      return '<section class="up-day" aria-label="' + esc(fmtDate(g.key, { long: true })) + '">' +
        '<h2 class="up-day-label"><time datetime="' + g.key + '">' + esc(fmtDay(g.key)) + "</time></h2>" +
        '<ol class="up-day-items">' + g.items.map(function (item) {
          return "<li>" + renderItem(item, { now: opts.now, level: 3 }) + "</li>";
        }).join("") + "</ol></section>";
    }).join("");
  }

  /* ---------- Search and filters ---------- */

  function normalise(text) {
    return String(text || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9₹%+.]+/g, " ").trim();
  }

  function haystack(item) {
    if (item._hay) return item._hay;
    var o = item.offer || {};
    item._hay = normalise([
      item.title, item.summary, item.issuer, item.merchant, (item.cards || []).join(" "), (item.tags || []).join(" "),
      categoryLabel(item.category), CATEGORIES[item.category] && CATEGORIES[item.category].plural, o.value, o.code
    ].join(" "));
    return item._hay;
  }

  function matches(item, state, now) {
    if (state.view === "news" && item.type !== "news") return false;
    if (state.view === "offers" && item.type !== "offer") return false;
    if (state.cat && item.category !== state.cat) return false;
    if (state.bank && item.issuer !== state.bank && item.merchant !== state.bank) return false;
    var show = state.show || "current";
    if (show === "current" && !isCurrent(item, now)) return false;
    if (show === "archive") {
      if (item.type === "offer" && offerStatus(item.offer, now) !== "expired") return false;
      if (item.type === "news" && !item.archived) return false;
    }
    if (state.q) {
      var hay = haystack(item);
      var words = normalise(state.q).split(" ").filter(Boolean);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) === -1) return false;
    }
    return true;
  }

  // Re-check offer statuses already in the page (static HTML can be days old).
  function refreshDom(scope, now) {
    now = now == null ? Date.now() : now;
    var nodes = (scope || document).querySelectorAll('[data-type="offer"][data-ends]');
    Array.prototype.forEach.call(nodes, function (node) {
      var status = offerStatus({ starts: node.dataset.starts, ends: node.dataset.ends, verified: node.dataset.verified }, now);
      node.dataset.status = status;
      var label = node.querySelector(".up-status");
      if (label) label.textContent = STATUS_LABEL[status];
    });
  }

  return {
    SITE: SITE,
    CATEGORIES: CATEGORIES,
    CONFIRMATION: CONFIRMATION,
    SOURCE_KINDS: SOURCE_KINDS,
    STATUS_LABEL: STATUS_LABEL,
    ONGOING_RECHECK_DAYS: ONGOING_RECHECK_DAYS,
    isValidDate: isValidDate,
    toMs: toMs,
    istDayKey: istDayKey,
    fmtDate: fmtDate,
    fmtDay: fmtDay,
    isoDate: isoDate,
    offerStatus: offerStatus,
    validityText: validityText,
    esc: esc,
    isExternal: isExternal,
    categoryLabel: categoryLabel,
    itemUrl: itemUrl,
    itemHref: itemHref,
    shareLinks: shareLinks,
    isCurrent: isCurrent,
    sortItems: sortItems,
    renderItem: renderItem,
    renderFeed: renderFeed,
    renderTerms: renderTerms,
    matches: matches,
    normalise: normalise,
    refreshDom: refreshDom
  };
});
