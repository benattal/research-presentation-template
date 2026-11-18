Transition: what is $y$? It satisfies an equation of the same form as light: $y = q + A^\top y$ (the line at the top, on every step), with the sensor $q$ in place of the emission $e$ and the adjoint $A^\top$ in place of $A$. Light is the solution of the transport equation with the lamp's emission as its source; importance is the solution of the transposed equation with the pixel's sensor as its source.

The slide builds one application of $A^\top$, as the operator section built $A = SG$, and draws importance in cyan along the same rays as light.

- Step 1, $q$: the sensor, nonzero on the floor inside the pixel's wedge, for the directions toward the camera.
- Step 2, $S^\top q$: scattering, transposed. Importance leaves the floor in every direction above it, weighted by the floor's BRDF with the incoming and outgoing directions swapped. For a reciprocal BRDF, one that is unchanged by that swap, $S^\top$ uses the same BRDF.
- Step 3, $A^\top q = G^\top S^\top q$: propagation, transposed: along the same rays as light, in the opposite direction, to every surface visible from the floor. The importance arriving at a surface is how much light leaving that surface toward the floor would add to the pixel, after one bounce.

The two transposes come in the opposite order from $A = SG$, because the transpose of a product is the product of the transposes in reverse order.

The sentence to remember: importance is transported by the same operators as light, transposed, starting from the sensor.

The question it invites: is importance physical? It is the transport of the sensor's response. For reciprocal BRDFs, it equals the light that a projector placed at the camera, lighting exactly the pixel's wedge, would cast on the scene. Dual photography in the aside used the same transpose, $\mathbf{T}^\top$, to swap the camera and the projector.

The buttons over the room (visible on hover) apply $G^\top$, $S^\top$, $A^\top$, or add $q$.
