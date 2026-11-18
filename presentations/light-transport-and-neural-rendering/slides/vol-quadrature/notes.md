Transition: a renderer, or NeRF, cannot integrate $C = \int T\sigma c\,dt$ exactly (the first line, from the last slide). It evaluates the field at samples along the ray.

- Each sample $t_i$ owns an interval of length $\delta_i$, here the stretch between the midpoints to its neighbours. In the quadrature, $\sigma$ and $c$ are constant on each interval, at their values at the sample: the purple steps on the $\sigma$ plot.
- On an interval of constant $\sigma_i$, the light absorbed is $1 - e^{-\sigma_i\delta_i}$, the opacity $\alpha_i$. $T_i = e^{-\sum_{j<i}\sigma_j\delta_j} = \prod_{j<i}(1 - \alpha_j)$ is the light left after the intervals in front.
- So $\hat C = \sum_i T_i \alpha_i c_i$, which is front-to-back alpha compositing.
- The result is exact when $\sigma$ and $c$ are constant on every interval. Otherwise it converges to the integral as the intervals shrink.
- The panel shows the medium: the faint wisp in front, then a dense core with a yellow outer layer and a red inside, and a faint tail behind it. The light reaching the camera comes from the core's outer layer.
- The bars are the weights $T_i\alpha_i$, drawn with area equal to the weight and colored by $c_i$. The black curve is the exact weight density $T\sigma$.
- The two squares are the estimate $\hat C$ and the exact $C$.
- Step 1, 4 samples: the core's surface falls in the interval of a sample outside the core, and the next sample lies in the red inside. That sample gets all the weight, so the estimate is too red.
- Step 2, 16 samples: closer, still off.
- Step 3, 64 samples: the bars match the curve, and the two colors agree.

The sentence to remember: volume rendering with samples is alpha compositing, exact for piecewise-constant fields.

Background: the exact $C$ is computed finely, with the trapezoid rule on 20,000 steps.

Next: where to put the samples.

Source: Tagliasacchi and Mildenhall 2022.

Mouse: drag sideways on the figure to move the core's surface; the estimate with 16 samples changes with where the surface falls between samples. The sharpness slider sets the surface's width: a soft surface needs few samples, a sharp one needs many.
