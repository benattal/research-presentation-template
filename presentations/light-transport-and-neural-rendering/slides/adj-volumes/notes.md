Transition: the same adjoint idea works in a participating medium, where $A = D^{-1}K$ and the parameters are a density grid.

Unbiased inverse volume rendering with differential trackers (Nimier-David et al., SIGGRAPH 2022):

- Left: a scattering volume reconstructed from images with known camera poses. With the usual free-flight sampling (delta tracking) the gradients with respect to density are biased and noisy, and the reconstruction breaks up (second image).
- Their differential ratio tracking samples distances in proportion to transmittance instead, which gives unbiased, low-variance gradients in linear time (first image).
- Right: the mean and variance of the density gradient for one slice of the grid. Hatched regions are biased.

The sentence to remember: differentiating a volume needs gradient estimators designed for it; reusing the forward sampler gives biased gradients.

The same paper shows that an emissive (NeRF-style) volume bakes in its lighting, while the scattering volume can be relit (the figure on the baked-illumination slide).

Optional slide: skip it if the talk runs long.

Figure 1 of the paper.
