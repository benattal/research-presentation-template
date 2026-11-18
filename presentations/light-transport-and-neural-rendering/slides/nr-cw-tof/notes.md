Transition: a lidar records the whole transient $h(\tau)$ of each pixel. A continuous-wave time-of-flight camera records one complex number per pixel instead. First, that number for one surface.

- The top plot: the source's intensity is modulated as a sinusoid at a frequency $f$ (emitted), and the light returning to the pixel is the same sinusoid, delayed by its travel time (received; each row has its own scale). The dashed lines mark a crest of the emitted light at $\tau = 0$ and the next crest of the received light. The delay between them, as a fraction of one period, is the phase $\phi$.
- The panel under it: the light source is beside the camera, and the pixel looks at a wall at depth $d$.
- Light returning from depth $d$ has travelled $2d$, so its modulation is delayed by $2d/c$, with $c$ the speed of light: the phase $\phi = 2\pi f \cdot 2d/c = 4\pi f d/c$.
- The measurement is a phasor, drawn in the complex plane on the right: an amplitude, $\rho/d^2$ for a surface of albedo $\rho$, and the phase $\phi$, the same angle as the delay in the top plot. The camera measures it by correlating the received light with the emitted modulation.
- Step 1, 30 MHz: the depth from the phase, $\hat d = c\phi/4\pi f$, equals the true depth $d$, 2.00 m.
- Step 2, 120 MHz: the delay is now longer than one period, so the next received crest after $\tau = 0$ belongs to an earlier period. The phase wraps every $c/2f$ of depth, 1.25 m here, and the depth from the phase is 0.75 m for a wall at 2 m. The pale ticks in the panel are every depth with the same phase.
- Question to the class before the next click: a mirror below the ray sends light to the same wall point by a longer path. What does the pixel measure now? Let them answer in the complex plane.
- Step 3, the answer: the received light is the sum of two delayed sinusoids (thin, in the colors of the two paths), so the measurement is the vector sum of two phasors, one per path. The mirror's path is longer and its light weaker. The phase of the sum lies between the two phases, and the depth from it is 2.09 m for a wall at 2.00 m. This error is called multipath interference.

The sentence to remember: the measurement at a time-of-flight pixel is a sum of phasors, one per path, and depth from phase is correct only for a single path.

The question it invites: why not use a low frequency and never wrap? A phase error $\delta\phi$ gives a depth error $c\,\delta\phi/4\pi f$, so a low frequency measures depth coarsely. Cameras combine several frequencies to get both range and precision.

Source: Attal et al. (TöRF, NeurIPS 2021) give 30 MHz as a typical modulation frequency, with an unambiguous range of 5 m. The modulation plot is redrawn after Lindell's CSC2529 lecture (after O'Toole, Wetzstein, and Gkioulekas), p. 28.

Model: light reflected by the mirror is equivalent to light from a second source at the camera's mirror image $C'$, with the mirror's reflectance $r = 0.9$ as its intensity. The irradiance at the wall point $P$ from it is $r\cos\theta/|C'P|^2$, and its return is that irradiance times the wall's albedo $\rho$. The mirror path is 4.83 m long (the direct round trip is 4 m), and its return is 0.32 times the direct one.

Mouse: the frequency slider changes $f$. In step 3, drag the mirror: lower it to lengthen the second path, or move it sideways past the reflection point to remove the second return.
