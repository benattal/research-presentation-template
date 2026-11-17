Transition: a renderer, or NeRF, cannot integrate $\int T\sigma c\,dt$ exactly. It evaluates the field at samples along the ray.

- Each sample $t_i$ owns an interval of length $\delta_i$, here the stretch between the midpoints to its neighbours. In the quadrature, $\sigma$ and $c$ are constant on each interval, at their values at the sample: the purple steps on the $\sigma$ plot.
- On an interval of constant $\sigma_i$, the light absorbed is $1 - e^{-\sigma_i\delta_i}$, the opacity $\alpha_i$. $T_i = e^{-\sum_{j<i}\sigma_j\delta_j} = \prod_{j<i}(1 - \alpha_j)$ is the light left after the intervals in front.
- So $\hat C = \sum_i T_i \alpha_i c_i$, which is front-to-back alpha compositing.
- The result is exact when $\sigma$ and $c$ are constant on every interval. Otherwise it converges to the integral as the intervals shrink.
- The bars are the weights $T_i\alpha_i$, drawn with area equal to the weight and colored by $c_i$. The black curve is the exact weight density $T\sigma$.
- The cloud's core is dense, with a yellow outer layer and a red inside. The light reaching the camera comes from the outer layer.
- Step 1, $N = 4$: the first sample inside the core lies in the red inside, so the estimate is too red (error about 18%).
- Step 2, $N = 16$: closer, still off (about 11%).
- Step 3, $N = 64$: the bars match the curve (about 2%).

The sentence to remember: volume rendering with samples is alpha compositing, exact for piecewise-constant fields.

Check: the estimate $\hat C$ against the exact $C$, computed with the trapezoid rule on 20,000 steps. The error is $\|\hat C - C\| / \|C\|$ over the RGB channels.

Source: Tagliasacchi and Mildenhall 2022.

Mouse: drag sideways on the figure to move the core's surface; the error at $N = 16$ changes with where the surface falls between samples. The sharpness slider sets the surface's width: a soft surface needs few samples, a sharp one needs many.
