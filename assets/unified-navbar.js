// Tweenly Navbar Interactive Behavior (Spring hover capsule highlight & mobile sheet)
(() => {
  function initTweenlyNavbar() {
    const navbar = document.querySelector(".tweenly-navbar");
    if (!navbar) return;

    // 1. Sliding capsule highlight for desktop links
    const linksContainer = navbar.querySelector(".tweenly-capsule-links");
    if (linksContainer) {
      let hl = linksContainer.querySelector(".tweenly-capsule-hl");
      if (!hl) {
        hl = document.createElement("span");
        hl.className = "tweenly-capsule-hl";
        linksContainer.appendChild(hl);
      }

      const links = linksContainer.querySelectorAll(".tweenly-link");
      links.forEach((link) => {
        link.addEventListener("pointerenter", () => {
          hl.style.width = `${link.offsetWidth}px`;
          hl.style.transform = `translateX(${link.offsetLeft}px)`;
          hl.style.opacity = "1";
        });
      });

      linksContainer.addEventListener("pointerleave", () => {
        hl.style.opacity = "0";
      });
    }

    // 2. Mobile Burger & Sheet
    const burger = navbar.querySelector(".tweenly-burger");
    const sheet = navbar.querySelector(".tweenly-mobile-sheet");
    if (burger && sheet) {
      const toggleSheet = (open) => {
        const isOpen = open !== undefined ? open : !sheet.classList.contains("is-open");
        burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
        burger.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
        if (isOpen) {
          sheet.classList.add("is-open");
          sheet.removeAttribute("hidden");
          sheet.setAttribute("aria-hidden", "false");
        } else {
          sheet.classList.remove("is-open");
          sheet.setAttribute("hidden", "");
          sheet.setAttribute("aria-hidden", "true");
        }
      };

      burger.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleSheet();
      });

      document.addEventListener("click", (e) => {
        if (!navbar.contains(e.target)) {
          toggleSheet(false);
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && sheet.classList.contains("is-open")) {
          toggleSheet(false);
          burger.focus();
        }
      });

      sheet.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => toggleSheet(false));
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTweenlyNavbar);
  } else {
    initTweenlyNavbar();
  }
})();
