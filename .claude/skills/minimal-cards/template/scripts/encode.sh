#!/usr/bin/env bash
# frames -> mp4. bash scripts/encode.sh frames out [fps]. With 120 fps frames it also writes a 60 fps copy.
set -euo pipefail
IN=${1:-frames}; OUT=${2:-out}; FPS=${3:-$(ls "$IN" | wc -l | awk '{print ($1>1200)?120:60}')}
mkdir -p "$OUT"
ffmpeg -y -framerate "$FPS" -i "$IN/%05d.png" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart -an "$OUT/video-${FPS}fps.mp4"
if [ "$FPS" = 120 ]; then ffmpeg -y -i "$OUT/video-120fps.mp4" -vf fps=60 -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart -an "$OUT/video.mp4"; else cp "$OUT/video-${FPS}fps.mp4" "$OUT/video.mp4"; fi
