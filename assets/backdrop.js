/* Ambient card light: picks the page's own artwork and hands it to backdrop.css. */
(() => {
  // Centres (x %, y %) for up to six light sources, spread across the top of the screen.
  const SPOTS = [[12, 8], [50, -4], [88, 10], [30, 34], [72, 30], [96, 52]];

  function pick() {
    // A review: its own card art, three times, so the light wraps the hero.
    const hero = document.querySelector("img.pv-art");
    if (hero) {
      const src = hero.currentSrc || hero.src;
      return { kind: "card", srcs: [src, src, src] };
    }
    // Homepage and review list: every reviewed card's art.
    const art = [...new Set([...document.querySelectorAll('img[src*="/assets/reviews/"]')].map((img) => img.currentSrc || img.src))];
    if (art.length === 1) return { kind: "card", srcs: [art[0], art[0], art[0]] };
    if (art.length >= 2) return { kind: "card", srcs: art.slice(0, 5) };
    // Bank pages: the banks' own logo colours.
    const logos = [...document.querySelectorAll('img[src*="bank-logos/"]')].map((img) => img.src);
    if (logos.length >= 12) return { kind: "logo", srcs: [0, 2, 7, 4, 8, 11].map((i) => logos[i]) };
    // An update with a poster.
    const poster = document.querySelector('main img[src*="/assets/updates/"]');
    if (poster) return { kind: "card", srcs: [poster.currentSrc || poster.src, poster.currentSrc || poster.src] };
    return { kind: "brand", srcs: [] };
  }

  // Share of clearly coloured pixels, so near-monochrome art (a black card on a
  // white photo) doesn't turn into a grey smear.
  function colourful(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = 24; c.height = 16;
          const ctx = c.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, 24, 16);
          const d = ctx.getImageData(0, 0, 24, 16).data;
          let hits = 0;
          for (let i = 0; i < d.length; i += 4) {
            const max = Math.max(d[i], d[i + 1], d[i + 2]), min = Math.min(d[i], d[i + 1], d[i + 2]);
            if (d[i + 3] > 128 && max > 60 && (max - min) / max > 0.35) hits++;
          }
          resolve(hits / 384 > 0.05 ? img : null);
        } catch (e) {
          resolve(img);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function mount() {
    const box = document.createElement("div");
    box.id = "bgfx";
    box.setAttribute("aria-hidden", "true");
    document.body.prepend(box);
    let { kind, srcs } = pick();
    // The review grid is rendered by React and can arrive after load: look once more.
    if (kind === "brand") {
      await new Promise((r) => setTimeout(r, 900));
      ({ kind, srcs } = pick());
    }
    let lights = await Promise.all(srcs.map(colourful));
    lights = lights.filter(Boolean);
    const layers = lights.length ? lights : [null, null];
    layers.forEach((img, i) => {
      const el = img || document.createElement("div");
      const [x, y] = SPOTS[i % SPOTS.length];
      el.className = "amb " + (img ? (kind === "logo" ? "logo" : "card") : "brand");
      el.alt = "";
      el.style.left = x + "%";
      el.style.top = y + "%";
      box.appendChild(el);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add("is-lit")));
  }

  if (document.readyState === "complete") mount();
  else addEventListener("load", mount, { once: true });
})();
