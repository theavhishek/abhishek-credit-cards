/* Credit card bill payment methods, by issuer.
   Every value here was read on the bank's own website or document on 13 Oct 2026
   (see `sources`). Nothing is copied from aggregator sites.
   - Only publish a transfer detail when the bank states the IFSC and the account format together.
   - Patterns use { ph: "…" } for the parts the cardholder fills in.
   - `time` is the bank's own wording, shortened. `speed` drives the chip colour:
     "fast" (instant or same day), "mid" (next working day), "slow" (2+ days), "" (not stated). */
window.PAY_CHECKED = "2026-10-13";
window.PAY_METHODS = {
  "Axis Bank": {
    methods: [
      { kind: "neft", title: "NEFT from another bank",
        fields: [
          { label: "IFSC", value: "UTIB0000400", copy: true },
          { label: "Account number", text: "Your 16-digit credit card number" },
          { label: "Beneficiary name", text: "Your name as embossed on the card" },
          { label: "Bank", text: "Axis Bank" }
        ], time: "Time not stated", speed: "" },
      { kind: "upi", title: "Pay to a UPI ID",
        fields: [{ label: "UPI ID", pattern: ["cc.91", { ph: "registered mobile number" }, { ph: "last 4 card digits" }, "@axisbank"],
          keys: [["registered mobile number", "Your 10-digit registered mobile number, typed straight after cc.91."], ["last 4 card digits", "The last 4 digits of your credit card number."]] }],
        note: "Axis Bank publishes this UPI ID in the terms of its October 2020 pay-by-UPI offer. Its current payment help page doesn’t list a UPI ID, so check that your UPI app shows Axis Bank as the payee.",
        verify: true, time: "Time not stated", speed: "",
        src: { label: "Axis Bank pay-by-UPI terms (PDF)", url: "https://www.axisbank.com/docs/default-source/default-document-library/tncs-pay-credit-card-bills-via-upi.pdf" } },
      { kind: "app", title: "Axis Mobile app", how: "Pay Last Bill, then Pay Now.", time: "Same day with Pay Now", speed: "fast" },
      { kind: "app", title: "Axis internet banking", how: "Accounts › My Credit Cards › Pay Bill." },
      { kind: "other", title: "Axis ATM, branch or cheque", how: "Cash at a branch costs ₹100 + tax. Cheques go in Axis drop boxes and can’t be post-dated.", time: "ATM and cash same day, cheque 1 working day", speed: "mid" }
    ],
    sources: [{ label: "Axis Bank: How do I pay my credit card dues", url: "https://application.axis.bank.in/webforms/axis-support/sub-issues/Cards-Credit-missedpymt-1.aspx" }]
  },

  "Kotak Mahindra Bank": {
    methods: [
      { kind: "imps", title: "IMPS or NEFT from another bank",
        fields: [
          { label: "IFSC", value: "KKBK0000958", copy: true },
          { label: "Account number", text: "Your 16-digit Kotak credit card number" },
          { label: "Payee name", text: "Your card number followed by your name, as in Kotak’s example" },
          { label: "Bank and branch", text: "Kotak Bank, Main Branch Mumbai" }
        ], time: "IMPS instant, NEFT 30 minutes to 3 working days", speed: "fast" },
      { kind: "gateway", title: "Kotak WebPay", how: "Pay from another bank’s net banking, UPI or a RuPay debit card on Kotak’s payment page.", time: "Within 3 working days", speed: "slow" },
      { kind: "app", title: "Kotak app or net banking", how: "Credit Card › CC Payments in the app, or Pay Now in net banking.", time: "App instant, net banking within 24 hours", speed: "fast" },
      { kind: "other", title: "Cash or cheque at a branch", how: "Cash costs ₹100 + GST. Cheques payable to “Kotak Mahindra Bank Card A/C” and your 16-digit card number.", time: "Cash within 24 hours, cheque 3 to 5 working days", speed: "slow" }
    ],
    sources: [{ label: "Kotak: Credit card payments", url: "https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/credit-card-services/credit-card-payments.html" }]
  },

  "SBI Card": {
    caution: "NEFT and IMPS use different account numbers. Don’t use your card number for IMPS.",
    methods: [
      { kind: "imps", title: "IMPS from another bank",
        fields: [
          { label: "IFSC", value: "SBIN00CARDS", copy: true },
          { label: "Account number", pattern: ["91", { ph: "registered mobile number" }, { ph: "last 4 card digits" }], example: "9198765432101234" },
          { label: "Account type", text: "Credit Card Payment" }
        ], time: "Instant, with an SMS confirmation", speed: "fast" },
      { kind: "neft", title: "NEFT from another bank",
        fields: [
          { label: "IFSC", value: "SBIN00CARDS", copy: true },
          { label: "Account number", text: "Your 16-digit SBI Card number" },
          { label: "Account type", text: "Credit Card Payment or Savings Account" }
        ], time: "SBI Card says it reflects instantly", speed: "fast" },
      { kind: "upi", title: "UPI",
        how: "Use Paynet › UPI or QR code on the SBI Card website or app. In BHIM SBI Pay, you can also pay to this UPI ID:",
        fields: [{ label: "UPI ID", pattern: ["Sbicard.", { ph: "16-digit card number" }, "@SBI"], keys: [["16-digit card number", "Your full 16-digit credit card number, with no spaces."]] }],
        note: "SBI Card documents this UPI ID in its BHIM SBI Pay steps. If you use another UPI app, check that the app accepts it and shows SBI Card as the payee.",
        verify: true, time: "SBI Card says it posts instantly", speed: "fast",
        src: { label: "SBI Card, Pay your bill", url: "https://www.sbicard.com/en/personal/pay.page" } },
      { kind: "bbps", title: "SBI UNIPAY (BBPS)", how: "Pick SBI Card under Bill Pay and enter the last 4 card digits and your registered mobile number.", time: "Real time", speed: "fast" },
      { kind: "app", title: "SBI Card app, YONO or Paynet", how: "Paynet works with net banking from 50+ banks and with debit cards.", time: "Instant", speed: "fast" },
      { kind: "other", title: "Cheque, branch or SBI ATM", how: "Cheque payments cost ₹200 + taxes since 15 Sep 2025. Senior citizens are exempt.", time: "Branch and ATM 2 working days, cheque 4", speed: "slow" }
    ],
    sources: [{ label: "SBI Card: Pay your bill", url: "https://www.sbicard.com/en/personal/pay.page" }]
  },

  "IDFC FIRST Bank": {
    methods: [
      { kind: "upi", title: "Pay to a UPI ID",
        how: "In a UPI-enabled banking app or the BHIM app, go to UPI › Send Money and pay to:",
        fields: [{ label: "UPI ID", pattern: [{ ph: "16-digit card number" }, ".cc@idfcbank"], keys: [["16-digit card number", "Your full 16-digit credit card number, with no spaces."]] }],
        verify: true, time: "Time not stated", speed: "",
        src: { label: "IDFC FIRST, Credit card bill payment", url: "https://www.idfcfirst.bank.in/personal-banking/payments/cc-bill-payment" } },
      { kind: "imps", title: "IMPS or NEFT from another bank",
        fields: [
          { label: "IFSC", value: "IDFB0010225", copy: true },
          { label: "Account number", text: "Your 16-digit IDFC FIRST credit card number" },
          { label: "Payee name", text: "Your name as on the card" },
          { label: "Bank", text: "IDFC FIRST Bank" }
        ], time: "Time not stated", speed: "" },
      { kind: "app", title: "IDFC FIRST app or net banking", how: "Credit Card › Pay credit card bill. You can turn on auto-debit here too." },
      { kind: "other", title: "Cash or cheque at a branch", how: "Cheques drawn in favour of “IDFC FIRST Bank Credit Card” and your card number." }
    ],
    sources: [{ label: "IDFC FIRST: Credit card bill payment", url: "https://www.idfcfirst.bank.in/personal-banking/payments/cc-bill-payment" }]
  },

  "ICICI Bank": {
    methods: [
      { kind: "upi", title: "Pay to a UPI ID",
        how: "Pay to this UPI ID, or scan ICICI’s Scan to Pay QR. You don’t need an ICICI account.",
        fields: [{ label: "UPI ID", pattern: ["ccpay.", { ph: "registered mobile number" }, { ph: "last 4 card digits" }, "@icici"], example: "ccpay.98765432101234@icici", keys: [["registered mobile number", "The 10-digit mobile number registered with your card."], ["last 4 card digits", "The last 4 digits of your credit card number."]] }],
        verify: true, time: "Usually within a few hours, up to 1 working day", speed: "mid",
        src: { label: "ICICI Bank, Credit card bill payment", url: "https://www.icici.bank.in/personal-banking/payments/credit-card-bill-payment" } },
      { kind: "neft", title: "NEFT from another bank",
        fields: [
          { label: "IFSC", value: "ICIC0000004", copy: true },
          { label: "Account number", text: "Your card number: 16 digits, or 15 for an ICICI Amex card" }
        ], time: "Usually within a few hours, up to 1 working day", speed: "mid" },
      { kind: "app", title: "iMobile or internet banking", how: "No convenience charge on ICICI’s own digital channels." },
      { kind: "other", title: "Cash at a branch or ICICI ATM", how: "Cash costs ₹100 + 18% GST per payment." }
    ],
    sources: [{ label: "ICICI Bank: Credit card bill payment", url: "https://www.icici.bank.in/personal-banking/payments/credit-card-bill-payment" }]
  },

  "BOBCARD": {
    note: "BOBCARD doesn’t publish NEFT or IMPS details on its website. Use the methods below, or the details printed on your statement.",
    methods: [
      { kind: "gateway", title: "InstaPay", how: "Pay by net banking, debit card or UPI on BOBCARD’s InstaPay page (BillDesk or Razorpay).", time: "Confirmed immediately", speed: "fast" },
      { kind: "upi", title: "UPI apps", how: "BOBCARD lists Paytm, Google Pay and other UPI apps. Use the app’s credit card bill section." },
      { kind: "app", title: "bobcard app, customer portal or bob World", time: "Confirmed immediately", speed: "fast" },
      { kind: "other", title: "Cheque or auto-debit", how: "Cheque in favour of “BOBCARD No.” and your 16-digit card number, at any Bank of Baroda branch. Auto-debit is for Bank of Baroda account holders.", time: "NEFT, IMPS, cheque and cash confirmed in 2 days", speed: "slow" }
    ],
    sources: [{ label: "BOBCARD: Pay credit card bill", url: "https://www.bobcard.co.in/pay-credit-card-bill" }]
  },

  "YES BANK": {
    methods: [
      { kind: "neft", title: "NEFT, IMPS or RTGS from another bank",
        how: "Add your YES BANK credit card as a beneficiary.",
        fields: [
          { label: "IFSC", value: "YESB0CMSNOC", copy: true },
          { label: "Account number", text: "Your YES BANK credit card number" }
        ], time: "Time not stated", speed: "" },
      { kind: "gateway", title: "BillDesk", how: "Pay from any bank’s net banking through BillDesk, linked from YES BANK’s bill payment page." },
      { kind: "upi", title: "UPI in the YES Pay app", how: "From a YES BANK or any other bank account. Android only for now." },
      { kind: "app", title: "iris by YES BANK or net banking" },
      { kind: "other", title: "Cheque", how: "Write your 16-digit card number, and your name and mobile number on the back. Drop it in a YES BANK drop box." }
    ],
    sources: [{ label: "YES BANK: Credit card bill payment", url: "https://www.yes.bank.in/personal-banking/yes-individual/cards/credit-cards/bill-payment" }]
  },

  "HDFC Bank": {
    methods: [
      { kind: "neft", title: "NEFT, RTGS or IMPS from another bank",
        fields: [
          { label: "IFSC", value: "HDFC0000128", copy: true },
          { label: "Account number", text: "Your complete credit card number" },
          { label: "Account type", text: "Current or Savings" },
          { label: "Bank", text: "HDFC Bank" }
        ], time: "1 to 2 days", speed: "slow" },
      { kind: "app", title: "PayZapp", how: "Bills and Recharges › Financial Services › Credit Card.", time: "Same day for HDFC Bank cards", speed: "fast" },
      { kind: "app", title: "HDFC Bank app or NetBanking", time: "1 day", speed: "mid" },
      { kind: "gateway", title: "BillDesk", time: "2 to 3 working days", speed: "slow" },
      { kind: "other", title: "Cash at a branch or ATM, or cheque", time: "Cash 1 day", speed: "mid" }
    ],
    sources: [{ label: "HDFC Bank: Credit card bill payment", url: "https://www.hdfc.bank.in/credit-cards/services/credit-cards-bill-payment" }]
  },

  "Punjab National Bank": {
    methods: [
      { kind: "neft", title: "NEFT from another bank",
        fields: [
          { label: "IFSC", value: "PUNB0112000", copy: true },
          { label: "Account number", text: "Your 16-digit PNB credit card number" },
          { label: "Account type", text: "Current Account" },
          { label: "Branch", text: "ECE House, New Delhi" }
        ], time: "Time not stated", speed: "" }
    ],
    sources: [{ label: "PNB Credit Card: NEFT payment", url: "https://creditcard.pnb.bank.in/neft.html" }]
  },

  "Indian Bank": {
    caution: "The account number starts with the letters INBCC. Don’t send to your card number on its own.",
    methods: [
      { kind: "neft", title: "NEFT, RTGS or IMPS from another bank",
        fields: [
          { label: "IFSC", value: "IDIB000N078", copy: true },
          { label: "Account number", pattern: ["INBCC", { ph: "16-digit card number" }], example: "INBCC4321123412341234", note: "No space between INBCC and the card number." }
        ], time: "Time not stated", speed: "" },
      { kind: "bbps", title: "Bill payment apps (BBPS)", how: "In BHIM, Google Pay, PhonePe, Paytm, CRED and similar apps, pick Indian Bank Credit Card under credit card bills and add it with your registered mobile number or last 4 digits." },
      { kind: "app", title: "IndSMART app, net banking or IB Credit Card app", how: "Pay from the Credit Card section, or add “Indian Bank Credit Card” as a biller under Bill Payments." },
      { kind: "other", title: "Branch or auto-debit", how: "Pay at a branch, or set up auto-debit from an Indian Bank account for the full or minimum due." }
    ],
    sources: [{ label: "Indian Bank: Options to pay credit card bills (PDF)", url: "https://indianbank.bank.in/documents/d/guest/Available-options-to-pay-Indian-Bank-Credit-Card-bills" }]
  },

  "Bank of India": {
    note: "Bank of India’s own pages give two different NEFT formats. Its English page says to use IFSC BKID0000101 with your card number as the account number. Another of its pages asks you to send money to a bank account and quote your card number as the reference. Until the bank confirms one, use the methods below or call 1800-220-229 before sending a NEFT.",
    methods: [
      { kind: "gateway", title: "BillDesk", how: "For direct billing cards: pay from another bank’s internet banking through BOI Online › Payment Services." },
      { kind: "app", title: "BOI Omni Neo app or BOI internet banking", how: "Card Services › Credit Card Payment." },
      { kind: "other", title: "Cheque or auto-debit", how: "Direct billing cards: cheque at any Bank of India branch. Branch billing cards are debited from your linked account on the due date." }
    ],
    sources: [
      { label: "Bank of India: Ancillary banking services", url: "https://bankofindia.bank.in/ancillary-banking-services" },
      { label: "Bank of India: Credit card", url: "https://bankofindia.bank.in/credit-card" }
    ]
  },

  "Canara Bank": {
    older: "From Canara Bank’s credit card policy for 2023–24, the newest document where the bank publishes these details.",
    methods: [
      { kind: "neft", title: "NEFT from another bank",
        fields: [
          { label: "IFSC", value: "CNRB0001912", copy: true },
          { label: "Account number", text: "Your 16-digit credit card number" },
          { label: "Beneficiary name", text: "The cardholder’s name" }
        ], time: "Time not stated", speed: "" },
      { kind: "bbps", title: "IMPS or BBPS", how: "Canara lists IMPS and BBPS payments, but doesn’t publish IMPS details." },
      { kind: "app", title: "Canara ai1 app or internet banking" },
      { kind: "other", title: "Branch, ATM or auto-debit", how: "Pay at any branch, at a Canara ATM with a Canara debit card, or have dues debited from your Canara account." }
    ],
    sources: [{ label: "Canara Bank: Credit card policy 2023–24 (PDF)", url: "https://www.canarabank.bank.in/documents/d/guest/credit-card-policy-2023-24-01042023" }]
  },

  "OneCard": {
    caution: "Your NEFT and IMPS account number is unique to your card and only shown in the OneCard app. Never use one someone else shares.",
    methods: [
      { kind: "app", title: "OneCard app", how: "Pay by UPI from any UPI app, a debit card or net banking." },
      { kind: "imps", title: "IMPS or NEFT", how: "Send to the unique OneCard account number shown in your app." },
      { kind: "other", title: "Not accepted", how: "OneCard doesn’t take cash or cheque payments." }
    ],
    sources: [{ label: "CSB Bank: OneCard terms and conditions (PDF)", url: "https://www.csb.bank.in/pdf/CC-T%26C21122022.pdf" }]
  },

  "RBL Bank": {
    methods: [
      { kind: "neft", title: "NEFT from another bank",
        fields: [
          { label: "IFSC", value: "RATN0CRCARD", copy: true },
          { label: "Account number", text: "Your 16-digit RBL credit card number" },
          { label: "Payee name", text: "Your name as on the card" },
          { label: "Bank and branch", text: "RBL Bank, NOC Goregaon, Mumbai" }
        ], time: "Limit freed same day, credit next business day", speed: "mid" },
      { kind: "upi", title: "UPI", how: "Pay with a UPI ID (VPA) through RBL’s online card payment.", time: "Limit freed same day, credit next business day", speed: "mid" },
      { kind: "gateway", title: "Other bank’s net banking or a debit card", how: "Through RBL’s online card payment (BillDesk or Razorpay).", time: "Limit freed same day, credit up to 3 business days", speed: "slow" },
      { kind: "app", title: "RBL MyBank app or RBL net banking", time: "From an RBL account: credit next business day", speed: "mid" },
      { kind: "other", title: "Cash, cheque or NACH", how: "Cash at an RBL branch costs ₹100 + GST. Cheques payable to “RBL Bank Card” and your 16-digit card number." }
    ],
    sources: [{ label: "RBL Bank: Credit card payments", url: "https://www.rbl.bank.in/credit-card-payments" }]
  },

  "IndusInd Bank": {
    methods: [
      { kind: "neft", title: "NEFT, RTGS or IMPS from another bank",
        fields: [
          { label: "IFSC", value: "INDB0000018", copy: true },
          { label: "Account number", text: "Your 16-digit card number, or 15 digits for an IndusInd Amex card, without spaces" },
          { label: "Beneficiary name", text: "The cardholder’s name" }
        ], time: "Pay at least 2 working days before the due date", speed: "slow" },
      { kind: "app", title: "INDIE app or IndusNet", how: "From an IndusInd Bank account." },
      { kind: "gateway", title: "Credit Card Quick Pay or Visa money transfer", how: "Pay online from another bank account." },
      { kind: "other", title: "Cash, cheque or NACH", how: "Cash at IndusInd branches costs ₹100." }
    ],
    sources: [
      { label: "IndusInd Bank: NEFT, RTGS and IMPS payment", url: "https://www.indusind.bank.in/in/en/personal/payment-NEFT-facility.html" },
      { label: "IndusInd Bank: Credit card bill payment", url: "https://www.indusind.bank.in/in/en/personal/bill-payment/credit-card-bill-payment.html" }
    ]
  },

  "Equitas Small Finance Bank": {
    note: "Equitas publishes the IFSC for payments from other banks (ESFB0CCARDS), but not what to enter as the account number. Check your statement or call the bank before sending money this way.",
    methods: [
      { kind: "app", title: "Equitas net banking, mobile banking or the Selfe app" }
    ],
    sources: [{ label: "Equitas: Credit card MITC 2024 (PDF)", url: "https://equitas.bank.in/strapi-dev/uploads/MITC_Credit_Cards_Final_2024_86cd34552e.pdf" }]
  },

  "AU Small Finance Bank": {
    methods: [
      { kind: "upi", title: "Pay to a UPI ID",
        how: "In your UPI app, choose Pay to UPI ID and enter:",
        fields: [{ label: "UPI ID", pattern: ["AUCC.", { ph: "registered mobile number" }, { ph: "last 4 card digits" }, "@AUBANK"], example: "AUCC.98765432101234@AUBANK", keys: [["registered mobile number", "The 10-digit mobile number registered with your card."], ["last 4 card digits", "The last 4 digits of your credit card number."]] }],
        verify: true, time: "Time not stated", speed: "",
        src: { label: "AU Bank, Credit card bill payment", url: "https://www.au.bank.in/credit-cards-bill-payment" } },
      { kind: "app", title: "AU 0101 app or net banking", how: "Select the card, then Pay bill. You can also turn on Auto Pay here." },
      { kind: "other", title: "Cheque at an AU branch", how: "Write your 16-digit card number as the payee and deposit it at least 2 days before the due date." }
    ],
    sources: [{ label: "AU Bank: Credit card bill payment", url: "https://www.au.bank.in/credit-cards-bill-payment" }]
  },

  "HSBC India": {
    methods: [
      { kind: "neft", title: "NEFT from another bank",
        fields: [
          { label: "IFSC", value: "HSBC0400002", copy: true },
          { label: "Card number", text: "Quote your complete 16-digit HSBC credit card number" }
        ], time: "Time not stated", speed: "" },
      { kind: "gateway", title: "BillDesk or PayU", how: "Pay from any bank account. Start from HSBC’s payment page so you land on the right site." },
      { kind: "app", title: "HSBC internet or mobile banking", how: "For HSBC bank account holders." },
      { kind: "other", title: "Visa money transfer, cheque, ATM or branch", how: "Cash at a branch costs ₹100." }
    ],
    sources: [{ label: "HSBC India: Credit card payments", url: "https://www.hsbc.bank.in/ways-to-bank/online-banking/payments/credit-card/" }]
  },

  "American Express": {
    caution: "Amex only accepts payments from a bank account in the primary Cardmember’s name.",
    methods: [
      { kind: "upi", title: "Pay to a UPI ID",
        how: "In a UPI-enabled mobile banking app, pay to:",
        fields: [{ label: "UPI ID", pattern: ["AEBC", { ph: "15-digit card number" }, "@SC"], example: "AEBC3XXXXXXXXXXXXXX@SC",
          keys: [["15-digit card number", "Your full 15-digit Amex card number, starting 34 or 37, with no spaces."]] }],
        note: "Pay only from an eligible bank account in the primary Cardmember’s name. Non-residents of India must pay from an NRE or NRO account in the primary Cardmember’s name.",
        verify: true, time: "Before 5 pm: credited next day, except Sundays and bank holidays", speed: "mid",
        src: { label: "American Express India, Making a payment", url: "https://www.americanexpress.com/in/customer-service/payments-statements-and-balance/making-a-payment.html" } },
      { kind: "neft", title: "NEFT, RTGS or IMPS from another bank",
        fields: [
          { label: "IFSC", value: "SCBL0036020", copy: true },
          { label: "Account number", text: "Your 15-digit card number, starting 34 or 37" },
          { label: "Payee name", value: "American Express", copy: true },
          { label: "Bank", text: "Standard Chartered Bank, Current account" }
        ], time: "NEFT settles next day", speed: "mid" },
      { kind: "gateway", title: "Online payment from 50+ banks", how: "Net banking, RuPay debit card, UPI or UPI QR from the Amex website or app.", time: "1 to 2 business days", speed: "slow" },
      { kind: "other", title: "Cheque or autopay", how: "Cheques payable to “AEBC Card No.” and your card number. Use Standard Chartered drop boxes with the Amex sticker." }
    ],
    sources: [{ label: "American Express India: Making a payment", url: "https://www.americanexpress.com/in/customer-service/payments-statements-and-balance/making-a-payment.html" }]
  },

  "SBM Bank India": {
    note: "SBM Bank India issues its cards with partner apps, and its website doesn’t publish a bank-wide way to pay. Pay in the partner app you applied through, or use the details printed on your statement.",
    methods: [],
    sources: [{ label: "SBM Bank India: Credit cards", url: "https://www.sbmbank.co.in/smart_banking/consumer-credit-cards.php" }]
  },

  "Unity Small Finance Bank": {
    methods: [
      { kind: "app", title: "Roarbank app", how: "For the Roarbank credit card." },
      { kind: "upi", title: "UPI apps or a linked bank account", how: "Unity lists UPI-enabled apps and transfers from a linked bank account. It doesn’t publish a UPI ID or account details." }
    ],
    sources: [{ label: "Unity Bank: Roarbank credit card", url: "https://roar.unity.bank.in/en/credit-card" }]
  },

  "CSB Bank": {
    note: "Most CSB credit cards are OneCards. Pay those in the OneCard app (see OneCard above). For other CSB cards, use the details printed on your statement.",
    methods: [],
    sources: [
      { label: "CSB Bank: Credit card", url: "https://www.csb.bank.in/credit-card" },
      { label: "CSB Bank: OneCard terms and conditions (PDF)", url: "https://www.csb.bank.in/pdf/CC-T%26C21122022.pdf" }
    ]
  },

  "Federal Bank": {
    methods: [
      { kind: "neft", title: "NEFT or IMPS",
        how: "Federal Bank describes this for FedMobile and FedNet. Add the card as a beneficiary:",
        fields: [
          { label: "IFSC", value: "FDRL00CARDS", copy: true },
          { label: "Account number", text: "Your credit card number" },
          { label: "Name", text: "Your name as on the card" },
          { label: "Bank and branch", text: "Federal Bank, Aluva" }
        ], time: "Time not stated", speed: "" },
      { kind: "other", title: "Cheque, cash or auto-debit", how: "Cheques payable to “Federal Bank Credit Card No.” and your card number. Cash at a branch costs ₹100.", time: "Federal cheque 1 working day, other banks 3 to 5", speed: "slow" }
    ],
    sources: [{ label: "Federal Bank: Credit card terms and conditions", url: "https://www.federal.bank.in/-/credit-cards-general-terms-and-conditions-1" }]
  },

  "Standard Chartered Bank": {
    methods: [
      { kind: "neft", title: "NEFT or IBFT from another bank",
        fields: [
          { label: "IFSC", value: "SCBL0036001", copy: true },
          { label: "Account number", text: "Any card number on your credit card account" },
          { label: "Branch", text: "MG Road, Mumbai" }
        ], time: "Time not stated", speed: "" },
      { kind: "gateway", title: "BillDesk", how: "Pay from any bank, starting from Standard Chartered’s payment page." },
      { kind: "app", title: "Standard Chartered online banking" },
      { kind: "other", title: "Cheque, cash or auto-debit", how: "Cash only at branch teller counters. Cheques in favour of your card account or card number." }
    ],
    sources: [{ label: "Standard Chartered: Credit card payment options", url: "https://www.sc.bank.in/credit-cards/payment-option/" }]
  },

  "Union Bank of India": {
    note: "Union Bank says you can pay from any bank by NEFT, IMPS or UPI, but doesn’t publish the account format. Use the UPI or bank details printed on your monthly statement.",
    methods: [
      { kind: "app", title: "Union Bank mobile or internet banking" },
      { kind: "gateway", title: "Payment gateway from other banks", how: "Union Bank lists payment gateway services for paying from other bank accounts." },
      { kind: "other", title: "Branch or auto-debit", how: "Cash, transfer or a cheque in favour of your card number at any branch. Auto-debit is required if you have a Union Bank account." }
    ],
    sources: [{ label: "Union Bank of India: Credit card policy 2024–25 (PDF)", url: "https://www.unionbankofindia.bank.in/pdf/credit-card-policy-2024-25.pdf" }]
  },

  "DBS Bank": {
    methods: [
      { kind: "imps", title: "NEFT or IMPS from another bank",
        fields: [
          { label: "IFSC", value: "DBSS0IN0811", copy: true },
          { label: "Account number", text: "Your 16-digit DBS credit card number" },
          { label: "Beneficiary", text: "Add “DBS Credit Card” as the beneficiary" }
        ], time: "Time not stated", speed: "" },
      { kind: "gateway", title: "Online payment from other banks", time: "Instant", speed: "fast" },
      { kind: "other", title: "Cheque", how: "Payable to “DBS Credit Card”. Drop it well before the due date." }
    ],
    sources: [{ label: "DBS Bank India: Credit card MITC (PDF)", url: "https://www.dbs.bank.in/in/credit-cards/credit-card-consolidated-mitc.pdf" }]
  }
};
