The previous slide named light transport as the map from sources to measurements. Here it becomes a matrix. Discretize both ends: the ceiling becomes 19 light elements, each a small lamp we can switch on with any brightness $p_k$, and the camera has 64 pixels; its image is $c$.

The bridge to the rendering equation: the elements set the emission, $e = Ep$; the radiance is $x = (I - A)^{-1} e$; the camera's pixels are a linear function of the radiance, $c = Cx$. So $c = C\,(I - A)^{-1} E\, p$, and the light transport matrix is $\mathbf{T} = C\,(I - A)^{-1} E$, a 64 × 19 matrix. Bold $\mathbf{T}$, so that plain $T$ stays free for transmittance later.

- **Column $k$.** Switch on one element, $p = \delta_k$: the photo is column $k$ of $\mathbf{T}$. The room shows everything that one element lights, including the light reflected by the walls; the strip under it is the camera's 1D photo, which is the column. In the blocks on the right, column $k$ of $\mathbf{T}$ and entry $k$ of $p$ are marked, and the whole of $c$ is that column.
- **Another column.** An element above the box: a different photo, a different column. Measuring $\mathbf{T}$ this way takes one photo per element.
- **Row $j$.** One pixel (the cyan wedge, on the floor beside the red wall). Row $j$ holds how much each element contributes to that pixel: the ceiling glows by that share. Elements near the red wall contribute most, through direct light and light reflected by the wall.

One sentence: a column of $\mathbf{T}$ is the camera's image of one element's light after all bounces.

No mouse interaction on this slide; the next slide paints lights.
