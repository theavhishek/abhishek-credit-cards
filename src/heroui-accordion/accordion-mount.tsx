import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Accordion } from "@heroui/react";
import "./accordion-theme.css";

// Upgrades the site's <details> accordions to HeroUI's Accordion (react-aria Disclosure underneath).
// The <details> stays in the page as the item's shell, so its id, classes, data-* and scroll target
// keep working, and the page scripts keep their contract: `details.open` reads and sets the HeroUI
// state, and every change fires a "toggle" event on the <details> like the native element does.
// The summary's children move into the HeroUI trigger and the rest into its panel, so event
// listeners and ids the page scripts hold stay live. The shell is held natively open and marked
// data-accordion; data-expanded mirrors the state for CSS. Without JS the native <details> work.
// Opt out with data-no-accordion (the review contents box keeps its own desktop/phone behaviour).
const SELECTOR = "details:not([data-accordion]):not([data-no-accordion]):not(.rv-toc-box)";
const nativeOpen = Object.getOwnPropertyDescriptor(HTMLDetailsElement.prototype, "open")!;

type Store = { get: () => boolean; set: (next: boolean) => void; subscribe: (fn: () => void) => () => void };

function createStore(details: HTMLDetailsElement, initial: boolean): Store {
  let expanded = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => expanded,
    set(next) {
      if (next === expanded) return;
      expanded = next;
      details.toggleAttribute("data-expanded", next);
      listeners.forEach(fn => fn());
      details.dispatchEvent(new Event("toggle"));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

function Item({ details, summary, content, store }: { details: HTMLDetailsElement; summary: HTMLElement; content: Node[]; store: Store }) {
  const expanded = useSyncExternalStore(store.subscribe, store.get);
  const trigger = useRef<HTMLButtonElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const button = trigger.current!;
    const inner = body.current!.firstElementChild!;
    const hadFocus = document.activeElement === summary;
    button.append(...Array.from(summary.childNodes));
    inner.append(...content);
    summary.style.setProperty("display", "none", "important");
    // Page scripts focus the summary after opening a card; send that focus to the trigger.
    summary.focus = options => button.focus(options);
    nativeOpen.set!.call(details, true);
    if (hadFocus) button.focus({ preventScroll: true });
  }, [details, summary, content]);
  return (
    <Accordion
      allowsMultipleExpanded
      expandedKeys={expanded ? ["item"] : []}
      onExpandedChange={keys => store.set(keys.has("item"))}
    >
      <Accordion.Item id="item">
        <Accordion.Heading>
          <Accordion.Trigger ref={trigger} className={summary.className || undefined} />
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body ref={body} />
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}

const roots = new Map<HTMLDetailsElement, Root>();

function upgrade(details: HTMLDetailsElement) {
  const summary = details.querySelector<HTMLElement>(":scope > summary");
  if (!summary) return;
  details.dataset.accordion = "";
  const store = createStore(details, details.open);
  details.toggleAttribute("data-expanded", store.get());
  Object.defineProperty(details, "open", { configurable: true, get: store.get, set: next => store.set(Boolean(next)) });
  const content = Array.from(details.childNodes).filter(node => node !== summary);
  const root = createRoot(details.appendChild(document.createElement("div")));
  root.render(<Item details={details} summary={summary} content={content} store={store} />);
  roots.set(details, root);
}

function scan() {
  document.querySelectorAll<HTMLDetailsElement>(SELECTOR).forEach(upgrade);
  // The support and pay pages rebuild their lists on search; drop roots whose cards were replaced.
  roots.forEach((root, details) => {
    if (details.isConnected) return;
    roots.delete(details);
    root.unmount();
  });
}

export function mountHeroAccordions() {
  scan();
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; scan(); });
  }).observe(document.body, { childList: true, subtree: true });
}
