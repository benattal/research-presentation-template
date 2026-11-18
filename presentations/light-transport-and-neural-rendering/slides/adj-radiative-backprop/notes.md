Transition: radiative backpropagation, Nimier-David et al., SIGGRAPH 2020: the adjoint method for a whole renderer, with a loss over every pixel. The figure follows the paper's overview figure, in our room.

- Step 1: The light $x$, and the camera's image $m$, one row of pixels in this flat room. Under it, the reference $\tilde m$: the same room with a darker red wall. The loss is $\ell = \sum_k \lVert m_k - \tilde m_k \rVert^2$.
- Step 2: Each pixel's loss gradient, $2(m - \tilde m)$, is the cyan strip, largest where the red wall is in the image. Weighted by it, each pixel's sensor $q_k$ is the source of an adjoint solve. Importance is linear in its source, so the whole loss takes one solve: its importance $y$ is the middle room.
- Step 3: The gradient for each surface's albedo, in amber bands. The red wall's is the largest: there the scene differs from the reference, and a gradient step lowers its albedo most.

Remember: the gradient of a rendering is computed by a second rendering, whose source is the loss gradients at the camera.

Pause for questions: this ends the adjoint section, and the lecture's content before the summary. If no question comes, two prompts:
- Why is one adjoint solve enough for a loss over a million pixels? Answer: importance is linear in its source, so the weighted sum of the pixels' importances is one solve with the weighted sum of their sensors.
- What changes if the parameter is the box's position? Answer: the gradient needs the geometry term $S\, (\partial_\theta G)\, x$, concentrated on the moving edges, and the methods of the operator derivative slide.

If asked:
- Every gradient is positive, so a step also darkens the floor and the box. Is that wrong? Every pixel is brighter than the reference, because the darker wall reflects less light onto every surface. Most of the floor's gradient comes from the red wall's pixels: the floor's light reaches the red wall. The gradient is local. After a few steps the floor's pixels become darker than the reference, their gradient turns negative, and the floor's albedo comes back. In this room, gradient descent lowers the floor's albedo by about 10%, then returns it to within 2%, while the wall's falls to 0.62 of its initial value, against 0.6 in the reference.
- What does the paper call the cyan strip? The adjoint rendering: the image of loss gradients, which is the source of the adjoint solve.
- Why is it faster than automatic differentiation? Automatic differentiation records every operation of the forward rendering, so memory grows with samples and bounces, as on the memory slide. Radiative backpropagation keeps no record: the backward pass is a second simulation. The paper reports it up to three orders of magnitude faster than automatic differentiation in Mitsuba 2 (its Fig. 8).
