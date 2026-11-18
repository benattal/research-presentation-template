Transition: Here $G$ and $S$ are applied one at a time. The room is lit by the spotlight of the section's first picture, so one beam is easy to follow.

- Step 1: $e$: the beam leaving the left wall.
- Step 2: $Ge$: the beam crosses the room and arrives at the floor. Nothing is reflected yet.
- Step 3: $SGe$: the floor reflects it by its BRDF. That is one bounce, $Ae = SGe$: light leaving surfaces again, which is why $x = e + Ax$ makes sense.

Remember: one bounce is propagation, then scattering, $A = SG$.

Stop (optional): why split $A$ into two operators? Answer: $G$ depends only on the geometry and $S$ only on the materials. Switch the floor between diffuse, glossy, and mirror with the buttons: $S$ changes, and $G$ stays the same.

If asked:
- Why is the light drawn only near the surfaces here? On this slide, light leaving a surface is drawn near it and propagation is drawn crossing the room. The next slides draw each bounce across the whole room.

Mouse: the buttons at the top left, visible on hover, apply $G$, $S$, or $A$, or add $e$, to what is shown. $G$ applies to light leaving surfaces and $S$ to light arriving at them.
