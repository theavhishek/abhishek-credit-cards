import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Tabs, TabsList, TabsTrigger } from "./arc/tabs/tabs";
import "./arc-tabs/tabs-theme.css";

// Upgrades the site's static tab strips and segmented controls to the uiarc tabs.
// Mark a group with data-arc-tabs="<name>". Its toggle buttons ([aria-pressed]) or radio labels
// stay in the page, hidden, and keep driving the page script: picking a tab clicks the original,
// and the tab follows whatever the page script selects (resets, URL state). Without JS the originals show.
type Item = { value: string; label: string; el: HTMLElement; target: HTMLElement };

function readItems(group: HTMLElement): Item[] {
  const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>("button[aria-pressed]"));
  if (buttons.length) return buttons.map((el, i) => ({ value: String(i), label: el.textContent?.trim() ?? "", el, target: el }));
  return Array.from(group.querySelectorAll<HTMLInputElement>('input[type="radio"]')).map(input => {
    const label = input.closest("label") ?? input;
    return { value: input.value, label: label.textContent?.trim() ?? "", el: label as HTMLElement, target: input };
  });
}

function selected(items: Item[]) {
  const on = items.find(item => item.target instanceof HTMLInputElement ? item.target.checked : item.target.getAttribute("aria-pressed") === "true");
  return on?.value ?? "";
}

function GroupTabs({ group, items }: { group: HTMLElement; items: Item[] }) {
  const [value, setValue] = useState(() => selected(items));
  useEffect(() => {
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
  return (
    <Tabs
      value={value}
      onValueChange={next => {
        setValue(next);
        items.find(item => item.value === next)?.target.click();
      }}
    >
      <TabsList aria-label={group.getAttribute("aria-label") ?? undefined} aria-labelledby={group.getAttribute("aria-labelledby") ?? undefined}>
        {items.map(item => (
          <TabsTrigger key={item.value} value={item.value} aria-controls={controls}>{item.label}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function mountArcTabs() {
  document.querySelectorAll<HTMLElement>("[data-arc-tabs]").forEach(group => {
    if (group.dataset.arcMounted) return;
    const items = readItems(group);
    if (items.length < 2) return;
    group.dataset.arcMounted = "true";
    const mount = document.createElement("div");
    mount.className = `arc-tabs arc-tabs--${group.dataset.arcTabs || "default"}`;
    // A group that holds only its options is swapped whole; one that also holds other controls keeps them.
    const onlyItems = Array.from(group.children).every(child => items.some(item => item.el === child));
    if (onlyItems) {
      group.before(mount);
      group.hidden = true;
    } else {
      items[0].el.before(mount);
      items.forEach(item => { item.el.hidden = true; });
    }
    createRoot(mount).render(<GroupTabs group={group} items={items} />);
  });
}
