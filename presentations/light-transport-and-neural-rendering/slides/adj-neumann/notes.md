Transition: importance is computed the way light was, bounce by bounce, with the Neumann series of $A^\top$: $y = (I - A^\top)^{-1} q = q + A^\top q + (A^\top)^2 q + \cdots$.

The column is the same iteration as for light, with $A^\top$ and the sensor $q$: start from $y_0 = q$ and repeat $y_{k+1} = q + A^\top y_k$. The iterate beside a row is the sum of the terms down to that row, and the large render is that sum.

- Step 1, $q$: the sensor alone, on the floor inside the pixel's wedge.
- Step 2, $A^\top q$: one bounce of importance, from that floor to every surface it sees.
- Steps 3 to 5, $(A^\top)^2 q$ to $(A^\top)^4 q$: each further bounce spreads importance over more of the room.

Each term has a meaning for the pixel. By the adjoint identity, $\langle (A^\top)^k q, e \rangle = \langle q, A^k e \rangle$: the part of the pixel's light that bounced $k$ times. The term with $k = 0$ is zero, because the lamp is not inside the pixel's wedge, and the term with $k = 1$, the direct light, is the largest. The terms do not all decrease: for this pixel, the third adds more than the second. The ceiling is not lit by the lamp directly, so the light it reflects reaches this floor only on the third bounce (lamp, floor, ceiling, floor).

Question for the class, at step 5: the column sums to $y$ on the next click. What is $\langle y, e \rangle$, the importance weighted by the emission? (The pixel itself: $\langle y, e \rangle = \langle q, x \rangle = m$. Set $z = e$ in the identity of the adjoint slide: $\langle (I - A^\top)^{-1} q, e \rangle = \langle q, (I - A)^{-1} e \rangle = \langle q, x \rangle$.)

- Step 6: the remaining terms and the fixed point $y = q + A^\top y$, with the answer under the column, $\langle q, x \rangle = \langle y, e \rangle$: the pixel computed forward from the lamp equals the pixel computed backward from the camera.

The sentence to remember: importance is the Neumann series of $A^\top$ started from the sensor, computed like light.

The question it invites: is this used in rendering? Yes. In path tracing, paths start at the camera; in light tracing, they start at the light. Both estimate the same pixel value, $\langle q, x \rangle = \langle y, e \rangle$.
