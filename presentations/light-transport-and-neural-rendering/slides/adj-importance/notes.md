Importance satisfies the same kind of equation as light, $y = q + A^\top y$, with $A^\top$ in place of $A$ and the sensor response $q$ as its source. The adjoint $A^\top$ is the operator with $\langle y, A x \rangle = \langle A^\top y, x \rangle$ for all $x$ and $y$.

- $q$: the pixel's response, nonzero on the surfaces and directions the pixel measures.
- $S^\top q$: scattering transposed. For a reciprocal BRDF this is the same BRDF with incoming and outgoing directions swapped.
- $G^\top S^\top q$: propagation transposed, along the same rays in the opposite direction.
- $A^\top = G^\top S^\top$: one application, the two steps in the opposite order.

The cyan in the room is drawn along the same rays as light. Dual photography in section 2 used the same transpose, $\mathbf{T}^\top$.

The value of importance on a surface is the change of the pixel per unit of light added leaving that surface (two slides later).
