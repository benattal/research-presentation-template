Transition: now every derivative at once. A parameter changes the light leaving a surface by $(\partial_\theta A)\, x$, so the pixel changes by $\partial_\theta m = \langle y, (\partial_\theta A)\, x \rangle$.

- Step 1: The light $x$, from one forward solve.
- Step 2: The importance $y$ of the pixel, from one adjoint solve. The light moves to the side: both are reused for every derivative.
- Step 3: $\theta$ is the red wall's albedo, as on the derivative slides. $(\partial_\theta A)\, x$ is the light the red wall reflects, weighted in the inner product by the importance on the wall. The amber band along the wall shows that derivative: the larger, the more opaque.
- Step 4: Every surface's albedo is a parameter, each with its own inner product of the same $x$ and $y$. The floor's band is the strongest by far: the floor is lit by the lamp and inside the wedge, so light and importance are both large there. Then the ceiling, the red wall, and the box; the green wall is last. Five derivatives took two solves, not one per albedo.

Remember: with many parameters, each derivative is one inner product with the same $x$ and $y$.

Stop (planned): at step 3, ask which surface's albedo changes this pixel most, and which least. Answer: the floor most and the green wall least, on the next click.

If asked:
- Why does the ceiling come before the red wall, when the lamp does not light it? The ceiling reflects the light of the floor, which the lamp lights directly, and the floor in the wedge faces all of the ceiling. The ceiling is also longer: one albedo scales ten units of ceiling against six of wall. Per unit length, the red wall's derivative is larger.
- Why is the green wall last? It is lit, but its light reaches the floor in the wedge only after other bounces.
- How opaque is each band? Its opacity is the square root of its derivative relative to the floor's, which keeps the order and keeps the green wall visible. The floor's derivative is about three times the ceiling's.
