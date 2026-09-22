(() => {
  const pngByDomain = {
    "axis.bank.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/utib/logo.png",
    "kotak.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/kkbk/logo.png",
    "sbicard.com":"https://commons.wikimedia.org/wiki/Special:Redirect/file/SBI%20Card%20logo.png",
    "idfcfirstbank.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/idfb/logo.png",
    "icicibank.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/icic/logo.png",
    "bobcard.co.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/barb/logo.png",
    "yesbank.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/yesb/logo.png",
    "hdfcbank.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/hdfc/logo.png",
    "pnbindia.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/punb/logo.png",
    "indianbank.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/idib/logo.png",
    "bankofindia.co.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/bkid/logo.png",
    "canarabank.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/cnrb/logo.png",
    "getonecard.app":"https://images.seeklogo.com/logo-png/42/1/onecard-logo-png_seeklogo-428583.png",
    "rblbank.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/ratn/logo.png",
    "indusind.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/indb/logo.png",
    "equitasbank.com":"https://commons.wikimedia.org/wiki/Special:Redirect/file/Equitas-logo.png",
    "aubank.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/aubl/logo.png",
    "hsbc.co.in":"https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/HSBC_logo_%282018%29.svg/512px-HSBC_logo_%282018%29.svg.png",
    "americanexpress.com":"https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/512px-American_Express_logo_%282018%29.svg.png",
    "sbmbank.co.in":"https://commons.wikimedia.org/wiki/Special:Redirect/file/State%20Bank%20of%20Mauritius%20Logo%20Image.png",
    "theunitybank.com":"https://commons.wikimedia.org/wiki/Special:Redirect/file/Unity%20Small%20Finance%20Bank.png",
    "csb.co.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/csbk/logo.png",
    "federalbank.co.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/fdrl/logo.png",
    "sc.com":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/scbl/logo.png",
    "unionbankofindia.co.in":"https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos/ubin/logo.png"
  };

  window.BANK_LOGO_PNG = pngByDomain;

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
