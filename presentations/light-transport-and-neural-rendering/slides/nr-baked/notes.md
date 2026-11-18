Transition: the slides so far were about new sensors. The rest of the section is about light that bounces. Every field so far reproduces the scene under the light it was captured in. Changing the light is harder.

- Step 1: a NeRF's color $c$ at a point, toward a direction, is the radiance leaving that point toward the camera. That is the solution of the rendering equation of the surfaces section, $x = e + Ax$, with the real scene's emission $e$ and one bounce $A = SG$ (scattering $S$ after propagation $G$): $x = (I - A)^{-1}e$.
- Step 2: that solution is the sum of every bounce. A NeRF stores only the sum, so the light, the materials, and the interreflections are baked into one color.
- Step 3: relighting means solving again with a new emission $e'$ and the same $A$. That needs $A$ itself, the materials and the geometry, separately from the light, and the whole series under the new light.

The figure (Nimier-David et al., SIGGRAPH 2022, Fig. 12): a plume of smoke reconstructed from images, under the original lighting (top) and relit (bottom). Left, an emissive volume, the NeRF-style model: it matches the original lighting, but relit it keeps the old illumination. Middle, a physically based scattering volume, the paper's method, which matches the reference (right) under the new light.

The sentence to remember: a NeRF's color is the sum $x$; relighting needs the light and $A$ separately.

The question it invites: why not keep NeRF and just fit $A$ as well? Because then the renderer inside the loop has to compute every bounce, $x = (I - A)^{-1}e$, at every iteration, and differentiate through it. That is the cost the next slides address.

Next: radiance caching, one way to afford those bounces.
