The transport operator has two parts, shown here with a spotlight on the left wall.

- $e$: the spotlight's beam, leaving the wall.
- $Ge$, propagation: radiance is constant along a ray. $Ge$ at a point is the light leaving the surface its ray reaches, as incident light at the point.
- $SGe$, scattering: the floor reflects the incident light by its BRDF. Switch the floor between diffuse, glossy, and mirror: a diffuse floor reflects in every direction, a glossy floor in a lobe, a mirror in one direction.
- $A = SG$: one bounce. $A$ maps outgoing light to outgoing light, so $x = e + Ax$ is well defined.

The equations of the earlier steps stay on the side, dimmed, so the last step shows the whole construction.

Drawing convention: on this slide, outgoing light is drawn only near the surface it leaves; in the propagation step it is drawn crossing the room. On the next slides each bounce is drawn crossing the whole room.

The buttons at the top left (visible on hover) apply $G$, $S$, $A$, or add $e$. $G$ is defined on outgoing light, $S$ on incident light.
