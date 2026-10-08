import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import { Navbar } from "./components/navbar";

export function PlaneSwitch() {
  const [dark, setDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.dataset.theme === "dark";
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.dataset.theme === "dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const nextDark = !dark;
    setDark(nextDark);
    const theme = nextDark ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("abhishek-card-stack-theme", theme);
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute("content", nextDark ? "#000000" : "#eef1f3");
    });
  };

  return (
    <label className="plane-switch" title="Switch day / night mode" style={{ cursor: "pointer", display: "inline-flex" }}>
      <span className="sr-only">Day / night mode</span>
      <input
        id="themeSwitch"
        type="checkbox"
        role="switch"
        checked={!dark}
        onChange={toggle}
        aria-label={dark ? "Switch to day mode" : "Switch to night mode"}
      />
      <div aria-hidden="true">
        <span className="street-middle"></span>
        <span className="cloud"></span>
        <span className="cloud two"></span>
        <div>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M21.4 11.1 14 7.4V3.6c0-.9-.7-1.6-1.6-1.6s-1.6.7-1.6 1.6v3.8l-7.4 3.7c-.5.2-.8.7-.8 1.3v1.2l8.2-2.2v4.8l-2.4 1.6v1.1l4-1 4 1v-1.1L14 16.2v-4.8l8.2 2.2v-1.2c0-.6-.3-1.1-.8-1.3Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </label>
  );
}

export function SiteNavbar() {
  const isCardsPage =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("cards.") ||
      window.location.pathname === "/" ||
      window.location.pathname.includes("portfolio"));

  const cardsHref = isCardsPage ? "#collection" : "https://cards.avhishek.in/";

  const siteLinks = [
    { label: "Cards", href: cardsHref },
    { label: "Reviews", href: "https://avhishek.in/card-reviews" },
    { label: "Support", href: "https://avhishek.in/bank-support" },
  ];

  const [activeHref] = useState(() => {
    if (typeof window === "undefined") return cardsHref;
    const path = window.location.pathname;
    if (path.includes("card-reviews")) return "https://avhishek.in/card-reviews";
    if (path.includes("bank-support") || path.includes("support")) return "https://avhishek.in/bank-support";
    if (path.includes("disclaimer")) return "https://avhishek.in/disclaimer";
    return cardsHref;
  });

  const isPortraitHome = typeof document !== "undefined" && document.body.classList.contains("portrait-home");

  const logo = (
    <a
      href="https://avhishek.in/"
      aria-label="Avhishek main website"
      className="wordmark"
      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
    >
      <span className="wordmark-brand" style={{ fontSize: "17px", fontWeight: 750, letterSpacing: "-0.035em", color: "var(--text)" }}>
        Abhishek<span className="brand-dot" style={{ color: "#c79232", fontWeight: 800 }}>.</span>
      </span>
    </a>
  );

  return (
    <Navbar
      links={siteLinks}
      logo={logo}
      activeHref={activeHref}
      variant="pill"
      position={isPortraitHome ? "absolute" : "sticky"}
      accentColor="#c79232"
      rightSlot={<PlaneSwitch />}
      className="topbar tweenly-topbar"
    />
  );
}

const rootEl = document.querySelector("#navbar-root");
if (rootEl) {
  createRoot(rootEl).render(<SiteNavbar />);
}
