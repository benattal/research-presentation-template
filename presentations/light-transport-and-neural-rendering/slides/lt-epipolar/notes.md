Probing with a mask per pixel needs a coaxial setup and many patterns per photo. With the epipolar constraint, probing is fast enough for video, with an ordinary projector and camera side by side.

- **The mechanism** (Gkioulekas, CMU 15-463, after O'Toole). For a projector and a camera side by side, a direct path from a projector row always arrives on one matching row of the camera, its epipolar line (left). Indirect paths, scattered by the bunny or reflected by the mirror, almost never do (right). With a scanning projector and a rolling-shutter camera, only the camera row matching the projector's current line is exposed, so only direct light is recorded; with an offset between the two, only indirect light is. In the terms of the last slide, $\Pi$ keeps the entries of $\mathbf{T}$ on matching epipolar lines.
- **Click: Episcan3D** (O'Toole et al., SIGGRAPH 2015), in place of the diagrams: live video, single-bounce light on the left, multiple-bounce light on the right. First a hand holding a wax bowl: most of the light scatters below the wax surface, so the bowl is dark in the single-bounce video and bright in the multiple-bounce video. Then a mirror ball: its reflections on the walls appear only in the multiple-bounce video.

The question this slide invites: why do indirect paths almost never arrive on the matching row? A projector row and the two centers of projection span one plane, the epipolar plane, and a direct path stays in it: the projector ray, the scene point, and the camera ray all lie in that plane. An indirect path is recorded on the matching row only if the last point it reflects from before the camera is also in that plane, which happens only for a small part of the indirect light.

If asked: the same epipolar idea also works with time-of-flight cameras outdoors (Achar et al., SIGGRAPH 2017); time of flight comes later in the lecture.

To remember: probing runs at video rate with a scanning projector and a rolling-shutter camera.

End of the aside: pause for questions on light transport matrices and probing before volume rendering.
