/* Happy Diwali welcome popup (Diwali 2026).
   Shows once per visitor, only between SHOW_FROM and SHOW_UNTIL (India time),
   then does nothing. Styles are injected only when it shows.
   Preview any time: add ?diwali to a URL (ignores the date and the "seen" flag). */
(function () {
  'use strict';

  var SHOW_FROM = Date.parse('2026-11-07T00:00:00+05:30');
  var SHOW_UNTIL = Date.parse('2026-11-10T00:00:00+05:30'); // hides itself after 9 Nov 2026, 11:59 pm IST
  var SEEN_KEY = 'avhishek-diwali-2026-seen';

  var forced = /[?&]diwali\b/.test(location.search);
  var now = Date.now();
  if (!forced && (now < SHOW_FROM || now >= SHOW_UNTIL)) return;

  function seen() { try { return localStorage.getItem(SEEN_KEY) === '1'; } catch (e) { return false; } }
  function markSeen() { try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) {} }
  if (!forced && seen()) return;
  if (navigator.webdriver && !forced) return; // keep bots and link-preview renderers out

  var CSS = [
    '.dw{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;box-sizing:border-box;font-family:var(--site-font,system-ui,sans-serif);-webkit-font-smoothing:antialiased}',
    '.dw *,.dw *::before,.dw *::after{box-sizing:border-box}',
    '.dw-scrim{position:absolute;inset:0;background:rgba(10,8,6,.42);-webkit-backdrop-filter:blur(10px) saturate(1.1);backdrop-filter:blur(10px) saturate(1.1);opacity:0;transition:opacity .45s var(--ease,ease)}',
    'html[data-theme="dark"] .dw-scrim{background:rgba(0,0,0,.62)}',
    '.dw-card{--dw-gold:#c2410c;--dw-gold-2:#ea5a12;position:relative;width:min(400px,100%);max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;padding:0 26px 24px;border-radius:28px;text-align:center;color:var(--text,#1d1d1f);background:rgba(255,255,255,.86);-webkit-backdrop-filter:blur(24px) saturate(1.6);backdrop-filter:blur(24px) saturate(1.6);border:1px solid rgba(0,0,0,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 1px 2px rgba(0,0,0,.06),0 24px 70px rgba(80,40,0,.22);opacity:0;transform:translateY(18px) scale(.96);transition:opacity .5s var(--ease,ease),transform .6s cubic-bezier(.2,1.1,.3,1)}',
    'html[data-theme="dark"] .dw-card{--dw-gold:#f5c76b;--dw-gold-2:#ffdf9a;background:rgba(28,28,30,.82);border-color:rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 30px 90px rgba(0,0,0,.7),0 0 0 1px rgba(245,199,107,.06)}',
    '.dw-card:focus{outline:none}',
    '.dw.is-open .dw-scrim{opacity:1}',
    '.dw.is-open .dw-card{opacity:1;transform:none}',
    '.dw.is-closing .dw-scrim{opacity:0;transition-duration:.3s}',
    '.dw.is-closing .dw-card{opacity:0;transform:translateY(10px) scale(.97);transition-duration:.25s}',
    /* string of lights */
    '.dw-toran{display:block;width:calc(100% + 52px);height:46px;margin:0 -26px;overflow:visible}',
    '.dw-toran path{fill:none;stroke:var(--line-strong,rgba(0,0,0,.15));stroke-width:1}',
    '.dw-bulb{animation:dw-twinkle 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}',
    '@keyframes dw-twinkle{0%,100%{opacity:1}50%{opacity:.35}}',
    /* diya */
    '.dw-stage{position:relative;width:132px;height:112px;margin:2px auto 6px}',
    '.dw-glow{position:absolute;left:50%;top:6px;width:150px;height:150px;margin-left:-75px;border-radius:50%;background:radial-gradient(circle,rgba(255,170,60,.38) 0,rgba(255,140,30,.12) 38%,transparent 68%);animation:dw-breathe 3.2s ease-in-out infinite;pointer-events:none}',
    'html[data-theme="dark"] .dw-glow{background:radial-gradient(circle,rgba(255,180,70,.42) 0,rgba(255,140,30,.14) 40%,transparent 70%)}',
    '@keyframes dw-breathe{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.08);opacity:1}}',
    '.dw-diya{position:relative;display:block;width:132px;height:112px}',
    '.dw-flame{transform-box:fill-box;transform-origin:50% 100%;animation:dw-flicker 1.6s ease-in-out infinite}',
    '.dw-flame-core{transform-box:fill-box;transform-origin:50% 100%;animation:dw-flicker 1.1s ease-in-out infinite reverse}',
    '@keyframes dw-flicker{0%,100%{transform:scale(1,1) skewX(0)}25%{transform:scale(.96,1.06) skewX(-2deg)}50%{transform:scale(1.03,.95) skewX(1.5deg)}75%{transform:scale(.98,1.04) skewX(2deg)}}',
    '.dw-spark{position:absolute;left:50%;top:44px;width:3px;height:3px;border-radius:50%;background:#ffc861;box-shadow:0 0 6px 1px rgba(255,170,60,.8);opacity:0;animation:dw-rise 3.6s ease-out infinite}',
    '@keyframes dw-rise{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),-70px)}}',
    /* text */
    '.dw-eyebrow{margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--muted,#6e6e73)}',
    '.dw-title{margin:0;font-size:clamp(38px,10vw,46px);line-height:1;font-weight:700;letter-spacing:-.045em;color:var(--dw-gold);background:linear-gradient(100deg,var(--dw-gold) 0%,var(--dw-gold) 38%,var(--dw-gold-2) 50%,var(--dw-gold) 62%,var(--dw-gold) 100%);background-size:250% 100%;background-position:100% 0;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:dw-foil 5s ease-in-out .9s infinite}',
    '@keyframes dw-foil{0%{background-position:100% 0}40%,100%{background-position:0 0}}',
    '.dw-lead{margin:12px auto 0;max-width:30ch;font-size:15px;line-height:1.5;letter-spacing:-.01em;color:var(--muted,#6e6e73);text-wrap:pretty}',
    '.dw-sign{margin:16px 0 0;font-size:13px;line-height:1.35;color:var(--muted,#6e6e73)}',
    '.dw-sign strong{display:block;font-weight:600;color:var(--text,#1d1d1f)}',
    '.dw-cta{margin-top:20px;width:100%;min-height:46px;padding:0 20px;border:0;border-radius:980px;font:inherit;font-size:15px;font-weight:600;letter-spacing:-.01em;cursor:pointer;color:#fff;background:linear-gradient(180deg,#f0701f,#c2410c);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 1px 2px rgba(0,0,0,.12),0 8px 22px rgba(194,65,12,.32);transition:transform .2s var(--ease,ease),box-shadow .2s var(--ease,ease),filter .2s}',
    'html[data-theme="dark"] .dw-cta{color:#2a1700;background:linear-gradient(180deg,#ffd98a,#e9a93c);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 8px 26px rgba(233,169,60,.28)}',
    '@media (hover:hover){.dw-cta:hover{filter:brightness(1.05);transform:translateY(-1px)}}',
    '.dw-cta:active{transform:scale(.98);filter:brightness(.96)}',
    '.dw-close{position:absolute;top:12px;right:12px;z-index:2;display:grid;place-items:center;width:34px;height:34px;padding:0;border:1px solid var(--line,rgba(0,0,0,.08));border-radius:50%;background:var(--surface,#fff);color:var(--muted,#6e6e73);cursor:pointer;transition:color .2s,transform .2s var(--ease,ease)}',
    '@media (hover:hover){.dw-close:hover{color:var(--text,#1d1d1f)}}',
    '.dw-close:active{transform:scale(.92)}',
    '.dw-close svg{width:14px;height:14px}',
    '.dw-cta:focus-visible,.dw-close:focus-visible{outline:2px solid var(--focus,#0066cc);outline-offset:3px}',
    '.dw-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    'html.dw-lock,html.dw-lock body{overflow:hidden}',
    '@media (max-width:640px){.dw{align-items:end;padding:12px 12px max(12px,env(safe-area-inset-bottom))}.dw-card{width:100%;border-radius:26px;transform:translateY(40px)}.dw.is-closing .dw-card{transform:translateY(30px)}}',
    '@media (prefers-reduced-motion:reduce){.dw-bulb,.dw-glow,.dw-flame,.dw-flame-core,.dw-title{animation:none}.dw-spark{display:none}.dw-card,.dw.is-closing .dw-card{transform:none;transition:opacity .2s linear}.dw-scrim{transition:opacity .2s linear}}'
  ].join('');

  var BULBS = ['#f59e0b', '#ef4444', '#fbbf24', '#f97316', '#fde68a', '#f97316', '#fbbf24', '#ef4444', '#f59e0b'];

  function toranSvg() {
    // a hanging string of lights across the top edge of the card
    var out = '<svg class="dw-toran" viewBox="0 0 400 46" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      '<path d="M0 6 Q50 30 100 10 Q150 32 200 10 Q250 32 300 10 Q350 30 400 6"/>';
    var xs = [22, 62, 100, 140, 200, 260, 300, 338, 378];
    var ys = [14, 20, 12, 21, 12, 21, 12, 20, 14];
    for (var i = 0; i < xs.length; i++) {
      var c = BULBS[i];
      out += '<g class="dw-bulb" style="animation-delay:' + (i * 0.27).toFixed(2) + 's">' +
        '<line x1="' + xs[i] + '" y1="' + (ys[i] - 2) + '" x2="' + xs[i] + '" y2="' + (ys[i] + 3) + '" stroke="currentColor" stroke-opacity=".25" stroke-width="1"/>' +
        '<circle cx="' + xs[i] + '" cy="' + (ys[i] + 7) + '" r="7" fill="' + c + '" opacity=".22"/>' +
        '<circle cx="' + xs[i] + '" cy="' + (ys[i] + 7) + '" r="3.6" fill="' + c + '"/></g>';
    }
    return out + '</svg>';
  }

  var DIYA =
    '<svg class="dw-diya" viewBox="0 0 132 112" aria-hidden="true" focusable="false">' +
    '<defs>' +
    '<linearGradient id="dwClay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2793a"/><stop offset=".55" stop-color="#b8461c"/><stop offset="1" stop-color="#7a2c10"/></linearGradient>' +
    '<linearGradient id="dwRim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6b26b"/><stop offset=".5" stop-color="#ffd9a0"/><stop offset="1" stop-color="#e98d47"/></linearGradient>' +
    '<radialGradient id="dwFlame" cx=".5" cy=".75" r=".75"><stop offset="0" stop-color="#fff7d6"/><stop offset=".35" stop-color="#ffd25a"/><stop offset=".75" stop-color="#ff8a1f"/><stop offset="1" stop-color="#ff5a1f" stop-opacity=".2"/></radialGradient>' +
    '</defs>' +
    // flame
    '<path class="dw-flame" d="M66 14 C74 30 80 40 80 50 C80 59 74 64 66 64 C58 64 52 59 52 50 C52 40 58 30 66 14Z" fill="url(#dwFlame)"/>' +
    '<path class="dw-flame-core" d="M66 38 C70 45 72 50 72 54 C72 59 69 62 66 62 C63 62 60 59 60 54 C60 50 62 45 66 38Z" fill="#fffbe8" opacity=".9"/>' +
    '<rect x="64.6" y="60" width="2.8" height="8" rx="1.4" fill="#5a2a12"/>' +
    // bowl
    '<path d="M16 70 C24 70 40 68 66 68 C92 68 108 70 118 66 C114 86 94 100 66 100 C38 100 20 88 16 70Z" fill="url(#dwClay)"/>' +
    '<path d="M16 70 C24 66 42 64 66 64 C92 64 108 64 118 66 C108 72 92 74 66 74 C40 74 24 74 16 70Z" fill="url(#dwRim)"/>' +
    '<path d="M24 71 C34 69 48 68.5 66 68.5 C86 68.5 100 69 110 67.5 C100 71 86 72 66 72 C46 72 32 72 24 71Z" fill="#4a1f08" opacity=".55"/>' +
    // dots on the bowl
    '<g fill="#ffd9a0" opacity=".85"><circle cx="40" cy="84" r="1.8"/><circle cx="53" cy="88" r="1.8"/><circle cx="66" cy="89.5" r="2.2"/><circle cx="79" cy="88" r="1.8"/><circle cx="92" cy="84" r="1.8"/></g>' +
    '<path d="M48 104 C56 106 76 106 84 104" stroke="#000" stroke-opacity=".12" stroke-width="3" stroke-linecap="round" fill="none"/>' +
    '</svg>';

  function sparks() {
    var s = '';
    var dx = [-18, 12, -6, 20, -14, 6, 16, -22];
    for (var i = 0; i < dx.length; i++) {
      s += '<span class="dw-spark" style="--dx:' + dx[i] + 'px;margin-left:' + (dx[i] / 6).toFixed(1) + 'px;animation-delay:' + (i * 0.45).toFixed(2) + 's"></span>';
    }
    return s;
  }

  var root, lastFocus, closing = false;

  function close() {
    if (!root || closing) return;
    closing = true;
    markSeen();
    root.classList.add('is-closing');
    root.classList.remove('is-open');
    document.removeEventListener('keydown', onKey, true);
    var done = function () {
      if (root && root.parentNode) root.parentNode.removeChild(root);
      document.documentElement.classList.remove('dw-lock');
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
      root = null;
    };
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(done, reduce ? 200 : 320);
  }

  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab' && root) {
      var f = root.querySelectorAll('button');
      var first = f[0], last = f[f.length - 1];
      var card = root.querySelector('.dw-card');
      if (document.activeElement === card) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!root.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  }

  function open() {
    if (document.querySelector('.dw')) return;
    var style = document.createElement('style');
    style.id = 'dw-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    root = document.createElement('div');
    root.className = 'dw';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'dw-title');
    root.setAttribute('aria-describedby', 'dw-lead');
    root.innerHTML =
      '<div class="dw-scrim" data-dw-close></div>' +
      '<div class="dw-card" tabindex="-1">' +
        '<button type="button" class="dw-close" data-dw-close aria-label="Close">' +
          '<svg viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
        '</button>' +
        toranSvg() +
        '<div class="dw-stage" aria-hidden="true"><span class="dw-glow"></span>' + DIYA + sparks() + '</div>' +
        '<p class="dw-eyebrow">Shubh Deepavali</p>' +
        '<h2 class="dw-title" id="dw-title">Happy Diwali</h2>' +
        '<p class="dw-lead" id="dw-lead">May the festival of lights fill your home with joy, good health and prosperity, and your cards with plenty of rewards.</p>' +
        '<p class="dw-sign"><strong>Abhishek Meena</strong>avhishek.in</p>' +
        '<button type="button" class="dw-cta" data-dw-close>Thank you</button>' +
      '</div>';

    root.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-dw-close]')) close();
    });

    lastFocus = document.activeElement;
    document.body.appendChild(root);
    document.documentElement.classList.add('dw-lock');
    document.addEventListener('keydown', onKey, true);
    markSeen(); // counts as seen even if they navigate away without closing
    // two frames so the entrance transition runs
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!root) return;
        root.classList.add('is-open');
        // focus the dialog itself (no ring shown); Tab moves to the buttons
        var card = root.querySelector('.dw-card');
        if (card) { try { card.focus({ preventScroll: true }); } catch (e) { card.focus(); } }
      });
    });
  }

  function start() { setTimeout(open, forced ? 300 : 1100); }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
})();
