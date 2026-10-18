/* ==========================================================================
   Credit card EMI rules for /calculator/no-cost-emi.
   One entry per issuer in the site's bank directory (the same 26 names as the
   support and pay pages). Edit terms here; the calculator UI and the engine
   (assets/emi-core.js) read this file and need no changes.

   Rules for this file
   - Only add a rate, fee or tenure that an official issuer page or PDF states,
     with its URL in `source` and the date you read it in `verifiedOn`.
   - status: "verified" = rate, fee and tenures all published and applied;
             "partial"  = some terms published (only those are applied);
             "unverified" = nothing official found; the calculator asks for
             the checkout figures instead.
   - `rates` / `fee` fill the form only when status is verified or partial,
     the rule is inside validFrom/validTo, and the tenure is listed.
     `fee.exact: false` marks an "up to" fee: shown, never auto-filled.
   - Never copy a rate from a past campaign. Put an end date in `validTo`
     when the source gives one; expired rules are shown as expired.
   - A bank being listed here doesn't mean it offers No-Cost EMI.
   ========================================================================== */
window.EMI_ISSUERS = {
  updated: "2026-10-18",
  merchants: [
    { id: "", name: "Any store / not sure" },
    { id: "amazon", name: "Amazon" },
    { id: "flipkart", name: "Flipkart" },
    { id: "croma", name: "Croma" },
    { id: "reliance-digital", name: "Reliance Digital" },
    { id: "vijay-sales", name: "Vijay Sales" },
    { id: "apple", name: "Apple Store / reseller" },
    { id: "samsung", name: "Samsung Shop" },
    { id: "other", name: "Other / custom" }
  ],
  issuers: [
    {
      id: "hdfc-bank", name: "HDFC Bank", short: "HDFC", logo: "hdfc.svg",
      programs: [{
        name: "EasyEMI at merchant",
        status: "partial",
        fee: { type: "fixed", value: 299, exact: false, note: "Up to ₹299 for EMI at a merchant (from 1 Aug 2024). The exact fee is shown at checkout." },
        rateNote: "HDFC Bank doesn’t publish a merchant EMI rate in its card terms; use the rate shown at checkout.",
        rewards: "EasyEMI transactions don’t earn reward points; points already earned are reversed. Tata Neu cards earn NeuCoins on eligible EasyEMI spends.",
        source: { url: "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/personal-mitc/mitc-in-english.pdf", title: "HDFC Bank credit card MITC, version 4.14 (October 2026)" },
        verifiedOn: "2026-10-18"
      }]
    },
    {
      id: "icici-bank", name: "ICICI Bank", short: "ICICI", logo: "icic.svg",
      programs: [{
        name: "Instant EMI",
        status: "verified",
        channel: "Online and in-store checkout",
        tenures: [3, 6, 9, 12, 18, 24],
        rates: { all: 15.99 },
        rateNote: "15.99% a year on every tenure, per ICICI’s Instant EMI page. The terms say the rate can vary by cardholder and merchant, so check checkout.",
        fee: { type: "percent", value: 2.99, max: 299, note: "2.99% of the amount, capped at ₹299, plus GST (from 1 Sep 2025)." },
        gst: "GST applies to the processing fee, interest and foreclosure charges.",
        minAmount: 1500,
        maxAmount: 1000000,
        subvention: "On No Extra Cost EMI products the brand or merchant bears the interest cost.",
        foreclosure: { percent: 3, note: "Up to 3% of the outstanding principal plus the next month’s interest." },
        cancellation: "Call within 15 days of the purchase; a full refund must come from the merchant as one transaction within 15 days. Foreclosure charges still apply.",
        rewards: "No reward points while the purchase is on EMI.",
        exclusions: "Not on the ICICI EMI Card, corporate or business cards, or ICICI’s American Express cards. Fuel, jewellery and watches may be excluded.",
        source: { url: "https://www.icici.bank.in/personal-banking/cards/credit-card/emi-products/instant-emi/terms-and-condition", title: "ICICI Bank Instant EMI terms and conditions" },
        sources: [{ url: "https://www.icici.bank.in/personal-banking/cards/credit-card/emi-products/instant-emi", title: "ICICI Bank Instant EMI" }],
        verifiedOn: "2026-10-18"
      }]
    },
    {
      id: "sbi-card", name: "SBI Card", short: "SBI Card", logo: "sbin.svg",
      programs: [{
        name: "Merchant EMI",
        status: "verified",
        channel: "EMI chosen at the merchant’s checkout or POS",
        validFrom: "2026-09-10",
        tenures: [3, 6, 9, 12, 18, 24],
        rates: { 3: 17.25, 6: 17, 9: 17, 12: 17, 18: 17, 24: 17 },
        rateNote: "17.25% a year for 3 months and 17% for 6 to 24 months, on a monthly reducing balance, for transactions from 10 Sep 2026.",
        fee: { byTenure: { 3: 0, 6: 45, 9: 69, 12: 89, 18: 129, 24: 169 }, note: "Nil for 3 months; ₹45, ₹69, ₹89, ₹129 and ₹169 for 6, 9, 12, 18 and 24 months. SBI Card’s table lists these against amounts of ₹20,000 or more, so a smaller purchase may show a different fee at checkout." },
        gst: "18% (IGST, or 9% CGST + 9% SGST in Haryana) on fees and interest, borne by the cardholder.",
        minAmount: 2500,
        subvention: "Manufacturer cashback (SBI Card doesn’t call it “No Cost”) is posted the day the EMI plan is created and reversed if the booking is cancelled. SBI Card’s own example: ₹35,000 for 6 months at 14% books ₹33,614 after ₹1,386 cashback; EMI ₹5,833.",
        foreclosure: { percent: 3, note: "3% of the principal outstanding, plus interest from the last statement date to the request date." },
        cancellation: "Cancelled only when the merchant refunds the full amount in one transaction within 45 days; the processing fee is reversed only then.",
        rewards: "No reward points on Merchant EMI (since 20 Nov 2020).",
        source: { url: "https://www.sbicard.com/sbi-card-en/assets/docs/pdf/personal/offers/merchant-emi-tnc.pdf", title: "SBI Card Merchant EMI terms and conditions" },
        sources: [{ url: "https://www.sbicard.com/sbi-card-en/assets/docs/html/personal/offers/calculator/cal-tc.html", title: "SBI Card EMI calculator terms (manufacturer subvention example)" }],
        verifiedOn: "2026-10-18"
      }]
    },
    {
      id: "axis-bank", name: "Axis Bank", short: "Axis", logo: "utib.svg",
      programs: [{
        name: "Merchant EMI",
        status: "partial",
        rateNote: "Axis Bank’s support page doesn’t state the merchant EMI rate or fee; use the figures shown at checkout.",
        foreclosure: { percent: 3, note: "3% of the principal outstanding when cancelled after 7 days (treated as foreclosure)." },
        cancellation: "Cancel within 7 days of booking: processing fee reversed and no foreclosure charge.",
        source: { url: "https://application.axis.bank.in/webforms/axis-support/sub-issues/Cards-Credit-BalanceonEMI-6.aspx", title: "Axis Bank: EMI transaction cancellation and charges" },
        verifiedOn: "2026-10-18"
      }]
    },
    {
      id: "kotak-mahindra-bank", name: "Kotak Mahindra Bank", short: "Kotak", logo: "kkbk.svg",
      programs: [{
        name: "Instant EMI",
        status: "partial",
        rateNote: "Kotak advertises rates “starting from 16% p.a.” on a reducing balance for 3 and 6 months. That is a lowest rate, not your rate, so it isn’t filled in.",
        fee: { type: "fixed", value: 199, note: "₹199 on all Instant EMI transactions. Kotak’s page doesn’t say whether GST is added; the calculator adds it if you leave GST on." },
        tenureNote: "3 to 36 months.",
        subvention: "Kotak lists No Cost EMI on leading brands but doesn’t describe the mechanism.",
        source: { url: "https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/credit-card-services/credit-card-emi-instant-emi/features.html", title: "Kotak credit card Instant EMI features" },
        verifiedOn: "2026-10-18"
      }]
    },
    {
      id: "idfc-first-bank", name: "IDFC FIRST Bank", short: "IDFC FIRST", logo: "idfb.svg",
      programs: [{
        name: "Merchant EMI",
        status: "partial",
        rateNote: "IDFC FIRST’s merchant EMI terms don’t state a rate; use the rate shown at checkout.",
        fee: { type: "fixed", value: 249, note: "₹249 plus taxes per EMI transaction." },
        gst: "GST applies to interest, the processing fee and foreclosure charges.",
        subvention: "On No-Cost or Low-Cost EMI the bank still charges interest; the merchant or manufacturer gives a discount or cashback for all or part of it. The processing fee isn’t covered. Cashback can take up to 90 days.",
        foreclosure: { percent: 3, note: "3% of the outstanding principal plus pro-rated interest. Discounts or cashback can be reversed." },
        cancellation: "Once converted, the EMI can’t be cancelled, only foreclosed.",
        source: { url: "https://www.idfcfirst.bank.in/personal-banking/credit-card-merchant-emi-tnc", title: "IDFC FIRST Bank credit card Merchant EMI terms" },
        verifiedOn: "2026-10-18"
      }]
    },
    {
      id: "au-small-finance-bank", name: "AU Small Finance Bank", short: "AU", logo: "aubl.svg",
      programs: [{
        name: "Instant EMI",
        status: "partial",
        tenures: [3, 6, 9, 12, 18, 24],
        rateNote: "AU shows the rate at the time of the transaction; it isn’t published.",
        fee: { type: "fixed", value: 199, note: "₹199 + GST." },
        gst: "GST applies to interest and foreclosure charges.",
        minAmount: 2000,
        subvention: "No Cost EMI cashback, where offered, is forfeited on foreclosure or cancellation.",
        foreclosure: { percent: 3, note: "3% of the balance principal outstanding, plus GST." },
        source: { url: "https://www.au.bank.in/pdf/credit-card/emi-terms-and-condition.pdf", title: "AU Small Finance Bank credit card EMI terms" },
        verifiedOn: "2026-10-18"
      }]
    },
    {
      id: "rbl-bank", name: "RBL Bank", short: "RBL", logo: "ratn.svg",
      programs: [{
        name: "Merchant EMI",
        status: "partial",
        rateNote: "RBL Bank applies the rate communicated at the time of the purchase; it isn’t published.",
        fee: { type: "percent", value: 1.5, min: 150, note: "1.5% of the amount or ₹150, whichever is higher." },
        gst: "GST applies to interest, including on No Cost EMI.",
        foreclosure: { percent: 3, note: "3% of the total outstanding amount." },
        rewards: "Reward points are reversed when a purchase is converted to EMI.",
        source: { url: "https://webassets.rbl.bank.in/document/Offers%20n%20Deals/Merchant-EMI-Terms-and-Conditions.pdf", title: "RBL Bank Merchant EMI terms and conditions" },
        verifiedOn: "2026-10-18"
      }]
    },
    {
      id: "indusind-bank", name: "IndusInd Bank", short: "IndusInd", logo: "indb.svg",
      programs: [{
        name: "Merchant EMI",
        status: "partial",
        validFrom: "2024-01-01",
        rateNote: "IndusInd’s notice doesn’t state the merchant EMI rate; use the rate shown at checkout.",
        fee: { type: "fixed", value: 249, note: "₹249 + GST (from 1 Jan 2024)." },
        foreclosure: { percent: 3, note: "3% pre-closure charge on Merchant EMI." },
        rewards: "Reward points are reversed on conversion and not restored if the EMI is cancelled or closed early.",
        source: { url: "https://bank.indusind.bank.in/content/dam/indusind-corporate/Other/Credit-Card-Merchant-and-Transaction-EMI.pdf", title: "IndusInd Bank Merchant and Transaction EMI changes" },
        verifiedOn: "2026-10-18"
      }]
    },
    { id: "yes-bank", name: "YES BANK", short: "YES BANK", logo: "yesb.svg", programs: [] },
    {
      id: "hsbc", name: "HSBC", short: "HSBC", logo: "hsbc.svg",
      programs: [{
        name: "Instant EMI",
        status: "verified",
        validFrom: "2023-11-23",
        tenures: [3, 6, 9, 12, 18, 24],
        rates: { all: 15 },
        rateNote: "15% a year on every tenure from 3 to 24 months (from 23 Nov 2023).",
        fee: { type: "fixed", value: 99, note: "₹99 + GST per transaction (from 23 Nov 2023)." },
        gst: "CGST + SGST/UTGST or IGST on fees and charges.",
        minAmount: 2000,
        subvention: "“Interest Free EMI” is offered by merchants on select products: HSBC still charges interest, and the merchant gives it back as an upfront discount or cashback.",
        foreclosure: { percent: 3, min: 250, note: "3% prepayment charge, minimum ₹250." },
        cancellation: "If you cancel the purchase after conversion, tell HSBC within 30 days of taking the EMI.",
        source: { url: "https://www.hsbc.bank.in/credit-cards/instant-emi/", title: "HSBC India Instant EMI" },
        verifiedOn: "2026-10-18"
      }]
    },
    {
      id: "american-express", name: "American Express", short: "Amex", logo: "americanexpress.svg",
      programs: [{
        name: "EMI at point of sale",
        status: "verified",
        validFrom: "2023-08-10",
        tenures: [3, 6, 9, 12, 18, 24],
        rates: { 3: 14, 6: 14, 9: 14, 12: 14, 18: 15, 24: 15 },
        rateNote: "14% a year for 3 to 12 months and 15% for 18 and 24 months, for EMI taken at the point of sale (from 10 Aug 2023).",
        fee: { type: "fixed", value: 199, note: "₹199 + taxes on every EMI converted at the point of sale, online or in-store." },
        gst: "18% GST on the interest; taxes on the fee and foreclosure charge.",
        minAmount: 5000,
        subvention: "Amex charges full interest plus GST; the merchant gives an instant discount equal to the interest. Amex’s own example: ₹12,000 over 3 months at 14%, ₹282 interest, ₹282 discount, ₹4,000 a month. Instalments are rounded up to whole rupees and adjusted in the last one.",
        foreclosure: { percent: 3, note: "3% + taxes on the outstanding balance; only the full unbilled principal can be prepaid." },
        cancellation: "Ask before the first payment due date of that charge.",
        rewards: "No Membership Rewards points on EMI at a merchant website or card terminal (SafeKey EMI and post-purchase conversions still earn).",
        exclusions: "Purchases of ₹5,000 and above (₹3,000 on Amazon.in).",
        source: { url: "https://www.americanexpress.com/en-in/benefits/emi/terms-and-conditions/index.html", title: "American Express India EMI terms and conditions" },
        verifiedOn: "2026-10-18"
      }]
    },
    { id: "standard-chartered-bank", name: "Standard Chartered Bank", short: "Standard Chartered", logo: "scbl.svg", programs: [] },
    { id: "federal-bank", name: "Federal Bank", short: "Federal", logo: "fdrl.svg", programs: [] },
    { id: "bobcard", name: "Bank of Baroda / BOBCARD", short: "BOBCARD", logo: "barb.svg", programs: [] },
    { id: "punjab-national-bank", name: "Punjab National Bank", short: "PNB", logo: "punb.svg", programs: [] },
    { id: "canara-bank", name: "Canara Bank", short: "Canara", logo: "cnrb.svg", programs: [] },
    { id: "union-bank-of-india", name: "Union Bank of India", short: "Union Bank", logo: "ubin.svg", programs: [] },
    { id: "bank-of-india", name: "Bank of India", short: "Bank of India", logo: "bkid.svg", programs: [] },
    { id: "indian-bank", name: "Indian Bank", short: "Indian Bank", logo: "idib.svg", programs: [] },
    { id: "dbs-bank", name: "DBS Bank", short: "DBS", logo: "dbs.svg", programs: [] },
    { id: "equitas-small-finance-bank", name: "Equitas Small Finance Bank", short: "Equitas", logo: "esfb.svg", programs: [] },
    { id: "sbm-bank-india", name: "SBM Bank India", short: "SBM", logo: "sbm.png", programs: [] },
    { id: "unity-small-finance-bank", name: "Unity Small Finance Bank", short: "Unity", logo: "unity-custom.png", programs: [] },
    { id: "csb-bank", name: "CSB Bank", short: "CSB", logo: "csbk.svg", programs: [] },
    {
      id: "onecard", name: "OneCard", short: "OneCard", logo: "onecard.svg",
      issuerNote: "OneCard is run by FPL Technologies; the card itself is issued by a partner bank (such as BOBCARD, Federal Bank, SBM Bank, CSB Bank or Indian Bank), and EMI terms follow that bank. Check which bank’s name is on your card.",
      programs: [{
        name: "OneCard EMI",
        status: "unverified",
        rateNote: "OneCard’s general EMI terms (last updated 13 Sep 2021) give the rate only at the time you take the EMI and don’t list merchant EMI fees, so nothing is filled in.",
        rewards: "Merchant EMIs aren’t eligible for rewards.",
        source: { url: "https://www.getonecard.app/legal/emitnc/", title: "OneCard EMI terms and conditions" },
        verifiedOn: "2026-10-18"
      }]
    }
  ]
};
