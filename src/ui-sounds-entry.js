// UI sounds for avhishek.in, synthesised live by cuelume (MIT, Daniel Belyi).
// No audio files and no network: one shared AudioContext, created on the first cue.
// motion.js imports this module once the page is idle; styles for the footer switch
// live in footer.css (.gf-sound).
//
// Rules: a cue only answers something the visitor just did (pointer or key within the
// last second), one cue per gesture, never on hover, scroll or page load. The footer
// "Sound" switch turns everything off and is remembered on this device; it starts off
// for visitors who ask for reduced motion.
import { play, setEnabled, setVolume, unlock } from "cuelume";

const KEY = "abhishek-card-stack-sound";
const doc = document;

let on = true;
try {
  const saved = localStorage.getItem(KEY);
  on = saved ? saved === "on" : !matchMedia("(prefers-reduced-motion: reduce)").matches;
} catch {
  on = !matchMedia("(prefers-reduced-motion: reduce)").matches;
}
setVolume(0.6);
setEnabled(on);

// Gestures: every pointerdown or keydown starts a new one; it may play one cue within 1s.
let gesture = 0;
let gestureAt = 0;
let spent = -1;
const mark = () => { gesture += 1; gestureAt = performance.now(); };
addEventListener("pointerdown", mark, true);
addEventListener("keydown", (e) => { if (!e.repeat || e.key.startsWith("Arrow")) mark(); }, true);
addEventListener("pointerup", () => { gestureAt = performance.now(); }, true);

function cue(name, options) {
  if (!on || spent === gesture || performance.now() - gestureAt > 1000) return;
  spent = gesture;
  play(name, options);
}

const subtle = { emphasis: "subtle" };

// Clicks, in the capture phase so a button's own handler (which may change inputs
// and fire change events) can't steal the gesture first.
doc.addEventListener("click", (e) => {
  const el = e.target instanceof Element ? e.target : null;
  if (!el || el.closest(".gf-sound")) return;
  if (el.closest("[data-max]")) return cue("count", { duration: 700 });
  if (el.closest('[role="tab"]') && !el.closest(".arc-tabs--nav")) return cue("select");
  if (el.closest("[data-preset], .sw-chip, .ui__chip, .py-fchip, .chip")) return cue("select");
  if (el.closest(".site-search-btn")) return cue("open", subtle);
}, true);

// Form controls: theme switch, radios, checkboxes, sliders, selects.
let lastTheme = -Infinity;
doc.addEventListener("change", (e) => {
  const el = e.target;
  if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement)) return;
  if (el.id === "themeSwitch") {
    // motion.js replays this change inside a view transition; play once.
    const now = performance.now();
    if (now - lastTheme < 400) return;
    lastTheme = now;
    return cue("toggle", { direction: el.checked ? "forward" : "back" });
  }
  if (el instanceof HTMLSelectElement) return cue("select");
  if (el.type === "radio") return cue("select", subtle);
  if (el.type === "checkbox") return cue("toggle", { ...subtle, direction: el.checked ? "forward" : "back" });
  if (el.type === "range") return cue("select", subtle);
}, true);

// Dropdowns (FAQ, Sources, bank cards, statements) and the Explore menu popover.
// toggle doesn't bubble, but capture listeners on the document still see it.
doc.addEventListener("toggle", (e) => {
  const el = e.target;
  if (el instanceof HTMLDetailsElement) return cue(el.open ? "open" : "close", subtle);
  if (el instanceof HTMLElement && el.hasAttribute("popover")) {
    return cue(e.newState === "open" ? "open" : "close", subtle);
  }
}, true);

// Copy buttons all go through the Clipboard API; chime softly when a copy lands.
const clip = navigator.clipboard;
if (clip && typeof clip.writeText === "function") {
  const writeText = clip.writeText.bind(clip);
  try {
    clip.writeText = (text) => writeText(text).then((v) => { cue("success", subtle); return v; });
  } catch { /* read-only in some browsers: copies stay silent */ }
}

// Footer switch, added next to Disclaimer on every page that has the site footer.
function label(button) {
  button.setAttribute("aria-pressed", String(on));
  button.querySelector("span").textContent = on ? "Sound on" : "Sound off";
}
const icon = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path class="gf-sound-wave" d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/><path class="gf-sound-mute" d="m16 9 6 6M22 9l-6 6"/></svg>';
doc.querySelectorAll(".gf-bottom-links").forEach((list) => {
  const li = doc.createElement("li");
  li.innerHTML = `<button type="button" class="gf-sound" title="Interface sounds">${icon}<span></span></button>`;
  const button = li.firstElementChild;
  label(button);
  button.addEventListener("click", async () => {
    on = !on;
    try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* private mode */ }
    setEnabled(on);
    doc.querySelectorAll(".gf-sound").forEach(label);
    if (on && (await unlock())) play("toggle");
  });
  list.prepend(li);
});
