Appendix slide, for a question about differentiating volumes with scattering. It follows the volume rendering gradient slide, which had no scattering.

The same adjoint idea works in a participating medium, where one bounce is $A = D^{-1}K$ (in-scattering $K$, then propagation along rays $D^{-1}$) and the parameters are a grid of densities. What changes is how the gradient is estimated when distances along rays are sampled at random.

Unbiased inverse volume rendering with differential trackers (Nimier-David et al., SIGGRAPH 2022):

- Left: a scattering volume reconstructed from images with known camera poses. With the usual free-flight sampling (delta tracking), the gradients with respect to density are biased and noisy, and the reconstruction breaks up (second image).
- With their differential ratio tracking, distances are sampled in proportion to transmittance instead; its gradients are unbiased, low in variance, and computed in linear time (first image).
- The caption under the figure is its legend, which the image leaves out: green frames are differential ratio tracking, blue frames delta tracking, and hatching marks biased gradients.
- Right: the mean and variance of the density gradient for one slice of the grid. Hatched regions are biased.
- Bottom right, the bar chart: the reconstruction error (lower is better) with each estimator's gradients and two optimizers, Adam and SGDm (stochastic gradient descent with momentum). In the paper's words, "using aggressive step size reduction, the Adam optimizer limits the impact of large gradient outliers, though our unbiased gradients lead to the lowest reconstruction error with either optimizer." With SGDm, delta tracking's bar runs off the axis, at about nine times the error of differential ratio tracking.

The sentence to remember: differentiating a volume needs gradient estimators designed for it; gradients computed with the forward sampler are biased.

The same paper shows that an emissive volume, as in NeRF, bakes in its lighting, while the scattering volume can be relit (the figure on the baked-illumination slide).
