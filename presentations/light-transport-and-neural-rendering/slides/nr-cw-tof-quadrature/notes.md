Transition: instead of reading a depth from one phase, write the measurement with the recipe, as the volume rendering quadrature along the camera ray.

- Step 1, NeRF's quadrature, with the albedo $a_i$ in place of the color: the term of each sample is $T_i\alpha_i a_i$. The arrows are on the real axis, tip to tail, and their total is the pixel $\hat C$. On these slides $c$ is the speed of light.
- Step 2, the source is at the camera. Light reaching sample $i$ is attenuated by $T_i$ on the way out.
- That light falls off as $1/t_i^2$, and a fraction $a_i$ of it is scattered back toward the camera.
- On the way back, it is attenuated by $T_i$ again. The total is the intensity $I$.
- The arrows of far samples are shorter than in step 1.
- The wall's arrow is the most reduced, because its light passes through the fog twice.
- Step 3, over the round trip $2t_i$ the modulation is delayed by the phase $4\pi f t_i/c$ ($\mathrm{j}$ is the imaginary unit). Each arrow is rotated by its own phase.
- The fog's arrows form a curve, and the wall's arrow is last.
- The measured phasor $m$ is the sum of all arrows.
- This is the Fourier coefficient of the last slides' transient: with a short pulse, $h(\tau)$ has the weight $T_i^2\alpha_i a_i/t_i^2$ at $\tau = 2t_i/c$, and $\int h(\tau)\, e^{\mathrm{j} 2\pi f \tau}\, d\tau$ multiplies each weight by $e^{\mathrm{j} 4\pi f t_i/c}$. The label under the panel says this.
- Step 4, one opaque surface: only the wall sample has a nonzero term, so $|m| = a/d^2$ and $\arg m = 4\pi f d/c$. This is the single return of the previous slide.

The sentence to remember: the time-of-flight measurement is NeRF's quadrature with the transmittance squared, an inverse-square falloff, and a phase for each sample.

Fitting: the sum is differentiable in every $\sigma_i$ and $a_i$, so a network that outputs them can be fit to raw phasor images by gradient descent. The fog and the wall are then both represented in the volume, instead of being read as one wrong depth.

Next: structured light, where the source is no longer at the camera.

Source: Attal et al. (TöRF, NeurIPS 2021), equations 5 and 6: $L_{\text{ToF}} = \int T(\mathbf{x},\mathbf{x}_t)^2\, \sigma(\mathbf{x}_t)\, I_s(\mathbf{x}_t,\omega_o)\, W(2\|\mathbf{x}-\mathbf{x}_t\|) / \|\mathbf{x}-\mathbf{x}_t\|^2\, dt$ with $W(d) = e^{\mathrm{j} 2\pi d f/c}$, evaluated by quadrature as in NeRF. (The paper writes the imaginary unit as $i$.)

Scene: $f$ = 30 MHz, fog from 1.0 to 2.0 m, wall at 2.6 m, 56 samples 5 cm apart.
