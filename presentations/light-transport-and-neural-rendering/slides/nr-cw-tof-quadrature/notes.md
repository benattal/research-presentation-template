Transition: two slides back, the transient $h(\tau)$ was the quadrature's weights binned by round-trip time; on the last slide, the measurement was one complex number per pixel. That number, for a whole ray through fog, is the same quadrature with a phase per sample.

- Step 1: the phasor $m$ is the Fourier coefficient of the transient at the modulation frequency $f$, $m = \int h(\tau)\, e^{\mathrm{j} 2\pi f \tau}\, d\tau$ ($\mathrm{j}$ is the imaginary unit, $c$ the speed of light). The arrows are the transient's weights $w_i = T_i^2\alpha_i\rho_i/t_i^2$, tip to tail on the real axis. Their total is $\int h\,d\tau = I = 0.1080$, the intensity of the transient slide.
- Step 2: with a short pulse, $h$ has the weight $w_i$ at $\tau = 2t_i/c$, so the integral multiplies each weight by $e^{\mathrm{j} 4\pi f t_i/c}$. These are the same weights, each rotated by the phase of its round trip; $T_i^2$ and $1/t_i^2$ need no new derivation, they are in $w_i$.
- The fog's arrows form a curve, and the wall's arrow is last. The measured phasor $m$ (black) is the sum of all arrows.
- Step 3, one opaque surface: only the wall sample has a nonzero weight, so $|m| = \rho/d^2 = 0.1183$ and $\arg m = 4\pi f d/c = 187.3°$. This is the single return of the last slide.

The sentence to remember: the time-of-flight measurement is the transient's quadrature with a phase for each sample.

Fitting: the sum is differentiable in every $\sigma_i$ and $\rho_i$, so a network with these outputs can be fit to raw phasor images by gradient descent. The fog and the wall are then both represented in the volume, instead of being read as one wrong depth.

Next: structured light, where the source is no longer at the camera.

Source: Attal et al. (TöRF, NeurIPS 2021), equations 5 and 6: $L_{\text{ToF}} = \int T(\mathbf{x},\mathbf{x}_t)^2\, \sigma(\mathbf{x}_t)\, I_s(\mathbf{x}_t,\omega_o)\, W(2\|\mathbf{x}-\mathbf{x}_t\|) / \|\mathbf{x}-\mathbf{x}_t\|^2\, dt$ with $W(d) = e^{\mathrm{j} 2\pi d f/c}$, evaluated by quadrature as in NeRF. (The paper writes the imaginary unit as $i$.)

Scene: $f$ = 30 MHz, fog from 1.0 to 2.0 m, a wall of albedo 0.8 at 2.6 m, 56 samples 5 cm apart.
