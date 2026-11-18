Transition: Now apply $A$ again and again, back under the ceiling lamp, which lights the whole room rather than one beam. Each click is one more bounce, $A^{k+1}e = A\,(A^k e)$, at the same exposure.

- Step 1: $e$, the lamp's light, with hard shadows. The line under the room is this step in the rendering equation's notation, with no $L_e$: emission enters once, in $e$.
- Step 2: $Ae$ has the color of the surface it reflected from: red near the red wall, green near the green one.
- Step 3: In $A^2 e$, that colored light reaches the white floor, ceiling, and box: color bleeding. Each bounce is dimmer than the last, and the line under the column says why.
- Steps 4 and 5: $A^3 e$ and $A^4 e$, each about two thirds of the bounce before.

Remember: $A^k e$ is the light after exactly $k$ bounces, and each bounce has less light than the one before.

Stop (planned): at step 3, why does an albedo below one give $\rho(A) < 1$? Hint: for any norm, $\rho(A) \le \|A\|$, so one norm with $\|A\| < 1$ is enough. Answer: measure light by its flux, the total power leaving all the surfaces. Propagation loses none of it in a closed room, and scattering keeps at most the largest albedo, so in that norm $\|A\|$ is at most the largest albedo, below one.

If asked:
- Why two thirds, and not the albedo? The surfaces have different albedos, and each bounce spreads its light over them differently. The ratio settles to the largest eigenvalue, $\rho(A) \approx 0.69$, as on the spectral view slide.
- Is flux a norm? The flux of $|x|$ is a weighted sum of absolute values, so it is a norm.
