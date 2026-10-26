# Project Guidelines & Rules

## Git & GitHub Identity Policy
- **Repository Scope Only**: The GitHub account `theavhishek` and email `theavhishek@users.noreply.github.com` are strictly reserved for this repository (`abhishek-credit-cards`).
- **No Global Leakage**: Do not set this identity globally (`--global`). It must remain isolated locally in `.git/config` (`--local`).
- **Other Projects**: Never use `theavhishek` or its credentials when working in any other repository or directory on this machine.
- **Privacy**: Never use personal email addresses in commit metadata; always use the private GitHub no-reply address (`theavhishek@users.noreply.github.com`).

## Credit Card Review Byline
- On every dedicated card-review article, display a two-line byline: **Abhishek Meena** above **[Month day, year] · [X] min read**. Use the same author/date/read-time arrangement on review listing cards.
- The date must match the article's actual last-update date, and the reading time should fit that article.
- Do not include the card network, issuer, category, or other facts in the byline.
- Keep structured article metadata (such as `dateModified`) consistent with the visible update date.
- Do not repeat the author portrait, name, bio, or “Read more reviews” in a separate author block at the bottom of review articles; keep author attribution in the top byline only.

## Affiliate Links
- Every affiliate link must use `rel="sponsored noopener noreferrer"` and show the visible label `<span class="aff-tag">Affiliate link</span>` next to it (styled in `assets/header.css`).
- The disclaimer page promises that links without this label earn nothing, so never add an unlabelled affiliate link.

## Site Architecture and SEO
- This checkout is a static HTML site on Vercel, not a Next.js app. `vercel.json` maps clean URLs and serves `/` from `home.html` on avhishek.in and `portfolio.html` on cards.avhishek.in. Do not add Next.js metadata routes unless the project is actually migrated.
- Public pages are HTML files in the root, `calculator/`, `card-reviews/`, and `updates/`. Small React widgets are built from `src/` with esbuild; financial data and browser logic live in `assets/`.
- Update articles come from `content/updates/*.md`. `scripts/updates/build.mjs` generates article HTML, hub/archive, feed, homepage update list, and the updates block in `sitemap.xml`. Review HTML is the source for `scripts/reviews/build.mjs`, which syncs review listings and data.
- Preserve canonical URLs and host split: avhishek.in uses `robots.txt` and `sitemap.xml`; cards.avhishek.in uses `cards-robots.txt` and `cards-sitemap.xml` via `vercel.json`. Search/retrieval crawler groups and AI training groups are separate in both robots files; changing training policy must not accidentally block search bots.
- Keep public HTML indexable without JavaScript. Use actual author and content dates for Article/NewsArticle JSON-LD and sitemap `<lastmod>`; update `lastmod` only when visible content meaningfully changes. Do not invent Organization details, dates, review claims, or search-engine guarantees.
- After SEO edits, run `node scripts/updates/build.mjs --check`, `node scripts/reviews/build.mjs --check`, `node scripts/upi/bake.mjs --check`, and relevant tests. Do not commit, push, or deploy unless the current user request authorizes it.
