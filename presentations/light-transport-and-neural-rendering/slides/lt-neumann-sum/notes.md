Now add the bounces instead of looking at them one at a time. The exposure is fixed, so the render brightens with each added bounce.

The sum is the iteration of the Neumann series section, $x_{k+1} = e + A x_k$, with $e$ in the place of $b$; each repetition adds one bounce. The iterate beside a row is the sum of the terms down to that row, and the render shows it.

The indexing differs from the Neumann series section's. That section started from $x_0 = 0$, so its $x_k = b + Ab + \cdots + A^{k-1} b$ had $k$ terms. Here the iteration starts one step later, from $x_0 = e$ (the section's $x_1$), so the subscript counts bounces: $x_k = e + Ae + \cdots + A^k e$ is the light that has bounced at most $k$ times, as in the slices of the section's first picture. The adjoint Neumann series later starts the same way, from $y_0 = q$.

- Clicks 1 to 5: $e$, then $+ Ae$, $+ A^2 e$, $+ A^3 e$, $+ A^4 e$. The first bounces change the render the most; after $A^4 e$ the sum has about nine tenths of the light.
- Click 6: "$+ \cdots$" stands for the remaining bounces, and the last row is the exact solution, the fixed point of the iteration: $x = e + Ax$, so $x = (I - A)^{-1} e$.

The line under the room is the same iteration written with the rendering equation: the light after $k + 1$ iterations is the emission plus the scattering integral of the light after $k$ iterations, traced back along each direction. $L_k$ is the iterate $x_k$ as a function of point and direction, as $L$ was $x$ on the rendering equation slide. It is the sum of the first $k + 1$ bounces, not the bounce $A^k e$ of the previous slide; the letter changes only because $x_k(\mathbf{x}, \omega)$ would put the vector $x$ beside the point $\mathbf{x}$.

The question this slide invites: how many bounces does a render need? The light still missing after $k$ bounces shrinks by about $\rho(A)$ per bounce. Here that is about two thirds per bounce, so a handful of bounces is close. In a room with bright walls (albedo near one) the light decays slowly and many more bounces are needed.

To remember: global illumination is the solution of $x = e + Ax$, the sum of all bounces, computed by repeating $x \leftarrow e + Ax$.
