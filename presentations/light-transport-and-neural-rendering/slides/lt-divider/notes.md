The Neumann series section solved $x = b + Ax$ for a matrix $A$ by summing $b + Ab + A^2 b + \cdots$, one product with $A$ per term. This section writes light between surfaces in the same form: $x$ is the light leaving every surface point in every direction, the emitted light $e$ takes the place of $b$, and $A$ is one bounce of light.

The picture is the room of the next slides, lit by a spotlight on the left wall, cut into slices. Each slice shows the light that has bounced at most the number of times under it:

- 0 bounces: only the light leaving the spotlight, $e$; the rest of the room is dark.
- 1 bounce: that light after one reflection, mostly off the floor, $e + Ae$.
- 2 and 3 bounces: $e + Ae + A^2 e$, then $+ A^3 e$: more light on the walls and around the box.
- all: every bounce, the solution $x$.

The exposure is the same in every slice, so the room brightens from left to right as bounces are added.

The question this slide invites: which slice does a camera record? The last one: a photograph is the sum of every bounce at once. The bounces are separated by computation here; in the aside, the direct light is separated from the rest optically (the probing slide).

To remember: the light in a room is the sum over the number of bounces, the Neumann series of one bounce $A$.
