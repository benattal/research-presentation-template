Transition: every picture so far was a steady state, with the lamp on long enough for the light to settle. A time-of-flight sensor records the light before it settles. Here the lamp flashes for 2 ns, and each pixel records when light arrives. Time is $\tau$ ($t$ stays the distance along a ray). The room is 10 m wide, and light covers 0.3 m per ns.

- Step 1, $\tau \approx 7$ ns: the pulse leaves the lamp as a wavefront.
- Step 2, $\tau \approx 22$ ns: the wavefront reaches the floor, and a dimmer wavefront reflects from each lit point back into the room.
- Step 3, $\tau \approx 55$ ns: light reaches the camera. The cyan wedge marks one pixel, the floor beside the red wall. The first peak of its histogram is direct light, lamp to floor to camera: the shortest paths.
- Step 4, $\tau \approx 120$ ns: the room glows faintly with light that has bounced several times, and the pixel's histogram has a long tail, colored by bounce order. Bounce 2 is small here, and most of the tail has bounced three or more times: the lamp is in the ceiling, so no direct light reaches the ceiling, and light reflected by the ceiling reaches this floor only on the third bounce.

The light in flight dims by orders of magnitude as it spreads, so each step has its own exposure; the label in the corner is the exposure relative to the first step.

Question to the class: add up this histogram over all time. What do you get? Answer: the pixel's value in an ordinary photograph. With the lamp on continuously, the light arriving now is the sum of the light from flashes at every earlier time, each seen at a different delay; for a scene that does not change, that sum is the integral of the transient. The steady state $x = e + Ax$ adds the bounces; the transient spreads the same bounces out in time.

The sentence to remember: light arrives in order of path length, so in a transient the bounces are separated in time, and a photograph is their sum.

Next: the same measurement for one pixel, as a quadrature along its ray.

Mouse: drag across the plot to scrub the time; the room render is the light in flight at that moment.
