The integral in the rendering equation, $S$ applied to the incident light, at one point of the floor.

- **Directions.** In flatland the directions at a surface point form a half circle, split here into 16 bins; 3 rays are drawn per bin.
- **Incident light.** Along each direction, the incident radiance $L_i$ is the outgoing radiance of the first surface on that ray, toward the point. Each ray has the color of that surface's light: bright toward the lamp, red toward the left wall. The plot shows $L_i$ against the angle.
- **BRDF and cosine.** Each ray is weighted by $f_r \cos\theta$. The floor is diffuse, so $f_r$ is its albedo divided by 2 in flatland (the 2D counterpart of the albedo divided by $\pi$), and the dashed circle is the cosine weight. Grazing light contributes little.
- **Sum.** The weighted sum over all directions, plus emission, is the light leaving the point, $L_o$. The check: $L_o$ of the point's patch from the solve of $x = e + Ax$. The solve is per patch (half a meter of surface), so the two agree to about a percent away from corners; here, to the third digit.

One sentence: the light leaving a point is the sum of the incident light from every direction, weighted by the BRDF and the cosine.

Click any surface to move the point; the rays, the plot, and the numbers update. At a point near the box or a corner, the incident light changes sharply between neighboring directions.
