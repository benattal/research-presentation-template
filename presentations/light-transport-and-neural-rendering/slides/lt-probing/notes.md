Probing changes which entries of $\mathbf{T}$ a single photograph adds up. Here a projector shares the camera's 64 pixels (coaxial, through a beam splitter): projector pixel $k$ lights exactly the points imaged by camera pixel $k$.

One exposure: open the shutter; for each $k$, light the scene with pattern $p_k$ and multiply the image by the camera mask $q_k$ (an LCD in front of the sensor); after the last $k$, close the shutter. The photo is $c = \sum_k q_k \odot \mathbf{T} p_k = (\Pi \odot \mathbf{T})\mathbf{1}$, with the probing matrix $\Pi = \sum_k q_k p_k^\top$ and $\mathbf{1}$ the vector of all ones. The blocks under the renders draw that product: $\Pi$ is set by the patterns and masks, and $\mathbf{T}$ is never measured (O'Toole, PhD thesis 2016, Eq. 3.1; Gkioulekas, CMU 15-463).

- **Photo.** Every projector pixel on, every camera pixel open: $\Pi = \mathbf{1}\mathbf{1}^\top$, so $c = \mathbf{T}\mathbf{1}$, all the light. About a third of it is indirect.
- **Direct.** Open camera pixel $k$ only while projector pixel $k$ is on: $\Pi = I$. Light that reflects once returns along the same ray, so it is on the diagonal of $\mathbf{T}$; light that bounced more arrives mostly at other pixels. Hard shadows, no color bleeding. A little indirect light does return to the same pixel; here 2.7 % of it.
- **Indirect.** The complement, $\Pi = \mathbf{1}\mathbf{1}^\top - I$: everything except the diagonal. Soft light, the shadow behind the box filled in, color from the walls. The photo is the sum of the two.

The renders show the light in the room for each part; the strip under each is the probed photo the camera records.

One sentence: masking the camera in sync with the projector selects light paths optically, in a single photograph.

No mouse interaction.
