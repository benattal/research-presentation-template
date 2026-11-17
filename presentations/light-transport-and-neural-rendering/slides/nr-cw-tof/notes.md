Transition: a lidar records the whole transient $h(\tau)$ of each pixel. A continuous-wave time-of-flight camera records one complex number per pixel instead: the transient weighted by its modulation, $m = \int h(\tau)\, e^{\mathrm{j} 2\pi f \tau}\, d\tau$, a Fourier coefficient of the transient at the modulation frequency $f$ (Lindell, CSC 2529 time-of-flight lecture, after O'Toole, Wetzstein, and Gkioulekas, pp. 14–30). First, what that number is for one surface.

- The light source is beside the camera, and its intensity is modulated at frequency $f$.
- Light returning from depth $d$ has traveled $2d$, so its modulation is delayed by the phase $\phi = 4\pi f d / c$.
- The pixel's measurement is a phasor: an amplitude, $a/d^2$ for a surface of albedo $a$, and the phase $\phi$. For one surface the transient is one peak at $\tau = 2d/c$, and its Fourier coefficient has exactly this phase, $2\pi f \cdot 2d/c$.
- Step 1, one surface: the depth from the phase, $\hat d = c\phi/4\pi f$, equals the true depth $d$ (2.00 m).
- Step 2, the frequency is raised from 30 to 120 MHz: the phase wraps every $c/2f$ of depth, 1.25 m here.
- The depth from the phase is 0.75 m for a wall at 2 m. The pale ticks are at every depth with the same phase.
- Step 3, with a mirror there is a second path: source, mirror, wall, camera. It is longer than the direct path.
- The light on the second path is weaker than on the direct path.
- The measurement is the vector sum of the two returns in the complex plane.
- The depth from the phase of the sum is 2.09 m, for a wall at 2.00 m. This error is called multipath interference.

The sentence to remember: a time-of-flight pixel measures a sum of phasors, one per path, and depth from phase is correct only for a single path.

Source: Attal et al. (TöRF, NeurIPS 2021) give 30 MHz as a typical modulation frequency, with an unambiguous range of 5 m.

Model: light reflected by the mirror is equivalent to light from a second source at the camera's mirror image, with the mirror's reflectance (0.9) as its intensity. The irradiance at the wall point from it is $\rho\cos\theta/|C'P|^2$.

Mouse: use the frequency slider to change $f$. In step 3, drag the mirror. Lower it to lengthen the second path. Slide it sideways past the reflection point to remove the second return.
