Transition: in fog, skin, and clouds, light interacts with the medium everywhere along a ray, not only at surfaces. The radiative transfer equation says how the radiance $L$ along a ray changes per unit length.

- The picture is a 2D simulation: photons enter from the left, cross a slab of medium of thickness $d$, and leave trails that add up like a long exposure.
- Step 0, no terms: $(\omega \cdot \nabla) L = 0$. Radiance is constant along a ray, and every photon crosses the slab.
- Step 1, absorption, $-\sigma_a L$: photons end inside the slab (the purple specks). The beam dims exponentially with depth.
- Step 2, out-scattering, $-\sigma_s L$: photons change direction and leave the beam (orange trails). For the beam this is also a loss.
- Step 3, emission, $+\sigma_a L_e$: the medium emits light in all directions (pale trails). A hot medium emits in proportion to how strongly it absorbs, hence $\sigma_a$.
- Step 4, in-scattering, $+\sigma_s \int f_p L\, d\omega'$: light from the lamp above scatters into the beam's direction (bright orange trails). $f_p$ is the phase function, the angular distribution of scattering; this simulation uses isotropic scattering.
- The two losses together are the extinction $\sigma_t = \sigma_a + \sigma_s$.

The sentence to remember: along a ray, light is lost to absorption and out-scattering and gained from emission and in-scattering.

Check: the fraction of beam photons that cross the slab without interacting matches $e^{-\sigma_t d}$ within its standard error (700 photons). At the defaults, $\sigma_a = \sigma_s = 0.8$ and $d = 1$, that is $e^{-1.6} = 0.20$.

Mouse: the sliders set $\sigma_a$ and $\sigma_s$. A slider is active once its term is on the slide.
