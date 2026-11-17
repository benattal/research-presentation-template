Transition: both kinds of field reproduce the scene under the light it was captured in. Changing the light is harder.

- Step 1: a NeRF's color $c$ at a point, toward a direction, is the radiance leaving that point toward the camera: the solution $x = (I - A)^{-1}e$ of the rendering equation $x = e + Ax$ (written with radiance, $L = L_e + AL$ with $A = SG$).
- Step 2: that solution is the sum of every bounce. A NeRF stores only the sum, so the light, the materials, and the interreflections are all baked into one color.
- Step 3: relighting means solving again with a new light $e'$. That needs the materials $S$ (and the geometry, in $G$) separately, and the whole series under the new light.

The figure (Nimier-David et al., SIGGRAPH 2022): a plume of smoke reconstructed from images. Column (b) is an emissive volume, the NeRF-style model, which matches the original lighting but keeps the old illumination when relit. Column (c) is a physically based scattering volume, which matches the reference (d) under the new light.

The sentence to remember: a NeRF stores the sum $x$; relighting needs the light, the materials $S$, and the geometry $G$ separately.

Next: recovering them requires rendering every bounce inside the optimization; radiance caching is a way to afford it.
