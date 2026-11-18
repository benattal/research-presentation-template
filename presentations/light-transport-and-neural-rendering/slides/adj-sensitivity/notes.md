Transition: what does importance at a surface mean? Since $m = \langle y, e \rangle$, the pixel is linear in the emission, and its derivative with respect to the emission is $y$.

- Step 1: The importance of the pixel. Light added where the importance is large changes the pixel most: the floor inside the wedge, and the surfaces whose light reaches that floor.
- Step 2: Add light $\delta e$ at the ring, on the red wall. The large render is the light it adds, $\delta x = (I - A)^{-1} \delta e$, one forward solve, and the pixel changes by $\langle q, \delta x \rangle$. The small render is the importance: the same change is $\langle y, \delta e \rangle$, with no new solve. Each new surface costs a forward solve on the left, and nothing on the right.

Remember: the importance at a surface is the change of the pixel per unit of light added there.

If asked:
- Does light added outside the wedge, at the green wall, change the pixel? Yes. That light reaches the floor inside the wedge and is reflected toward the camera, so the green wall's importance is not zero, as the small render shows. A click on any surface moves the ring there.
