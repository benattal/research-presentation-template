Transition: With a continuous-wave time-of-flight camera, each pixel's measurement is one complex number instead of a transient. First, that number for one surface.

- Step 1: The source's intensity is a sinusoid at frequency $f$. The light returning from the wall is the same sinusoid, delayed by the round trip; as a fraction of a period, that delay is the phase $\phi$. The measurement is a phasor with angle $\phi$, on the right, and the depth from the phase is correct.
- Step 2: At 120 MHz, the delay is longer than one period, so the phase wraps, and the wall at 2 m reads as 0.75 m.
- Step 3: The received light is the sum of two delayed sinusoids, so the measurement is the sum of two phasors, one per path. Its phase lies between the two, and the depth is wrong: multipath interference.

Remember: a time-of-flight measurement is a sum of phasors, one per path, and depth from phase is correct only for a single path.

Stop (planned), at step 2, before the click: a mirror below the ray sends light to the same wall point by a longer path. What does the pixel measure now? Let them answer in the complex plane. Answer: the sum of two phasors, whose phase gives a wrong depth.

If asked:
- Why not use a low frequency and never wrap? A phase error $\delta\phi$ gives a depth error $c\,\delta\phi/4\pi f$, so a low frequency measures depth coarsely. Cameras combine several frequencies.
- What frequency is typical? 30 MHz, with an unambiguous range of 5 m, as in TöRF.
- What are the pale ticks? Every depth with the same phase: it wraps every $c/2f$ of depth, 1.25 m at 120 MHz.
- What is the amplitude? $\rho/d^2$ for a surface of albedo $\rho$ at depth $d$.
- How is the mirror modelled? As a second source at the camera's mirror image. Its path is 4.83 m against 4 m, and its return is 0.32 of the direct one.
- Can we change it? The slider sets $f$. On step 3, drag the mirror to lengthen the second path or remove it.
- Source? The plot is redrawn after Lindell's CSC2529 lecture, p. 28.
