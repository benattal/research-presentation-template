Transition: an appendix slide, for a question about differentiating volumes with scattering. One bounce is then $A = D^{-1}K$, in-scattering $K$ then propagation along rays $D^{-1}$, and the parameters are a grid of densities. The adjoint method is the same; what changes is the gradient estimator.

- Step 1: Nimier-David et al., SIGGRAPH 2022. Left, a scattering volume reconstructed from photographs with their differential ratio tracking: unbiased, low-variance gradients. Next, the same reconstruction with the usual delta tracking: biased, noisy gradients, and the volume breaks into blobs. Right, the mean and variance of the density gradient on one slice, framed green and blue as the two estimators; hatched regions are biased. Below, the reconstruction error of each, with two optimizers; shorter is better.

Remember: differentiating a volume needs gradient estimators designed for it; gradients through the forward sampler are biased.

If asked:
- What is the difference between the two? Both sample distances along rays at random. Delta tracking is the forward renderer's free-flight sampling; differential ratio tracking samples distances in proportion to transmittance.
- Which optimizers? Adam, and stochastic gradient descent with momentum. With the second, delta tracking's error is about nine times that of differential ratio tracking, and its bar runs off the chart. Adam's step size reduction limits large gradient outliers, so the gap is smaller there, but the unbiased gradients still have the lower error.
- Does this relate to NeRF? The same paper shows that an emissive volume, as in NeRF, bakes in its lighting, while the scattering volume can be relit: the figure on the baked-illumination slide.
