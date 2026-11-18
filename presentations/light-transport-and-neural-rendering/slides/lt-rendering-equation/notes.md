Transition: Where does $x = b + Ax$ come from for light? From Kajiya's rendering equation, built one term per click at a floor point $\mathbf{x}$. A bold $\mathbf{x}$ is a point; a plain $x$ is a vector.

- Step 1: $L_o$ is the radiance leaving $\mathbf{x}$ in direction $\omega_o$: the white ray.
- Step 2: $L_e$ is emitted radiance. Only the lamp emits, so the light leaving the floor is all reflected.
- Step 3: Reflected light integrates the incident radiance $L_i$ over the half circle of directions, weighted by the cosine, the dashed lobe, and by the BRDF $f_r$, the bidirectional reflectance distribution function. On this diffuse floor, $f_r$ is a constant set by the albedo: the fraction of arriving light a surface reflects.
- Step 4: Radiance is constant along a ray, so the light arriving from $\omega_i$ is the light leaving the first surface on that ray, $r(\mathbf{x}, \omega_i)$.
- Step 5: Substituting leaves only outgoing radiance and two operators: propagation $G$, ray tracing in every direction, and scattering $S$, the integral.
- Step 6: Split the surfaces into patches and the directions into bins. Radiance becomes a vector, and this is the fixed-point equation $x = b + Ax$ of the first section, with $b = e$: the emitted light. One bounce is $A = SG$.

Remember: the rendering equation is $x = e + Ax$, with one bounce $A = SG$.

Stop (planned): at step 6, why is this equation hard to solve directly? Answer: the unknown is on both sides, once inside an integral over every direction at every point. Discretized, $A$ has a row and a column for every patch and direction, far too many to invert, so the next slides apply $A$ one bounce at a time.

If asked:
- What is $f_r$ for this floor? Its albedo divided by 2 in flatland, or by $\pi$ in 3D.
- Is visibility part of $G$? Yes: $G$ takes the light of the first surface each ray reaches.
- What kind of equation is this? A Fredholm integral equation of the second kind.

Mouse: click any surface to move $\mathbf{x}$.
