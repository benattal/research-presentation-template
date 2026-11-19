#!/usr/bin/env bash
# Media of the summary slide: our generated views of the vase scene (the opening
# scene), from the Dropbox figures folder (read-only). Run from the presentation
# directory:  bash media/summary.sh
# The loop plays forward, holds 2 s on the last view, and plays back.
set -euo pipefail
. "$(dirname "$0")/figures.sh"
OUT=public/slides/summary
ENC="-an -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -movflags +faststart -map_metadata -1"
LOOP="split=4[a][b][c][d];[b]trim=start_frame=28:end_frame=29,loop=loop=29:size=1:start=0,setpts=N/15/TB[hold];[c]reverse,trim=start_frame=1:end_frame=28,setpts=N/15/TB[rev];[d]trim=start_frame=0:end_frame=1,loop=loop=7:size=1:start=0,setpts=N/15/TB[first];[a][hold][rev][first]concat=n=4:v=1"
mkdir -p $OUT
ffmpeg -v error -y -i "$W/1_teaser/teaser_scene/scenes/teaser/prediction/video.mp4" -filter_complex \
  "[0:v]scale=690:690:flags=lanczos,$LOOP" -r 15 $ENC $OUT/ours-vase.mp4
ffmpeg -v error -y -i $OUT/ours-vase.mp4 -frames:v 1 -q:v 2 -map_metadata -1 $OUT/ours-vase.poster.jpg
echo "$OUT/ours-vase.mp4 $(ffprobe -v error -select_streams v -show_entries stream=width,height,duration -of csv=p=0 $OUT/ours-vase.mp4)"
