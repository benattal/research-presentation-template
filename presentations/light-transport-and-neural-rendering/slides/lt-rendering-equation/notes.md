Kajiya's rendering equation, in the notation of the CMU 15-468 slides. Points are bold, $\mathbf{x}$; plain $x$ stays the radiance vector of the Neumann series section.

- Line 1: outgoing radiance at point $\mathbf{x}$ in direction $\omega_o$ is the emitted radiance $L_e$ plus the reflected radiance: the incident radiance from every direction of the hemisphere, weighted by the BRDF $f_r(\mathbf{x}, \omega_i, \omega_o)$ and the cosine of the incidence angle.
- Line 2: incident radiance is not a new unknown. Radiance is constant along rays in vacuum, so the light arriving at $\mathbf{x}$ from direction $\omega_i$ is the light leaving the first surface point $r(\mathbf{x}, \omega_i)$ on that ray, in the direction back toward $\mathbf{x}$. $r$ is the ray-tracing function. The figure shows the light arriving at a visible point: some straight from the lamp (direct), some after other bounces (indirect).
- Line 3: substitute line 2 into line 1. Only outgoing radiance is left, on both sides, so we drop the subscript. Two operators appear. $G$ is ray tracing: the incident radiance is $GL$, with $(GL)(\mathbf{x}, \omega') = L(r(\mathbf{x}, \omega'), -\omega')$. Visibility is part of $G$. $S$ is scattering: the hemisphere integral with the BRDF and the cosine.
- Line 4: so $L = L_e + AL$ with $A = SG$, one bounce: propagate, then scatter. This is a Fredholm equation of the second kind: the unknown appears both outside and inside an integral.
- Line 5: discretize radiance into a vector and it is the fixed-point equation of the Neumann series section, $x = e + Ax$, with $x = L$ and $e = L_e$.

To remember: the rendering equation is $x = e + Ax$, with $A$ one bounce of light.
