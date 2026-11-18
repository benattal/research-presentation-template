Transition: In the lab, a projector replaces the scene's own emission. It shows a pattern $p$, and a camera records the image $c$.

- Step 1: Light adds, so the image is linear in the pattern: $c = \mathbf{T}p$, with $\mathbf{T}$ the light transport matrix.
- Step 2: With the emission $e = Ep$ and the image $c = Cx$, $\mathbf{T}$ is a sum over bounces, $C(I + A + A^2 + \cdots)E$. The paths, after Nayar et al. (2006), are in the colors of their terms. A direct path reflects once: the $A$ term.
- Step 3: Interreflection, off the wall and then the point: $A^2$.
- Step 4: Volumetric, one scattering in a medium such as fog, then the point: also $A^2$, with the medium part of $A$.
- Step 5: Subsurface, many scatterings inside the floor: the later terms. The direct paths make the direct component of the image; all the others, its global component.

Remember: light transport is the linear map from the sources to the measurements, and each term of its series is a set of light paths.

Stop (optional): is a real camera image linear in the pattern? Answer: light is, by superposition, and a camera and a projector are once their responses are calibrated: raw images, no saturation.

If asked:
- Why a bold $\mathbf{T}$? Plain $T$ is kept for transmittance in the volume rendering section.
- What is the $I$ term? Light from the projector straight into the camera. The next slide shows it.
