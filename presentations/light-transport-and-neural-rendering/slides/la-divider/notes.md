Before any physics, plain linear algebra. The goal of this section is to solve a linear system $(I - A)x = b$, for a square matrix $A$ and a vector $b$, without ever forming $(I - A)^{-1}$.

The picture is where the section ends up: starting from $x = 0$, the updates $x \leftarrow b + Ax$ step toward the solution, the ring. Each update costs one product with $A$.

The next four slides: the system as a fixed point, the Neumann series, why the series converges (with eigenvectors), and why the updates compute it.

To remember: we want to solve $(I - A)x = b$ using only products with $A$.

If asked why we would avoid the inverse: in light transport, $A$ has a row and a column for every surface point and direction, so it is far too large to store or invert. What we can do is apply it to a vector, by tracing one bounce of light.
