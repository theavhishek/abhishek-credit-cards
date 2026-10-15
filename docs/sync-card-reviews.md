# Automatically synchronized card reviews

Review article HTML in card-reviews/*.html is the source of truth.

When an article on main is edited or a new article is added, GitHub Actions
automatically updates:
- home.html Latest reviews cards and footer (three most recently updated);
- card-reviews.html search-engine/no-JavaScript fallback and article metadata;
- src/card-reviews/blog-grid-data.ts and compiled assets/card-reviews-react.js;
- the review bundle cache version.

Edit the H1 title, paragraph with class rv-dek, byline updated date and reading
time, card image inside rv-hero-card, or pv-status on the article. Their
corresponding cards will update without any separate manual editing.

Category: "Launching" / "Waitlist" / "Pre-launch" status => Pre-launch,
"Launched" / "Live" => Launched; no status => Cashback.
For other categories, add <meta name="review:category" content="Your category">
to the article head. Preserve the article's existing design and classes.

Workflow: .github/workflows/sync-card-reviews.yml
Manual rebuild:
  node scripts/reviews/build.mjs
  pnpm build:reviews
  node scripts/reviews/build.mjs --cache

No CSS or website layout change is required. The short Latest updates news
section is editorial and is deliberately not rewritten by this workflow.
