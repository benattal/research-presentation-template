Transition: an appendix slide, for a question about what probing is used for.

- Step 1: Structured light triangulates projected stripes, assuming each camera pixel receives light directly from one projector pixel; indirect light breaks that assumption. Top row: a mannequin head beside a mirror. With conventional projection, the mirror adds a second set of fringes on the face, and the reconstruction fails. With indirect-invariant imaging, the probing matrix is all ones off the epipolar lines, so indirect light adds the same image to every pattern, like ambient light, and the same algorithm recovers the face. Bottom row: a bowl and an open book. The conventional scan is corrupted inside the bowl and between the pages; the indirect-invariant scan is clean.

Remember: with indirect-invariant probing, existing 3D scanning algorithms work unchanged in scenes with indirect light.

If asked:
- What does probing select here? On each epipolar line, where direct light arrives, the probing matrix applies the pattern, as conventional projection does. For every other pair of projector and camera pixels it is all ones, whatever the pattern. Indirect light, which mostly arrives off the epipolar lines, becomes a constant image, which the 3D algorithm handles as ambient light. The face is recovered even on its side seen in the mirror.
- Is the indirect light blocked? No. Blocking the paths off the epipolar lines is epipolar-only imaging, a different probing matrix, which gives direct light alone.
