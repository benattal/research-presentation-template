Transition: an appendix slide, for a question about where $A = SG$ comes from: the rendering equation over surface points, as in Veach's thesis. Light leaves $\mathbf{x}$, arrives at $\mathbf{x}'$, and scatters toward $\mathbf{x}''$.

- Step 1: The change of variables from directions at $\mathbf{x}'$ to area at $\mathbf{x}$ gives the geometry term $g$: a cosine at each end, over the squared distance.
- Step 2: The three-point form, an integral over all surfaces $\mathcal{M}$, with the BRDF $f_r$ and the visibility $V$: 1 when the segment between the two points is unoccluded, 0 otherwise. The braces mark the two factors: $f_r$, the kernel of scattering $S$, depends only on the material; $gV$, the kernel of propagation $G$, only on the geometry.
- Step 3: So one bounce is $A = SG$: propagation, then scattering.

Remember: in area form, one bounce is propagation, by geometry and visibility, then scattering, by the BRDF.

If asked:
- Why does the split matter? The two factors change for different reasons: a material parameter changes only $S$, and moving an object changes only $G$, through visibility. The operator derivative of the adjoint section uses this.
- Why a lowercase $g$? So that $G$ stays the propagation operator.
- What changes in the flat room? The geometry term has $1/r$ instead of $1/r^2$.
- Other notations? Veach writes the BRDF $f_s$. Arvo writes the same split as $\mathcal{K}\mathcal{G}$, a local reflection operator after a propagation operator.
