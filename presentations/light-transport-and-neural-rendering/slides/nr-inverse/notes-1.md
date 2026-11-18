Step 2, compare: the measured image $\tilde C$ appears under the rendered one. They differ where the camera sees the wall: red in $\tilde C$, grey in $\hat C$. The loss $\ell(\theta) = \|\hat C - \tilde C\|^2$ is the squared difference, summed over pixels and colors.

Question to the class: here $\theta$ is three numbers. Why not render every candidate albedo and keep the one with the lowest loss?

Answer: with 100 values per channel that is $10^6$ renderings, and a rendering of a real scene can take hours. Gkioulekas's lecture (p. 11) calls this exhaustive search "not scalable". In neural rendering $\theta$ is millions of network weights, and no grid covers them. The gradient instead gives a direction to move in, from one rendering and its derivative.

Next click: how to compute that gradient.
