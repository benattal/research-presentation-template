$y = (I - A^\top)^{-1} q = q + A^\top q + (A^\top)^2 q + \cdots$, computed as light was: bounce after bounce.

The percentages are each term's share of the pixel, $\langle (A^\top)^k q, e \rangle / m$. By the adjoint identity this equals the forward term $\langle q, A^k e \rangle / m$, the share of the pixel's light that bounced $k$ times.

- $q$ alone: 0%. No light source is inside the pixel's wedge.
- One bounce, the direct light: 56%.
- Two bounces: 6%. Three bounces: 18%. The ceiling is not lit by the lamp directly, so light reflected by the ceiling reaches this floor only on the third bounce (lamp, floor, ceiling, floor).
- Four bounces: 5%. The bounces after the fourth make up the remaining 15%.

On the global illumination slide the percentages were shares of all the light in the room; these are shares of one pixel, so the numbers differ.

The last step checks $\langle q, x \rangle = \langle y, e \rangle$: the pixel computed forward from the light, or backward from the pixel.
