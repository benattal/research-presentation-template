Transition: the last slide was the adjoint idea on one ray of a volume. Radiative backpropagation applies it to a whole renderer, with every pixel at once. In the room, $q$ was one pixel. A loss $\ell$ depends on every pixel $m_k = \langle q_k, x \rangle$, and the source of the adjoint solve is the gradient of the loss with respect to the pixels.

The line at the top is why one adjoint solve is enough for the whole loss, not one per pixel. The chain rule gives $\partial_\theta \ell = \sum_k \frac{\partial \ell}{\partial m_k}\, \partial_\theta m_k = \sum_k \frac{\partial \ell}{\partial m_k}\, \langle y_k, (\partial_\theta A)\, x \rangle$, with $y_k = (I - A^\top)^{-1} q_k$ the importance of pixel $k$. Since $y_k$ is linear in $q_k$, the weighted sum of the $y_k$ is one solve with the weighted sum of the sources: $y = (I - A^\top)^{-1} \sum_k \frac{\partial \ell}{\partial m_k}\, q_k$, and $\partial_\theta \ell = \langle y, (\partial_\theta A)\, x \rangle$. So a million pixels cost one adjoint solve, as a million parameters cost one inner product each.

The figure's letters differ from ours: its scene parameters $\mathbf{x}$ are our $\theta$, its image $\mathbf{y}$ is our vector of pixels $m$, its objective $g(\mathbf{y})$ is our loss $\ell$, and its "adjoint rendering" $\delta_{\mathbf{y}} = \partial g / \partial \mathbf{y}$ is our source $\sum_k \frac{\partial \ell}{\partial m_k}\, q_k$. Its $\delta_{\mathbf{x}}$ is the gradient $\partial_\theta \ell$. (Our $y$ is the importance, which the figure does not name.)

Radiative backpropagation (Nimier-David et al., SIGGRAPH 2020), the figure from left to right:

- Render the image normally, without automatic differentiation (primal rendering).
- Differentiate the loss with respect to the pixels: $\delta_{\mathbf{y}}$, the sensitivity of the loss to each pixel.
- The backward pass is a second solve: $\delta_{\mathbf{y}}$ is emitted from the camera as adjoint radiance, scattered and propagated through the scene with $A^\top$, and at every differentiable parameter, the product of the adjoint radiance and the derivative of the scattered light is accumulated. The result is the gradient for all parameters at once.

Memory: automatic differentiation records every operation of the forward rendering to replay it backward, so memory is proportional to samples and bounces (the memory slide). In radiative backpropagation no record of the forward pass is kept: the backward pass is a second simulation, so its memory does not depend on the length of the paths.

Speed: the paper compares iteration times with Mitsuba 2's automatic differentiation (its Fig. 8) and reports that "radiative backpropagation is up to three orders of magnitude faster". On the scene of its Figure 1, the unbiased method is 533 times faster at 1 sample per pixel and 40 times faster at 512; the largest speed-up in the figure, 992 times, is a biased variant on the smoke reconstruction at 512 samples per pixel.

The sentence to remember: the gradient of a rendering is computed by a second rendering, with the loss gradient emitted from the camera.

Next: the summary.

Figure 2 of the paper.
