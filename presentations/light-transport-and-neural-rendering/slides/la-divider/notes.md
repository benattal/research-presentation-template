Transition: Before any physics, plain linear algebra.

- Step 1: The goal: solve $(I - A)x = b$ for a square matrix $A$, using only products with $A$. The picture is where we end up: from $x = 0$, the updates $x \leftarrow b + Ax$ reach the solution, the ring.

Remember: a linear system can be solved using only products with its matrix.

If asked:
- Why avoid the inverse? In light transport, $A$ has a row and a column for every surface point and direction, far too many to store or invert. Applying $A$ to a vector is possible: it is one bounce of light.
