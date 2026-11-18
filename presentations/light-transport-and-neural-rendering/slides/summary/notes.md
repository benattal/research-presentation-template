To close, one takeaway per part, in the order of the outline. One row per click.

1. **Neumann series.** A linear system $(I - A)x = b$ is solved by iterating $x \leftarrow b + Ax$, which sums the series $b + Ab + A^2b + \cdots$ when $\rho(A) < 1$. Only products with $A$ are needed.
2. **Operator light transport.** The light in a scene satisfies the same equation, with $b$ the emitted light and $A$ one bounce. Its solution, global illumination, is the sum of all bounces, and path tracing estimates that sum with random walks.
   - **Aside: computational imaging.** With projectors and cameras, light transport can be measured and probed in the lab: relighting, dual photography, optical computing, and separating direct from indirect light.
3. **Volume rendering.** In fog, smoke, or skin, light is absorbed and scattered along the whole ray, and the equation keeps the same fixed-point form with a different operator.
4. **Neural rendering.** To recover a scene, we render a model of it and fit the model until the rendering matches the measurements: photographs, lidar, time of flight, or structured light.
5. **Adjoint light transport.** The gradient of a measurement with respect to every scene parameter costs one extra solve of the same equation with $A^\top$, whose solution is importance.

To remember: one linear equation for light, which we solve, measure, fit to data, and differentiate.
