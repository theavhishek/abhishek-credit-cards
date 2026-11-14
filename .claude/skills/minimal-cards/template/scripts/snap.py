"""Stills at chosen seconds into out/: python3 scripts/snap.py 0.6 3 6.4 9 13.9"""
import os, sys, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/usr/bin/google-chrome" if os.path.exists("/usr/bin/google-chrome") else None
times = [float(a) for a in sys.argv[1:]] or [0.6, 3, 6.4, 9, 13.9]
(ROOT / "out").mkdir(exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    pg = b.new_page(viewport={"width": 1200, "height": 900}, device_scale_factor=2)
    pg.goto((ROOT / "index.html").as_uri()); pg.wait_for_timeout(300)
    for t in times:
        pg.evaluate(f"draw({t})"); pg.screenshot(path=str(ROOT / "out" / f"snap-{t:05.2f}.png"))
        print("out/snap-%05.2f.png" % t)
    b.close()
