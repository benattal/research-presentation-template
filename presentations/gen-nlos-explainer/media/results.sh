#!/usr/bin/env bash
# Media of the results slides (line-of-sight, captured-comparison, room-scale),
# from the Dropbox figures folder (read-only). Every comparison is ordered
# reference or ground truth, ours, GEN3C*, HOLI-1-to-3*, Lyra 2. Run from the presentation directory:
#   bash media/results.sh
# Trajectories are 29 frames at 15 fps: played forward, held 2 s on the last view,
# played back, held 0.5 s on the input view (a 6.27 s loop). Each grid is one file,
# so its clips stay in step; cells and gaps are 1.5x the stage geometry in the
# slide's content.json.
set -euo pipefail
. "$(dirname "$0")/figures.sh"
Q="$W/6_QualExperimental/scenes"
H="$W/holi_1_to_3_trajectories"
R="$W/5_QualSimulation/assets/test100_paper_8020_cfg3"
A="$W/website/assets"
OUT=public/slides
ENC="-an -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -movflags +faststart -map_metadata -1"
LOOP="split=4[a][b][c][d];[b]trim=start_frame=28:end_frame=29,loop=loop=29:size=1:start=0,setpts=N/15/TB[hold];[c]reverse,trim=start_frame=1:end_frame=28,setpts=N/15/TB[rev];[d]trim=start_frame=0:end_frame=1,loop=loop=7:size=1:start=0,setpts=N/15/TB[first];[a][hold][rev][first]concat=n=4:v=1"

# grid <cell> <column gap> <row gap> <columns> <output> <clips, row by row>
grid() {
  local cell=$1 cgap=$2 rgap=$3 cols=$4 out=$5; shift 5
  local inputs=() filter="" layout="" labels="" i=0
  for clip in "$@"; do
    inputs+=(-i "$clip")
    filter+="[$i:v]fps=15,scale=$cell:$cell:flags=lanczos,setsar=1[v$i];"
    labels+="[v$i]"
    layout+="$(( (i % cols) * (cell + cgap) ))_$(( (i / cols) * (cell + rgap) ))|"
    i=$((i + 1))
  done
  ffmpeg -v error -y "${inputs[@]}" -filter_complex "${filter}${labels}xstack=inputs=$i:layout=${layout%|}:fill=black,pad=ceil(iw/2)*2:ceil(ih/2)*2,$LOOP" -r 15 $ENC "$out"
  echo "$out $(ffprobe -v error -select_streams v -show_entries stream=width,height,duration -of csv=p=0 "$out")"
}

mkdir -p $OUT/line-of-sight $OUT/captured-comparison $OUT/room-scale

# line-of-sight: cells 240 (360 px), row gap 40 (60 px)
ffmpeg -v error -y -i "$A/lamp.png" -vf "scale=360:360:flags=lanczos" -map_metadata -1 $OUT/line-of-sight/input-view.png
for object in lamp globe; do
  ffmpeg -v error -y -i "$A/$object-ref-square.webp" -vf "scale=360:360:flags=lanczos" -map_metadata -1 $OUT/line-of-sight/$object-reference.png
done
# The direct-light and indirect-light videos are written by light-split.py.

# captured-comparison: cells 224 (336 px), column gap 36 (54 px), row gap 40 (60 px)
# Ours on the lamp scene is the generation the user supplied on 2026-11-19
# (assets/sources/captured-comparison/ours-lamp-20261119.mp4, flipped horizontally
# to the trajectory's orientation), not the Dropbox prediction.
OURS_LAMP=assets/sources/captured-comparison/ours-lamp-20261119-flipped.mp4
for object in lamp globe; do
  ffmpeg -v error -y -i "$A/$object-ref-square.webp" -vf "scale=336:336:flags=lanczos" -map_metadata -1 $OUT/captured-comparison/$object-reference.png
done
grid 336 54 60 3 $OUT/captured-comparison/ours-gen3c-holi.mp4 \
  "$OURS_LAMP" "$Q/paperscene5/rgb_only/video.mp4" "$H/captured_lamp_holi123.mp4" \
  "$Q/paperscene6/prediction/video.mp4" "$Q/paperscene6/rgb_only/video.mp4" "$H/captured_globe_holi123.mp4"

# room-scale: cells 208 (312 px), column gap 28 (42 px), row gap 40 (60 px)
ROOM1=test_normal_normal_3000037_obs_000_traj_ccw
ROOM2=test_zone_full_zone_full_3000023_obs_000_traj_ccw
grid 312 42 60 5 $OUT/room-scale/gt-ours-gen3c-holi-lyra2.mp4 \
  "$R/gt/videos/$ROOM1.mp4" "$R/ours/videos/$ROOM1.mp4" "$R/gen3c/videos/$ROOM1.mp4" "$H/room_normal_3000037_holi123.mp4" "$R/lyra2/videos/$ROOM1.mp4" \
  "$R/gt/videos/$ROOM2.mp4" "$R/ours/videos/$ROOM2.mp4" "$R/gen3c/videos/$ROOM2.mp4" "$H/room_zone_full_3000023_holi123.mp4" "$R/lyra2/videos/$ROOM2.mp4"

# A poster for every video written above: its first frame, shown until the video has a frame.
for video in $(grep -o '\$OUT/[a-z-]*/[a-z0-9-]*\.mp4' "$0" | sort -u | sed "s#\$OUT#$OUT#"); do
  [ -f "$video" ] && ffmpeg -v error -y -i "$video" -frames:v 1 -q:v 2 -map_metadata -1 "${video%.mp4}.poster.jpg"
done
