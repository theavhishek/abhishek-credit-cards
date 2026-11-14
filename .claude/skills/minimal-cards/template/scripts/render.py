"""Parallel frame render: frame i -> draw(i/fps) -> 2x screenshot -> Lanczos to 1600x1200 PNG in frames/.
python3 scripts/render.py --fps 60 --seconds 14 --workers 4"""
import argparse, io, os, pathlib
from multiprocessing import Pool
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/usr/bin/google-chrome" if os.path.exists("/usr/bin/google-chrome") else None

def work(args):
    frames, fps, out = args
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME)
        pg = b.new_page(viewport={"width": 1200, "height": 900}, device_scale_factor=2)
        pg.goto((ROOT / "index.html").as_uri()); pg.wait_for_timeout(300)
        for i in frames:
            pg.evaluate(f"draw({i / fps})")
            Image.open(io.BytesIO(pg.screenshot())).resize((1600, 1200), Image.LANCZOS).save(out / f"{i:05d}.png")
        b.close()
    return len(frames)

if __name__ == "__main__":
    a = argparse.ArgumentParser(); a.add_argument("--fps", type=int, default=60); a.add_argument("--seconds", type=float, default=14)
    a.add_argument("--workers", type=int, default=4); a.add_argument("--out", default="frames"); o = a.parse_args()
    out = ROOT / o.out; out.mkdir(exist_ok=True); n = round(o.fps * o.seconds)
    jobs = [(list(range(w, n, o.workers)), o.fps, out) for w in range(o.workers)]
    with Pool(o.workers) as pool: print(sum(pool.map(work, jobs)), "frames ->", out)
