# CLAUDE.md

avhishek.in: Abhishek Meena's personal credit-card site (portfolio, card reviews, bank support, bill-payment guide). Static HTML, CSS and vanilla JS on Vercel. Owner: Abhishek (GitHub `theavhishek`).

@AGENTS.md

## Rules (non-negotiable)

- Never push to `main` or merge PRs. Every change goes on its own branch (`claude/<short-topic>`) with a pull request for Abhishek's approval.
- Preserve the existing design and functionality. Change visuals, layout, copy or behaviour only when Abhishek explicitly asks. Fix what was asked; don't "tidy up" nearby code, styles or unused files.
- Never alter card, bank, contact or payment data (`assets/data.js`, `support-data.js`, `pay-data.js`, review content) unless asked, and only from the bank's official source.
- Follow `AGENTS.md`: local-only git identity, review byline format, affiliate-link labelling.

## Architecture

- No framework and no build step on Vercel (framework preset: none). The repo root is served as-is.
- Pages (each a full standalone HTML file with its own header, footer and inline theme script):
  - `home.html` → `/` on avhishek.in
  - `portfolio.html` → `/` on cards.avhishek.in
  - `support.html` → `/bank-support`
  - `pay-credit-card-bill.html`, `card-reviews.html`, `disclaimer.html`, `404.html`
  - `card-reviews/<slug>.html` → individual reviews
- Routing, redirects and security headers live in `vercel.json` (`cleanUrls`, host-based rewrites). `_headers` and `CNAME` are leftovers that Vercel ignores; don't rely on them.
- Data lives in plain JS globals: `window.PORTFOLIO_DATA` (`assets/data.js`), `window.SUPPORT_CONTACTS` (`support-data.js`), `window.PAY_METHODS` (`pay-data.js`, with its sourcing rules in the file header).
- The only compiled piece is the card-reviews grid: React 19 + motion in `src/`, bundled by `pnpm build:reviews` into `assets/card-reviews-react.js`. The bundle is committed; rebuild and commit it whenever `src/` changes. Review list data is in `src/card-reviews/blog-grid-data.ts`.

## Design system

- Tokens in `assets/site.css` `:root` and `html[data-theme="dark"]`: colours (`--page`, `--surface`, `--text`, `--muted`, `--line`, `--focus`), radii, font sizes, `--shell` (1200px), `--ease`. Use tokens, not new hard-coded values.
- Fonts: self-hosted Geist / Geist Mono (`assets/font.css`, `--site-font`, `--site-mono`).
- Theme: `data-theme` on `<html>`, saved in `localStorage` key `abhishek-card-stack-theme`, toggled by the `#themeSwitch` plane switch (`plane-switch-home.css`). Every change must work in light and dark.
- CSS is layered per page in a fixed order: `font.css` → `site.css` → shared (`plane-switch-home`, `footer`, `inner-page-refinement`, `brand-wordmark`, `typography`, `ui`) → `header.css` (loaded last; the current navbar for all pages except home) → page CSS.
- Reusable pieces: header/nav (`header.css`, `.unified-navbar`), footer (`footer.css`), follow block (`follow.css/js`), theme + navbar script (`card-reviews.js`, also used on non-review pages), review layout (`review-page.css/js`, `preview-page.css/js`), bank logos (`assets/bank-logos/`, `logo-png.js`), motion tokens (`lib/motion-tokens.ts`).
- Respect existing accessibility: skip links, visible focus, `prefers-reduced-motion`, responsive down to phone width (nav moves to a bottom tab bar at ≤640px).

## Working conventions

- Cache busting: asset URLs carry `?v=N`. When you edit a CSS/JS file, bump its `?v=` in every page that loads it.
- Header/footer markup is duplicated in each HTML page; a nav or footer change must be applied to every page.
- New pages or reviews: add to `sitemap.xml`, include JSON-LD, OG image in `assets/og/`, and (for reviews) an entry in `blog-grid-data.ts` plus rebuilt bundle.
- Local preview: `pnpm dev` (port 3000). Note it serves the portfolio at `/`, unlike production. Check pages in both themes and at phone width before opening a PR.
