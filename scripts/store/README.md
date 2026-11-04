# Private store setup

The `/store` route rewrites to `api/store.js`. It returns a PIN screen until a server-signed session cookie is present. It is absent from the site's navigation and sitemaps, and every response is `noindex` and `no-store`.

## Required before the store can be unlocked on Vercel

- Set `STORE_PIN` to the owner's chosen four digit PIN as a Vercel environment variable. Never add it to Git.
- Set `STORE_SESSION_SECRET` to a unique random value of at least 32 bytes, also in Vercel environment variables.
- A four digit PIN gives limited protection against shared access and guessing. Configure a persistent rate limit or Vercel Firewall rule before public exposure. The function's in-memory limit is only a best effort per instance.

## Required before checkout can be enabled

- Deploy and configure a private YouPI gateway instance. The project's [README](https://github.com/youpi-pg/YouPI-PG) describes it as experimental and not production ready. Review its open [authorization issue](https://github.com/youpi-pg/YouPI-PG/issues/69) and resolve it in the gateway version you use.
- Confirm how paid voucher codes will be sourced, delivered, and tracked. Verify a complete order from payment through fulfillment in a test environment. The store intentionally has no voucher inventory or automatic delivery yet.
- Set `YOUPI_API_URL`, `YOUPI_CHECKOUT_URL`, `YOUPI_MERCHANT_ID`, and `YOUPI_MERCHANT_KEY` in Vercel environment variables. Both gateway URLs must use HTTPS. The merchant key stays server side.
- Only after the gateway and fulfillment workflow are tested, set both `STORE_CHECKOUT_ENABLED=true` and `STORE_FULFILLMENT_READY=true`.

The checkout endpoint validates the selected voucher, face value and email on the server, creates a unique order ID, and calls YouPI's documented `POST /api/v1/payments`. It accepts only a checkout URL from the configured gateway origin. The user is then sent to YouPI's hosted checkout. The gateway, its merchant setup, paid order records and voucher fulfillment are separate operational dependencies.

The local preview used during development is on `http://localhost:3111/store`. It uses a temporary server secret and does not accept payments. The preview server is an untracked local helper under `preview/`.
