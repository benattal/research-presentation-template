So far the light came from the scene's own emission $e$. Now a projector lights the scene with a chosen pattern, and a camera takes the image.

- **The setup.** The pattern $p$ has one value per projector pixel, and the image $c$ one value per camera pixel. Light adds: the image under the sum of two patterns is the sum of their images. So the image is a linear function of the pattern, $c = \mathbf{T}p$, with $\mathbf{T}$ the light transport matrix. Bold $\mathbf{T}$, so that plain $T$ stays free for transmittance later.
- **Direct.** Each kind of path from the projector to one scene point and on to the camera is a term of the previous section's series. The emission is a linear function of the pattern, $e = Ep$, and the image a linear function of the radiance, $c = Cx$; with $x = (I - A)^{-1}e$, the map is $\mathbf{T} = C(I + A + A^2 + \cdots)E$ (the next slide derives it). A direct path reflects once, at the point: the $A$ term, in the bounce-1 color. The $I$ term is light from the projector straight into the camera, which this setup does not have.
- **Interreflection.** The light reflects off the wall first, then off the point: two reflections, the $A^2$ term.
- **Volumetric.** The light scatters once in a medium (fog, smoke) on its way to the point: also two scatterings, so also $A^2$, with $A$ including scattering in the medium (the volume rendering section). It is drawn in the same color as the interreflection.
- **Subsurface.** The light enters the translucent floor beside the point, scatters many times inside it, and leaves at the point: the higher terms, $A^3$ and beyond.

The value of one camera pixel is the sum over all of these paths. The figure is after Nayar et al. (SIGGRAPH 2006, Fig. 2): one scene point, and the kinds of path that bring projector light to it. The direct path is the direct component; the others together are the global (indirect) component. The two are separated optically on the probing slide.

The question this slide invites: is a real image linear in the pattern? Light is, by superposition. A real camera and projector are linear once their responses are calibrated (raw images, no saturation), which is how these measurements are made.

To remember: light transport is the linear map from the light sources (projector pixels) to the measurements (camera pixels), and each term of $C(I + A + A^2 + \cdots)E$ is a set of light paths. The rest of the aside is about that map: its columns and rows, and what can be computed with it optically.
