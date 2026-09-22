(() => {
  const pngByDomain = {
    "axis.bank.in":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2397144d'/><path d='M50 18 L20 82 H38 L50 56 L62 82 H80 Z' fill='%23ffffff'/><path d='M50 38 L60 58 H40 Z' fill='%2397144d'/></svg>",
    "kotak.com":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23ed1c24'/><path d='M28 20 H42 V42 L64 20 H82 L56 48 L84 80 H65 L42 54 V80 H28 Z' fill='%23ffffff'/><circle cx='76' cy='30' r='5' fill='%23ffffff'/></svg>",
    "sbicard.com":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2300b5ef'/><circle cx='50' cy='50' r='32' fill='%23ffffff'/><rect x='44' y='50' width='12' height='32' fill='%2300b5ef'/><circle cx='50' cy='44' r='14' fill='%2300b5ef'/></svg>",
    "idfcfirstbank.com":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%239e1b32'/><text x='50' y='58' font-family='sans-serif' font-weight='900' font-size='26' fill='%23ffffff' text-anchor='middle'>IDFC</text><text x='50' y='78' font-family='sans-serif' font-weight='800' font-size='15' fill='%23e3ab35' text-anchor='middle'>FIRST</text></svg>",
    "icicibank.com":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23053c6d'/><path d='M20 20 H80 V40 H55 V80 H35 V40 H20 Z' fill='%23f37021'/><circle cx='50' cy='30' r='8' fill='%23ffffff'/></svg>",
    "bobcard.co.in":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23f26522'/><text x='50' y='58' font-family='sans-serif' font-weight='900' font-size='24' fill='%23ffffff' text-anchor='middle'>BOB</text><text x='50' y='78' font-family='sans-serif' font-weight='800' font-size='13' fill='%23ffffff' text-anchor='middle'>CARD</text></svg>",
    "yesbank.in":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23005a9c'/><path d='M25 50 L42 67 L78 31' stroke='%23ed1c24' stroke-width='14' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>",
    "hdfcbank.com":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23004c8f'/><rect x='25' y='25' width='50' height='50' fill='%23ed1c24'/><rect x='40' y='40' width='20' height='20' fill='%23ffffff'/><rect x='35' y='14' width='30' height='11' fill='%23004c8f'/><rect x='35' y='75' width='30' height='11' fill='%23004c8f'/></svg>",
    "pnbindia.in":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23a20a3a'/><text x='50' y='64' font-family='sans-serif' font-weight='900' font-size='32' fill='%23f8ad1d' text-anchor='middle'>PNB</text></svg>",
    "indianbank.in":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230054a6'/><polygon points='50,18 63,43 90,43 68,60 77,86 50,70 23,86 32,60 10,43 37,43' fill='%23ffc20e'/></svg>",
    "bankofindia.co.in":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23f37023'/><text x='50' y='64' font-family='sans-serif' font-weight='900' font-size='30' fill='%23ffffff' text-anchor='middle'>BOI</text></svg>",
    "canarabank.com":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230091d2'/><polygon points='28,24 76,24 52,66' fill='%23ffdd00'/><polygon points='72,76 24,76 48,34' fill='%23ffffff'/></svg>",
    "getonecard.app":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2318181b'/><path d='M30 70 L70 30 M70 30 H40 M70 30 V60' stroke='%2338bdf8' stroke-width='10' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>",
    "rblbank.com":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23003a70'/><text x='50' y='64' font-family='sans-serif' font-weight='900' font-size='30' fill='%23e31b23' text-anchor='middle'>RBL</text></svg>",
    "indusind.com":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2384181b'/><text x='50' y='62' font-family='sans-serif' font-weight='900' font-size='22' fill='%23ffffff' text-anchor='middle'>INDUS</text></svg>",
    "equitasbank.com":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%235c2483'/><text x='50' y='62' font-family='sans-serif' font-weight='900' font-size='18' fill='%23f37021' text-anchor='middle'>EQUITAS</text></svg>",
    "aubank.in":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2367298a'/><circle cx='50' cy='50' r='30' fill='%23f37021'/><text x='50' y='60' font-family='sans-serif' font-weight='900' font-size='26' fill='%23ffffff' text-anchor='middle'>AU</text></svg>",
    "hsbc.co.in":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23db0011'/><polygon points='25,25 75,25 75,75 25,75' fill='%23ffffff'/><polygon points='25,25 50,50 25,75' fill='%23db0011'/><polygon points='75,25 50,50 75,75' fill='%23db0011'/></svg>",
    "americanexpress.com":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23006fcf'/><text x='50' y='60' font-family='sans-serif' font-weight='900' font-size='24' fill='%23ffffff' text-anchor='middle'>AMEX</text></svg>",
    "sbmbank.co.in":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23003366'/><text x='50' y='64' font-family='sans-serif' font-weight='900' font-size='28' fill='%2300a8b5' text-anchor='middle'>SBM</text></svg>",
    "theunitybank.com":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%231a1a1a'/><text x='50' y='62' font-family='sans-serif' font-weight='900' font-size='22' fill='%23fbb03b' text-anchor='middle'>UNITY</text></svg>",
    "csb.co.in":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23d32f2f'/><text x='50' y='64' font-family='sans-serif' font-weight='900' font-size='30' fill='%23ffffff' text-anchor='middle'>CSB</text></svg>",
    "federalbank.co.in":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23004b87'/><text x='50' y='64' font-family='sans-serif' font-weight='900' font-size='28' fill='%23fdb813' text-anchor='middle'>FED</text></svg>",
    "sc.com":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230079c1'/><text x='50' y='64' font-family='sans-serif' font-weight='900' font-size='30' fill='%2378be20' text-anchor='middle'>SC</text></svg>",
    "unionbankofindia.co.in":"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2300529b'/><text x='50' y='64' font-family='sans-serif' font-weight='900' font-size='28' fill='%23e31b23' text-anchor='middle'>UBI</text></svg>"
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
