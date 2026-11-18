Transition: Here is the plan, one row per click. Every part uses the same linear equation.

- Step 1: Neumann series. Plain linear algebra: solving $x = b + Ax$ using only products with the matrix $A$. The picture shows the updates reaching the solution.
- Step 2: Operator light transport. The same equation for light on surfaces, $x = e + Ax$, with $x$ the light leaving every surface, $e$ the emitted light, and $A$ one bounce.
- Step 3: An aside on computational imaging: measuring light transport with projectors and cameras.
- Step 4: Volume rendering. Light in fog, smoke, or skin. The equation keeps its form, with a different operator.
- Step 5: Neural rendering. The measurements are given and the scene is unknown. We fit a model of the scene until its rendering matches them.
- Step 6: Adjoint light transport. Fitting needs gradients with respect to the scene. All of them cost one extra solve, with $A^\top$ in place of $A$.

Remember: the lecture is about one linear equation for light: solving it, measuring its solution, fitting it to data, and differentiating it.

If asked:
- Why start with linear algebra? Once light transport is written as $x = e + Ax$, solving it and differentiating it are linear algebra, and the light sections reuse the first section's results.
