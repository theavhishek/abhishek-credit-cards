# PVR INOX offers: where the data comes from

The offers page at https://www.pvrinox.com/offers is a Next.js app and the HTML has no offers in it, so don't scrape the HTML. The browser loads the catalogue from the site's own API routes on the same origin. These routes are public: they need no login and no cookies.

It was checked on 25 Nov 2026 from a normal browser. The cloud proxy blocks pvrinox.com, so run these calls from a browser on a real computer, for example with `fetch()` in the devtools console on pvrinox.com.

## Endpoints

| Route | Query | Returns |
|---|---|---|
| `GET /api/offers/by-city` | `cityId` (any city id; on 25 Nov 2026 every city gave the same 41 offers) | Every listed offer, with its terms |
| `GET /api/offers/detail` | `vouId` | One offer, with the structured fields listed below |
| `GET /api/get-city-list` | none | Cities (`popularCities[].cityId`, plus `subCities`) |

Every response is wrapped like this: `{ ok, data: { statusCode, messageType: "VOUCHERS_DATA", data: <array or object> } }`.

## Fields worth reading

From `by-city`, for each offer:
- `vouId`: the offer number. It's quoted in each record's `terms` as "PVR INOX offer N".
- `vouDesc`: the headline.
- `type`: `Bank` or `Normal`. `Normal` covers wallet and UPI offers and card offers that pay cashback or points.
- `bank`
- `discOn`: `Qty` for BOGO, `Per` for percent, `Value` for flat.
- `discValue`, `minTrnValue`
- `discCalOn`: `Box Office`, `Concession` (which means food), or both.
- `validFrom`, `validTo`
- `termsAndConditions[]`: `{ vouTCMessage, vouTCMessageOrder }`.

From `detail`, also:
- `maxDiscAmt`: the cap in ₹. It's sometimes the only place a cap is given.
- `maxDiscQty`, `minTrnQty`, `minTrnValue`
- `bankVouTypeSub`: `Credit Card`, `Debit Card`, or both.
- `redemptionOutletArr`: `Box Office`, `Website`, `Concession`, `InCinema F&B`.
- The day flags `mon` to `sun`.
- `validToDateTime`: epoch ms, the last valid moment in IST.

## Dates

`validTo` is midnight IST stored in UTC, so `2027-03-30T18:30:00Z` means the offer runs through 31 Mar 2027. Use `validToDateTime` for a precise end date.

## Rules used for /movie-offers

- Use only card offers: credit, debit and prepaid cards, plus RuPay credit cards on UPI. Leave out plain wallet and UPI offers (Paytm, MobiKwik, CRED) and cinema price promotions such as Blockbuster Tuesdays and ₹99 mornings.
- If PVR INOX's terms contradict themselves, or disagree with the bank's page, record it in `conflict` and don't pick one silently.
- Leave out offers whose own terms say they have ended, even when the listing still shows them. On 25 Nov 2026 that was the HDFC Millennia combo, whose terms say it ran for 6 months from 8 Oct 2025.
