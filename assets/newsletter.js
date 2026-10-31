// Newsletter signup: posts form[data-newsletter] to /api/subscribe without a page load.
// Without JS the form still posts and the function redirects back with ?newsletter=<code>.
(() => {
  const MESSAGES = {
    subscribed: "You’re subscribed. Thanks!",
    invalid: "Enter a valid email address.",
    busy: "Too many tries. Please wait a few minutes.",
    closed: "Signups open soon. Please check back.",
    error: "Something went wrong. Please try again.",
  };

  function setup(form) {
    const box = form.closest(".nl") || form.parentElement;
    const input = form.querySelector('input[name="email"]');
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector(".nl-status");
    const done = box.querySelector(".nl-done");

    const show = (code, message) => {
      if (code === "subscribed" && done) {
        form.hidden = true;
        done.hidden = false;
        return;
      }
      status.textContent = message || MESSAGES[code] || MESSAGES.error;
      status.dataset.tone = code === "subscribed" ? "ok" : "error";
      input.setAttribute("aria-invalid", code === "invalid" ? "true" : "false");
      if (code === "invalid") input.focus();
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (button.getAttribute("aria-busy") === "true") return;
      const email = input.value.trim();
      if (!email || !input.checkValidity()) return show("invalid");

      status.textContent = "";
      button.setAttribute("aria-busy", "true");
      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ email, company: form.elements.company?.value || "" }),
        });
        const data = await res.json().catch(() => ({}));
        show(data.code || (res.ok ? "subscribed" : "error"), data.message);
      } catch {
        show("error", "Couldn’t reach the server. Check your connection and try again.");
      } finally {
        button.removeAttribute("aria-busy");
      }
    });

    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") {
        input.setAttribute("aria-invalid", "false");
        status.textContent = "";
      }
    });

    // Result of a no-JS post: show it once, then tidy the URL.
    const params = new URLSearchParams(location.search);
    const code = params.get("newsletter");
    if (code && MESSAGES[code]) {
      show(code);
      params.delete("newsletter");
      const query = params.toString();
      history.replaceState(history.state, "", location.pathname + (query ? `?${query}` : "") + location.hash);
    }
  }

  const start = () => document.querySelectorAll("form[data-newsletter]").forEach(setup);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
