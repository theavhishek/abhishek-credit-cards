import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { Slider } from "@heroui/react";
import "./slider-theme.css";

// Upgrades the site's range inputs to HeroUI's Slider (react-aria underneath).
// The native <input type="range"> stays in the page, hidden, and keeps driving the page scripts:
// dragging the slider sets its value and fires "input" like a native drag, and the slider follows
// whatever the scripts write to `input.value` (typed amounts, resets). The input's aria-label or
// <label for>, aria-valuetext and tabindex carry over to the slider's thumb. Without JS the native
// range shows. Opt out with data-no-slider.
const nativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!;

type Store = { get: () => number; subscribe: (fn: () => void) => () => void; notify: () => void };

function createStore(input: HTMLInputElement): Store {
  const listeners = new Set<() => void>();
  return {
    get: () => Number(nativeValue.get!.call(input)),
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    notify: () => listeners.forEach(fn => fn()),
  };
}

function RangeSlider({ input, store }: { input: HTMLInputElement; store: Store }) {
  const value = useSyncExternalStore(store.subscribe, store.get);
  const valueText = useSyncExternalStore(store.subscribe, () => input.getAttribute("aria-valuetext"));
  const root = useRef<HTMLDivElement>(null);
  const label = input.id ? document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(input.id)}"]`) : null;
  if (label && !label.id) label.id = `${input.id}-label`;
  // react-aria writes its own value text; keep the page's (₹ amounts, "% a year") on the thumb.
  useLayoutEffect(() => {
    const thumb = root.current?.querySelector<HTMLInputElement>("input");
    if (!thumb) return;
    if (valueText) thumb.setAttribute("aria-valuetext", valueText);
    if (input.getAttribute("tabindex") === "-1") thumb.tabIndex = -1;
  });
  return (
    <Slider
      ref={root}
      className={input.className || undefined}
      minValue={Number(input.min) || 0}
      maxValue={Number(input.max) || 100}
      step={Number(input.step) || 1}
      value={value}
      aria-label={label ? undefined : input.getAttribute("aria-label") ?? undefined}
      aria-labelledby={label?.id}
      onChange={next => {
        const v = Array.isArray(next) ? next[0] : next;
        nativeValue.set!.call(input, String(v));
        input.dispatchEvent(new Event("input", { bubbles: true }));
        store.notify();
      }}
    >
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb />
      </Slider.Track>
    </Slider>
  );
}

function upgrade(input: HTMLInputElement) {
  input.dataset.slider = "";
  const store = createStore(input);
  Object.defineProperty(input, "value", {
    configurable: true,
    get: store.get,
    set(next) {
      nativeValue.set!.call(input, next);
      store.notify();
    },
  });
  // Page scripts update aria-valuetext after each change; re-render so the thumb picks it up.
  new MutationObserver(store.notify).observe(input, { attributes: true, attributeFilter: ["aria-valuetext"] });
  const mount = document.createElement("div");
  mount.className = "slider-mount";
  input.after(mount);
  input.style.setProperty("display", "none", "important");
  createRoot(mount).render(<RangeSlider input={input} store={store} />);
}

export function mountHeroSliders() {
  document.querySelectorAll<HTMLInputElement>('input[type="range"]:not([data-slider]):not([data-no-slider])').forEach(upgrade);
}
