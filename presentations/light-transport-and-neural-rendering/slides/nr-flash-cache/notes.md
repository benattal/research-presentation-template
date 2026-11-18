Transition: A real radiance cache is a network queried for the light arriving at a point. Earlier caches add bias on top of the cache's own $A(\hat{x} - x)$: some evaluate the NeRF at one point per camera ray, and some use a small network for the incoming light.

- Step 1: In Flash Cache, we keep a high-quality NeRF as the cache and make the bounce affordable without adding bias. Left to right: a few samples per ray, drawn by the quadrature weights. Importance sampling of the incident light. And a control variate: a fast cache on many rays, plus a few rays through the NeRF for the difference, the identity under the figure. The video compares the two caches at one point.

Remember: with a fast cache as a control variate, many cheap rays and a few expensive ones give an estimate whose expected value is that of the NeRF cache.

Stop (optional): the fast cache is wrong. Why does its error not bias the result? Answer: it appears twice, with opposite signs. It adds noise, but the only bias left is the NeRF cache's own, $A(\hat{x} - x)$.

If asked:
- Which bias does Flash Cache reduce? The bias earlier caches add on top of $A(\hat{x} - x)$: from a NeRF evaluated at one point per ray, and from a low-capacity cache of the incoming light. Both also bias the gradients.
- How are the samples chosen? Along each ray, in proportion to the quadrature weights, so only those samples are shaded. For the incident light, from lobes trained to match the cache.
- What does it cost? $M$ evaluations of the NeRF cache and $M + M'$ of the fast cache, for about the quality of $M'$ rays through the NeRF cache.
- What does it recover? Geometry, materials, and lighting, with every bounce in the rendering model, so the result can be relit.
- Source? Attal et al., ECCV 2024: Fig. 2 and the project video.
