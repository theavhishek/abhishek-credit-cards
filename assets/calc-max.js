// "Max benefits" on review calculators: fills the calculator with the spend that gets the most out of the card
// (worked out from that review's own caps, milestones and waivers) and shows the plan (.cm-plan) it controls.
// The button is [data-max] with aria-controls pointing at the plan.
//   data-preset: the page's own calculator script fills the inputs, like the other example buttons.
//   data-max-click="sel,sel": clicks those buttons in the calculator (tier, card, payment count).
//   data-max-check="sel": ticks those checkboxes.
//   data-max-range="sel=value": sets those range inputs, or a text amount field (shown with Indian grouping).
// The plan hides again as soon as the reader changes anything in the calculator.
(() => {
  const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
  const list = (value) => (value ? value.split(",").map((s) => s.trim()).filter(Boolean) : []);

  document.querySelectorAll(".rv-calc [data-max]").forEach((button) => {
    const calc = button.closest(".rv-calc");
    const plan = document.getElementById(button.getAttribute("aria-controls"));
    const pressed = () => button.getAttribute("aria-pressed") === "true";
    const sync = () => { if (plan) plan.hidden = !pressed(); };

    button.addEventListener("click", () => {
      const d = button.dataset;
      list(d.maxClick).forEach((sel) => calc.querySelector(sel)?.click());
      list(d.maxCheck).forEach((sel) => {
        const box = calc.querySelector(sel);
        if (box && !box.checked) { box.checked = true; fire(box, "change"); }
      });
      list(d.maxRange).forEach((pair) => {
        const [sel, value] = pair.split("=");
        const range = calc.querySelector(sel);
        if (range) {
          range.value = range.type === "range" ? value : new Intl.NumberFormat("en-IN").format(Number(value));
          fire(range, "input");
        }
      });
      button.setAttribute("aria-pressed", "true");
    });

    // A real edit anywhere else in the calculator means it's no longer the max scenario.
    const release = (event) => {
      if (!event.isTrusted || !pressed()) return;
      if (event.target.closest("[data-max]") === button) return;
      if (event.type === "click" && !event.target.closest("button")) return;
      button.setAttribute("aria-pressed", "false");
    };
    ["input", "change", "click"].forEach((type) => calc.addEventListener(type, release));

    new MutationObserver(sync).observe(button, { attributes: true, attributeFilter: ["aria-pressed"] });
    sync();
  });
})();
