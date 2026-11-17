Transition: in the room, $q$ was one pixel. A loss $\ell$ depends on every pixel $m_k = \langle q_k, x \rangle$, and the source of the adjoint solve is the gradient of the loss with respect to the pixels.

The chain rule (bottom right): $\partial_\theta \ell = \sum_k \frac{\partial \ell}{\partial m_k}\, \partial_\theta m_k = \sum_k \frac{\partial \ell}{\partial m_k}\, \langle y_k, (\partial_\theta A)\, x \rangle$. Since $y_k = (I - A^\top)^{-1} q_k$ is linear in $q_k$, one adjoint solve with the source $q = \sum_k \frac{\partial \ell}{\partial m_k}\, q_k$ computes every term at once: $\partial_\theta \ell = \langle y, (\partial_\theta A)\, x \rangle$ with $y = (I - A^\top)^{-1} q$.

The figure uses other letters (bottom left): its scene parameters $\mathbf{x}$ are our $\theta$, its image $\mathbf{y}$ is our vector of pixels $m$, its objective $g(\mathbf{y})$ is our loss $\ell$, and its "adjoint rendering" $\delta_{\mathbf{y}} = \partial g / \partial \mathbf{y}$ is our source $q$. Its $\delta_{\mathbf{x}}$ is the gradient $\partial_\theta \ell$. (Our $y$ is the importance, which the figure does not name.)

Radiative backpropagation (Nimier-David et al., SIGGRAPH 2020), left figure:

- Render the image normally, without automatic differentiation (primal rendering).
- Differentiate the loss with respect to the pixels: $\delta_{\mathbf{y}}$, the sensitivity of the loss to each pixel.
- Emit $\delta_{\mathbf{y}}$ from the camera as adjoint radiance, scatter and propagate it through the scene with $A^\top$, and accumulate, at every differentiable parameter, the product of the adjoint radiance and the derivative of the scattered light. The result is the gradient for all parameters at once.

Constant memory: automatic differentiation records every operation of the forward rendering to replay it backward, so memory grows with samples and bounces (the memory slide). Radiative backpropagation stores no such record; the adjoint pass is a second simulation, with its variables in registers.

Right: the speed-up over Mitsuba 2's automatic differentiation on the scene of their Figure 1, by samples per pixel. The paper reports up to three orders of magnitude.

The sentence to remember: the gradient of a rendering is computed by a second rendering, with the loss gradient emitted from the camera.

Next: the summary.

Figures 2 and 8(b) of the paper.
