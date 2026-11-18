$y = (I - A^\top)^{-1} q = q + A^\top q + (A^\top)^2 q + \cdots$, computed as light was: bounce after bounce.

The column is the same iteration as for light, with $A^\top$ and $q$: start from $y_0 = q$ and repeat $y_{k+1} = q + A^\top y_k$. The iterate beside a row is the sum of the terms down to that row; the last row is the fixed point, $y = q + A^\top y$.

By the adjoint identity, the term $\langle (A^\top)^k q, e \rangle$ equals the forward term $\langle q, A^k e \rangle$: the part of the pixel's light that bounced $k$ times.

- $q$ alone: none of the pixel's light. No light source is inside the pixel's wedge.
- $A^\top q$, the direct light: a little over half of the pixel.
- $(A^\top)^2 q$ adds little, and $(A^\top)^3 q$ adds more. The ceiling is not lit by the lamp directly, so light reflected by the ceiling reaches this floor only on the third bounce (lamp, floor, ceiling, floor).

The last step shows $\langle q, x \rangle = \langle y, e \rangle$: the pixel computed forward from the light equals the pixel computed backward from the pixel.
