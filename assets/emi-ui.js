/* ==========================================================================
   EMI UI helpers shared by loan-emi.js and no-cost-emi.js (window.EmiUI):
   money inputs, sliders, the donut and balance chart, CSV, copy and print.
   Calculations live in emi-core.js; this file only draws and wires things.
   ========================================================================== */
(function () {
  "use strict";
  var E = window.EmiCore;
  var SVGNS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Read a field: money fields accept commas, ₹ and lakh/crore shorthand.
  function readNum(el) {
    if (!el) return NaN;
    var v = el.value;
    return el.dataset.money !== undefined ? E.parseAmount(v) : (v === "" ? NaN : parseFloat(v));
  }

  // Money inputs show Indian grouping when not focused and keep the caret steady while typing.
  function bindMoney(el, onChange) {
    function pretty() {
      var n = E.parseAmount(el.value);
      if (isFinite(n)) el.value = E.formatNumber(n, 2);
    }
    el.addEventListener("input", onChange);
    el.addEventListener("blur", function () { pretty(); });
    el.addEventListener("paste", function () { setTimeout(onChange, 0); });
    if (document.activeElement !== el) pretty();
  }
  function setMoney(el, n) {
    if (!el) return;
    el.value = isFinite(n) && n !== null && n !== "" ? E.formatNumber(n, 2) : "";
  }

  // Sliders: linear, or logarithmic for loan amounts (₹10,000 to ₹5 crore feels even).
  function bindRange(range, input, opts) {
    var log = opts && opts.log;
    var min = parseFloat(range.dataset.min || range.min), max = parseFloat(range.dataset.max || range.max);
    function toRange(v) {
      if (!isFinite(v)) return;
      var t = log ? (Math.log(Math.max(min, Math.min(max, v))) - Math.log(min)) / (Math.log(max) - Math.log(min)) : (Math.min(max, Math.max(min, v)) - min) / (max - min);
      range.value = log ? String(Math.round(t * 1000)) : String(Math.min(max, Math.max(min, v)));
      range.style.setProperty("--fill", (t * 100).toFixed(2) + "%");
      range.setAttribute("aria-valuetext", opts && opts.text ? opts.text(v) : String(v));
    }
    function fromRange() {
      var t = log ? parseFloat(range.value) / 1000 : (parseFloat(range.value) - min) / (max - min);
      var v = log ? Math.exp(Math.log(min) + t * (Math.log(max) - Math.log(min))) : parseFloat(range.value);
      if (opts && opts.snap) v = opts.snap(v);
      return v;
    }
    range.addEventListener("input", function () {
      var v = fromRange();
      if (input.dataset.money !== undefined) setMoney(input, v); else input.value = String(v);
      toRange(v);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    return { sync: function () { toRange(readNum(input)); } };
  }
  // Round slider amounts to friendly steps.
  function snapAmount(v) {
    var step = v < 1e5 ? 1000 : v < 1e6 ? 5000 : v < 1e7 ? 50000 : 500000;
    return Math.round(v / step) * step;
  }

  function setText(el, text, flash) {
    if (!el || el.textContent === text) return;
    el.textContent = text;
    if (flash && !reduceMotion.matches) {
      el.classList.remove("ce-flash");
      void el.offsetWidth;
      el.classList.add("ce-flash");
    }
  }
  function setError(field, msg) {
    var box = field && field.closest(".ce-field");
    if (!box) return;
    var err = $(".ce-error", box);
    var wrap = $(".ce-input", box);
    if (err) err.textContent = msg || "";
    if (wrap) wrap.classList.toggle("is-invalid", !!msg);
    field.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  /* ---------- Donut: two shares of a whole ---------- */
  function donut(svg, parts) {
    var total = parts.reduce(function (s, p) { return s + Math.max(0, p.value); }, 0) || 1;
    var r = 45, c = 2 * Math.PI * r, gap = parts.filter(function (p) { return p.value > 0; }).length > 1 ? 2.5 : 0;
    svg.setAttribute("viewBox", "0 0 112 112");
    var off = 0, html = "";
    parts.forEach(function (p) {
      var len = Math.max(0, (p.value / total) * c - gap);
      if (p.value > 0) {
        html += '<circle cx="56" cy="56" r="' + r + '" stroke="' + p.color + '" stroke-dasharray="' + len.toFixed(2) + " " + (c - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 56 56)"></circle>';
      }
      off += (p.value / total) * c;
    });
    svg.innerHTML = html;
  }

  /* ---------- Line chart: loan balance over time ---------- */
  // series: [{ name, values: [balance at month 0..n], cls, color }]
  function lineChart(box, series, opts) {
    var o = opts || {};
    // Draw at the box's real width so text stays 12px on phones and wide screens alike.
    var W = Math.max(300, Math.round(box.clientWidth || 720)), H = Math.round(Math.min(320, Math.max(220, W * 0.36))), L = 64, R = 16, T = 12, B = 32;
    var maxN = Math.max.apply(null, series.map(function (s) { return s.values.length - 1; })) || 1;
    var maxV = Math.max.apply(null, series.map(function (s) { return Math.max.apply(null, s.values); })) || 1;
    var nice = niceMax(maxV);
    function x(i) { return L + (i / maxN) * (W - L - R); }
    function y(v) { return T + (1 - v / nice) * (H - T - B); }
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.label || "") + '" focusable="false">';
    svg += '<g class="ce-grid">';
    for (var g = 0; g <= 4; g++) {
      var gy = y((nice * g) / 4);
      svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '"></line>';
    }
    svg += '</g><g class="ce-axis">';
    for (var t = 0; t <= 4; t++) svg += '<text x="' + (L - 10) + '" y="' + (y((nice * t) / 4) + 4) + '" text-anchor="end">' + shortINR((nice * t) / 4) + "</text>";
    var yearsTotal = maxN / 12, stepY = yearsTotal <= 3 ? 0.5 : yearsTotal <= 10 ? 1 : yearsTotal <= 20 ? 2 : 5;
    if (maxN < 12) {
      for (var m = 0; m <= maxN; m += Math.max(1, Math.ceil(maxN / 6))) svg += '<text x="' + x(m) + '" y="' + (H - 8) + '" text-anchor="middle">' + m + "m</text>";
    } else {
      for (var yy = 0; yy * 12 <= maxN + 0.01; yy += stepY) svg += '<text x="' + x(yy * 12) + '" y="' + (H - 8) + '" text-anchor="middle">' + (yy === 0 ? "0" : (yy % 1 ? yy.toFixed(1) : yy) + "y") + "</text>";
    }
    svg += "</g>";
    series.forEach(function (s) {
      var d = s.values.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join("");
      svg += '<path class="ce-line ' + s.cls + '" d="' + d + '"></path>';
    });
    svg += '<line class="ce-cross" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) + '" visibility="hidden"></line>';
    series.forEach(function (s, k) { svg += '<circle class="ce-dot" data-k="' + k + '" r="5" fill="' + s.color + '" visibility="hidden"></circle>'; });
    svg += "</svg>";
    box.innerHTML = svg + '<div class="ce-chart-hit" tabindex="0" role="slider" aria-label="' + esc(o.hitLabel || "Move through the months") + '" aria-valuemin="0" aria-valuemax="' + maxN + '" aria-valuenow="0"></div><div class="ce-tip" hidden></div>';

    var svgEl = $("svg", box), hit = $(".ce-chart-hit", box), tip = $(".ce-tip", box), cross = $(".ce-cross", box);
    var dots = $$(".ce-dot", box);
    var cur = -1;
    function show(i) {
      i = Math.max(0, Math.min(maxN, Math.round(i)));
      cur = i;
      var px = x(i);
      cross.setAttribute("x1", px); cross.setAttribute("x2", px); cross.setAttribute("visibility", "visible");
      var rows = "";
      series.forEach(function (s, k) {
        var v = s.values[Math.min(i, s.values.length - 1)];
        dots[k].setAttribute("cx", px); dots[k].setAttribute("cy", y(v)); dots[k].setAttribute("visibility", "visible");
        rows += '<div><i style="background:' + s.color + '"></i>' + esc(s.name) + ": " + E.formatINR(v) + "</div>";
      });
      var label = o.dateFor ? o.dateFor(i) : "";
      tip.innerHTML = "<b>" + (i === 0 ? "Start" : "After " + E.monthsLabel(i)) + (label ? " · " + esc(label) : "") + "</b>" + rows;
      tip.hidden = false;
      var bw = box.clientWidth, scale = bw / W;
      var left = px * scale + 14;
      if (left + tip.offsetWidth > bw) left = px * scale - tip.offsetWidth - 14;
      tip.style.left = Math.max(0, left) + "px";
      tip.style.top = "8px";
      hit.setAttribute("aria-valuenow", String(i));
      hit.setAttribute("aria-valuetext", tip.textContent);
    }
    function hide() {
      tip.hidden = true;
      cross.setAttribute("visibility", "hidden");
      dots.forEach(function (d) { d.setAttribute("visibility", "hidden"); });
    }
    function fromEvent(ev) {
      var rect = svgEl.getBoundingClientRect();
      var px = ((ev.clientX - rect.left) / rect.width) * W;
      return ((px - L) / (W - L - R)) * maxN;
    }
    hit.addEventListener("pointermove", function (ev) { show(fromEvent(ev)); });
    hit.addEventListener("pointerdown", function (ev) { show(fromEvent(ev)); });
    hit.addEventListener("pointerleave", function (ev) { if (ev.pointerType === "mouse") hide(); });
    hit.addEventListener("blur", hide);
    hit.addEventListener("focus", function () { show(cur < 0 ? 0 : cur); });
    hit.addEventListener("keydown", function (ev) {
      var step = ev.shiftKey ? 12 : 1;
      var keys = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: 12, PageDown: -12 };
      if (keys[ev.key] !== undefined) { ev.preventDefault(); show((cur < 0 ? 0 : cur) + keys[ev.key]); }
      else if (ev.key === "Home") { ev.preventDefault(); show(0); }
      else if (ev.key === "End") { ev.preventDefault(); show(maxN); }
      else if (ev.key === "Escape") hide();
    });
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(v)));
    var m = v / p;
    var n = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
    return n * p;
  }
  // ₹12.5L / ₹1.2Cr / ₹45K for axis labels.
  function shortINR(v) {
    if (v >= 1e7) return "₹" + trim(v / 1e7) + "Cr";
    if (v >= 1e5) return "₹" + trim(v / 1e5) + "L";
    if (v >= 1e3) return "₹" + trim(v / 1e3) + "K";
    return "₹" + Math.round(v);
  }
  function trim(n) { return (Math.round(n * 10) / 10).toString(); }

  /* ---------- Export ---------- */
  function csv(rows) {
    return rows.map(function (r) {
      return r.map(function (c) {
        var s = c == null ? "" : String(c);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(",");
    }).join("\r\n");
  }
  function download(name, text, type) {
    var blob = new Blob(["﻿" + text], { type: type || "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      ta.remove();
    });
  }
  // Briefly confirm on a button and in a live region.
  function confirm(btn, status, msg) {
    if (status) status.textContent = msg;
    if (btn) {
      btn.classList.add("is-done");
      setTimeout(function () { btn.classList.remove("is-done"); if (status && status.textContent === msg) status.textContent = ""; }, 2400);
    }
  }

  // Coalesce many input events into one recalculation per frame.
  function scheduler(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fn(); });
    };
  }

  window.EmiUI = {
    $: $, $$: $$, esc: esc,
    readNum: readNum, bindMoney: bindMoney, setMoney: setMoney,
    bindRange: bindRange, snapAmount: snapAmount,
    setText: setText, setError: setError,
    donut: donut, lineChart: lineChart, shortINR: shortINR,
    csv: csv, download: download, copy: copy, confirm: confirm,
    scheduler: scheduler
  };
})();
