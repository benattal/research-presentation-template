- Step 3: The gradient of the loss. Only $\hat C$ depends on $\theta$.

Stop (planned): what is $\nabla_\theta \ell$? Give them a moment. Answer, on the next click: $2\,(\partial_\theta \hat C)^\top (\hat C - \tilde C)$, by the chain rule. The residual is the difference of the two strips. The new ingredient is $\partial_\theta \hat C$, the derivative of the rendering with respect to the scene.
