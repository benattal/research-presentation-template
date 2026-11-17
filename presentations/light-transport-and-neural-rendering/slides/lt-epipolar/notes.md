A probing matrix fast enough for video: the epipolar constraint.

- Click 1, the mechanism (Gkioulekas, CMU 15-463, after O'Toole). For a projector and a camera side by side, a direct path from a projector row always arrives on one matching row of the camera, its epipolar line (left). Indirect paths, scattered by the bunny or reflected by the mirror, almost never do (right). With a scanning projector and a rolling-shutter camera, only the camera row matching the projector's current line is exposed, so only direct light is recorded; with an offset between the two, only indirect light is.
- Click 2, Episcan3D (O'Toole et al., SIGGRAPH 2015), in place of the diagrams: live video, single-bounce light on the left, multiple-bounce light on the right. First a hand holding a wax bowl: most of the light scatters below the wax surface, so the bowl is dark in the single-bounce video and bright in the multiple-bounce video. Then a mirror ball: its reflections on the walls appear only in the multiple-bounce video.

To remember: probing is practical at video rate, not only in a laboratory.

The same epipolar idea also works with time-of-flight cameras outdoors (Achar et al., SIGGRAPH 2017); that needs time of flight, which comes later in the lecture.
