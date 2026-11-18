Here is the plan. Every part uses the same linear equation, $x = b + Ax$, in a different setting. One row per click.

1. **Neumann series.** Plain linear algebra first: how to solve $x = b + Ax$ using only products with the matrix $A$, and when that works. The picture is the section's example: the updates $x \leftarrow b + Ax$ from $x = 0$ approaching the solution, the ring.
2. **Operator light transport.** The same equation for light on surfaces: $x$ is the light leaving every surface point in every direction, $b$ is the emitted light, and $A$ is one bounce of light. The solution is the sum over bounces, and path tracing estimates it.
   - **Aside: computational imaging.** A short detour into the lab: measuring light transport with projectors and cameras, and computing with it optically.
3. **Volume rendering.** Light inside fog, smoke, or skin, where it is absorbed and scattered along the whole ray. The equation keeps its form, with a different operator.
4. **Neural rendering.** The reverse problem: the measurements are given (photographs, lidar, time of flight, structured light) and the scene is unknown. We render a model of the scene and fit it until the rendering matches the measurements.
5. **Adjoint light transport.** Fitting needs gradients of the measurements with respect to the scene. All of them cost one extra solve of the same equation, with $A^\top$ in place of $A$.

To remember: the lecture solves one equation, measures it, fits it to data, and differentiates it.

If asked why the lecture starts with linear algebra: once light transport is written as $x = b + Ax$, solving it, measuring it, and differentiating it are linear algebra, and the light transport sections reuse the first section's results.
