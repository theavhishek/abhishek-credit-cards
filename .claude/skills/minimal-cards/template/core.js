// Easing and timing helpers. Everything is a pure function of t (seconds). No Math.random, no Date.
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const ease3 = p => (p = clamp(p), p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const expo = p => (p = clamp(p), p === 1 ? 1 : 1 - Math.pow(2, -10 * p));
const soft = p => (p = clamp(p), 1 - Math.pow(1 - p, 2));
// Damped spring from 0 to 1 over roughly `dur` seconds, with a small overshoot.
const spring = (s, dur = .7, bounce = .32) => { if (s <= 0) return 0; const x = s / dur * 6; return 1 - Math.exp(-x) * Math.cos(x * (1 + bounce * 2)); };
// tw: progress between two times with an easing. kf: keyframes [[t, v], ...] with ease3 between.
const tw = (t, a, b, e = ease3) => e((t - a) / (b - a));
const kf = (t, k) => { if (t <= k[0][0]) return k[0][1]; for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], ease3((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]))); return k[k.length - 1][1]; };
// Odometer: each digit column rolls the short way from `from` to `to`, `s` seconds after the change.
const roll2 = (from, to, s, dur = .6) => {
  const a = String(from), b = String(to), n = Math.max(a.length, b.length), pa = a.padStart(n, " "), pb = b.padStart(n, " ");
  let out = "";
  for (let i = 0; i < n; i++) {
    const p = spring(s - i * .05, dur, .15);
    if (pa[i] === pb[i] || !/\d/.test(pa[i] + pb[i])) { out += `<span class="dg">${pb[i] === " " ? "" : pb[i]}</span>`; continue; }
    const da = +pa[i] || 0, db = +pb[i] || 0; let d = db - da; if (d > 5) d -= 10; if (d < -5) d += 10;
    const pos = da + d * clamp(p, 0, 1.08);
    const col = [-1, 0, 1, 2].map(k => ((Math.floor(pos) + k) % 10 + 10) % 10);
    out += `<span class="dg roll"><span style="transform:translate3d(0,${-(pos - Math.floor(pos) + 1)}em,0)">${col.map(c => `<b>${c}</b>`).join("")}</span></span>`;
  }
  return out;
};
// stepRoll: value changes at given times [[t, v], ...]. rollL: cycle a list every `every` seconds.
const stepRoll = (t, steps) => { let i = 0; while (i + 1 < steps.length && t >= steps[i + 1][0]) i++; return roll2(steps[Math.max(0, i - 1)][1], steps[i][1], i ? t - steps[i][0] : 9); };
const rollL = (t, list, every, start = 0) => { const k = Math.max(0, Math.floor((t - start) / every)); return roll2(list[Math.max(0, k - 1) % list.length], list[k % list.length], k ? t - start - k * every : 9); };
// Clocks: tickUp counts seconds from base, tickDn counts down. Return [mm, ss, secondsSinceMinuteChange].
const tickUp = (t, base, rate = 1) => { const v = base + t * rate; return [Math.floor(v / 60), Math.floor(v % 60), (v % 60) / rate]; };
const tickDn = (t, base, rate = 1) => { const v = Math.max(0, base - t * rate); return [Math.floor(v / 60), Math.floor(v % 60), (60 - v % 60) / rate]; };
const cnt = (t, from, to, a, b) => Math.round(lerp(from, to, tw(t, a, b, soft)));
// Crossfade text that changes state with a small slide; never swap strings at a threshold.
const xf = (a, b, p) => `<span class="xf"><span style="opacity:${1 - p};transform:translate3d(0,${-6 * p}px,0)">${a}</span><span style="opacity:${p};transform:translate3d(0,${6 * (1 - p)}px,0)">${b}</span></span>`;
