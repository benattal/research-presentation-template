Transition: Now the same measurement for one pixel, as a quadrature along its ray. A pulsed lidar's measurement is the number of returning photons in each time bin: a transient $h(\tau)$. Here $c$ is the speed of light, so NeRF's color $c_i$ is written $L_i$.

- Step 1: NeRF's quadrature: $T_i$ is the transmittance in front of sample $i$, and $\alpha_i$ the opacity of its interval. The bars are NeRF's weights at each depth: the fog, then the wall, whose bar runs off the top.
- Step 2: Now a light source at the camera. The light reaching sample $i$ is attenuated by $T_i$ and falls off as $1/t_i^2$, and the albedo $\rho_i$ is the fraction sent back. Every bar is multiplied by $L_i$: the back of the fog and the wall shrink most.
- Step 3: Substitute: each term is a weight $w_i$, and their sum $m$ is the pixel's intensity.
- Step 4: The light of sample $i$ arrives at its round-trip time $2t_i/c$, spread by the pulse shape $g$. Each depth sits above its arrival time, and the histogram fills in arrival order.
- Step 5: With a 3 ns pulse, both returns are lower and wider, and they overlap in time.

Remember: a transient is the quadrature's weights, binned by round-trip time.

Stop (optional), at step 3: why is $T_i$ squared? Answer: the light crosses the medium in front of the sample twice, out and back.

If asked:
- Does the pulse width change the total? No. Binning only moves the same weights in time, so $\int h\,d\tau = m$ at every pulse width: the area stays the same.
- What does Transient NeRF add? The same model, with an integral over each time bin and a convolution with the lidar's calibrated impulse response (Malik et al., NeurIPS 2023).
- Can we change the pulse? On the last two steps, the slider sets its width, from 0.1 to 4 ns.
