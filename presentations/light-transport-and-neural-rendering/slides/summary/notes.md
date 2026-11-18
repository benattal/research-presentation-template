Transition: To close, one takeaway per part, one row per click.

- Step 1: Neumann series. A linear system $x = b + Ax$ is solved by repeated products with $A$, when the spectral radius of $A$ is below 1.
- Step 2: Operator light transport. Light satisfies the same equation, $x = e + Ax$. Its solution is the sum of all bounces, and path tracing estimates it.
- Step 3: Computational imaging. With projectors and cameras, light transport can be measured and probed in the lab.
- Step 4: Volume rendering. Inside a medium, the equation for light keeps the same fixed-point form, with a different operator.
- Step 5: Neural rendering. We recover a scene by fitting a rendering model to measurements.
- Step 6: Adjoint light transport. The gradient with respect to every scene parameter costs one extra solve, with $A^\top$ in place of $A$.

Remember: one linear equation for light: we solve it, measure its solution, fit it to data, and differentiate it.
