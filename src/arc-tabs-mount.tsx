import { useEffect, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Tabs, TabsList, TabsTrigger } from "./arc/tabs/tabs";
import "./arc-tabs/tabs-theme.css";

// Upgrades the site's static tab strips and segmented controls to the uiarc tabs.
// Mark a group with data-arc-tabs="<name>". Its toggle buttons ([aria-pressed]), radio labels or nav links
// stay in the page, hidden, and keep driving the page script: picking a tab clicks the original,
// and the tab follows whatever the page script selects (resets, URL state). Without JS the originals show.
// Nav links ([aria-current] marks the page you're on) switch with Enter or a click, not on arrow keys,
// so moving through the tabs never leaves the page. data-arc-keep leaves hiding the originals to CSS.
type Item = { value: string; label: string; el: HTMLElement; target: HTMLElement; href?: string };

function readItems(group: HTMLElement): Item[] {
  const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>("button[aria-pressed]"));
  if (buttons.length) return buttons.map((el, i) => ({ value: String(i), label: el.textContent?.trim() ?? "", el, target: el }));
  const links = Array.from(group.querySelectorAll<HTMLAnchorElement>(":scope > a[href]"));
  if (links.length) return links.map((el, i) => ({ value: String(i), label: el.textContent?.trim() ?? "", el, target: el, href: el.href }));
  return Array.from(group.querySelectorAll<HTMLInputElement>('input[type="radio"]')).map(input => {
    const label = input.closest("label") ?? input;
    return { value: input.value, label: label.textContent?.trim() ?? "", el: label as HTMLElement, target: input };
  });
}

function selected(items: Item[]) {
  const on = items.find(item => {
    if (item.target instanceof HTMLInputElement) return item.target.checked;
    if (item.href) return (item.target.getAttribute("aria-current") ?? "false") !== "false";
    return item.target.getAttribute("aria-pressed") === "true";
  });
  return on?.value ?? "";
}

function GroupTabs({ group, items, onMount }: { group: HTMLElement; items: Item[]; onMount: () => void }) {
  const [value, setValue] = useState(() => selected(items));
  // Hide the originals in the same commit that shows the tabs, so the page never paints the gap (layout shift).
  useLayoutEffect(onMount, [onMount]);
  useEffect(() => {
    // Nav links: the page you're on never changes in place, but Back can restore this page after a tab was picked.
    if (items.some(item => item.href)) {
      const restore = () => setValue(selected(items));
      window.addEventListener("pageshow", restore);
      return () => window.removeEventListener("pageshow", restore);
    }
    let frame = 0;
    const sync = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => setValue(selected(items))); };
    const observer = new MutationObserver(sync);
    observer.observe(group, { subtree: true, attributes: true, attributeFilter: ["aria-pressed"] });
    // Radios set from code fire no event, so re-read after anything on the page changes.
    ["change", "click", "reset"].forEach(type => document.addEventListener(type, sync, true));
    window.addEventListener("popstate", sync);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      ["change", "click", "reset"].forEach(type => document.removeEventListener(type, sync, true));
      window.removeEventListener("popstate", sync);
    };
  }, [group, items]);
  const controls = group.dataset.arcControls;
  const links = items.some(item => item.href);
  return (
    <Tabs
      activationMode={links ? "manual" : "automatic"}
      value={value}
      onValueChange={next => {
        setValue(next);
        items.find(item => item.value === next)?.target.click();
      }}
    >
      <TabsList aria-label={group.getAttribute("aria-label") ?? undefined} aria-labelledby={group.getAttribute("aria-labelledby") ?? undefined}>
        {items.map(item => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            aria-controls={controls}
            // Modified clicks open the link in a new tab, so keep them from also switching this page.
            onMouseDown={item.href ? event => { if (event.metaKey || event.ctrlKey || event.shiftKey) event.preventDefault(); } : undefined}
            onClick={item.href ? event => { if (event.metaKey || event.ctrlKey || event.shiftKey) window.open(item.href, "_blank", "noopener"); } : undefined}
            onAuxClick={item.href ? event => { if (event.button === 1) window.open(item.href, "_blank", "noopener"); } : undefined}
          >{item.label}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function mountArcTabs() {
  document.querySelectorAll<HTMLElement>("[data-arc-tabs]").forEach(group => {
    if (group.dataset.arcMounting) return;
    const items = readItems(group);
    if (items.length < 2) return;
    const mount = document.createElement("div");
    mount.className = `arc-tabs arc-tabs--${group.dataset.arcTabs || "default"}`;
    // A group that holds only its options is swapped whole; one that also holds other controls keeps them.
    const onlyItems = Array.from(group.children).every(child => items.some(item => item.el === child));
    if (group.dataset.arcKeep !== undefined || onlyItems) group.before(mount);
    else items[0].el.before(mount);
    group.dataset.arcMounting = "true";
    const onMount = () => {
      group.dataset.arcMounted = "true";
      if (group.dataset.arcKeep !== undefined) return;
      if (onlyItems) group.hidden = true;
      else items.forEach(item => { item.el.hidden = true; });
    };
    createRoot(mount).render(<GroupTabs group={group} items={items} onMount={onMount} />);
  });
}
