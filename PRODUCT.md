# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Everyday Indian credit-card users who need practical help finding card information, paying bills, contacting issuers, and deciding whether a card suits them.

## Product Purpose

Avhishek is one practical credit-card toolkit for India. It brings free tools, bank support, bill-payment guidance, firsthand reviews, updates, and Abhishek Meena's own card portfolio together so visitors can find and use reliable information with less effort. Future comparison tools are mentioned on the homepage, but their exact scope is undecided.

## Positioning

The site pairs issuer-sourced practical details with Abhishek's firsthand experience managing 50+ credit cards from 20+ banks. It presents that experience independently of the issuers it covers.

## Operating Context

Visitors can search across banks, cards, helplines, and reviews from the homepage. They can browse Abhishek's cards by bank and filter them, read card reviews and updates, find customer-care and escalation contacts, and look up issuer-specific bill-payment methods. The site works on phones and desktop and needs no account to use its tools.

## Capabilities and Constraints

- Preserve existing card, bank, contact, payment, and review data, URLs, and working features when improving the site.
- Current bank-support and bill-payment directories cover 26 issuers; the card portfolio currently contains 51 cards from 22 issuers. These counts are live content, not permanent targets.
- Changing bank contacts, card terms, and payment details must be checked against issuer sources. The site links to official sources and shows verification dates where relevant.
- Reviews distinguish actual terms and firsthand use from pre-launch claims; visible review dates and reading times must match article metadata.
- The site is maintained independently by Abhishek Meena. It is not affiliated with, endorsed by, or sponsored by the banks and networks mentioned. It is not financial advice; affiliate links, where present, are visibly labelled.
- The production site is static HTML, CSS, and JavaScript on Vercel. The reviews grid is the compiled React component within that site. `avhishek.in` hosts the toolkit, while `cards.avhishek.in` opens the portfolio.

## Brand Commitments

Keep the existing Avhishek identity and Abhishek Meena's authorship. The owner has asked that future work not replace the brand identity without approval. Use direct, useful language grounded in what the tools and reviews actually provide.

## Evidence on Hand

- The current product and editorial claims are documented in [README.md](README.md), [home.html](home.html), [portfolio.html](portfolio.html), and [disclaimer.html](disclaimer.html).
- Portfolio data: [assets/data.js](assets/data.js). Bank support and payment data: [assets/support-data.js](assets/support-data.js) and [assets/pay-data.js](assets/pay-data.js).
- Article sources and last-update metadata live in [card-reviews/](card-reviews/). Publishing rules for updates and reviews live in [docs/publishing-updates.md](docs/publishing-updates.md) and [docs/sync-card-reviews.md](docs/sync-card-reviews.md).
- No testimonials, performance claims, or specific future comparison-tool capabilities have been confirmed for use in product claims.

## Product Principles

1. Help visitors complete common credit-card tasks quickly and without a sign-up.
2. Put verifiable issuer details and practical next steps near the decision they support.
3. Make firsthand experience clear without presenting personal holdings as universal advice.
4. Keep time-sensitive information accurate and mark uncertainty where terms are unconfirmed.
5. Preserve continuity of data, URLs, and tools as the toolkit grows.

## Accessibility & Inclusion

The existing site uses skip links, labelled controls, visible keyboard focus, reduced-motion support, light and dark themes, and phone layouts. Preserve those behaviors across future work.
