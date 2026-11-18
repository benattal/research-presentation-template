- Step 2: Compare: the measured image $\tilde C$ appears under the rendered one. They differ where the camera sees the wall: red in $\tilde C$, grey in $\hat C$. The loss $\ell$ sums the squared difference over pixels and colors.

Stop (optional): $\theta$ is only three numbers. Why not render every candidate albedo and keep the best? Answer: with 100 values per channel that is a million renderings, and in neural rendering $\theta$ is millions of network weights. The gradient gives a direction to move in, from one rendering and its derivative.
