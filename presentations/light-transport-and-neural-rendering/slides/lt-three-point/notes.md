Appendix slide, for a question about where the split $A = SG$ comes from. It follows the rendering equation slide.

The rendering equation written over surface points instead of directions, as in Veach's thesis. The figure shows the three points: light leaves $\mathbf{x}$, arrives at $\mathbf{x}'$, and scatters toward $\mathbf{x}''$.

- Line 1: the change of variables from directions at $\mathbf{x}'$ to area at $\mathbf{x}$, $\cos\theta_i' \, d\omega_i = g(\mathbf{x} \leftrightarrow \mathbf{x}') \, dA(\mathbf{x})$. The geometry term $g$ (lowercase, so that $G$ stays the propagation operator) has a cosine at each end and the inverse squared distance. In the two-dimensional room it has $1/r$ instead of $1/r^2$.
- Line 2: the three-point form. The integral runs over all surfaces $\mathcal{M}$. $f_r$ is the BRDF at $\mathbf{x}'$, as in the rendering equation (Veach writes $f_s$), and the visibility $V(\mathbf{x} \leftrightarrow \mathbf{x}')$ is 1 when the segment between the two points is unoccluded and 0 otherwise.
- Line 3: the integrand factors. $gV$ depends only on geometry: it is the kernel of propagation $G$, which maps light leaving $\mathbf{x}$ to light arriving at $\mathbf{x}'$. $f_r$ depends only on the material: it is the kernel of scattering $S$. So one bounce is $A = SG$. Arvo writes the same split as $\mathcal{K}\mathcal{G}$, a local reflection operator after a propagation operator.

The sentence to remember: in area form, one bounce is propagation (geometry and visibility) followed by scattering (the BRDF).

The question it invites: why does this matter beyond notation? The two factors change for different reasons: a material parameter changes only $S$, and moving an object changes only $G$, through visibility. The adjoint section's operator derivative uses this split.
