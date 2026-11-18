Transition: A renderer cannot integrate $C$ exactly. It evaluates the medium at samples along the ray and adds them up.

- Step 1: Each sample has an interval of length $\delta_i$, with $\sigma$ and $c$ taken as constant on it: the purple steps. The estimate $\hat C$ is front-to-back alpha compositing, with $\alpha_i$ the opacity of interval $i$, the fraction of the light absorbed in it.
- Step 2: Light crossing the interval keeps $e^{-\sigma_i \delta_i}$, so $\alpha_i = 1 - e^{-\sigma_i \delta_i}$, and $T_i$ is the light left after the intervals in front. The bars are the weights $T_i\alpha_i$, the curve is the exact $T\sigma$. With four samples, the sample past the core's yellow layer, in its red inside, takes all the weight, so the estimate is too red.
- Step 3: With 16 samples, closer.
- Step 4: With 64, the bars match the curve and the colors agree.

Remember: volume rendering with samples is alpha compositing, exact for piecewise-constant fields.

Stop (planned), at step 1: with density $\sigma_i$ on an interval of length $\delta_i$, what is $\alpha_i$? Hint: the transmittance of a uniform slab, from the transfer equation slide. Answer: $\alpha_i = 1 - e^{-\sigma_i \delta_i}$.

If asked:
- Why is it exact for piecewise-constant fields? On interval $i$, $\int T\,\sigma_i\,c_i\,dt = T_i\,c_i\,(1 - e^{-\sigma_i\delta_i}) = T_i\,\alpha_i\,c_i$.
- What are the two squares? The estimate $\hat C$ and the exact $C$, computed with the trapezoid rule on 20,000 steps.
- Can we move the surface? Drag sideways on the figure. The sharpness slider sets its width: a soft surface needs few samples, a sharp one many.
- Source? Tagliasacchi and Mildenhall, 2022.
