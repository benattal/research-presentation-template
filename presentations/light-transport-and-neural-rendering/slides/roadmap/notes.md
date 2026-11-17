The lecture has five parts; each is the same linear equation $x = e + Ax$ in a different setting.

1. Neumann series: how to solve $x = b + Ax$ with powers of $A$, and when that works.
2. Operator light transport: $x$ is the light leaving surfaces, $A = SG$ is one bounce (propagation, then scattering).
   - Aside: computational imaging measures and uses the same transport with projectors and cameras.
3. Volume rendering: light inside a medium; the same form with $A = D^{-1}K$.
4. Neural rendering: fit a scene to measurements (photographs, lidar, time of flight) through this model.
5. Adjoint light transport: gradients of a measurement with respect to the scene, from one extra solve with $A^\top$.
