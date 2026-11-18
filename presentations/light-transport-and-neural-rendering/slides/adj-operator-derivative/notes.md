Transition: the new source $(\partial_\theta A)\, x$ needs the derivative of the operator. One bounce is $A = SG$: propagation $G$ maps the light leaving each surface to the light arriving at the surfaces it reaches, and scattering $S$ maps arriving light to reflected light by each surface's BRDF. By the product rule, $\partial_\theta A = (\partial_\theta S)\, G + S\, (\partial_\theta G)$ (the line at the top): one term for materials and one for geometry.

- Step 1, a material: $\theta$ is the red wall's albedo. Only $S$ changes, so $(\partial_\theta A)\, x = (\partial_\theta S)\, G\, x$: the light arriving at the wall, $Gx$, reflected by the change of its albedo. It is the source of the last slide, drawn the same way.
- Step 2, geometry: $\theta$ is the box's position. Moving the box changes $G$, because it changes which surfaces are visible from each other. The render shows how the direct light changes when the box moves right: warm where light is gained, blue where it is lost. The change lies along the box's sides and the edges of its shadow. This is the largest part of $S\, (\partial_\theta G)\, x$.

The sentence to remember: a material parameter changes scattering, and a geometric parameter changes visibility.

The question it invites: which term is harder to compute? The geometry term. Visibility jumps from 1 to 0 across a shadow edge, so its derivative is concentrated on the edges. A Monte Carlo sample almost never lies exactly on an edge, so differentiating a renderer's samples one by one misses this term. Differentiable renderers include it with methods designed for it: sampling the edges, or reparameterizing the integral. The rest of the section uses material parameters.

Next: the derivatives of one pixel with respect to every parameter at once.
