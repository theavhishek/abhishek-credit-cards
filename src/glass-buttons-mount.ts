import "./glassyui/styles/liquid.css";
import "./glass-buttons/glass-theme.css";
import { buildLensMapDataUrl, clamp, MAX_LENS_SURFACE_AREA, type LensRadii } from "./glassyui/lib/refraction-map";

// Gives the site's buttons the GlassyUI glass-button material (src/glassyui, registry files unchanged).
// The pages are static HTML whose scripts already hold these buttons, so instead of swapping them for the
// React <GlassButton> this adds the same classes and layers to each one in place, and repeats its press
// light and its Chromium edge lens without React. glass-theme.css keeps each button's size, type and colours.
//   solid: filled CTAs, which keep their colour as tinted glass
//   brand: the WhatsApp follow button, which keeps its own green
//   clear: outlined buttons, which become clear glass
//   ghost: icon buttons that only show glass on hover (the GlassButton ghost variant)
const GROUPS: [string, string][] = [
  ["solid", ".ch-btn-primary, .rv-btn-primary, .hm-about-cta, .not-found-btn-primary, .up-btn-solid"],
  ["brand", ".wa-follow-btn"],
  ["clear", ".ch-btn-quiet, .rv-btn-quiet, .ce-btn, .up-btn, .up-filter-btn, .not-found-btn, .reset-button, .hm-scroll-btn, .up-sharebar a, .up-sharebar button"],
  ["ghost", ".up-share"],
];
const ALL = GROUPS.map(([, selector]) => selector).join(", ");
const LAYERS = ["light", "distortion", "tint", "shine", "bloom", "rim"];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const reduceTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)");
const lenses = new Map<HTMLElement, () => void>();
let lensCount = 0;

function syncTheme() {
  const root = document.documentElement;
  const theme = root.dataset.theme === "dark" ? "dark" : "light";
  if (root.getAttribute("data-lg-theme") === theme) return;
  root.setAttribute("data-lg-theme", theme);
  // The lens reads theme tokens when it measures.
  lenses.forEach(schedule => schedule());
}

// GlassButton: "A press lights the glass from the point it lands and the light spreads outward."
function bloom(button: HTMLElement, x: number, y: number) {
  const element = button.querySelector<HTMLElement>(":scope > .lg-button__layers > .lg-button__bloom");
  if (!element || reduceMotion.matches) return;
  element.style.setProperty("--lg-bloom-x", `${x}px`);
  element.style.setProperty("--lg-bloom-y", `${y}px`);
  element.style.setProperty("--lg-bloom-size", `${Math.max(button.offsetWidth, button.offsetHeight) * 2.4}px`);
  element.animate?.(
    [
      { opacity: 0, transform: "scale(0.08)" },
      { opacity: 1, transform: "scale(0.42)", offset: 0.16 },
      { opacity: 0, transform: "scale(1)" },
    ],
    { duration: 720, easing: "cubic-bezier(0.22, 0.8, 0.3, 1)" },
  );
}

const isDisabled = (button: HTMLElement) => button.matches(":disabled, [aria-disabled='true']");

function press(button: HTMLElement, down: boolean) {
  button.style.setProperty("--lg-press", down ? "1" : "0");
  button.dataset.pressed = String(down);
}

function wirePress(button: HTMLElement) {
  const release = () => press(button, false);
  button.addEventListener("pointerdown", event => {
    if (event.defaultPrevented || isDisabled(button)) return;
    const bounds = button.getBoundingClientRect();
    // A scaled button maps client pixels back to its own, so the bloom starts under the finger.
    const scale = bounds.width / Math.max(button.offsetWidth, 1) || 1;
    press(button, true);
    bloom(button, (event.clientX - bounds.left) / scale, (event.clientY - bounds.top) / scale);
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("blur", release);
  button.addEventListener("keydown", event => {
    if (event.defaultPrevented || isDisabled(button) || (event.key !== " " && event.key !== "Enter")) return;
    press(button, true);
    if (!event.repeat) bloom(button, button.offsetWidth / 2, button.offsetHeight / 2);
  });
  button.addEventListener("keyup", event => {
    if (event.key === " " || event.key === "Enter") release();
  });
}

// The lens from useLensFilter (src/glassyui/lib/use-refraction-filter.tsx): Chromium bends and splits the
// backdrop along the rim through an SVG filter in backdrop-filter. Other engines keep the CSS frost.
const supportsBackdropLens = () => "userAgentData" in navigator && typeof ResizeObserver !== "undefined";
const LENS_BEVEL = 36;
const LENS_THICKNESS_RATIO = 1.4;
const MIN_FROST = 0.5;

function readNumber(style: CSSStyleDeclaration, name: string, fallback = 0) {
  const value = Number.parseFloat(style.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

function readRadius(value: string, width: number, height: number) {
  const [first] = value.trim().split(/\s+/);
  const parsed = Number.parseFloat(first);
  const max = Math.min(width, height) / 2;
  if (first.endsWith("%")) return clamp((parsed / 100) * Math.min(width, height), 0, max);
  return clamp(Number.isFinite(parsed) ? parsed : max, 0, max);
}

function refractColours(scale: number, dispersion: number) {
  const displace = (s: number, result: string) =>
    `<feDisplacementMap in="frost" in2="lens" scale="${s}" xChannelSelector="R" yChannelSelector="G" result="${result}"/>`;
  if (dispersion <= 0.005) return displace(scale, "bent");
  const channel = (name: string, matrix: string, factor: number) =>
    displace(Math.round(scale * factor * 100) / 100, `${name}-scene`) +
    `<feColorMatrix in="${name}-scene" type="matrix" values="${matrix}" result="${name}-bent"/>`;
  return (
    channel("red", "1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1", 1 - dispersion / 2) +
    channel("green", "0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 1", 1) +
    channel("blue", "0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 1", 1 + dispersion / 2) +
    `<feBlend in="red-bent" in2="green-bent" mode="screen" result="red-green"/>` +
    `<feBlend in="red-green" in2="blue-bent" mode="screen" result="rgb"/>` +
    `<feComposite in="rgb" in2="green-scene" operator="in" result="bent"/>`
  );
}

function lensFilter(button: HTMLElement, id: string) {
  const width = button.clientWidth;
  const height = button.clientHeight;
  const style = getComputedStyle(button);
  const depth = readNumber(style, "--lg-lens-depth");
  if (depth <= 0 || !width || !height || width * height > MAX_LENS_SURFACE_AREA) return null;

  const radii = [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius]
    .map(value => readRadius(value, width, height)) as unknown as LensRadii;
  const multiplier = clamp(readNumber(style, "--lg-glass-thickness", 1), 0.1, 4);
  const bevelToken = readNumber(style, "--lg-lens-bevel");
  const thicknessToken = readNumber(style, "--lg-lens-thickness");
  const baseBevel = bevelToken > 0 ? bevelToken : clamp(Math.max(...radii), 6, LENS_BEVEL);
  const bevel = clamp(baseBevel * (0.6 + 0.4 * multiplier), 4, Math.min(width, height) / 2);
  const thickness = (thicknessToken > 0 ? thicknessToken : baseBevel * LENS_THICKNESS_RATIO) * multiplier;
  const { href, metrics } = buildLensMapDataUrl({
    bevel,
    depth,
    devicePixelRatio: window.devicePixelRatio || 1,
    height,
    ior: Math.max(1, readNumber(style, "--lg-lens-ior", 1.5)),
    radii,
    thickness,
    width,
  });

  const blur = Math.max(0, readNumber(style, "--lg-lens-blur"));
  const bodyBrightness = clamp(readNumber(style, "--lg-lens-body-brightness", 1), 0, 1);
  const rimBrightness = clamp(readNumber(style, "--lg-lens-rim-brightness", 1), 0, 1);
  const dispersion = clamp(readNumber(style, "--lg-lens-dispersion") * multiplier, 0, 1);
  const saturation = readNumber(style, "--lg-lens-saturation") || 1;
  const frost = Math.max(blur, MIN_FROST);
  const padding = Math.ceil(frost * 3) + 2;
  const scale = Math.round(2 * metrics.reach * 100) / 100;
  const dim = (input: string, brightness: number, result: string) =>
    brightness < 1
      ? `<feComponentTransfer in="${input}" result="${result}"><feFuncR type="linear" slope="${brightness}"/><feFuncG type="linear" slope="${brightness}"/><feFuncB type="linear" slope="${brightness}"/></feComponentTransfer>`
      : "";
  const shaded = rimBrightness !== bodyBrightness;
  const rimSource = rimBrightness < 1 ? "rim-lit" : "bent";
  const topSource = bodyBrightness < 1 ? "top-lit" : "bent";
  const glass = shaded ? "mixed" : topSource;

  return (
    `<svg aria-hidden="true" class="lg-refraction-filter" focusable="false" viewBox="0 0 0 0"><defs>` +
    `<filter id="${id}" x="${-padding}" y="${-padding}" width="${metrics.width + padding * 2}" height="${metrics.height + padding * 2}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">` +
    `<feGaussianBlur in="SourceGraphic" stdDeviation="${frost}" result="frost"/>` +
    `<feImage href="${href}" x="0" y="0" width="${metrics.width}" height="${metrics.height}" preserveAspectRatio="none" result="lens"/>` +
    refractColours(scale, dispersion) +
    (shaded
      ? `<feColorMatrix in="lens" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0" result="rim"/>` +
        dim("bent", rimBrightness, "rim-lit") +
        dim("bent", bodyBrightness, "top-lit") +
        `<feComposite in="${rimSource}" in2="rim" operator="in" result="rim-glass"/>` +
        `<feComposite in="rim-glass" in2="${topSource}" operator="over" result="mixed"/>`
      : dim("bent", bodyBrightness, "top-lit")) +
    (saturation === 1 ? "" : `<feColorMatrix in="${glass}" type="saturate" values="${saturation}"/>`) +
    `</filter></defs></svg>`
  );
}

function wireLens(button: HTMLElement, layers: HTMLElement) {
  if (!supportsBackdropLens()) return;
  const id = `lg-lens-glass-${++lensCount}`;
  const holder = document.createElement("span");
  holder.className = "lg-glass-lens";
  layers.prepend(holder);
  let frame = 0;
  let last = "";
  const measure = () => {
    frame = 0;
    const markup = reduceTransparency.matches || isDisabled(button) ? null : lensFilter(button, id);
    if ((markup ?? "") === last) return;
    last = markup ?? "";
    holder.innerHTML = last;
    if (markup) {
      button.style.setProperty("--lg-lens-filter", `url(#${id})`);
      button.dataset.lgLens = "active";
    } else {
      button.style.removeProperty("--lg-lens-filter");
      delete button.dataset.lgLens;
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
  new ResizeObserver(schedule).observe(button);
  lenses.set(button, schedule);
  schedule();
}

function enhance(button: HTMLElement) {
  if (button.classList.contains("lg-button")) return;
  const group = GROUPS.find(([, selector]) => button.matches(selector));
  if (!group) return;
  const variant = group[0] === "ghost" ? "ghost" : "primary";

  const label = document.createElement("span");
  label.className = "lg-button__label";
  label.append(...button.childNodes);
  const layers = document.createElement("span");
  layers.className = "lg-button__layers";
  layers.setAttribute("aria-hidden", "true");
  for (const name of LAYERS) {
    const layer = document.createElement("span");
    layer.className = `lg-button__${name}`;
    layers.append(layer);
  }
  button.append(layers, label);
  button.classList.add("lg-button", `lg-button--${variant}`);
  button.dataset.glass = group[0];
  button.dataset.lgPreset = "control";
  button.dataset.pressed = "false";
  wirePress(button);
  // GlassButton turns the lens on for every variant but ghost; the green follow button is opaque, so it would show nothing.
  if (group[0] === "solid" || group[0] === "clear") wireLens(button, layers);
}

function enhanceWithin(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(ALL).forEach(enhance);
}

export function mountGlassButtons() {
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  enhanceWithin(document);
  // Some buttons are drawn later by page scripts (the /updates feed, its empty state).
  new MutationObserver(records => {
    for (const record of records) {
      record.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement) || node.closest(".lg-button")) return;
        if (node.matches(ALL)) enhance(node);
        enhanceWithin(node);
      });
    }
  }).observe(document.body, { childList: true, subtree: true });
  reduceTransparency.addEventListener?.("change", () => lenses.forEach(schedule => schedule()));
}
