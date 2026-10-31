# Newsletter (Resend)

Signups go from the box on `/updates` to `api/subscribe.js`, a Vercel function that adds the email to **Resend Contacts** (and to a segment if one is set). Resend sends the emails and handles unsubscribes.

## One-time setup (Abhishek)

1. **Create a Resend account** at resend.com (free plan).
2. **Verify the domain.** Resend → Domains → Add domain → `avhishek.in` (or a subdomain such as `mail.avhishek.in`, which keeps the main domain's email reputation separate). Add the DNS records Resend shows (SPF/DKIM TXT and MX) wherever avhishek.in's DNS is managed, then click Verify.
3. **Create a segment** for subscribers. Resend → Contacts → Segments → Create segment, name it `Newsletter`. Copy its ID.
4. **Create an API key.** Resend → API Keys → Create. Permission: **Full access** (sending-only keys can't add contacts). Copy it once; Resend won't show it again.
5. **Add the env vars in Vercel.** Project → Settings → Environment Variables, for Production (and Preview if you want to test there):
   - `RESEND_API_KEY` = the key from step 4
   - `RESEND_SEGMENT_ID` = the segment ID from step 3
6. **Redeploy** (Deployments → latest → Redeploy) so the function picks up the variables. Until the key is set, the form answers "Signups open soon".
7. Optional: Resend → Settings → Unsubscribe page → set your logo and colours.

## Sending an issue

Resend → Broadcasts → Create → audience: the `Newsletter` segment → from `Abhishek <news@avhishek.in>` (any address on the verified domain). Keep the unsubscribe link in the footer: the editor's unsubscribe block, or `{{{RESEND_UNSUBSCRIBE_URL}}}` in custom HTML. Clicking it opens Resend's unsubscribe page and marks the contact unsubscribed; Resend then skips them in every broadcast.

## Moving to another provider later

Resend → Contacts → filter by segment → Export CSV (email, unsubscribed status, dates). Import that into the new provider, keeping unsubscribed people unsubscribed. Then swap the two `fetch` calls in `api/subscribe.js` for the new provider's API; the form, styles and script don't change.

## Code

- `api/subscribe.js`: POST only, from avhishek.in hosts; validates the email, has a hidden honeypot field and a per-IP limit (5 tries per 10 minutes). Existing contacts are opted back in. Same reply for new and existing emails.
- `assets/newsletter.css`, `assets/newsletter.js`: the box. Works without JS (plain form post, redirect back with `?newsletter=<result>`).
- To add the box to another page: copy the `<section class="nl" id="newsletter">` block from `updates.html`, and load `newsletter.css` and `newsletter.js` on that page. Give each copy unique `id`s.
- Tests: `pnpm test:newsletter` (mocked Resend API). `pnpm dev` runs `api/` locally too.
- CSP needs no change: the browser only talks to `/api/subscribe` (same origin); the function talks to Resend.
