The color of the NeRF of the previous slide is the light leaving each surface in its training views: $x = (I - A)^{-1}e$, all bounces summed. In inverse rendering it can be used as a cache $\hat{x}$ of that light, with one physically based bounce over the cached light: $x \approx e + A\hat{x}$. The first bounce is computed exactly, every later bounce is taken from the cache, and no path is traced beyond one bounce.

This slide is an illustration of the idea in the flatland room, not a trained network. The cache is exact on every surface visible in one of the five views, and zero on the surfaces visible in none: the box's left face and the floor beside it.

- **NeRF as cache, $\hat{x}$.** The five views and, dashed in green, the surfaces visible in none of them. A real NeRF has some value there too, just not the right one.
- **One bounce, $e + A\hat{x}$.** On the surfaces behind the box, one bounce over the cache restores most of the light: their error is 16 % instead of 100 %.
- **Solve, $x$.** The full solution, for comparison.
- **Bias.** The error of the estimate is $(e + A\hat{x}) - x = A(\hat{x} - x)$: one bounce of the cache's error. Here the cache is too dark behind the box, so the bias is a deficit of light; the render is that missing light, at four times the exposure. It is on the far ceiling, the floor beside the box, and the box's corner: observed surfaces, now about 3 % too dark.

The table is the check: the cache's error is only on the unobserved surfaces; after one bounce it is smaller there and also present on every surface they light. It is a bias: it does not decrease with more samples of the bounce.

One sentence: with a radiance cache, every bounce after the first comes from the cache, at the price of a bias $A(\hat{x} - x)$ wherever the cache is wrong.

Toward the next slide: in Flash Cache the bounce is written over a fast cache $\hat{x}_{\text{fast}}$ plus a correction, $A\hat{x}_{\text{fast}} + A(\hat{x} - \hat{x}_{\text{fast}})$, a control variate for reducing this bias.

No mouse interaction.
