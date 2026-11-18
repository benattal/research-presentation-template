Transition: what does the value of importance on a surface mean? Since $m = \langle y, e \rangle$, the pixel is linear in the emission, and its derivative with respect to the light emitted at each surface and direction is $\partial m / \partial e = y$. Importance is the sensitivity of the pixel to light added anywhere in the scene.

- Step 1: the importance of the pixel. The bright cyan surfaces are those where added light changes the pixel most: the floor inside the wedge, and the surfaces from which light reaches that floor.
- Step 2: add light $\delta e$ at one surface, at the ring (click any surface to move it). The large render is the light it adds everywhere, $\delta x = (I - A)^{-1} \delta e$, which takes one forward solve. The pixel changes by $\langle q, \delta x \rangle$, the added light inside the wedge. The small render is the importance again, with the same ring: the same change is $\langle y, \delta e \rangle$, the importance at the ring, with no new solve. Trying another surface costs a forward solve on the left side of the equation and nothing on the right side.

Optional question for the class, at step 2: click a surface outside the pixel's wedge, such as the green wall. Does the pixel change? (Yes. Light added at the green wall reaches the floor inside the wedge and is reflected toward the camera, so the green wall's importance is not zero, as the small render shows.)

The sentence to remember: the importance at a surface is how much the pixel changes per unit of light added there.

Next: a parameter instead of added light. When the red wall's albedo changes, the light leaving the wall changes by $(\partial_\theta A)\, x$, so the pixel changes by $\langle y, (\partial_\theta A)\, x \rangle$.
