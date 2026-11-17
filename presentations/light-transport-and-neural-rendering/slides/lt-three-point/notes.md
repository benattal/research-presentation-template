The rendering equation written over surface points instead of directions, as in Veach's thesis. The figure shows the three points: light leaves $\mathbf{x}$, arrives at $\mathbf{x}'$, and scatters toward $\mathbf{x}''$.

- Line 1: the change of variables from directions at $\mathbf{x}'$ to area at $\mathbf{x}$: $\cos\theta_i' \, d\omega_i = G(\mathbf{x} \leftrightarrow \mathbf{x}') \, dA(\mathbf{x})$. The geometry term has a cosine at each end and the inverse squared distance. In the two-dimensional room it has $1/r$ instead of $1/r^2$.
- Line 2: the three-point form. The integral runs over all surfaces $\mathcal{M}$; $f_s$ is the BRDF at $\mathbf{x}'$, and the visibility $V(\mathbf{x} \leftrightarrow \mathbf{x}')$ is 1 when the segment between the two points is unoccluded and 0 otherwise.
- Line 3: the integrand factors. $G V$ depends only on geometry: it is the kernel of propagation, the operator $G$ of the rendering equation slide, under which light leaving $\mathbf{x}$ becomes light arriving at $\mathbf{x}'$. $f_s$ depends only on the material: it is the kernel of scattering, $S$. So one bounce is $A = SG$. Arvo writes the same split as $\mathcal{K}\mathcal{G}$, a local reflection operator after a propagation operator.

To remember: in area form, one bounce is propagation (geometry and visibility) followed by scattering (the BRDF).
