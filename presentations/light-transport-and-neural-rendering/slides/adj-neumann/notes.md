Transition: importance is computed the way light was, bounce by bounce: $y = q + A^\top q + (A^\top)^2 q + \cdots$. The column is the iteration $y_{k+1} = q + A^\top y_k$ from $y_0 = q$, and the large render is the sum down to the current row.

- Step 1: $q$, the sensor alone.
- Step 2: $A^\top q$, one bounce of importance, from the floor to every surface visible from it.
- Steps 3 to 5: $(A^\top)^2 q$ to $(A^\top)^4 q$. Each term adds importance on surfaces one more bounce away from the floor.
- Step 6: the remaining terms, and their sum $y$. Under the column, $\langle q, x \rangle = \langle y, e \rangle$: the pixel computed forward from the lamp equals the pixel computed backward from the camera.

Remember: importance is the Neumann series of $A^\top$, started from the sensor.

Stop (optional): at step 5, ask what $\langle y, e \rangle$ is, the importance weighted by the emission. Answer: the pixel itself, $\langle y, e \rangle = \langle q, x \rangle = m$: the identity of the adjoint slide with $z = e$. Step 6 shows it.

If asked:
- What does each term mean for the pixel? $\langle (A^\top)^k q, e \rangle = \langle q, A^k e \rangle$, the part of the pixel's light that bounced $k$ times. The term with $k = 0$ is zero, because the lamp is not in the wedge, and the term with $k = 1$, the direct light, is the largest. The term with $k = 3$ adds more than the one with $k = 2$: the lamp does not light the ceiling, so the ceiling's light reaches this floor only on the third bounce (lamp, floor, ceiling, floor).
- Is this used in rendering? Yes. Path tracing starts paths at the camera and applies $A^\top$ to $q$: the $\langle y, e \rangle$ side. Light tracing starts paths at the lamp and applies $A$ to $e$: the $\langle q, x \rangle$ side. Both estimate the same pixel.
