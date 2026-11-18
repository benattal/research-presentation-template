Transition: The rendering equation became $x = e + Ax$ once its operators had names. The transfer equation can be written the same way.

- Step 1: Both losses move to the left, as one extinction coefficient $\sigma_t$.
- Step 2: $D$ is the derivative along the ray plus extinction. $DL$ at a point depends only on $L$ along the ray through it: the top drawing.
- Step 3: $K$ is the in-scattering, an integral over directions at one point: the bottom drawing.
- Step 4: With the emission written $Q$, the equation is $(D - K)L = Q$. Compare $(I - A)x = e$ between surfaces.

Remember: the transfer equation is $(D - K)L = Q$, with $D$ acting along each ray and $K$ over directions.

Stop (optional), at step 4: of $D$ and $K$, which is easier to invert? Answer: $D$. It acts along one ray at a time, so inverting it means solving an ordinary differential equation per ray, which has a closed-form solution: the next slide.
