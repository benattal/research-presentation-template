An aside before volumes: the same operators, in a lab instead of a renderer.

So far the light came from the scene's own emission, and its images were computed. In computational imaging the light source is a controlled projector and the sensor is a real camera, and light transport between them is a matrix $\mathbf{T}$ from projector pixels to camera pixels. Parts of $\mathbf{T}$ are measured, products with it are computed optically, and its direct and indirect parts are separated. The photo is from O'Toole et al. (SIGGRAPH 2012): a scene photographed with coded projector patterns and camera masks, the probing of the aside's last slides.

These slides are mostly results; the main thread continues with volume rendering.

The question this slide invites: why are a projector and a camera described by the same operators as a renderer? Light adds, whatever the scene, so the camera image is a linear function of the projector pattern: a matrix, from projector pixels to camera pixels. The next slides build that matrix from the series of the operator section.

To remember: with a projector and a camera, light transport is a matrix that can be measured and computed with.
