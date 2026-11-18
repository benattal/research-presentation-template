Transition: Follow the radiance $L$ along one ray, in its direction $\omega$, and ask how it changes per unit length. In the simulation, photons cross a slab of thickness $d$, and their trails add up like a long exposure.

- Step 1: The left side is the derivative of $L$ along the ray. With nothing on the right, radiance is constant, and every photon crosses the slab.
- Step 2: Absorption, $-\sigma_a L$: photons end inside the slab. $\sigma_a$ is the probability per unit length of being absorbed. The beam dims exponentially, so the fraction $T = e^{-\sigma_a d}$ gets through: the Beer–Lambert law.
- Step 3: Out-scattering, $-\sigma_s L$: photons turn and leave the beam, also a loss. $\sigma_s$ is the probability per unit length of scattering. The losses add, so now $T = e^{-(\sigma_a + \sigma_s) d}$.
- Step 4: Emission, $+\sigma_a L_e$: a hot medium emits in every direction, in proportion to how strongly it absorbs.
- Step 5: In-scattering: light from the lamp, travelling in other directions $\omega'$, scatters into the beam. The phase function $f_p$ is the probability density of turning from $\omega'$ into $\omega$.

Remember: along a ray, light is lost to absorption and out-scattering, and gained from emission and in-scattering.

Stop (planned), at step 1: in fog, what can change the light along this ray? Let them list. Answer: the next four clicks, absorption, out-scattering, emission, and in-scattering.

If asked:
- Where does out-scattered light go? Into other rays. Scattering moves light between directions; only absorption removes it.
- What phase function does the simulation use? An isotropic one: the same in every direction.
- Can we change the medium? Yes: the sliders set $\sigma_a$ and $\sigma_s$, each once its term is on the slide.
