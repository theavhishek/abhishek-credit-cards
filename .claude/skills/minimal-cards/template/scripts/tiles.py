"""Smoothness check: mean frame-to-frame difference per tile on a 16x12 grid; flags spikes (snaps, pops).
python3 scripts/tiles.py frames [--k 4]"""
import sys, pathlib
import numpy as np
from PIL import Image
d = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "frames"); k = float(sys.argv[sys.argv.index("--k") + 1]) if "--k" in sys.argv else 4.0
files = sorted(d.glob("*.png")); prev = None; diffs = []
for f in files:
    a = np.asarray(Image.open(f).convert("L").resize((320, 240)), dtype=np.float32)
    if prev is not None: diffs.append(np.abs(a - prev).reshape(12, 20, 16, 20).mean(axis=(1, 3)))
    prev = a
D = np.stack(diffs); med = np.median(D, axis=0) + 0.5; flagged = 0
for i, m in enumerate(D):
    hot = np.argwhere(m > k * med + 2)
    if len(hot): flagged += 1; print(f"frame {i + 1:05d}: {len(hot)} tile(s) spike, max {m.max():.1f} at row/col {tuple(hot[0])}")
print(f"{len(files)} frames, {flagged} flagged")
