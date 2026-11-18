The previous slide named light transport as the map from sources to measurements. Here it becomes a matrix, built from the previous section's equation. Both ends are discrete: the ceiling is a row of light elements, each a small lamp switched on with brightness $p_k$, and the camera's image $c$ has one value per pixel.

The equations on the right, top to bottom:

- $x = e + Ax$ is the discretized rendering equation: radiance $x$, emission $e$, one bounce $A = SG$.
- The emission is a linear function of the pattern, $e = Ep$, and each pixel's value a linear function of the radiance (the radiance along the pixel's ray), $c = Cx$.
- So $c = C(I - A)^{-1}Ep$: the light transport matrix is $\mathbf{T} = C(I - A)^{-1}E$, and $c = \mathbf{T}p$ (the blocks, drawn to scale).

One element is on: $p = \delta_k$, a one in entry $k$ (marked in $p$) and zeros elsewhere. The room is lit by that element alone.

Question to the class: the camera takes an image of this room. Which part of $\mathbf{T}$ is that image?

Answer (on the next click): $c = \mathbf{T}\delta_k$ is column $k$ of $\mathbf{T}$. The image of the scene under one light is one column, and measuring all of $\mathbf{T}$ this way takes one image per light element.
