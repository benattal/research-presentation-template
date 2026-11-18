The previous slide named light transport as the map from sources to measurements. Here it becomes a matrix, built from the previous section's equation. Discretize both ends: the ceiling becomes a row of light elements, each a small lamp switched on with brightness $p_k$, and the camera's image $c$ has one value per pixel.

The link to the rendering equation, top to bottom on the right:

- $x = e + Ax$ is the discretized rendering equation of the previous section: radiance $x$, emission $e$, one bounce $A = SG$.
- The emission is a linear function of the pattern, $e = Ep$. Each pixel's value is a linear function of the radiance (the radiance along the pixel's ray), $c = Cx$.
- So $c = Cx = C(I - A)^{-1}e = C(I - A)^{-1}Ep$, and the light transport matrix is $\mathbf{T} = C(I - A)^{-1}E$, with $c = \mathbf{T}p$ (the blocks).

- **Column $k$.** Switch on one element, $p = \delta_k$: the image is column $k$ of $\mathbf{T}$. The room is lit by that element after all bounces. Each line from a surface to the camera is one pixel's ray, drawn in the color of that pixel's value; the strip under the room is the same values side by side. The brightest ray ends on the lit element itself: those pixels image the element directly, the $I$ term of the series below. Column $k$ is the image of the whole scene under this one light.
- **Another column.** An element above the box: a different image, a different column. Measuring $\mathbf{T}$ this way takes one photo per element.
- **Row $j$.** One pixel (the cyan wedge, on the floor beside the red wall). Expanding the inverse as in the previous section, $\mathbf{T} = C(I + A + A^2 + \cdots)E$, and each term holds the light paths with that number of bounces. The lines are light paths from the elements that end at pixel $j$, a sample in which a path is drawn more often the more light it carries: yellow, direct paths with one bounce ($A$); orange, paths with one more reflection on the way ($A^2$); red, three bounces (the first term of $\cdots$). The glow under each element is its total over all of its paths, $\mathbf{T}_{jk}$. Most of it comes along the direct paths, and the elements over the left half, nearer to the floor point, contribute most. Row $j$ is all the paths from the sources to this one pixel; the adjoint section returns to it as importance.

One sentence: a column of $\mathbf{T}$ is the image under one light; a row is all the light paths from the sources to one pixel.

No mouse interaction on this slide; on the next slide, lights can be painted on.
