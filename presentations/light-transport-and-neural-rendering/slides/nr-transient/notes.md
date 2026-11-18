Transition: Every picture so far was a steady state. With a time-of-flight sensor, we measure the light before it settles. Here the lamp flashes for 2 ns, and we measure when light arrives at one pixel. Light covers 0.3 m per ns, and the room is 10 m wide.

- Step 1: At 7 ns, the pulse leaves the lamp.
- Step 2: At 22 ns, it reaches the floor, and each lit point sends a dimmer wavefront back into the room.
- Step 3: At 53 ns, light reaches the camera: the bright band in the cyan wedge, the pixel looking at the floor. The first peak of its histogram is direct light, the shortest paths.
- Step 4: At 120 ns, the room glows faintly, and the histogram has a long tail: light that bounced three or more times.

Remember: light arrives in order of path length, so a transient separates the bounces in time.

Stop (optional), at step 4: add up this histogram over all time. What do you get? Answer: the pixel's value in an ordinary photograph.

If asked:
- Why is the sum the photograph? With the lamp on continuously, the light arriving now is the sum of the light from flashes at every earlier time. For a scene that does not change, that is the integral of the transient.
- Why does the room's exposure change between steps? The light in flight dims by orders of magnitude as it spreads, so each step has its own exposure, shown in the corner. The light in the wedge has one exposure for every step.
- Why is the second bounce small here? The lamp is in the ceiling, so no direct light reaches the ceiling, and light reflected by the ceiling reaches this floor only on the third bounce.
- Can we scrub? Drag across the plot.
