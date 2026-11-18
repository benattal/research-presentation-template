Appendix slide, for a question about what probing is used for. It follows the probing and epipolar slides of the aside.

Structured light (projecting stripes and triangulating where they land) is built on the assumption that the light at each camera pixel comes directly from one projector pixel. Indirect light breaks that assumption.

- Row 1: a mannequin head beside a mirror. With conventional projection, the stripes reflected by the mirror appear on the face as a second set of fringes, and the 3D reconstruction fails. With probing, the same patterns are projected but the indirect paths are blocked, as on the epipolar slide, and the face is recovered by the same algorithm, even its side reflected in the mirror.
- Row 2: a bowl and an open book, with strong diffuse and specular interreflections. The conventional scan is corrupted inside the bowl and between the pages; the probed scan is clean.

The sentence to remember: with probing, existing 3D scanning algorithms work unchanged in scenes with indirect light.

The question it invites: what does probing select here? The entries of $\mathbf{T}$ that connect a projector pixel to the camera pixels on its epipolar line, where direct light arrives; the other entries, mostly indirect light, are blocked.
