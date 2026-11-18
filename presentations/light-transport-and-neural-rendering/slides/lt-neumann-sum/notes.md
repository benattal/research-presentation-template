Transition: Now add the bounces up. The thumbnails are the bounces of the last slide, and the large render is their sum, at the same exposure.

- Step 1: $e$ alone. The sum is the iteration $x_{k+1} = e + Ax_k$, started from $x_0 = e$, so $x_k$ is the light after at most $k$ bounces.
- Steps 2 to 5: each click adds one bounce. The first ones change the render the most; after $A^4 e$, the sum has about nine tenths of the light.
- Step 6: with the remaining bounces, the sum is the fixed point, $x = (I - A)^{-1} e$. The line under the room is the same iteration written with the rendering equation.

Remember: global illumination is the sum of all bounces, computed by repeating $x \leftarrow e + Ax$.

Stop (optional): how many bounces does a render need? Answer: the light still missing shrinks by about $\rho(A)$ per bounce, two thirds here, so a handful. With bright walls, albedo near one, many more.

If asked:
- Is $L_k$ in the line under the room the bounce $A^k e$? No: $L_k$ is the iterate $x_k$, the sum of the first $k + 1$ bounces.
