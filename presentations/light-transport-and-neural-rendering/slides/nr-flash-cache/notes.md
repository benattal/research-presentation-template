Transition: a radiance cache is a network whose output is the light arriving at a point from a direction, in place of tracing a recursive path. Earlier radiance-cache methods, in the paper's words, "rely on approximations that introduce bias into the renderings and, more importantly, into the gradients used for optimization": a NeRF rendered at "only a single evaluation along each camera ray" gives a biased estimate of the volume rendering integral, and a low-capacity cache of the incoming light a biased estimate of the reflection integral.

Flash Cache (Attal et al., ECCV 2024) "avoids these approximations while remaining computationally efficient". The cache is a high-quality NeRF, and the rendering is made affordable with variance reduction for unbiased estimators, from left to right in the figure:

- Volume rendering with a few samples per ray, drawn in proportion to the quadrature weights (Eq. 11): "its expected value equals the quadrature value", and only those samples need physically based shading.
- Importance sampling: a mixture of von Mises–Fisher lobes per point, trained to match the NeRF cache's incident light. It is occlusion-aware: "if a light source is occluded from the perspective of one surface point, then the model can 'turn off' the lobe for that light source."
- A control variate: a fast cache, supervised "to match the incoming radiance of the expensive, NeRF-based cache", is evaluated on many rays ($M'$), and a few more rays ($M \ll M'$) estimate the difference between the NeRF cache and the fast cache; the two estimates are added (Eq. 9). In the notation of the last slide, $A\hat x = A\hat x_{\text{fast}} + A(\hat x - \hat x_{\text{fast}})$. The sum is "an unbiased estimator of the rendering equation (provided that incoming illumination from the NeRF cache is correct)" (Section C.1): the fast cache's errors add noise, not bias, and the only bias left is the NeRF cache's own, $A(\hat x - x)$. It costs $M$ evaluations of the NeRF cache and $M + M'$ of the fast cache, for "the quality of using $M'$ incoming rays from the accurate NeRF-based cache".

The video: the light arriving at one point of the hotdog scene, from the NeRF cache (left) and from the fast cache (right). The fast cache is close but blurrier; the difference is the correction term, estimated with the few rays through the NeRF cache.

The sentence to remember: with the fast cache as a control variate, many cheap rays and a few expensive ones give an estimate whose expected value is that of the NeRF cache.

With this, geometry, materials, and lighting are recovered with all bounces in the rendering model, and the result can be relit.

Figure 2 and the video from the project page.
