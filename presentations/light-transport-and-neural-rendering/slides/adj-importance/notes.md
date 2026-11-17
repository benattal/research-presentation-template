Importance satisfies the same kind of equation as light, $y = q + A^\top y$ (the line at the top, on every step), with $A^\top$ in place of $A$ and the sensor response $q$ as its source. The adjoint $A^\top$ is the operator with $\langle u, A z \rangle = \langle A^\top u, z \rangle$ for all $u$ and $z$.

- Step 1, $q$: the pixel's response, nonzero on the surfaces and directions inside the pixel's wedge.
- Step 2, $S^\top q$: scattering transposed. For a reciprocal BRDF this is the same BRDF with incoming and outgoing directions swapped.
- Step 3, $A^\top q = G^\top S^\top q$: propagation transposed, along the same rays in the opposite direction. The two steps together are one application of $A^\top$, with the two operators in the opposite order from $A = SG$.

The cyan in the room is drawn along the same rays as light. Dual photography in the aside used the same transpose, $\mathbf{T}^\top$.

The value of importance on a surface is the change of the pixel per unit of light added leaving that surface (two slides later).
