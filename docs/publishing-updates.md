# Publishing news and offers on /updates

Every item on [avhishek.in/updates](https://avhishek.in/updates) is one Markdown
file in `content/updates/`. A build script turns those files into the feed, the
article pages, the archive, the RSS feed, the sitemap entries and the homepage's
"Latest updates". You never edit page HTML by hand.

## The quickest way: ask Claude Code

Paste what you posted on WhatsApp or Telegram, plus the source link, and say:

> Publish this on /updates as an offer (or news). Source: <official link>.
> I checked the terms today.

Claude Code then writes the file, runs `pnpm build:updates` and
`pnpm test:updates`, and opens a pull request. Merge it and Vercel deploys.

What to include in the message, so nothing has to be guessed:

| For news | For offers |
| --- | --- |
| The headline and what changed | What the offer is and the bank or brand |
| The bank or issuer | Discount or cashback, cap and minimum spend, **only if the terms say so** |
| The source link, and whether it is official or a report | Start and end date (and time, if it ends at a set time) |
| Whether you want a full article (150+ words) or just a feed item | Eligible cards, promo code, eligibility |
| | The official offer page and/or terms link |
| | The date you checked the terms |

Claude must not fill in a rate, cap, date, code or link that isn't in your
message or the official source. Anything unknown is left out, and the page
simply doesn't show it.

## Doing it by hand

1. Copy `content/updates/_template-news.md` or `_template-offer.md` to
   `content/updates/<url-name>.md`. The file name becomes the URL, so use
   lowercase words and hyphens, for example `hdfc-infinia-devaluation-2026.md`.
2. Fill in the fields (see below) and delete the ones you don't need.
3. Run `pnpm build:updates`. It checks every file and stops with a clear message
   if something is wrong. Nothing is written until everything passes.
4. Run `pnpm preview:updates` to look at it on http://localhost:3000/updates
   (this preview also shows the sample fixtures and drafts).
5. Commit the Markdown file **and** the generated files, push to a branch and
   open a pull request.

`pnpm check:updates` (also run by `pnpm test:updates`) fails if someone edited a
Markdown file but forgot to rebuild.

## Fields

```yaml
---
type: news                      # news or offer
title: HDFC Infinia caps SmartBuy rewards at 15,000 points
summary: One or two sentences (under 260 characters). Shown in the feed, search results and link previews.
category: devaluation           # see the list below
published: 2026-10-14 18:30     # IST; the time is optional
updated: 2026-10-15             # optional; set it when you correct or add something
issuer: HDFC Bank               # bank or card issuer, as written in the bank support directory
merchant: Amazon                # optional, for offers and co-brands
cards: [HDFC Infinia, HDFC Diners Black]   # optional
tags: [smartbuy, reward points]            # optional extra search words
confirmation: official          # news only: official, reported or unconfirmed
link: /card-reviews/hsbc-live-plus         # optional: a related page on this site
related: [another-update-file-name]        # optional: pin related updates
image: /assets/updates/infinia.webp        # optional, with imageAlt; shown on the feed card and the article
imageAlt: What the image shows
page: true                      # optional; see "Feed item or full article"
archived: false                 # optional; true moves old news to the archive
draft: true                     # optional; drafts are never published
sources:                        # news needs at least one
  - label: HDFC Bank notice to cardholders
    url: https://www.hdfcbank.com/...
    kind: official              # official, report or community
---
```

Offers add an `offer:` block:

```yaml
offer:
  value: 10% instant discount   # only if the official terms state it
  cap: ₹1,500 per card
  minSpend: ₹5,000
  starts: 2026-10-01            # optional
  ends: 2026-10-31              # a date (ends 11:59 pm IST), a date and time, or "ongoing"
  eligibility: Credit card EMI transactions only
  code: SAVE10                  # promo code, if there is one
  link: https://...             # official offer page
  terms: https://...            # official terms and conditions
  verified: 2026-10-14          # the date you checked the official terms
```

### Categories

News: `launch`, `devaluation`, `banking`, `regulatory` (RBI and regulation),
`rewards` (rewards and benefits changes), `announcement`.

Offers: `card-offer`, `gift-card`, `cashback`, `shopping`, `travel`,
`limited` (limited-time promotions).

### Images

An image makes an item easier to spot when people scan the feed: it appears
beside the headline on the feed card and at the top of the article. Use the
bank's or merchant's own poster or a picture you made; never a stock photo.
Items without an image simply show no picture.

Put the file in `assets/updates/`. For a faster feed, also add a small copy
named `<same-name>-thumb.webp` (about 336 px wide). The build uses it on the
feed card when it exists, and the full image everywhere else.

## How offer status works

Status is worked out in Indian Standard Time, in the visitor's browser, every
time the page loads, so it is right even if the site hasn't been rebuilt.

| Status | When |
| --- | --- |
| Active | `verified` is set, and now is between `starts` and `ends` |
| Upcoming | `verified` is set, and `starts` is still ahead |
| Expired | `ends` has passed. The offer leaves the main list but stays in the archive |
| Needs verification | No `verified` date, or no `ends`, or an `ongoing` offer not re-checked in the last 30 days |

An offer is never shown as active just because it has no end date. To keep an
ongoing offer active, re-check it and update `verified` at least every 30 days.

There are no countdown timers. If an offer ends early, change `ends` to the real
end date and add `updated`.

## Feed item or full article

- A short item (no body, or a body under 150 words) stays in the feed only. Its
  title links to `link` if you set one, otherwise it has no page of its own.
- Write 150 words or more below the frontmatter and the item gets its own page at
  `/updates/<file-name>`, with the byline, reading time, sources, share buttons,
  related updates and a sitemap entry. You can force this off with `page: false`.
- The body supports paragraphs, `##` and `###` headings, `-` and `1.` lists,
  `> quotes`, `**bold**`, `*italic*`, `` `code` `` and `[links](https://...)`.
  Raw HTML is not allowed.

Brief offers should stay feed items. Only write an article when there is
something to explain.

## Correcting, archiving and removing

- **Correct a post:** edit its file, set `updated` to today, rebuild. The page,
  feed and sitemap pick up the change. Don't create a second file for the same
  news; the build refuses two items with the same title or the same offer terms
  and end date.
- **Archive old news:** add `archived: true`. It leaves the main list but stays in
  the archive and keeps its page.
- **Expired offers:** nothing to do. They archive themselves.
- **Unpublish:** add `draft: true` (or delete the file) and rebuild. The build
  removes the generated page.

## Accuracy rules

- Every item needs a source. Prefer the bank's or merchant's own page.
- A third-party report is `kind: report` and the news is `confirmation: reported`.
  A forum or social post is `kind: community`, and the news is `unconfirmed`.
  The page labels these clearly.
- Never fill in a rate, cap, minimum spend, date, code, eligibility or link that
  the source doesn't state. Leave the field out instead.
- Affiliate links must follow the rule in `AGENTS.md` (labelled, `rel="sponsored"`).
  The feed doesn't add affiliate links on its own.

## Sharing

Each article has WhatsApp, Telegram, X and copy-link buttons that share its own
URL. Feed-only items share `avhishek.in/updates#<file-name>`, which opens the feed
at that item (and shows it even after it has ended). Posting to the WhatsApp
channel, Telegram and X is still done by hand; nothing is posted automatically.

## What the build writes

| File | What it is |
| --- | --- |
| `updates.html` | The hub. Only the parts between `<!-- updates:… -->` markers are generated; edit the rest like any page |
| `updates/<file-name>.html` | Article pages, from `scripts/updates/templates/page.html` |
| `updates/archive.html` | Every item, including ended offers (not indexed, but crawlable) |
| `updates/feed.xml` | RSS feed of the latest 50 items |
| `assets/updates-index.json` | Summaries for search and filters (no article bodies) |
| `sitemap.xml` | `/updates` and article pages, between markers |
| `home.html` | The three latest current items, between markers |

The header and footer in `scripts/updates/templates/page.html` are a copy of the
site's. When the nav or footer changes on the other pages, change it there too
and rebuild.
