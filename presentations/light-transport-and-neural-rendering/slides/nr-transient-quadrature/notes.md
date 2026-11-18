Transition: the last slide showed light arriving in order of path length, in the whole room. Now the same measurement for one pixel, as a quadrature along the camera ray, built from NeRF's.

- In a pulsed lidar, a laser emits a short pulse, and photon arrivals are counted in time bins by a single-photon detector: a transient histogram $h(\tau)$. Time is $\tau$; distance along the ray is $t$; $c$ is the speed of light, so NeRF's color $c_i$ is written $L_i$ here (the label on the first line).
- Step 1, NeRF's quadrature: $\hat C = \sum_i T_i\alpha_i L_i$, with $L_i$ the light leaving sample $i$ toward the camera. The bars are NeRF's weights $T_i\alpha_i$ at each sample's depth: the fog, then the wall.
- Step 2, a light source at the camera. The light reaching sample $i$ is attenuated by $T_i$ on the way out and falls off as $1/t_i^2$, and a fraction $\rho_i$ (the albedo) of it is scattered back toward the camera: $L_i = \rho_i T_i / t_i^2$. The bars of far samples are shorter now, the wall's most of all.
- Step 3, substitute: $m = \sum_i T_i^2\alpha_i\rho_i/t_i^2$. The transmittance is squared because the light crosses the medium twice, out and back. $m$ is the intensity, the pixel's total measurement (the deck's measurement symbol, $m = \langle q, x \rangle$); each term is a weight $w_i$.
- Step 4, the transient: the light of sample $i$ arrives at its round-trip time $2t_i/c$, spread by the pulse shape $g$, so $h(\tau) = \sum_i w_i\, g(\tau - 2t_i/c)$: the same weights, binned by arrival time. The panel and the plot have the same horizontal axis, each depth $t$ above its time $2t/c$. On the click, the histogram fills in arrival order while a mark moves along the ray.
- Step 5, a 3 ns pulse: both returns are blurred, and the fog's and the wall's light overlap in time.
- Binning only redistributes the same weights in time, so $\int h\,d\tau = m$ at every pulse width.

The sentence to remember: a transient is the quadrature's weights, binned by round-trip time.

Next: continuous-wave time of flight, where the measurement is one complex number per pixel, a Fourier coefficient of this same transient.

Source: Malik et al. (Transient NeRF, NeurIPS 2023) use this time-resolved volume rendering: $T^2$ for the two-way propagation, a $(tc)^{-2}$ falloff, an integral over each time bin, and a convolution with the lidar's calibrated impulse response. Their intensity images are the histograms integrated over time.

Mouse: on the last two steps, the pulse slider sets the pulse width, from 0.1 to 4 ns.
