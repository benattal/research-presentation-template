Transition: the last slide showed light arriving in order of path length, in the whole room. Now the same measurement for one pixel, written with the recipe: as a quadrature along the camera ray.

- A pulsed lidar's laser emits a short pulse. A single-photon detector counts photon arrivals in time bins: a transient histogram $h(\tau)$. Time is $\tau$; distance along the ray is $t$.
- The light from sample $i$, with weight $T_i^2\alpha_i a_i/t_i^2$, arrives at its round-trip time $2t_i/c$, spread by the pulse shape $g$.
- The panel and the histogram have the same horizontal axis: each depth $t$ is above its time $2t/c$.
- Step 1, one surface: a single peak at $2d/c$.
- Step 2, fog in front of the wall: a broad hump from the fog, then a peak from the wall.
- The wall's peak is lower than in step 1, because its light passes through the fog twice.
- Step 3, a 3 ns pulse: both peaks are blurred, and the fog's and the wall's returns overlap.
- The check: $\int h\,d\tau$ equals the intensity quadrature $I = \sum_i T_i^2\alpha_i a_i/t_i^2$ at every pulse width, since binning only redistributes the same weights in time.

The sentence to remember: a transient is the quadrature's weights, binned by round-trip time.

Next: a continuous-wave time-of-flight camera measures one number per pixel from this same transient.

Source: Malik et al. (Transient NeRF, NeurIPS 2023) use this time-resolved volume rendering: $T^2$ for the two-way propagation, a $(tc)^{-2}$ falloff, an integral over each time bin, and a convolution with the lidar's calibrated impulse response. Their intensity images are the histograms integrated over time.

Mouse: use the pulse slider to set the pulse width, from 0.1 to 4 ns. On each click, the histogram is filled in arrival order while a mark moves along the ray.
