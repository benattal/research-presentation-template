Transition: the first half of this section was new sensors; the second half is global illumination. With both kinds of field, the scene is reproduced under the light it was captured in. Changing the light is harder.

- Step 1: a NeRF's color $c$ at a point, toward a direction, is the radiance leaving that point toward the camera: the solution $x = (I - A)^{-1}e$ of the rendering equation $x = e + Ax$ (written with radiance, $L = L_e + AL$ with $A = SG$), for the real scene's $A$.
- Step 2: that solution is the sum of every bounce. A NeRF's color is only the sum, so the light, the materials, and the interreflections are all baked into one color.
- Step 3: relighting means solving again with a new light $e'$ and the same $A$. That needs $A$, the materials $S$ and the geometry $G$, separately from the light, and the whole series under the new light.

The figure (Nimier-David et al., SIGGRAPH 2022, Fig. 12): a plume of smoke reconstructed from images, under the original lighting (top) and relit (bottom). Left, an emissive volume, the NeRF-style model: it matches the original lighting, but relit it has the old illumination. Middle, a physically based scattering volume (the paper's method), which matches the reference (right) under the new light.

The sentence to remember: a NeRF's color is the sum $x$; relighting needs the light and $A$ separately.

Next: recovering $A$ requires rendering every bounce inside the optimization; radiance caching is a way to afford it.
