Transition: the same adjoint idea works in a participating medium, where $A = D^{-1}K$ and the parameters are a density grid.

Unbiased inverse volume rendering with differential trackers (Nimier-David et al., SIGGRAPH 2022):

- Left: a scattering volume reconstructed from images with known camera poses. With the usual free-flight sampling (delta tracking) the gradients with respect to density are biased and noisy, and the reconstruction breaks up (second image).
- With their differential ratio tracking, distances are sampled in proportion to transmittance instead; its gradients are unbiased, low in variance, and computed in linear time (first image).
- The caption under the figure is its legend, which is left out of the image: green frames are differential ratio tracking, blue frames delta tracking, and hatching marks biased gradients.
- Right: the mean and variance of the density gradient for one slice of the grid. Hatched regions are biased.
- Bottom right, the bar chart: the reconstruction error (lower is better) with each estimator's gradients (green: differential ratio tracking, blue: delta tracking) and two optimizers, Adam and SGDm (stochastic gradient descent with momentum). In the paper's words, "using aggressive step size reduction, the Adam optimizer limits the impact of large gradient outliers, though our unbiased gradients lead to the lowest reconstruction error with either optimizer." With SGDm the difference is large: the delta-tracking bar runs off the axis, to 0.675, against about 0.075 for differential ratio tracking (read from the chart).

The sentence to remember: differentiating a volume needs gradient estimators designed for it; gradients computed with the forward sampler are biased.

The same paper shows that an emissive (NeRF-style) volume bakes in its lighting, while the scattering volume can be relit (the figure on the baked-illumination slide).

Optional slide: skip it if the talk runs long.

Figure 1 of the paper.
