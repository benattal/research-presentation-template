So far every picture was a steady state: the lamp on long enough for the light to settle. A time-of-flight camera measures the light before it settles. The lamp flashes for 2 ns, and each pixel records when light arrives. Time is $\tau$ here ($t$ is distance along a ray on the following slides). The room is 10 m wide; light covers 0.3 m per ns.

- **$\tau \approx 7$ ns.** The pulse leaves the lamp as a wavefront.
- **$\tau \approx 22$ ns.** The wavefront reaches the floor, and a dimmer wavefront reflects from each lit point back into the room.
- **$\tau \approx 55$ ns.** Light reaches the camera. The cyan wedge marks one pixel (the floor beside the red wall). The first peak of its histogram is direct light: lamp to floor to camera, the shortest paths.
- **$\tau \approx 120$ ns.** The room glows faintly with light that has bounced several times, and the pixel's histogram has a long tail, colored by bounce order. Bounce 2 is small here, and most of the tail has bounced three or more times. No direct light from the lamp reaches the ceiling (the lamp is in the ceiling), so light reflected by the ceiling reaches this floor only on the third bounce.

Summed over time, the histogram equals the pixel's value in the steady state: a steady-state photograph is the integral of the transient over time.

The light in flight dims by orders of magnitude as it spreads, so each step has its own exposure; the label in the corner is the exposure relative to the first step.

One sentence: light arrives in order of path length, so in a transient the bounces are separated in time, and a photograph is their sum.

Mouse: drag across the plot to scrub the time; the room render is the light in flight at that moment.
