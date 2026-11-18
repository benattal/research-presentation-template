Transition: The rest of the section is about light that bounces. Every field so far reproduces the scene under the light it was captured in.

- Step 1: A NeRF's color is the light leaving a point toward the camera: the solution $x$ for the real scene, with its emission $e$ and its one bounce $A$. For this smoke, $A = D^{-1}K$. The top row is the original lighting.
- Step 2: That solution is the sum of every bounce. A NeRF stores only the sum, so light, materials, and interreflections are baked into one color.
- Step 3: Relighting means solving again with a new emission $e'$ and the same $A$, which needs $A$ separate from the light. Relit, the emissive volume, like a NeRF, keeps the old light; the scattering volume matches the reference.

Remember: a NeRF's color is the sum $x$; relighting needs the light and $A$ separately.

Stop (optional), at step 3: why not keep NeRF and fit $A$ as well? Answer: then the renderer inside the loop computes every bounce at every iteration, and differentiates through it. That is the cost the next slides address.

If asked:
- Source? Nimier-David et al., SIGGRAPH 2022, Fig. 12: a plume of smoke reconstructed from images.
