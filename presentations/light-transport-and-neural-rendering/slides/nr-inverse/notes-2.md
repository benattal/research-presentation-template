Question to the class: what is $\nabla_\theta \ell$? The loss is $\ell = \|\hat C - \tilde C\|^2$, and only $\hat C$ depends on $\theta$. Give them a moment.

Answer (next click): by the chain rule, $\nabla_\theta \ell = 2\,(\partial_\theta \hat C)^\top (\hat C - \tilde C)$. Each pixel's residual, weighted by how much that pixel changes with $\theta$, summed over the pixels. The residual is the difference of the two strips. The new ingredient is $\partial_\theta \hat C$, the derivative of the rendering with respect to the scene. For this wall it costs one more solve of the room. The adjoint section shows how to compute it for every parameter at once.

Next click: the answer, and the strip $\partial_\theta \hat C$.
