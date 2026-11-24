/* Credit card movie and show ticket offers on BookMyShow, District and PVR INOX.
 *
 * Sourcing rules (same spirit as pay-data.js):
 * - Only offers listed on the platform's own offers page or the bank's own T&C page.
 * - `benefit` is the headline as the platform states it. `cap`, `limit`, `validTill` and
 *   `rules` are filled ONLY after reading that offer's official T&C; leave them out otherwise.
 * - `checked` is the date the source was read. Never invent a cap, frequency, code or date.
 * - An offer with `validTill` in the past hides itself.
 * After editing, run: pnpm build:movies
 */
(function () {
  const BMS = "https://in.bookmyshow.com/offers";
  const CHECKED = "2026-11-24";

  // type: bogo (buy 1 get 1) | percent | flat | free (free tickets)
  const bms = [
    ["AU Small Finance Bank", "AU Zenith+", "bogo", "Buy 1 ticket, get 1 free, up to ₹500"],
    ["SBI Card", "AURUM", "free", "4 movie tickets or ₹1,000 off, once a month"],
    ["Axis Bank", "Axis Bank Neo, IndianOil Axis Bank", "percent", "10% off movie tickets"],
    ["Axis Bank", "Axis Bank Olympus", "bogo", "Buy 1 ticket, get 1 free"],
    ["Axis Bank", "Axis Bank Reserve, Burgundy Private", "bogo", "Buy 1 ticket, get 1 free"],
    ["Axis Bank", "IndiGo Axis Bank Premium", "bogo", "Buy 1 ticket, get 1 free"],
    ["Bandhan Bank", "Bandhan Bank credit cards", "flat", "Up to ₹1,000 off per calendar month"],
    ["BOBCARD", "BOBCARD TIARA (RuPay)", "flat", "Flat ₹250 off"],
    ["Bank of India", "Bank of India RuPay Select", "flat", "Flat ₹250 off"],
    ["Canara Bank", "Canara Bank credit cards", "bogo", "Buy 1 ticket, get 1 free, up to ₹100"],
    ["City Union Bank", "CUB SalarySe LevelUP", "bogo", "Buy 1 ticket, get 1 free, up to ₹500"],
    ["City Union Bank", "City Union Bank credit cards", "bogo", "Buy 1 ticket, get 1 free, up to ₹250"],
    ["DBS Bank", "DBS Vantage", "bogo", "Buy 1 ticket, get 1 free, up to ₹500, twice a month"],
    ["DBS Bank", "DBS Spark", "bogo", "Buy 1 ticket, get 1 free, up to ₹200"],
    ["DCB Bank", "DCB novio", "bogo", "Buy 1 ticket, get 1 free"],
    ["Federal Bank", "Federal Bank credit cards", "percent", "10% off, up to ₹200"],
    ["HDFC Bank", "HDFC Bank Diners Club Privilege", "flat", "Up to ₹250 off per ticket on group bookings"],
    ["HDFC Bank", "HDFC Bank PIXEL Times", "percent", "25% off movie tickets"],
    ["HDFC Bank", "HDFC Bank Times Card", "percent", "25% off movie tickets, 50% on some Times Card variants"],
    ["HSBC", "HSBC credit cards", "bogo", "Buy 1 ticket, get 1 free on Saturdays, BookMyShow app only"],
    ["HSBC", "HSBC Premier Mastercard", "bogo", "Buy 1 ticket, get 1 free"],
    ["HSBC", "HSBC Privé", "bogo", "Buy 1 ticket, get 1 free"],
    ["HSBC", "HSBC Taj", "bogo", "Buy 1 ticket, get 1 free"],
    ["HSBC", "HSBC credit cards (live events)", "percent", "10% off live event tickets, up to ₹1,000"],
    ["ICICI Bank", "ICICI Bank credit cards", "percent", "25% off"],
    ["ICICI Bank", "ICICI Bank Emeralde Private Metal, Diamant", "bogo", "Buy 1 ticket, get 1 free"],
    ["ICICI Bank", "Selected ICICI Bank credit cards", "bogo", "Buy 1 ticket, get 1 free"],
    ["IDBI Bank", "IDBI Bank credit cards", "percent", "25% off the total ticket cost, up to ₹250"],
    ["IDFC FIRST Bank", "IDFC FIRST Private", "flat", "Up to ₹750 off on movies, food and non-movie events, twice a month"],
    ["Indian Bank", "Indian Bank credit cards", "bogo", "Buy 1 ticket, get 1 free"],
    ["Indian Bank", "Indian Bank Youth Visa", "percent", "50% off, up to ₹300"],
    ["Indian Overseas Bank", "IOB novio", "bogo", "Buy 1 ticket, get 1 free"],
    ["IndusInd Bank", "IndusInd PIONEER Private, Heritage Metal and other listed cards", "free", "Assured movie ticket offer"],
    ["IndusInd Bank", "IndusInd Legend, Nexxt, Duo, Signature, Iconia and other listed cards", "bogo", "Buy 1 ticket, get 1 free"],
    ["IndusInd Bank", "IndusInd Indulge, Crest, Celesta, Heritage (non-metal), Legacy and other listed cards", "bogo", "Super premium and premium card movie offer"],
    ["J&K Bank", "J&K Bank Mastercard credit cards", "bogo", "Buy 1 ticket, get 1 free"],
    ["Kotak Mahindra Bank", "Kotak Cashback+", "percent", "20% off, up to ₹150"],
    ["Punjab National Bank", "PNB credit cards", "flat", "Flat ₹250 off, once a quarter"],
    ["Punjab National Bank", "PNB Luxura Defence (Visa)", "bogo", "Buy 1 ticket, get 1 free"],
    ["RuPay", "PNB Luxura, Union Bank Nexteria, IOB EKAA (RuPay)", "bogo", "Buy 1 ticket, get 1 free"],
    ["RBL Bank", "RBL Bank credit cards", "bogo", "Movie discounts on listed RBL Bank cards"],
    ["RBL Bank", "RBL Bank Popcorn, Fun+, Movies and More", "flat", "Monthly discount: ₹500 on Popcorn and Fun+, ₹250 or ₹500 on Movies and More"],
    ["RBL Bank", "RBL Bank NOVA, LUMIÈRE", "bogo", "Movie benefits on NOVA and LUMIÈRE"],
    ["RBL Bank", "RBL Bank SuperCard", "bogo", "Movie discounts on SuperCards"],
    ["RBL Bank", "RBL Bank Popcorn, Fun+, Movies and More, Blockbuster", "flat", "₹1,000 welcome gift"],
    ["RBL Bank", "RBL Bank PLAY", "flat", "₹500 off tickets plus ₹100 off food, every month"],
    ["RBL Bank", "RBL Bank PLAY (welcome)", "flat", "Up to ₹500 off tickets on card activation"],
    ["RBL Bank", "TVS Credit RBL Bank", "bogo", "Buy 1 ticket, get 1 free"],
    ["SBI Card", "Reliance SBI Card PRIME", "free", "1 free movie ticket up to ₹250, every month"],
    ["SBI Card", "SBI Card ELITE, Signature", "free", "2 free movie tickets a month or ₹500 off"],
    ["SBM Bank", "SBM novio Credilio", "bogo", "Buy 1 ticket, get 1 free"],
    ["Standard Chartered", "Standard Chartered Beyond", "bogo", "Buy 1 ticket, get 1 free, up to ₹1,000"],
    ["Standard Chartered", "Standard Chartered Simply Cash", "bogo", "Buy 1 ticket, get 1 free, up to ₹500"],
    ["Union Bank of India", "Union Bank Diva, Unicorn (RuPay Select)", "flat", "Flat ₹250 off"],
    ["YES BANK", "YES BANK MARQUEE", "bogo", "Buy 1 ticket, get 1 free"],
    ["YES BANK", "YES First Preferred, YES BANK RESERV", "percent", "25% off movie tickets"],
    ["YES BANK", "YES Private", "bogo", "Buy 1 ticket, get 1 free, plus 50% off non-movie tickets"],
    ["YES BANK", "YES novio", "bogo", "Buy 1 ticket, get 1 free"],
    ["ZET", "ZET credit card", "flat", "Flat ₹100 off"],
    ["Zagg", "Zagg RuPay credit card", "bogo", "Buy 1 ticket, get 1 free"],
  ].map(([bank, cards, type, benefit]) => ({
    platform: "bms", bank, cards, type, benefit, source: BMS, checked: CHECKED,
  }));

  window.MOVIE_OFFERS = {
    checked: CHECKED,
    platforms: {
      bms: { name: "BookMyShow", url: BMS },
      district: { name: "District", url: "https://www.district.in/" },
      pvr: { name: "PVR INOX", url: "https://www.pvrcinemas.com/" },
    },
    types: { bogo: "Buy 1 Get 1", percent: "% off", flat: "Flat off", free: "Free tickets" },
    offers: bms,
  };
})();
