#!/usr/bin/env bash
# Media of the training-data slide: one video of five tabletop digital twins
# (top row) and five Infinigen rooms (bottom row), and its poster.
# Run from the presentation directory:  bash media/training-data.sh
#
# Tabletops: ground-truth trajectories (ccw90) of the dual-relay v2 training
# set: chef, lamp, bouquet, lavender, teapot. The user listed chef, lamp,
# orchid, fan, cookiebox, pitcher, lavender, teapot in that order, then
# (2026-11-19) "pick what looks nice" and "there is way too many of that ugly
# pitcher in all of the scenes. make the tabletop digital twins more diverse":
# every orchid, fan, and cookiebox variant shows the speckled jug or a wall
# sign, so the bouquet stands in for them. The clips considered are in
# assets/sources/training-data/tabletops/ (from the export
# dual_relay_v2_turn90_download/scenes/<scene>/ccw90/p95/ground_truth_rgb.mp4;
# its README is README-source.md there). Variants chosen so the named object
# comes into view, the speckled jug and the wall sign never show, and the
# props repeat as little as possible.
# Rooms: Infinigen scenes of the evaluation set (the generator of the training
# set) from the Dropbox figures folder (read-only), none of them a room shown
# in the results.
#
# Every clip is 256 px, 29 frames at 15 fps. One file holds all ten, so
# they stay in step: cells of 312 px (208 stage pixels at 1.5x), gaps of 24 px
# between columns and 126 px between the rows (16 and 84 stage pixels), black.
# The layout draws a panel over each row's gaps (panels `groups`). The loop
# plays forward, holds, and plays back.
set -euo pipefail
. "$(dirname "$0")/figures.sh"
V="$W/5_QualSimulation/assets/test100_paper_8020_cfg3/gt/videos"
T=assets/sources/training-data/tabletops
OUT=public/slides/training-data
ENC="-an -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -movflags +faststart -map_metadata -1"
LOOP="split=4[a][b][c][d];[b]trim=start_frame=28:end_frame=29,loop=loop=29:size=1:start=0,setpts=N/15/TB[hold];[c]reverse,trim=start_frame=1:end_frame=28,setpts=N/15/TB[rev];[d]trim=start_frame=0:end_frame=1,loop=loop=7:size=1:start=0,setpts=N/15/TB[first];[a][hold][rev][first]concat=n=4:v=1"
CELL=312 COLUMN_STEP=336 ROW_STEP=438
mkdir -p $OUT

tabletops=(chef__dual_relay_paperscene3__004 lamp__dual_relay_paperscene4__003 bouquet__dual_relay_paperscene4__003
  lavender__dual_relay_paperscene3__002 teapot__dual_relay_paperscene4__003)
rooms=(normal_normal_3000016 normal_normal_3000023 normal_normal_3000030 normal_normal_3000040 zone_full_zone_full_3000008)

inputs=() filter="" labels="" layout="" i=0
for scene in "${tabletops[@]}"; do inputs+=(-i "$T/${scene}__ccw90.mp4"); done
for room in "${rooms[@]}"; do inputs+=(-i "$V/test_${room}_obs_000_traj_ccw.mp4"); done
for i in $(seq 0 9); do
  filter+="[$i:v]fps=15,scale=$CELL:$CELL:flags=lanczos,setsar=1[v$i];"
  labels+="[v$i]"
  layout+="$(( (i % 5) * COLUMN_STEP ))_$(( (i / 5) * ROW_STEP ))|"
done
video=$OUT/tabletops-and-rooms.mp4
ffmpeg -v error -y "${inputs[@]}" -filter_complex "${filter}${labels}xstack=inputs=10:layout=${layout%|}:fill=black,$LOOP" -r 15 $ENC $video
ffmpeg -v error -y -i "$video" -frames:v 1 -q:v 2 -map_metadata -1 "${video%.mp4}.poster.jpg"
echo "$video $(ffprobe -v error -select_streams v -show_entries stream=width,height,duration -of csv=p=0 "$video")"
