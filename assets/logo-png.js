(() => {
  const pngByDomain = {
    "axis.bank.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/utib/logo.png",
    "kotak.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/kkbk/logo.png",
    "sbicard.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/sbin/logo.png",
    "idfcfirstbank.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/idfb/logo.png",
    "icicibank.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/icic/logo.png",
    "bobcard.co.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/barb/logo.png",
    "yesbank.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/yesb/logo.png",
    "hdfcbank.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/hdfc/logo.png",
    "pnbindia.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/punb/logo.png",
    "indianbank.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/idib/logo.png",
    "bankofindia.co.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/bkid/logo.png",
    "canarabank.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/cnrb/logo.png",
    "getonecard.app":"https://www.google.com/s2/favicons?domain=getonecard.app&sz=256",
    "rblbank.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/ratn/logo.png",
    "indusind.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/indb/logo.png",
    "equitasbank.com":"https://commons.wikimedia.org/wiki/Special:Redirect/file/Equitas-logo.png",
    "aubank.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/aubl/logo.png",
    "hsbc.co.in":"https://www.google.com/s2/favicons?domain=www.hsbc.co.in&sz=256",
    "americanexpress.com":"https://www.google.com/s2/favicons?domain=americanexpress.com&sz=256",
    "sbmbank.co.in":"https://www.google.com/s2/favicons?domain=www.sbmbank.co.in&sz=256",
    "theunitybank.com":"assets/bank-logos/unity-custom.png",
    "csb.co.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/csbk/logo.png",
    "federalbank.co.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/fdrl/logo.png",
    "sc.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/scbl/logo.png",
    "unionbankofindia.co.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/ubin/logo.png"
  };

  window.BANK_LOGO_PNG = pngByDomain;

  // Keep current portfolio data in sync before app.js renders it.
  const portfolio = window.PORTFOLIO_DATA;
  if (portfolio?.cards) {
    const rblIcon = portfolio.cards.find((card) => card.id === "rbl-bank-icon-40");
    if (rblIcon) rblIcon.annualFee = "LTF";

    const xciteUltra = portfolio.cards.find((card) => card.id === "au-small-finance-bank-xcite-ultra-44");
    if (xciteUltra) xciteUltra.annualFee = "LTF";

    const hasAirPlus = portfolio.cards.some((card) => card.bank === "Kotak Mahindra Bank" && card.card === "Air+");
    if (!hasAirPlus) {
      const lastKotakIndex = portfolio.cards.reduce((last, card, index) => card.bank === "Kotak Mahindra Bank" ? index : last, -1);
      const airPlus = {
        id: "kotak-mahindra-bank-air-plus-51",
        bank: "Kotak Mahindra Bank",
        card: "Air+",
        network: null,
        status: "Active",
        annualFee: "LTF",
        rewardType: "Reward Points",
        tag: null,
        bestFor: ["Rewards"]
      };
      portfolio.cards.splice(lastKotakIndex >= 0 ? lastKotakIndex + 1 : portfolio.cards.length, 0, airPlus);
    }

    if (portfolio.meta) {
      portfolio.meta.cardCount = portfolio.cards.length;
      portfolio.meta.ltfCount = portfolio.cards.filter((card) => card.annualFee === "LTF").length;
    }
  }

  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  if (!descriptor?.get || !descriptor?.set) return;

  const transform = (value) => {
    if (typeof value !== "string" || !value.includes("data-domain=")) return value;

    return value.replace(/<img\b[^>]*data-domain="([^"]+)"[^>]*>/gi, (tag, domain) => {
      const png = pngByDomain[domain];
      if (!png) return tag;

      let next = tag.replace(/\ssrc="[^"]*"/i, ` src="${png}"`);
      if (/\sdata-logo-stage="[^"]*"/i.test(next)) {
        next = next.replace(/\sdata-logo-stage="[^"]*"/i, ' data-logo-stage="2"');
      } else {
        next = next.replace(/>$/, ' data-logo-stage="2">');
      }
      return next;
    });
  };

  Object.defineProperty(Element.prototype, "innerHTML", {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    get: descriptor.get,
    set(value) {
      return descriptor.set.call(this, transform(value));
    }
  });
})();
