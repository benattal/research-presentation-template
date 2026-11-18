Now add the bounces instead of looking at them one at a time. The exposure is fixed, so the render is brighter with each added bounce.

The sum is an iteration. Start from $x_0 = e$ and repeat $x_{k+1} = e + A x_k$: each repetition adds one bounce, $x_k = e + Ae + \cdots + A^k e$. The iterate beside a row is the sum of the terms down to that row, which is the render at that step. The line under the room is the same iteration written with the rendering equation: the light after $k + 1$ iterations is the emission plus the scattering integral of the light after $k$ iterations, traced back along each direction.

After $A^4 e$ the sum has about nine tenths of the light; the "+ ⋯" row stands for the remaining bounces. The last step is the exact solution, the fixed point of the iteration: $x = e + Ax$.

This is the Neumann series from the linear algebra section, with $A$ now the light transport operator.
