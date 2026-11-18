Transition: the new source needs the derivative of one bounce, $A = SG$: propagation $G$, then scattering $S$. By the product rule, $\partial_\theta A = (\partial_\theta S)\, G + S\, (\partial_\theta G)$, the line at the top: one term for materials and one for geometry.

- Step 1: A material: $\theta$ is the red wall's albedo. Only scattering changes, so the source is $(\partial_\theta S)\, G\, x$: the light arriving at the wall, reflected by the change of its albedo. It is the source of the last slide.
- Step 2: Geometry: $\theta$ is the box's position. Moving the box changes propagation, because it changes which points are visible from each other. The render shows how the direct light changes when the box moves right: amber where light is gained, red where it is lost. The change lies along the box's sides and the edges of its shadow. This is the largest part of $S\, (\partial_\theta G)\, x$.

Remember: a material changes scattering $S$, and geometry changes visibility, in propagation $G$.

If asked:
- Which term is harder to compute? The geometry term. Visibility jumps from 1 to 0 across a shadow edge, so its derivative is concentrated on the edges. A Monte Carlo sample almost never lies exactly on an edge, so differentiating each sample misses this term. Differentiable renderers sample the edges, or reparameterize the integral. The rest of the section uses material parameters.
