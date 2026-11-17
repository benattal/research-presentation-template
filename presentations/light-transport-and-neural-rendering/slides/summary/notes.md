What to take away.

- Light in steady state solves $x = e + Ax$, and its solution is a sum over bounces. Each application of $A$ adds a bounce, and path tracing is a random-walk estimate of the same sum.
- The transport matrix $T$ can be measured and probed with a projector and a camera: optical computing, dual photography, direct–global separation, probing.
- Volume rendering is the same equation with in-scattering as $A$, and its quadrature is the one NeRF uses.
- In neural rendering, a scene representation is fit to measurements through this model, including time of flight and structured light.
- With the adjoint method, the gradient for every parameter costs one extra solve with $A^\top$: importance, transported like light.
