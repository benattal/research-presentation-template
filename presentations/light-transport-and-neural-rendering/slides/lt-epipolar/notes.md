Transition: A mask per pixel needs a beam splitter and many patterns per photo. Epipolar geometry makes probing fast enough for video, with a projector and a camera side by side.

- Step 1: A direct path from one projector row always arrives on one matching camera row, its epipolar line (left). Indirect paths, off the bunny or the mirror, almost never do (right). So a scanning projector and a rolling-shutter camera that exposes only the matching row record mostly direct light; with an offset between the two, mostly indirect. In probing terms, $\Pi$ keeps the entries of $\mathbf{T}$ on matching rows.
- Step 2: Episcan3D (O'Toole et al., 2015), live: direct on the left, indirect on the right. A wax bowl in a hand is dark in the direct video and bright in the indirect one, since light scatters under the wax. A mirror ball's reflections on the walls appear only in the indirect video.

Remember: probing runs at video rate with a scanning projector and a rolling-shutter camera.

Stop (optional): why do indirect paths almost never arrive on the matching row? Answer: a direct path stays in the plane of its projector row and the two centers of projection. An indirect path arrives on the matching row only if its last reflection is in that plane too, which is rare.

Pause for questions: after step 2, on light transport matrices and probing, before volume rendering.

If asked:
- Does this work for time of flight? Yes: epipolar time-of-flight imaging works outdoors in sunlight (Achar et al., 2017).
