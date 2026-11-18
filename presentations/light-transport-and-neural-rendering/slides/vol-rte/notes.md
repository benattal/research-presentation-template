Transition: to describe these media, follow the radiance $L$ along one ray, in its direction $\omega$, and ask how it changes per unit length. The answer is the radiative transfer equation.

The picture is a 2D simulation: photons enter from the left, cross a slab of medium of thickness $d$, and leave trails that add up like a long exposure.

- Step 1: the left side, $(\omega \cdot \nabla) L$, is the derivative of $L$ along the ray's direction $\omega$ (the label on the right). With nothing on the right side it is zero: radiance is constant along the ray, as between surfaces, and every photon crosses the slab.
  Question to the class before the next click: in fog, what can change the light along this ray? Let them list. The next four clicks are the answers.
- Step 2, absorption, $-\sigma_a L$: photons end inside the slab (the purple specks). The absorption coefficient $\sigma_a$ is the probability per unit length of being absorbed. The beam dims exponentially with depth.
- Step 3, out-scattering, $-\sigma_s L$: photons change direction and leave the beam (orange trails). For the beam this is also a loss. The scattering coefficient $\sigma_s$ is the probability per unit length of scattering.
- Step 4, emission, $+\sigma_a L_e$: the medium emits light in all directions (pale trails). A hot medium emits in proportion to how strongly it absorbs, hence the factor $\sigma_a$.
- Step 5, in-scattering, $+\sigma_s \int f_p\, L\, d\omega'$: light from the lamp above, travelling in other directions $\omega'$, scatters into the beam's direction (bright orange trails). The phase function $f_p(\omega', \omega)$ is the probability density that light scattering at a point turns from the incoming direction $\omega'$ into $\omega$; it integrates to one over directions. This simulation scatters isotropically, the same in every direction.

The two losses together are the extinction coefficient, $\sigma_t = \sigma_a + \sigma_s$. With the losses alone, $dL/dt = -\sigma_t L$ along the beam, so after a distance $d$ the fraction $T = e^{-(\sigma_a + \sigma_s)\, d}$ of the light is left: the transmittance on the right, shown from step 2 (the Beer–Lambert law). The share of beam photons that cross the slab without interacting matches it (the deck's tests check this).

The sentence to remember: along a ray, light is lost to absorption and out-scattering and gained from emission and in-scattering.

The question it invites: out-scattering is a loss, so where does that light go? Into other rays: light scattered out of this ray is in-scattered into the rays it turns into. Scattering only moves light between directions. Absorption is the only term that removes it.

Next: the same equation, with its terms grouped into two operators.

Mouse: the sliders set $\sigma_a$ and $\sigma_s$. A slider is active once its term is on the slide.
