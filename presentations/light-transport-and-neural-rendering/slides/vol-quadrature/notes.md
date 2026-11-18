Transition: a renderer cannot integrate $C = \int T\sigma c\,dt$ exactly (the first line, from the last slide). It evaluates the medium at samples along the ray and adds them up.

- Step 1, 4 samples: each sample $t_i$ has an interval of length $\delta_i$, from the midpoint with its previous neighbour to the midpoint with its next. The quadrature takes $\sigma$ and $c$ as constant on each interval, at their values at the sample: the purple steps on the $\sigma$ plot. The estimate is $\hat C = \sum_i T_i\,\alpha_i\,c_i$, front-to-back alpha compositing, with $\alpha_i$ the opacity of interval $i$: the fraction of the light absorbed in it.
  Question to the class: with $\sigma = \sigma_i$ on an interval of length $\delta_i$, what is $\alpha_i$? They have the tool: the transmittance of a uniform slab, from the transfer equation slide.
- Step 2, the answer: light crossing the interval keeps the fraction $e^{-\sigma_i\delta_i}$, so $\alpha_i = 1 - e^{-\sigma_i\delta_i}$. The light left after the intervals in front is $T_i = \prod_{j<i}(1 - \alpha_j) = e^{-\sum_{j<i}\sigma_j\delta_j}$. And this is why the sum is the integral: on interval $i$, $\int T\,\sigma_i\,c_i\,dt = T_i\,c_i\,(1 - e^{-\sigma_i\delta_i}) = T_i\,\alpha_i\,c_i$. Alpha compositing is exact when $\sigma$ and $c$ are constant on every interval, and it converges to the integral as the intervals shrink.
- The figure: the panel is the medium, a faint wisp in front, then a dense core with a yellow outer layer and a red inside, and a faint tail behind. The bars are the weights $T_i\alpha_i$, each with area equal to its weight and the color $c_i$; the black curve is the exact weight density $T\sigma$. The two squares are the estimate $\hat C$ and the exact $C$.
- With 4 samples, the core's surface falls in the interval of a sample outside the core, and the next sample is in the red inside. That sample gets all the weight, so the estimate is too red.
- Step 3, 16 samples: closer, still off.
- Step 4, 64 samples: the bars match the curve, and the two colors agree.

The sentence to remember: volume rendering with samples is alpha compositing, exact for piecewise-constant fields.

Background: the exact $C$ is computed with the trapezoid rule on 20,000 steps.

Next: where to put the samples.

Source: Tagliasacchi and Mildenhall 2022.

Mouse: drag sideways on the figure to move the core's surface; the estimate with 16 samples changes with where the surface falls between samples. The sharpness slider sets the surface's width: a soft surface needs few samples, a sharp one needs many.
