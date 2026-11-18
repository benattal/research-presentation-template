The rendering equation slide wrote one bounce as $A = SG$. Here the two operators are applied to light in the room, one at a time, with the spotlight of the section's first picture on the left wall.

- $e$, emission: the spotlight's beam, leaving the wall.
- $Ge$, propagation: radiance is constant along a ray, so $Ge$ at a surface point is the light leaving the surface its ray reaches, now as light arriving at the point. The beam crosses the room and arrives at the floor. Nothing has been reflected yet, so $Ge$ is still in the emission color.
- $SGe$, scattering: the floor reflects the arriving light by its BRDF.
- $Ae = SGe$: one bounce. $A$ maps light leaving surfaces to light leaving surfaces, so $x = e + Ax$ is well defined.

The equations of the earlier steps stay on the side, dimmed, so the last step shows the whole construction.

Drawing convention: on this slide, light leaving a surface is drawn only near that surface; propagation is drawn crossing the room. On the next slides each bounce is drawn crossing the whole room.

The question this slide invites: why split $A$ into two operators? Each depends on one thing. $G$ depends only on the geometry (which surface each ray reaches); $S$ only on the materials (the BRDF at each point). Changing the floor's material changes $S$ and leaves $G$ as it is. To show it, switch the floor between diffuse, glossy, and mirror with the buttons: a diffuse floor reflects in every direction, a glossy floor in a lobe, a mirror in one direction.

To remember: one bounce is propagation, then scattering, $A = SG$.

Mouse: the buttons at the top left (visible on hover) apply $G$, $S$, $A$, or add $e$ to what is shown; $G$ applies to light leaving surfaces and $S$ to light arriving at them.
