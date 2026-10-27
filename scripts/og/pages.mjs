// Link-preview (Open Graph) images for the site's fixed pages, rendered by
// scripts/og/build.mjs into assets/og/<file>. Every figure here must already
// appear on the page it describes; never put a number on a card that the page
// itself doesn't state.
//
// visual:
//   { cards: [marquee faces] }   fanned card faces from assets/hero/marquee/
//   { card: "face" }             one tilted card face
//   { logos: [bank-logo files] } a grid of bank logos from assets/bank-logos/
//   { donut: [a, b] }            an EMI split ring with two labels
//   { tiles: "latest" }          the three newest /updates fact tiles
//   (none)                       text only

export const PAGES = [
  {
    file: "home.jpg",
    alt: "There’s more to your credit card: reviews, bank support and tools for India by Abhishek Meena",
    eyebrow: "Reviews · Bank support · Tools",
    title: "There’s more to your credit card.",
    subtitle: "Firsthand card reviews, bank helplines and free tools for India.",
    stats: [["51", "cards I hold"], ["26", "bank helplines"], ["Free", "no sign-up"]],
    visual: { cards: ["hdfc-infinia", "axis-atlas", "eternal-sbi-card"] },
  },
  {
    file: "portfolio.jpg",
    alt: "Abhishek Meena’s credit card portfolio: 51 cards across Indian banks",
    eyebrow: "My card portfolio",
    title: "Credit cards I actually manage.",
    subtitle: "Searchable by bank, network, lifetime-free status and RuPay on UPI.",
    stats: [["51", "cards I hold"]],
    visual: { cards: ["amex-platinum-travel", "icici-emeralde-private", "hdfc-diners-black"] },
  },
  {
    file: "bank-support.jpg",
    alt: "Bank support: customer care, complaint and nodal officer contacts for 26 Indian banks",
    eyebrow: "Bank support",
    title: "Bank support, without the runaround.",
    subtitle: "Customer care, complaint emails, nodal officers and the RBI Ombudsman step.",
    stats: [["26", "banks and issuers"]],
    visual: { logos: ["hdfc.svg", "sbin.svg", "icic.svg", "utib.svg", "kkbk.svg", "americanexpress.svg", "hsbc.svg", "idfb.svg", "yesb.svg"] },
  },
  {
    file: "pay-credit-card-bill.jpg",
    alt: "Pay your credit card bill: NEFT, IMPS and UPI details for 26 Indian banks",
    eyebrow: "Bill payments",
    title: "Pay your card bill, the right way.",
    subtitle: "NEFT and IMPS IFSC codes, UPI ID formats and posting times, checked against bank websites.",
    stats: [["NEFT", "IFSC codes"], ["IMPS", "posting times"], ["UPI", "ID formats"]],
    visual: { logos: ["sbin.svg", "hdfc.svg", "icic.svg", "utib.svg", "americanexpress.svg", "idfb.svg", "aubl.svg", "kkbk.svg", "ratn.svg"] },
  },
  {
    file: "loan-emi-calculator.jpg",
    alt: "Loan EMI Calculator on avhishek.in: EMI, interest, fees and prepayments",
    eyebrow: "Calculators",
    title: "Loan EMI Calculator",
    subtitle: "Monthly EMI, the real cost after fees and GST, prepayment savings and a full schedule.",
    stats: [["Free", "no sign-up"]],
    visual: { donut: ["Principal", "Interest"] },
  },
  {
    file: "no-cost-emi-calculator.jpg",
    alt: "No-Cost EMI Calculator on avhishek.in: the real cost of a no-cost EMI",
    eyebrow: "Calculators",
    title: "Is No-Cost EMI really free?",
    subtitle: "Interest the bank still charges, GST on it and fees, compared with paying in full.",
    stats: [["Free", "no sign-up"]],
    visual: { donut: ["Price", "Interest + GST"] },
  },
  {
    file: "updates.jpg",
    alt: "Credit card news, devaluations and offers in India by Abhishek Meena",
    eyebrow: "Updates",
    title: "Stay ahead of the fine print.",
    subtitle: "Credit card news, devaluations and offers, each linked to its source.",
    visual: { tiles: "latest" },
  },
  {
    file: "disclaimer.jpg",
    alt: "Disclaimer and affiliate disclosure for avhishek.in",
    eyebrow: "Disclaimer",
    title: "Disclaimer and affiliate disclosure",
    subtitle: "How this site makes money, why nothing here is financial advice, and how it handles accuracy and privacy.",
  },
  {
    file: "eternal-sbi-card.jpg",
    alt: "Eternal SBI Card review by Abhishek Meena: 10% off Zomato and District, ₹2,000 monthly cap, ₹499 fee",
    eyebrow: "Card review",
    title: "Eternal SBI Card",
    subtitle: "10% off Zomato, District and Blinkit beauty; 5% on other Blinkit.",
    stats: [["10%", "Zomato, District"], ["₹2,000", "monthly cap"], ["₹499", "+ GST a year"]],
    visual: { card: "eternal-sbi-card" },
  },
  {
    file: "kredit-pe-yes-bank-max-credit-card.jpg",
    alt: "Kredit.Pe YES BANK Max Credit Card review by Abhishek Meena: advertised 5% cashback, lifetime free, redemption charges",
    eyebrow: "Card review",
    title: "Kredit.Pe YES BANK Max Credit Card",
    subtitle: "Advertised 5% cashback, and the voucher fees that cut its real value.",
    stats: [["5%", "advertised"], ["3%", "UPI, ₹20,000 a month"], ["₹0", "lifetime free"]],
    visual: { card: "kredit-pe-yes-bank-max-credit-card" },
  },
];
