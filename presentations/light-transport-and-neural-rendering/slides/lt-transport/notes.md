Transition: so far the light came from the scene's own emission $e$. Now we control the light with a projector and measure it with a camera.

A projector lights the scene with a pattern $p$ (one value per projector pixel), and a camera records an image $c$ (one value per camera pixel). Every path of light from a projector pixel to a camera pixel contributes to $c$. The figure is after Nayar et al. (SIGGRAPH 2006, Fig. 2): one scene point, and the kinds of path that bring projector light to it.

- Click 1, **direct**: projector to the point, one reflection, to the camera.
- Click 2, **interreflection**: the light reflects off the wall first, then off the point.
- Click 3, **subsurface**: the light enters the translucent floor beside the point, scatters inside it, and leaves at the point.
- Click 4, **volumetric**: the light scatters in a medium (fog, smoke) on its way to the point.

The last three are global (indirect) light. One camera pixel measures the sum of all of them. Light adds linearly, so the image is a linear function of the pattern: $c = \mathbf{T}p$, with $\mathbf{T}$ the light transport matrix. Bold $\mathbf{T}$, so that plain $T$ stays free for transmittance later.

To remember: light transport is the linear map from the light sources (projector pixels) to the measurements (camera pixels). The rest of this part is about that map: what its columns and rows are, and what we can compute with it optically.
