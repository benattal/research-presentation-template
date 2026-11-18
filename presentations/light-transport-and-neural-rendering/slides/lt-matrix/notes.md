The previous slide named light transport as the map from sources to measurements. Here it becomes a matrix, built from the previous section's equation. Both ends are discrete: the ceiling is a row of light elements, each a small lamp switched on with brightness $p_k$, and the camera's image $c$ has one value per pixel.

The equations on the right, top to bottom:

- $x = e + Ax$ is the discretized rendering equation: radiance $x$, emission $e$, one bounce $A = SG$.
- The emission is a linear function of the pattern, $e = Ep$, and each pixel's value a linear function of the radiance (the radiance along the pixel's ray), $c = Cx$.
- So $c = C(I - A)^{-1}Ep$: the light transport matrix is $\mathbf{T} = C(I - A)^{-1}E$, and $c = \mathbf{T}p$ (the blocks, drawn to scale).

Clicks:

1. One element on, $p = \delta_k$, and a question for the class (notes of this click).
2. Column $k$: the image under element $k$ alone. Each line from a surface to the camera is one pixel's ray, drawn in the color of that pixel's value; the strip under the room is the same values side by side. The brightest rays end on the lit element itself: light from the element straight into those pixels, the $I$ term of $\mathbf{T} = C(I + A + \cdots)E$.
3. Another element, another column; a second question (notes of this click).
4. Row $j$, the paths of one bounce: the $A$ term.
5. Paths of two bounces: the $A^2$ term.
6. Paths of three bounces (the first of the terms after $A^2$), and each element's whole entry $\mathbf{T}_{jk}$.

In the row view, the lines are light paths from the elements that end at pixel $j$ (the cyan wedge, on the floor beside the red wall). They are a sample in which a path is drawn more often the more light it contributes, colored by its number of bounces: yellow, one bounce ($A$); orange, two ($A^2$); red, three. The glow under each element is its share of row $j$: the terms shown so far, and on the last click all of $\mathbf{T}_{jk}$. Most of the light comes along the direct paths, from the elements over the left half, nearest to the floor point. The adjoint section returns to a row as importance: how much each source contributes to one pixel.

If asked why there are fewer two-bounce paths than three-bounce ones: a two-bounce path from the ceiling to this floor point needs a surface in between that is neither the ceiling nor the floor, so only the walls and the box. A three-bounce path can go ceiling, floor, ceiling, floor, over the two largest white surfaces.

To remember: a column of $\mathbf{T}$ is the image under one light; a row is the light from every source along every path to one pixel.

No mouse interaction on this slide; on the next slide, lights can be painted on.
