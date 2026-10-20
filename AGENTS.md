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
