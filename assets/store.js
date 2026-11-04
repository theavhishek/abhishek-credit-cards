"use strict";

(() => {
  const theme = document.querySelector("#themeSwitch");
  function setTheme(next, persist = true) {
    const dark = next === "dark";
    document.documentElement.dataset.theme = next;
    if (theme) {
      theme.checked = !dark;
      theme.setAttribute("aria-label", dark ? "Switch to day mode" : "Switch to night mode");
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#000000" : "#f5f5f7");
    if (persist) try { localStorage.setItem("abhishek-card-stack-theme", next); } catch {}
  }
  setTheme(document.documentElement.dataset.theme || "light", false);
  theme?.addEventListener("change", () => setTheme(theme.checked ? "light" : "dark"));
  const navbarShell = document.querySelector("#navbarShell");
  if (navbarShell) {
    const updateNavbar = () => navbarShell.classList.toggle("scrolled", window.scrollY > 20);
    window.addEventListener("scroll", updateNavbar, { passive: true });
    updateNavbar();
  }

  const products = document.querySelectorAll("[data-product]");
  const values = document.querySelectorAll("[data-value]");
  if (!products.length) return;
  let product = "amazon-shopping";
  let value = 1000;
  const format = (amount) => `₹${amount.toLocaleString("en-IN")}`;
  function update() {
    products.forEach((item) => {
      const selected = item.dataset.product === product;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
      item.querySelector(".st-product-pick").textContent = selected ? "✓" : "+";
    });
    values.forEach((item) => {
      const selected = Number(item.dataset.value) === value;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    document.querySelector("#summaryProduct").textContent = document.querySelector(`[data-product="${product}"] strong`).textContent;
    document.querySelector("#summaryValue").textContent = format(value);
    document.querySelector("#summaryTotal").textContent = format(value);
  }
  products.forEach((item) => item.addEventListener("click", () => { product = item.dataset.product; update(); }));
  values.forEach((item) => item.addEventListener("click", () => { value = Number(item.dataset.value); update(); }));

  const checkout = document.querySelector("#storeCheckout");
  checkout?.addEventListener("click", async () => {
    const emailField = document.querySelector("#deliveryEmail");
    const message = document.querySelector("#storeMessage");
    if (!emailField.reportValidity()) return;
    checkout.disabled = true;
    checkout.firstChild.textContent = "Opening checkout";
    message.textContent = "";
    try {
      const response = await fetch("/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "checkout", product, value, email: emailField.value.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Checkout could not start.");
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      message.textContent = error.message;
      checkout.disabled = false;
      checkout.firstChild.textContent = "Continue to secure checkout";
    }
  });
})();
