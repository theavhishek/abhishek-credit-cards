/* Credit and debit card movie, event and food offers on BookMyShow, District and PVR INOX.
 *
 * Two kinds of entry:
 * - status "checked": every figure (cap, limit, minimum tickets, days, code, dates) was read from the
 *   official source in `source` on the `checked` date. Research file from Abhishek, 25 Nov 2026
 *   (/mnt/project-files/movie-offers/movie_card_offers_2026-11-25.json, "verified" rows only;
 *   one row per offer, with every eligible card variant in `cards`).
 * - status "listed": the offer appears on the platform's own offers page, but its terms haven't been
 *   read yet, so only the platform's headline is shown. Never add a figure to a listed offer.
 *
 * Rules: official bank or platform sources only; never invent a cap, limit, code or date. An offer
 * whose `validTill` has passed hides itself. Leave a field out rather than guess.
 * After editing, run: pnpm build:movies
 */
(function () {
  const BMS = "https://in.bookmyshow.com/offers";

  const checked = [
    {"platform": "bms", "bank": "SBI Card", "cardType": "credit", "cards": ["AURUM"], "type": "free", "benefit": "Free movie tickets, up to ₹250 each", "cap": 250, "limit": "4 tickets a month", "source": "https://www.sbicard.com/en/personal/credit-cards/lifestyle/aurum-card.page", "checked": "2026-11-25", "note": "Up to ₹500 per booking and ₹1,000 a month.", "status": "checked"},
    {"platform": "bms", "bank": "SBI Card", "cardType": "credit", "cards": ["ELITE", "Signature"], "type": "free", "benefit": "Free movie tickets, up to ₹250 each", "cap": 250, "limit": "2 tickets a month", "source": "https://www.sbicard.com/eapply/eapply-form.page?path=personal%2Fcredit-cards%2Flifestyle%2Fsbi-card-elite.dcr", "checked": "2026-11-25", "note": "Up to ₹500 a month in total.", "status": "checked"},
    {"platform": "bms", "bank": "BOBCARD", "cardType": "credit", "cards": ["Tiara RuPay"], "type": "flat", "benefit": "Flat ₹250 off movies and events", "cap": 250, "limit": "Once a quarter", "minTickets": 2, "source": "https://www.bobcard.co.in/blogs/credit-card-benefits-for-festive-shopping", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "ICICI Bank", "cardType": "credit", "cards": ["Sapphiro Visa", "LTN Sapphiro", "NRI Sapphiro", "Visa Signature"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹500 off", "cap": 500, "limit": "Twice a month", "minTickets": 2, "source": "https://in.bookmyshow.com/offers/icici-bank-complimentary-offer/ICICCOM426", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "ICICI Bank", "cardType": "credit", "cards": ["Sapphiro Mastercard", "Sapphiro", "InterMiles Sapphiro"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹500 off", "cap": 500, "limit": "Once a month", "minTickets": 2, "source": "https://in.bookmyshow.com/offers/icici-bank-complimentary-offer/ICICCOM426", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "ICICI Bank", "cardType": "credit", "cards": ["Sapphiro American Express", "AdaniOne Signature"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹500 off", "cap": 500, "minTickets": 2, "source": "https://in.bookmyshow.com/offers/icici-bank-complimentary-offer/ICICCOM426", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "ICICI Bank", "cardType": "credit", "cards": ["Emeralde Private"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹750 off", "cap": 750, "minTickets": 2, "source": "https://in.bookmyshow.com/offers/icici-bank-complimentary-offer/ICICCOM426", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "ICICI Bank", "cardType": "credit", "cards": ["HPCL Titanium", "HPCL Coral Platinum", "HPCL Coral Visa Contactless", "HPCL Coral", "Coral", "Coral Contactless", "Secured Coral", "LTN Coral", "NRI Unsecured Coral", "Expressions", "MMT Platinum", "ManU Platinum", "Ferrari Platinum", "MMT RuPay", "AdaniOne Platinum", "HPCL Super Saver RuPay"], "type": "percent", "benefit": "25% off movie tickets, up to ₹100", "cap": 100, "limit": "Twice a month", "minTickets": 2, "validTill": "2027-03-31", "source": "https://in.bookmyshow.com/offers/icici-bank-25-discount-offer/ICICICC520", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "IndusInd Bank", "cardType": "credit", "cards": ["Legend", "EazyDiner Platinum", "Signature"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹200 off", "cap": 200, "limit": "Once a month", "minTickets": 2, "validTill": "2027-03-31", "source": "https://in.bookmyshow.com/offers/indusind-bank-credit-cards-buy-1-get-1-free-movie-ticket-offer-(legend,-nexxt,-duo,-signature,-iconia,-intermiles)/INDBOGO424", "checked": "2026-11-25", "note": "Also ₹50 off a food combo in the same booking.", "status": "checked"},
    {"platform": "bms", "bank": "IndusInd Bank", "cardType": "credit", "cards": ["Nexxt"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹200 off", "cap": 200, "limit": "Twice a month", "minTickets": 2, "validTill": "2027-03-31", "source": "https://in.bookmyshow.com/offers/indusind-bank-credit-cards-buy-1-get-1-free-movie-ticket-offer-(legend,-nexxt,-duo,-signature,-iconia,-intermiles)/INDBOGO424", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "IndusInd Bank", "cardType": "credit", "cards": ["Iconia", "InterMiles Voyage"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹200 off", "cap": 200, "limit": "Once a month", "minTickets": 2, "validTill": "2027-03-31", "source": "https://in.bookmyshow.com/offers/indusind-bank-credit-cards-buy-1-get-1-free-movie-ticket-offer-(legend,-nexxt,-duo,-signature,-iconia,-intermiles)/INDBOGO424", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "IndusInd Bank", "cardType": "credit", "cards": ["Poonawalla Fincorp eLITE"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free", "limit": "Twice a month", "minTickets": 2, "validTill": "2027-03-31", "source": "https://in.bookmyshow.com/offers/indusind-bank-credit-cards-buy-1-get-1-free-movie-ticket-offer-(legend,-nexxt,-duo,-signature,-iconia,-intermiles)/INDBOGO424", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "IndusInd Bank", "cardType": "credit", "cards": ["Indulge", "Crest", "Celesta", "Heritage Non-Metal", "Legacy", "Vistara Explorer", "Pinnacle"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹700 off", "cap": 700, "limit": "3 times a month", "minTickets": 2, "source": "https://in.bookmyshow.com/offers/indusind-bank-super-premium-&-premium-credit-cards-offer-(indulge,-crest,-celesta,-heritage-(non-metal),-legacy,-vistara-explorer-co--branded,-pinnacle)/INDSPC0424", "checked": "2026-11-25", "note": "Also ₹50 off a food combo in the same booking.", "status": "checked"},
    {"platform": "bms", "bank": "IndusInd Bank", "cardType": "credit", "cards": ["Indulge", "Crest", "Celesta", "Heritage Non-Metal", "Legacy", "Vistara Explorer", "Pinnacle"], "type": "percent", "benefit": "20% off event tickets, up to ₹350", "cap": 350, "minTickets": 2, "source": "https://in.bookmyshow.com/offers/indusind-bank-super-premium-&-premium-credit-cards-offer-(indulge,-crest,-celesta,-heritage-(non-metal),-legacy,-vistara-explorer-co--branded,-pinnacle)/INDSPC0424", "checked": "2026-11-25", "note": "Theatre and event bookings; this has its own limit, separate from movies.", "status": "checked"},
    {"platform": "bms", "bank": "AU Small Finance Bank", "cardType": "debit", "cards": ["ivy"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹500 off", "cap": 500, "limit": "6 times a month", "minTickets": 2, "validTill": "2026-12-31", "source": "https://in.bookmyshow.com/offers/au-small-finance-bank-limited-debit-card-offer/AUDC0224", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "AU Small Finance Bank", "cardType": "debit", "cards": ["ivy"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹500 off on event tickets", "cap": 500, "limit": "Twice a month", "minTickets": 2, "validTill": "2026-12-31", "source": "https://in.bookmyshow.com/offers/au-small-finance-bank-limited-debit-card-offer/AUDC0224", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "AU Small Finance Bank", "cardType": "debit", "cards": ["Eternity", "Eternity Business"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹400 off", "cap": 400, "limit": "Twice a month", "minTickets": 2, "validTill": "2026-12-31", "source": "https://in.bookmyshow.com/offers/au-small-finance-bank-limited-debit-card-offer/AUDC0224", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "AU Small Finance Bank", "cardType": "debit", "cards": ["Royale", "Royale Business"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹250 off", "cap": 250, "limit": "Twice a month", "minTickets": 2, "validTill": "2026-12-31", "source": "https://in.bookmyshow.com/offers/au-small-finance-bank-limited-debit-card-offer/AUDC0224", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "Bank of Baroda", "cardType": "debit", "cards": ["EaseMyTrip RuPay Platinum"], "type": "flat", "benefit": "Flat ₹250 off movies and events", "cap": 250, "limit": "Once a quarter", "minTickets": 2, "validTill": "2028-08-31", "source": "https://in.bookmyshow.com/offers/bank-of-baroda-easemytrip-rupay-platinum-debit-card/RPBOB0724", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "ICICI Bank", "cardType": "debit", "cards": ["Coral Chip", "Coral Mastercard", "Coral Paywave", "Coral RuPay", "Expressions Paywave", "Expressions Mastercard", "NRE Expressions"], "type": "percent", "benefit": "25% off movie tickets, up to ₹125", "cap": 125, "validTill": "2027-03-31", "source": "https://in.bookmyshow.com/offers/icici-debit-card-movie-ticket-offers/ICICOR0813", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "IndusInd Bank", "cardType": "debit", "cards": ["Platinum Plus", "Platinum Premier", "Duo"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹250 off", "cap": 250, "limit": "Twice a quarter", "minTickets": 2, "source": "https://www.indusind.bank.in/in/en/personal/offers/debit-card-offer-changes.html", "checked": "2026-11-25", "note": "One free ticket a day at most.", "status": "checked"},
    {"platform": "bms", "bank": "IndusInd Bank", "cardType": "debit", "cards": ["Pioneer Infinite"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹750 off", "cap": 750, "limit": "4 times a quarter", "minTickets": 2, "source": "https://www.indusind.bank.in/pioneer/personal-banking/cards/pioneer-infinite-debit-card.html", "checked": "2026-11-25", "note": "One free ticket a day at most.", "status": "checked"},
    {"platform": "bms", "bank": "IndusInd Bank", "cardType": "debit", "cards": ["Pioneer Infinite"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹1,000 off on event tickets", "cap": 1000, "limit": "4 times a quarter", "minTickets": 2, "source": "https://www.indusind.bank.in/pioneer/personal-banking/cards/pioneer-infinite-debit-card.html", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "YES Bank", "cardType": "debit", "cards": ["Aura", "FIRST", "FIRST Business", "Glory", "Premia", "Premia Business"], "type": "percent", "benefit": "50% off movie tickets, up to ₹300", "cap": 300, "limit": "Once a month", "minTickets": 2, "validTill": "2026-12-31", "source": "https://in.bookmyshow.com/offers/yes-bank-debit-card-offer/YESDC0324", "checked": "2026-11-25", "note": "Also up to ₹200 off food combos.", "status": "checked"},
    {"platform": "bms", "bank": "YES Bank", "cardType": "debit", "cards": ["Aura", "FIRST", "FIRST Business", "Glory", "Premia", "Premia Business"], "type": "percent", "benefit": "50% off event tickets, up to ₹500", "cap": 500, "limit": "Once a month", "minTickets": 2, "validTill": "2026-12-31", "source": "https://in.bookmyshow.com/offers/yes-bank-debit-card-offer/YESDC0324", "checked": "2026-11-25", "status": "checked"},
    {"platform": "bms", "bank": "Bajaj Pay", "cardType": "credit", "cards": ["RuPay credit card on Bajaj Pay UPI"], "type": "rewards", "benefit": "Cashback up to ₹200 on movies and events", "cap": 200, "limit": "Once in the campaign", "validFrom": "2026-11-01", "validTill": "2026-11-30", "source": "https://in.bookmyshow.com/offers/bajaj-pay-upi-cashback-offer/BAJAJU1126", "checked": "2026-11-25", "note": "Your first Bajaj Pay UPI payment in the campaign; cashback is up to ₹200, not a fixed amount.", "status": "checked"},
    {"platform": "district", "bank": "IDFC FIRST Bank", "cardType": "credit", "cards": ["Mayura"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹500 off", "cap": 500, "limit": "Twice a month", "minTickets": 2, "source": "https://www.idfcfirst.bank.in/credit-card/metal-credit-card/mayura", "checked": "2026-11-25", "status": "checked"},
    {"platform": "district", "bank": "IDFC FIRST Bank", "cardType": "credit", "cards": ["Ashva"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹400 off", "cap": 400, "limit": "Twice a month", "minTickets": 2, "source": "https://www.idfcfirst.bank.in/credit-card/metal-credit-card/ashva", "checked": "2026-11-25", "status": "checked"},
    {"platform": "district", "bank": "IDFC FIRST Bank", "cardType": "credit", "cards": ["FIRST Wealth"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹250 off", "cap": 250, "limit": "Twice a month", "minTickets": 2, "source": "https://www.idfcfirst.bank.in/credit-card/wealth", "checked": "2026-11-25", "status": "checked"},
    {"platform": "district", "bank": "IDFC FIRST Bank", "cardType": "credit", "cards": ["Diamond Reserve"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹250 off", "cap": 250, "limit": "Twice a month", "minTickets": 2, "source": "https://www.idfcfirst.bank.in/credit-card/benefits/entertainment", "checked": "2026-11-25", "status": "checked"},
    {"platform": "district", "bank": "IDFC FIRST Bank", "cardType": "credit", "cards": ["FIRST Select"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹125 off", "cap": 125, "limit": "Twice a month", "minTickets": 2, "source": "https://www.idfcfirst.bank.in/credit-card/benefits/entertainment", "checked": "2026-11-25", "status": "checked"},
    {"platform": "district", "bank": "IDFC FIRST Bank", "cardType": "credit", "cards": ["FIRST Millennia"], "type": "percent", "benefit": "25% off movie tickets, up to ₹100", "cap": 100, "limit": "Once a month", "source": "https://www.idfcfirst.bank.in/content/dam/idfcfirstbank/pdf/credit-card/FIRST-Millennia-Credit-Card-Communication-May-26.pdf", "checked": "2026-11-25", "status": "checked"},
    {"platform": "district", "bank": "Axis Bank", "cardType": "credit", "cards": ["MY ZONE"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹200 off", "cap": 200, "limit": "Once a month", "minTickets": 2, "code": "AXIS200", "source": "https://cug.axisbank.com/cards/credit-card/axis-bank-my-zone-credit-card", "checked": "2026-11-25", "status": "checked"},
    {"platform": "district", "bank": "Axis Bank", "cardType": "credit", "cards": ["SELECT"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹250 off", "cap": 250, "limit": "Twice a month", "minTickets": 2, "source": "https://cug.axisbank.com/cards/credit-card/axis-bank-select-credit-card", "checked": "2026-11-25", "status": "checked"},
    {"platform": "district", "bank": "Axis Bank", "cardType": "credit", "cards": ["Privilege"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹250 off", "cap": 250, "limit": "Once a month", "minTickets": 2, "source": "https://cug.axisbank.com/cards/credit-card/privilege-credit-card-with-unlimited-benefits", "checked": "2026-11-25", "status": "checked"},
    {"platform": "district", "bank": "HSBC", "cardType": "credit", "cards": ["Live+", "Visa Platinum"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹250 off", "cap": 250, "minTickets": 2, "days": "Fridays and Saturdays", "source": "https://www.district.in/hsbc-campaign", "checked": "2026-11-25", "note": "The campaign page doesn’t state an end date or monthly limit.", "status": "checked"},
    {"platform": "district", "bank": "HSBC", "cardType": "credit", "cards": ["Live+", "Visa Platinum"], "type": "percent", "benefit": "10% off event tickets, up to ₹2,000", "cap": 2000, "source": "https://www.district.in/hsbc-campaign", "checked": "2026-11-25", "note": "Selected events only, plus presale access.", "status": "checked"},
    {"platform": "district", "bank": "HSBC", "cardType": "credit", "cards": ["Live+", "Visa Platinum"], "type": "percent", "benefit": "10% off activities, up to ₹400", "cap": 400, "source": "https://www.district.in/hsbc-campaign", "checked": "2026-11-25", "note": "Order must be over ₹3,000.", "status": "checked"},
    {"platform": "district", "bank": "BOBCARD", "cardType": "credit", "cards": ["Eterna"], "type": "bogo", "benefit": "Buy 1 ticket, get 1 free, up to ₹250 off", "cap": 250, "limit": "Once a month", "minTickets": 2, "source": "https://www.bobcard.co.in/credit-card-types/eterna", "checked": "2026-11-25", "status": "checked"},
    {"platform": "pvr", "bank": "Kotak Mahindra Bank", "cardType": "credit", "cards": ["PVR INOX co-brand"], "type": "percent", "benefit": "5% off movie tickets", "source": "https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/pvr-inox-kotak-credit-card.html", "checked": "2026-11-25", "note": "At the cinema counter or on the PVR INOX app and website.", "status": "checked"},
    {"platform": "pvr", "bank": "Kotak Mahindra Bank", "cardType": "credit", "cards": ["PVR INOX co-brand"], "type": "percent", "benefit": "20% off food and drinks", "source": "https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/pvr-inox-kotak-credit-card.html", "checked": "2026-11-25", "status": "checked"},
    {"platform": "pvr", "bank": "Kotak Mahindra Bank", "cardType": "credit", "cards": ["PVR INOX co-brand"], "type": "free", "benefit": "Free ticket worth up to ₹300 when you hit the spend milestone", "cap": 300, "limit": "Per ₹10,000 spent in a billing cycle", "source": "https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/pvr-inox-kotak-credit-card.html", "checked": "2026-11-25", "note": "A ₹300 coupon for every ₹10,000 of eligible spend in a billing cycle (rent, wallet loads and online skill gaming don’t count). Claim within 2 billing cycles; the coupon lasts 60 days, one per ticket, fees and taxes extra.", "status": "checked"},
    {"platform": "pvr", "bank": "SBI Card", "cardType": "credit", "cards": ["AURUM", "ELITE", "PRIME", "PULSE", "SimplySAVE"], "type": "rewards", "benefit": "10X reward points on movie tickets and food", "limit": "Once a month", "validFrom": "2026-10-15", "validTill": "2027-01-15", "source": "https://www.sbicard.com/en/personal/offer/pvr-inox-13oct26.page", "checked": "2026-11-25", "note": "10X points including base points, at selected cinemas on the counter or the PVR INOX app and website. One transaction per card a month; points arrive within 90 days. Some cinemas are excluded, listed in the terms.", "status": "checked"},
    {"platform": "pvr", "bank": "ICICI Bank", "cardType": "credit", "cards": ["Coral"], "type": "percent", "benefit": "25% off movie tickets, up to ₹100", "cap": 100, "limit": "Twice a month", "minTickets": 2, "source": "https://www.icici.bank.in/personal-banking/cards/credit-card/coral-credit-card", "checked": "2026-11-25", "note": "At INOX cinemas, as listed on ICICI’s card page; may not cover every PVR cinema.", "status": "checked"},
    {"platform": "pvr", "bank": "ICICI Bank", "cardType": "credit", "cards": ["HPCL Super Saver"], "type": "percent", "benefit": "25% off movie tickets, up to ₹100", "cap": 100, "limit": "Twice a month", "minTickets": 2, "source": "https://www.icici.bank.in/personal-banking/cards/credit-card/hpcl-super-saver", "checked": "2026-11-25", "status": "checked"},
    {"platform": "pvr", "bank": "Kotak Mahindra Bank", "cardType": "credit", "cards": ["PVR Gold"], "type": "free", "benefit": "Free ticket worth up to ₹400 when you hit the spend milestone", "cap": 400, "limit": "1 ticket at ₹10,000 spend, 2 at ₹15,000, per billing cycle", "source": "https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/pvr-gold-credit-card.html", "checked": "2026-11-25", "note": "₹400 per ticket. Utilities, education, wallet loads, rent and online skill gaming don’t count towards the spend.", "status": "checked"},
    {"platform": "pvr", "bank": "Kotak Mahindra Bank", "cardType": "credit", "cards": ["PVR Gold"], "type": "percent", "benefit": "5% off movie tickets", "source": "https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/pvr-gold-credit-card.html", "checked": "2026-11-25", "status": "checked"},
    {"platform": "pvr", "bank": "Kotak Mahindra Bank", "cardType": "credit", "cards": ["PVR Gold"], "type": "percent", "benefit": "20% off food and drinks", "source": "https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/pvr-gold-credit-card.html", "checked": "2026-11-25", "status": "checked"},
    {"platform": "pvr", "bank": "ICICI Bank", "cardType": "debit", "cards": ["Expressions Coral"], "type": "percent", "benefit": "25% off movie tickets, up to ₹75", "cap": 75, "minTickets": 2, "source": "https://www.icici.bank.in/personal-banking/cards/debit-card/expressions-coral-debit-card", "checked": "2026-11-25", "note": "INOX cinemas only.", "status": "checked"},
    {"platform": "pvr", "bank": "ICICI Bank", "cardType": "debit", "cards": ["Coral Plus"], "type": "percent", "benefit": "25% off movie tickets, up to ₹100", "cap": 100, "minTickets": 2, "source": "https://www.icici.bank.in/personal-banking/cards/debit-card/coral-plus-debit-card", "checked": "2026-11-25", "note": "INOX cinemas only.", "status": "checked"},
    {"platform": "bms", "bank": "Standard Chartered", "cardType": "debit", "cards": ["Priority Infinite"], "type": "percent", "benefit": "50% off movie tickets, up to ₹300", "cap": 300, "source": "https://www.sc.com/in/debit-cards/priority-infinite-debit-card/", "checked": "2026-11-25", "note": "Visa card.", "status": "checked"}
  ];

  // [bank, cards, type, BookMyShow headline]; read on BookMyShow's offers page, 24 Nov 2026.
  const listed = [
    ["AU Small Finance Bank", "AU Zenith+", "bogo", "Buy 1 ticket, get 1 free, up to ₹500"],
    ["Axis Bank", "Axis Bank Neo, IndianOil Axis Bank", "percent", "10% off movie tickets"],
    ["Axis Bank", "Axis Bank Olympus", "bogo", "Buy 1 ticket, get 1 free"],
    ["Axis Bank", "Axis Bank Reserve, Burgundy Private", "bogo", "Buy 1 ticket, get 1 free"],
    ["Axis Bank", "IndiGo Axis Bank Premium", "bogo", "Buy 1 ticket, get 1 free"],
    ["Bandhan Bank", "Bandhan Bank credit cards", "flat", "Up to ₹1,000 off per calendar month"],
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
    ["ICICI Bank", "ICICI Bank Emeralde Private Metal, Diamant", "bogo", "Buy 1 ticket, get 1 free"],
    ["IDBI Bank", "IDBI Bank credit cards", "percent", "25% off the total ticket cost, up to ₹250"],
    ["IDFC FIRST Bank", "IDFC FIRST Private", "flat", "Up to ₹750 off on movies, food and non-movie events, twice a month"],
    ["Indian Bank", "Indian Bank credit cards", "bogo", "Buy 1 ticket, get 1 free"],
    ["Indian Bank", "Indian Bank Youth Visa", "percent", "50% off, up to ₹300"],
    ["Indian Overseas Bank", "IOB novio", "bogo", "Buy 1 ticket, get 1 free"],
    ["IndusInd Bank", "IndusInd PIONEER Private, Heritage Metal and other listed cards", "free", "Assured movie ticket offer"],
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
    ["SBM Bank", "SBM novio Credilio", "bogo", "Buy 1 ticket, get 1 free"],
    ["Standard Chartered", "Standard Chartered Beyond", "bogo", "Buy 1 ticket, get 1 free, up to ₹1,000"],
    ["Standard Chartered", "Standard Chartered Simply Cash", "bogo", "Buy 1 ticket, get 1 free, up to ₹500"],
    ["Union Bank of India", "Union Bank Diva, Unicorn (RuPay Select)", "flat", "Flat ₹250 off"],
    ["YES Bank", "YES Bank MARQUEE", "bogo", "Buy 1 ticket, get 1 free"],
    ["YES Bank", "YES First Preferred, YES Bank RESERV", "percent", "25% off movie tickets"],
    ["YES Bank", "YES Private", "bogo", "Buy 1 ticket, get 1 free, plus 50% off non-movie tickets"],
    ["YES Bank", "YES novio", "bogo", "Buy 1 ticket, get 1 free"],
    ["ZET", "ZET credit card", "flat", "Flat ₹100 off"],
    ["Zagg", "Zagg RuPay credit card", "bogo", "Buy 1 ticket, get 1 free"]
  ].map(([bank, cards, type, benefit]) => ({
    platform: "bms", bank, cardType: "credit", cards: [cards], type, benefit, source: BMS, checked: "2026-11-24", status: "listed",
  }));

  window.MOVIE_OFFERS = {
    checked: "2026-11-25",
    platforms: {
      bms: { name: "BookMyShow", url: BMS },
      district: { name: "District", url: "https://www.district.in/" },
      pvr: { name: "PVR INOX", url: "https://www.pvrcinemas.com/" },
    },
    types: { bogo: "Buy 1 Get 1", percent: "% off", flat: "Flat off", free: "Free tickets", rewards: "Cashback and points" },
    offers: checked.concat(listed),
  };
})();
