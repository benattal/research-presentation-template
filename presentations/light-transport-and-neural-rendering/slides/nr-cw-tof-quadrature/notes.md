Transition: That phasor, for a whole ray through fog, is the transient's quadrature with a phase for each sample.

- Step 1: The phasor $m_f$ is the Fourier coefficient of the transient at the modulation frequency $f$. The arrows are the transient's weights $w_i$, tip to tail. At $f = 0$ they lie on the real axis, and their sum is the intensity $m$.
- Step 2: With a short pulse, each weight is multiplied by $e^{\mathrm{j} 4\pi f t_i/c}$, the phase of its round trip. The fog's arrows curve, the wall's arrow is last, and the measured phasor $m_f$, in black, is their sum.
- Step 3: Without the fog, only the wall's weight is left: the single return of the last slide.

Remember: the time-of-flight measurement is the transient's quadrature, with a phase for each sample.

Stop (optional), at step 2: if we remove the fog and keep only the wall, what is $m_f$? Answer: the wall's single return, $(\rho/d^2)\, e^{\mathrm{j} 4\pi f d/c}$, on the next click.

If asked:
- What is $\mathrm{j}$? The imaginary unit.
- Does one frequency determine the transient? No. Each frequency measures one Fourier coefficient of $h$, and several together determine $h(\tau)$.
- Can a network be fit to these measurements? Yes. The sum is differentiable in every $\sigma_i$ and $\rho_i$, which is what TöRF does (Eqs. 5 and 6). The fog and the wall are then both in the volume, instead of one wrong depth.
- What is the scene? 30 MHz, fog from 1 to 2 m, and a wall of albedo 0.8 at 2.6 m.
