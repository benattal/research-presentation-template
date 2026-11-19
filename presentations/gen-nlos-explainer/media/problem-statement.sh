#!/usr/bin/env bash
# Media of the problem-statement slides (single-image, light-video, novel-views),
# from the Dropbox figures folder (read-only). Run from the presentation directory:
#   bash media/problem-statement.sh
# Trajectories are 29 frames at 15 fps: played forward, held 3 s on the last
# view, played back, held on the input view (a 7.27 s loop). Encoded at 1.5x the stage size.
set -euo pipefail
. "$(dirname "$0")/figures.sh"
T="$W/1_teaser/teaser_scene/scenes/teaser"
OUT=public/slides
ENC="-an -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -movflags +faststart -map_metadata -1"
# forward (29) + hold on the last view (45) + back without the end frames (27) + hold on the first (8)
LOOP="split=4[a][b][c][d];[b]trim=start_frame=28:end_frame=29,loop=loop=44:size=1:start=0,setpts=N/15/TB[hold];[c]reverse,trim=start_frame=1:end_frame=28,setpts=N/15/TB[rev];[d]trim=start_frame=0:end_frame=1,loop=loop=7:size=1:start=0,setpts=N/15/TB[first];[a][hold][rev][first]concat=n=4:v=1"

mkdir -p $OUT/single-image $OUT/light-video $OUT/novel-views

ffmpeg -v error -y -i "$W/website/assets/vase.png" -vf "scale=540:540:flags=lanczos" -map_metadata -1 $OUT/single-image/input-view.png
ffmpeg -v error -y -i "$W/1_teaser/teaser12_assets/reference_smartphone_crop.png" -vf "scale=540:540:flags=lanczos" -map_metadata -1 $OUT/single-image/reference-photo.png
cp $OUT/single-image/reference-photo.png $OUT/novel-views/reference-photo.png

ffmpeg -v error -y -i "$T/rgb_only/video.mp4" -filter_complex "[0:v]scale=540:540:flags=lanczos,$LOOP" -r 15 $ENC $OUT/single-image/image-only.mp4

# One file for the pair (ours first), so the two trajectories stay in step: 360 + 44 + 360 stage pixels wide.
ffmpeg -v error -y -i "$T/prediction/video.mp4" -i "$T/rgb_only/video.mp4" -filter_complex \
  "[0:v]scale=540:540:flags=lanczos,pad=606:540:0:0:black[l];[1:v]scale=540:540:flags=lanczos[r];[l][r]hstack=2,$LOOP" \
  -r 15 $ENC $OUT/novel-views/with-and-without-propagating-light.mp4

# The light video: frame k is time bin 320 + k at 16 ps (5.12 ns + 16 ps per frame).
ffmpeg -v error -y -i "$W/website/assets/teaser-light-clean.mp4" -vf "scale=660:660:flags=lanczos" -r 48 $ENC $OUT/light-video/propagating-light.mp4
ffmpeg -v error -y -i "$W/website/assets/teaser-light-clean.mp4" -vf "select='eq(n,54)',scale=372:372:flags=lanczos" -frames:v 1 -map_metadata -1 $OUT/light-video/direct-5.98ns.png
ffmpeg -v error -y -i "$W/website/assets/teaser-light-clean.mp4" -vf "select='eq(n,371)',scale=372:372:flags=lanczos" -frames:v 1 -map_metadata -1 $OUT/light-video/indirect-11.06ns.png

for f in $OUT/single-image/image-only.mp4 $OUT/novel-views/with-and-without-propagating-light.mp4 $OUT/light-video/propagating-light.mp4; do
  echo "$f $(ffprobe -v error -select_streams v -show_entries stream=width,height,nb_frames,duration -of csv=p=0 "$f")"
done

# A poster for every video written above: its first frame, shown until the video has a frame.
for video in $(grep -o '\$OUT/[a-z-]*/[a-z0-9-]*\.mp4' "$0" | sort -u | sed "s#\$OUT#$OUT#"); do
  [ -f "$video" ] && ffmpeg -v error -y -i "$video" -frames:v 1 -q:v 2 -map_metadata -1 "${video%.mp4}.poster.jpg"
done
