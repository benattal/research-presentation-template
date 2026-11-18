The color of the NeRF of the previous slide is the light leaving each surface in its training views: $x = (I - A)^{-1}e$, all bounces summed. In inverse rendering it can be used as a cache $\hat{x}$ of that light, with one physically based bounce over the cached light: $x \approx e + A\hat{x}$. The first bounce is computed exactly, every later bounce is taken from the cache, and no path is traced beyond one bounce.

This slide is an illustration of the idea in the flatland room, not a trained network. The four views are all on the right of the box. The cache is exact on every surface visible in one of them, and zero on the surfaces visible in none: the box's left face and the 3 m of floor beside it.

- **NeRF as cache, $\hat{x}$.** The four views and, dashed in green, the surfaces visible in none of them. A real NeRF has some value there too, just not the right one.
- **One bounce, $e + A\hat{x}$.** On the surfaces behind the box, with one bounce over the cache, most of the light is recovered: their error is 21 % instead of 100 %.
- **Solve, $x$.** The full solution, for comparison.
- **Bias.** The error of the estimate is $(e + A\hat{x}) - x = A(\hat{x} - x)$: one bounce of the cache's error. Here the cache is too dark behind the box, so the bias is a deficit of light; the render is that missing light, at four times the exposure. It is brightest by the box's left face, and it reaches the red wall and the ceiling: on the observed surfaces, the estimate is about 7 % too dark.

The table is the check: the cache's error is only on the unobserved surfaces; after one bounce it is smaller there and also present on every surface lit from them. It is a bias: it does not decrease with more samples of the bounce.

One sentence: with a radiance cache, every bounce after the first comes from the cache, at the cost of a bias $A(\hat{x} - x)$ wherever the cache is wrong.

Toward the next slide: Flash Cache uses a NeRF as this cache and estimates the bounce over it as a bounce over a fast cache plus a correction, $A\hat{x} = A\hat{x}_{\text{fast}} + A(\hat{x} - \hat{x}_{\text{fast}})$: a control variate. The paper shows this is "an unbiased estimator of the rendering equation (provided that incoming illumination from the NeRF cache is correct)" (Section C.1). So the fast cache adds noise but no bias, and the bias left is this slide's $A(\hat{x} - x)$, where the NeRF cache is wrong.

No mouse interaction.
