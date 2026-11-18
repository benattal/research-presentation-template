Transition: A NeRF stores the light leaving each surface, every bounce summed. In inverse rendering it can serve as a cache $\hat{x}$ of that light, with one physically based bounce over it: $x \approx e + A\hat{x}$.

- Step 1: An illustration in the flatland room. The four views are all right of the box, so the cache is exact on what they see and zero elsewhere, dashed in green.
- Step 2: One bounce over the cache recovers most of the light behind the box.
- Step 3: The full solve $x$, for comparison.
- Step 4: The estimate's error is one bounce of the cache's error, $A(\hat{x} - x)$. Here the cache is too dark, so the estimate misses the light $A(x - \hat{x})$, shown brighter. It also reaches the red wall and the ceiling.

Remember: with a radiance cache, every bounce after the first comes from the cache, with a bias $A(\hat{x} - x)$ wherever the cache is wrong.

Stop (planned), at step 4: does this error shrink if we trace more rays for the bounce? Answer: no. It is a bias: more samples of the bounce converge to $e + A\hat{x}$, not to $x$. Only a better cache removes it.

If asked:
- Which bounce uses the materials? The first one, computed with the materials being recovered; every later bounce is read from the cache.
- Is the cache a trained network? No, an illustration: exact where observed, zero elsewhere.
- How large are the errors? Behind the box, 100% for the cache and 21% after one bounce; on the observed surfaces, about 7% too dark. The missing light is shown at four times the exposure.
