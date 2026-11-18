Transition: what is $y$? It satisfies an equation of the same form as light, $y = q + A^\top y$, the line at the top: the sensor $q$ in place of the emission, and $A^\top$ in place of $A$. Here one application of $A^\top$ is built in two parts, as $A = SG$ was in the operator section.

- Step 1: $q$, the sensor, on the floor inside the pixel's wedge. Importance is transported in the opposite direction to light. The sensor is importance arriving at the floor from the camera: the label under the room.
- Step 2: $S^\top q$, scattering transposed: importance leaving the floor in every direction above it, weighted by the floor's BRDF with the two directions swapped.
- Step 3: $A^\top q = G^\top S^\top q$, propagation transposed: along the same rays as light, in the opposite direction, to every surface visible from the floor. The importance arriving at a surface is how much the pixel changes per unit of light leaving that surface toward the floor. The transposes come in the opposite order from $A = SG$, as for any product.

Remember: importance is transported by the same operators as light, transposed, starting from the sensor.

If asked:
- Does the swap of directions change the BRDF? Not for a reciprocal BRDF, which is unchanged by the swap: then $S^\top$ uses the same BRDF as $S$.
- Is importance physical? For reciprocal BRDFs, it equals the light that a projector at the camera would cast on the scene, lighting only the pixel's wedge. Dual photography in the aside used the same transpose to swap the camera and the projector.
- What are the buttons over the room? On hover, they apply $G^\top$, $S^\top$, or $A^\top$, or add $q$, to the picture shown.
