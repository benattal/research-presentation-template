Transition: the NeRF of the last slide stores the light leaving each surface in its training views, $x = (I - A)^{-1}e$, every bounce summed. In inverse rendering it can serve as a cache $\hat{x}$ of that light, with one physically based bounce computed over it: $x \approx e + A\hat{x}$. The first bounce is computed with the materials being recovered, every later bounce is read from the cache, and no path is traced beyond one bounce.

This slide is an illustration of the idea in the flatland room, not a trained network. The four views are all on the right of the box. The cache is exact on every surface visible in one of them, and zero on the surfaces visible in none: the box's left face and the 3 m of floor beside it.

- Step 1, NeRF as cache, $\hat{x}$: the four views and, dashed in green, the surfaces visible in none of them. A real NeRF has some value there too, just not the right one.
- Step 2, one bounce, $e + A\hat{x}$: on the surfaces behind the box, one bounce over the cache recovers most of the light. Their error is 21% instead of 100%.
- Step 3, solve, $x$: the full solution, for comparison.
- Step 4, bias: the error of the estimate is $(e + A\hat{x}) - x = A(\hat{x} - x)$, one bounce of the cache's error. Here the cache is too dark behind the box, so the bias is missing light; the render shows that missing light, at four times the exposure. It is brightest by the box's left face, and it reaches the red wall and the ceiling: on the observed surfaces, the estimate is about 7% too dark.

The thumbnails show the point: the cache's error is only on the unobserved surfaces; after one bounce it is smaller there, and also present on every surface lit from them.

Question to the class: does this error shrink if we trace more rays for the bounce? No. It is a bias, $A(\hat{x} - x)$: more samples of the bounce converge to $e + A\hat{x}$, not to $x$. Only a better cache removes it.

The sentence to remember: with a radiance cache, every bounce after the first comes from the cache, at the cost of a bias $A(\hat{x} - x)$ wherever the cache is wrong.

Next: Flash Cache, which uses a NeRF as this cache and keeps the bounce over it affordable without adding any other bias.

No mouse interaction.
