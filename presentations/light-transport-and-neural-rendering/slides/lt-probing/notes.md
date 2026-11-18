Transition: Probing goes further: one photograph sums a chosen set of entries of $\mathbf{T}$, keeping chosen light paths and removing the others.

- Step 1: Through a beam splitter, projector pixel $k$ lights what camera pixel $k$ sees. In one exposure, patterns $p_k$ light the scene in turn, and while $p_k$ is on, a mask $s_k$, a shutter per pixel, multiplies the image. The photo is $c = (\Pi \odot \mathbf{T})\mathbf{1}$, with the probing matrix $\Pi = \sum_k s_k p_k^\top$, and $\mathbf{T}$ is never measured. With every pixel lit and open, $\Pi = \mathbf{1}\mathbf{1}^\top$: an ordinary photo, about a third of it indirect.
- Step 2: Direct: camera pixel $k$ is open only while projector pixel $k$ is on, so $\Pi = I$, the diagonal of $\mathbf{T}$, since light reflected once returns along its ray. Hard shadows, no color from the walls.
- Step 3: Indirect, the complement $\Pi = \mathbf{1}\mathbf{1}^\top - I$: soft light, the shadow behind the box filled in, color from the walls. The two photos sum to the ordinary one.
- Step 4: Real scenes, after Nayar et al. (2006), without a beam splitter: shift a projected checkerboard. A pixel gets its direct light $L_d$ only when its projector pixel is on, and about half of its global light $L_g$ under every shift, so its maximum is $L_d + \frac12 L_g$ and its minimum $\frac12 L_g$. The eggs light each other; the peppers' light is mostly subsurface scattering.

Remember: light paths are selected optically, in one photograph, by masking the camera in step with the projector.

Stop (optional): is the direct photo exactly the direct light? Answer: not quite. A little indirect light returns to the pixel it left from, so it is on the diagonal too, but it is a small part.

If asked:
- Why $s$ for the masks? The letter $q$ is kept for the sensor of the adjoint section; $s$ is for shutter.
- Where is this from? O'Toole's PhD thesis (2016), Eq. 3.1, and Gkioulekas's CMU 15-463 lecture.
