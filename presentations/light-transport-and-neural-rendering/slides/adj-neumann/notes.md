$y = (I - A^\top)^{-1} q = q + A^\top q + (A^\top)^2 q + \cdots$, computed as light was: bounce after bounce.

The percentages are the sum so far, as a share of the pixel: after the term $(A^\top)^k q$, the sum of $\langle (A^\top)^j q, e \rangle / m$ for $j \le k$. By the adjoint identity each term equals the forward term $\langle q, A^j e \rangle / m$, the share of the pixel's light that bounced $j$ times.

- $q$ alone: 0%. No light source is inside the pixel's wedge.
- With $A^\top q$, the direct light: 56%.
- With $(A^\top)^2 q$: 62%, so the second bounce adds only 6%. With $(A^\top)^3 q$: 79%, so the third adds 18%. The ceiling is not lit by the lamp directly, so light reflected by the ceiling reaches this floor only on the third bounce (lamp, floor, ceiling, floor).
- With $(A^\top)^4 q$: 85%. The terms after the fourth (the "+ ⋯" row) make up the remaining 15%.

On the global illumination slide the percentages were shares of all the light in the room; these are shares of one pixel, so the numbers differ.

The last step checks $\langle q, x \rangle = \langle y, e \rangle$: the pixel computed forward from the light, or backward from the pixel.
