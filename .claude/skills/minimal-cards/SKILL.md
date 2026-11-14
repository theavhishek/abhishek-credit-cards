---
name: minimal-cards
description: >-
  Use when asked to make a silent, minimal "bento dashboard" motion video: a 4 x 3 grid of white rounded widget
  cards on a soft light-gray stage, one accent color, and a dot-matrix motif everywhere (dot clock digits that
  morph between numbers, dotted gauges and timer rings, halftone album art that changes with the track, dot step
  bars, a month of habit dots, a transit route with a gliding train, a toggle card that flips to dark with a
  halftone sweep). Cards blur in, numbers roll like odometers, the camera slowly pulls back. 1600x1200 (4:3),
  14 s, rendered frame by frame at 60 fps. Plain HTML, CSS and JS with Playwright and ffmpeg. No framework.
---
# Minimal cards motion video

**What you get:** a 14 second, 1600x1200 video of nine minimal widget cards that all move at once, rendered
deterministically so every frame is the same on every run. It plays well on X, LinkedIn and Instagram.

**Pick this when** you want the calm, "Dieter Rams made a dashboard" post: white cards, lots of air, one accent,
small precise motion. It reads instantly in a feed because the stage is light and the shapes are simple.

## Files
> Note for this repo: only SKILL.md was shared. `template/` and `preview.jpg` are an original recreation written to
> this spec (same file names, helpers and timeline constants), not the author's reference files.

```
template/index.html          the whole scene: tokens, dot font, widget functions W.<name>(t, ctx) -> html, layout, draw(t)
template/core.js             easing and timing helpers: spring, soft, expo, ease3, kf, tw, roll2 odometer, rollL, tickUp/tickDn, cnt
template/scripts/snap.py     stills at chosen seconds into out/ (fast review loop)
template/scripts/render.py   parallel Playwright workers: frame i -> draw(i/fps) -> screenshot at 2x -> 1600x1200 PNG
template/scripts/tiles.py    smoothness check: frame to frame difference on a tile grid, flags spikes (snaps, pops)
template/scripts/encode.sh   frames -> mp4 (see the 60 fps line below if you rendered at 60)
preview.jpg                  a still from the reference render
```

## Quick start
```bash
cp -r template my-video && cd my-video          # never build inside the skill folder
pip install playwright pillow numpy && python3 -m playwright install chromium
python3 scripts/snap.py 0.6 3 6.4 9 13.9        # intro, a clock tick, the track change, night shift, the end
python3 scripts/render.py --fps 60 --seconds 14 --workers 4      # 840 frames, a few minutes on 4 cores
ffmpeg -framerate 60 -i frames/%05d.png -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart -an out/video.mp4
```
For a 120 fps master, render with `--fps 120` and use `bash scripts/encode.sh frames out`, which also makes a 60 fps copy.
If Chrome is installed at /usr/bin/google-chrome the scripts use it; otherwise they use Playwright's Chromium.

## How the scene works
- **Stage:** 1200x900 CSS px, captured at device scale 2 and downscaled to 1600x1200 with Lanczos. Background
  #ECECEB with a faint accent glow that drifts, and a white glow top left.
- **Cards:** white, radius 22, a hairline ring plus a soft long shadow. Every card has the same header: a 5 px
  accent dot and a gray label top left, an optional gray pill top right. Big numbers are Inter 600 with tight
  tracking and tabular figures.
- **Layout:** 200 px cells, 14 px gaps, 4 columns x 3 rows. One wide card per row, stepping right row by row
  (clock, now playing, train), so the grid never looks like a spreadsheet.
- **One accent:** `A` at the top of the script. Everything lit uses it; everything off is `#EBEBEE`.
- **Dots:** `dot(x, y, size, color, scale, opacity)` places one circle by its center. Off dots stay on screen,
  smaller and pale, so every widget reads as a dot-matrix display.
- **Dot font:** `G` is a 5x7 font for 0-9 and the colon. When a digit changes, each column of dots crossfades
  from the old glyph to the new one with a small stagger, so the number "re-lights" instead of swapping.
- **Camera:** scale eases from 1.2 to 1.0 over the whole clip with a cubic in out, plus a 14 px rise.
- **Intro:** cards fade, un-blur (10 px to 0), rise 16 px and spring from 0.94 to 1.0, in the order in `ORDER`.
- **Timeline:** constants near the top (`T_TRACK`, `T_NIGHT`, `T_STREAK`, `TRAIN`). The clock runs a minute every
  4.5 s, so its digits re-light three times.

## The nine cards
| Card | Motion |
| --- | --- |
| Clock (wide) | dot-matrix HH:MM that re-lights each minute, a 60-dot seconds strip that fills and wipes |
| Air quality | 19-dot gauge arc, number rolls through a few values |
| Night shift | press, toggle springs on, card fades white to black, halftone triangle sweeps in from the corner |
| Focus | 48-dot ring that empties once a minute, mm:ss counts down |
| Now playing (wide) | 12x12 halftone art (diagonal swell, then a breathing ring after the track change), dotted progress, next button press |
| Heart rate | scrolling dot pulse, spikes in the accent, bpm rolls |
| Streak | a month of dots fills in, today's ring pulses, then gets checked and the count rolls |
| Steps | counter ticks up, today's dot column rises |
| Next train (wide) | train glides along a dotted route and lights the dots behind it, minutes roll down |

## Making your own version
1. Change `A`, the copy in each `W.<name>` and the times at the top. Keep it fictional: no real brands, logos or people.
2. Add a card: write `W.myThing=(t,ctx)=>\`...\``, then put it in `L` with a column, row and span. Set `ctx.bg` to
   change the card color. Everything must be a pure function of `t`: no Math.random, no Date, no CSS transitions.
3. Numbers: `roll2(from, to, secondsSinceChange)` or the wrappers `rollL` (cycle a list), `stepRoll` (change at
   given times), `tickUp` / `tickDn` (clocks), `cnt` (slow counters). Digits roll the short way.
4. Text that changes state: `xf(a, b, p)` stacks both and crossfades with a small slide. Never swap strings at a threshold.
5. Review stills with `snap.py`, render, run `python3 scripts/tiles.py frames`, fix anything that spikes, encode.

## Gotchas
- **Pixel snapping.** Chrome snaps `left`/`top` and plain 2D translations to whole pixels, so slow moves step.
  Cards and the camera use `translate3d(...) rotate(0.0002deg)`. Anything that travels inside a card (the train,
  the heart strip) moves with `transform`, never `left`.
- Change a dot's look with `transform:scale()` and color, not by resizing it, or neighbours shimmer.
- A roll from 10 to 9 changes the digit count and the odometer shifts. Pick values with the same number of digits.
- Pick the thumbnail at a moment where every number is settled (mid-roll digits look broken in a still).
- Keep labels short. Narrow cards are 200 px wide; check the widest value each counter can reach.

## Known limits
- Silent by design. Rendering is CPU bound, roughly 0.2 s per frame per worker at 2400x1800.
- The frame folder is about 1 GB for 14 s at 60 fps. Delete it after encoding.
