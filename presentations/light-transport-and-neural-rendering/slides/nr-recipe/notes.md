Transition: Every method on the last slide is built from the same pieces around one network.

- Step 1: The scene: a network $F_\theta$ maps a point and a direction to a density and a color, in green. $\theta$ is its weights.
- Step 2: Model the measurement as an integral along each camera ray $\mathbf{r}$. For a photograph, the emission–absorption integral.
- Step 3: Discretize it with the quadrature of the volume rendering section, with the opacity $\alpha_i$ of each interval.
- Step 4: Differentiate: compare with the measured pixels over a batch of rays, and take a gradient step on $\theta$.

Remember: model, discretize, differentiate. For a new sensor, only the measurement model changes.

If asked:
- What must the measurement model satisfy? It must be differentiable in $\sigma$ and $c$, and cheap enough for thousands of rays at every iteration. The quadrature is both.
- How is the gradient computed? By automatic differentiation through the quadrature.
