Transition: the last slide was the adjoint method on one ray. Radiative backpropagation (Nimier-David et al., SIGGRAPH 2020) is the adjoint method for a whole renderer, with a loss over every pixel. The figure is drawn after the paper's overview figure (its Fig. 2), in our room and with our symbols.

Until now, $q$ was the sensor of one pixel. A loss $\ell$ depends on every pixel, $m_k = \langle q_k, x \rangle$. By the chain rule, $\partial_\theta \ell = \sum_k \frac{\partial \ell}{\partial m_k}\, \langle y_k, (\partial_\theta A)\, x \rangle$, with $y_k$ the importance of pixel $k$. Importance is linear in its source, so the weighted sum of the $y_k$ is one solve with the weighted sum of the sensors: $y = (I - A^\top)^{-1} \sum_k \frac{\partial \ell}{\partial m_k}\, q_k$, and $\partial_\theta \ell = \langle y, (\partial_\theta A)\, x \rangle$ (the line at the top). A million pixels cost one adjoint solve, as a million parameters cost one inner product each.

- Step 1, the primal rendering: the light $x$ and the camera's image $m$ (in the flatland room an image is one row of pixels). Under it, a reference image $\tilde m$ of the same room with a darker red wall: the target of the optimization. The loss is $\ell = \sum_k \lVert m_k - \tilde m_k \rVert^2$.
- Step 2, the backward pass: the loss gradient of each pixel, $\partial \ell / \partial m = 2(m - \tilde m)$, the cyan strip. It is largest where the red wall is in the image. It is the source of the adjoint solve: emitted from the camera, each pixel with its weight, and transported with $A^\top$. The middle room is its importance $y$. In the paper's figure, the image of these loss gradients is called the adjoint rendering.
- Step 3, the gradient for each surface's albedo, $\partial_\theta \ell = \langle y, (\partial_\theta A)\, x \rangle$, drawn as amber bands. The red wall's is the largest: it is the surface where the scene differs from the reference, and a gradient step lowers its albedo most.

Memory: with automatic differentiation, every operation of the forward rendering is recorded to be replayed backward, so memory grows with samples and bounces (the memory slide of the neural rendering section). In radiative backpropagation no record is kept: the backward pass is a second simulation, and its memory does not depend on the length of the paths. The paper compares iteration times with automatic differentiation in Mitsuba 2 (its Fig. 8) and reports that "radiative backpropagation is up to three orders of magnitude faster".

The sentence to remember: the gradient of a rendering is computed by a second rendering, with the loss gradient emitted from the camera.

Pause for questions: this is the end of the adjoint section, and of the lecture's content before the summary. Ask for questions on the adjoint method. If none come, two prompts:

- Why is one adjoint solve enough for a loss over a million pixels? (Importance is linear in its source: the weighted sum of the pixels' importances is one solve with the weighted sum of their sensors.)
- What changes if the parameter is the box's position? (The gradient needs the geometry term $S\, (\partial_\theta G)\, x$, concentrated on the moving edges, which needs the methods of the operator derivative slide.)

Next: the summary.
