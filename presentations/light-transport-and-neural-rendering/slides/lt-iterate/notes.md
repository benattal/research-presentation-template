Now apply $A$ again and again, in the room lit by the ceiling lamp: $A^k e$ is the light that has bounced exactly $k$ times. Each click adds one bounce.

- $e$, light leaving the lamp. It crosses the room to the walls, the floor, and the box, with hard shadows; none of it has been reflected yet.
- $Ae$, after one bounce: the light reflected by the surfaces the lamp lights directly. This is the direct illumination.
- $A^2 e$: the first indirect bounce, colored by the walls: red near the red wall, green near the green one.
- $A^3 e$, $A^4 e$: each bounce has about two thirds of the light of the one before.

All frames use the same exposure, so the dimming is real.

The line under the room is the same step written with the rendering equation: the light after $k + 1$ bounces leaving $\mathbf{x}$ is the scattering integral (BRDF $f_r$ and cosine) of the light after $k$ bounces leaving the surfaces $r(\mathbf{x}, \omega_i)$ that the rays from $\mathbf{x}$ reach. There is no $L_e$ term: emission enters only once, in $e$. The bounce keeps its name as a function of point and direction, $(A^k e)(\mathbf{x}, \omega)$.

The line under the bounces, albedo $< 1 \Rightarrow \rho(A) < 1$, is a question for the class on the third step, after 2 bounces (see the notes of that step).

To remember: $A^k e$ is the light after exactly $k$ bounces, and every bounce has less light than the one before.
