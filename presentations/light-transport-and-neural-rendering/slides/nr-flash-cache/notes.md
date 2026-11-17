Transition: a radiance cache is a network that returns the light arriving at a point from a direction, in place of tracing a recursive path. Earlier caches made approximations to be cheap enough, and those approximations bias the rendering and its gradients.

Flash Cache (Attal et al., ECCV 2024) keeps a high-quality NeRF as the cache and makes it affordable with two variance-reduction techniques from Monte Carlo rendering:

- Importance sampling (middle of the figure): a mixture of von Mises–Fisher lobes per point, trained to match the cache's incident light. It is occlusion-aware: a light source hidden from a point gets no lobe there.
- A control variate (right): a fast cache, trained to match the NeRF cache, gives a cheap, low-noise, biased estimate from many rays; a few rays through the expensive NeRF cache estimate the remaining difference. The sum is unbiased with respect to the NeRF cache. In the notation of the last slide, $A\hat x = A\hat x_{\text{fast}} + A(\hat x - \hat x_{\text{fast}})$: the first term is estimated with many rays (the paper's $M'$), the second with few ($M \ll M'$), and the expected value is $A\hat x$ (the paper's Eq. 9 and its proof in Section C.1).

The video: the light arriving at one point of the hotdog scene, from the NeRF cache (left) and from the fast cache (right). The fast cache is close but blurrier; the NeRF-cache term accounts for the difference.

The sentence to remember: with a control variate, a cheap cache and an accurate cache together give a low-noise estimate without the cheap cache's bias.

With this, geometry, materials, and lighting are recovered with all bounces in the rendering model, and the result can be relit.

Figure 2 and the video from the project page.
