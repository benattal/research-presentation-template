Transition: a lidar's record is the whole transient $h(\tau)$ of each pixel. With a continuous-wave time-of-flight camera, the record is one complex number per pixel instead: the transient weighted by the modulation, $m = \int h(\tau)\, e^{\mathrm{j} 2\pi f \tau}\, d\tau$, a Fourier coefficient of the transient at the modulation frequency $f$. First, that number for one surface.

- The figure (Lindell's CSC2529 lecture, after O'Toole, Wetzstein, and Gkioulekas, p. 28): the source's intensity is modulated as a sinusoid (input), and the light returning to the sensor is the same sinusoid, delayed by its travel time (output).
- In the panel below it, the light source is beside the camera.
- Light returning from depth $d$ has traveled $2d$, so its modulation is delayed by the phase $\phi = 4\pi f d / c$, with $c$ the speed of light.
- The pixel's measurement is a phasor: an amplitude, $\rho/d^2$ for a surface of albedo $\rho$, and the phase $\phi$. For one surface the transient is one peak at $\tau = 2d/c$, and its Fourier coefficient has this phase, $2\pi f \cdot 2d/c$.
- Step 1, one surface: the depth from the phase, $\hat d = c\phi/4\pi f$, equals the true depth $d$ (2.00 m).
- Step 2, the frequency is raised from 30 to 120 MHz: the phase wraps every $c/2f$ of depth, 1.25 m here.
- The depth from the phase is 0.75 m for a wall at 2 m. The pale ticks are at every depth with the same phase.
- Step 3, with a mirror there is a second path: source, mirror, wall, camera. It is longer than the direct path, and the light on it is weaker.
- The measurement is the vector sum of the two returns in the complex plane.
- The depth from the phase of the sum is 2.09 m, for a wall at 2.00 m. This error is called multipath interference.

The sentence to remember: the measurement at a time-of-flight pixel is a sum of phasors, one per path, and depth from phase is correct only for a single path.

Source: Attal et al. (TöRF, NeurIPS 2021) give 30 MHz as a typical modulation frequency, with an unambiguous range of 5 m.

Model: light reflected by the mirror is equivalent to light from a second source at the camera's mirror image $C'$, with the mirror's reflectance $r = 0.9$ as its intensity. The irradiance at the wall point $P$ from it is $r\cos\theta/|C'P|^2$, and its return is that irradiance times the wall's albedo $\rho$. The mirror path is 4.83 m long (the direct round trip is 4 m), and its return is 0.32 times the direct one.

Mouse: use the frequency slider to change $f$. In step 3, drag the mirror: lower it to lengthen the second path, or move it sideways past the reflection point to remove the second return.
