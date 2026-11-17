With probing, one photograph is a sum over a chosen set of entries of $\mathbf{T}$. Here a projector shares the camera's 64 pixels (coaxial, through a beam splitter): projector pixel $k$ lights exactly the points imaged by camera pixel $k$.

The symbols: $p_k$ is a projector pattern, $q_k$ a camera mask (an LCD in front of the sensor), and $\mathbf{1}$ the vector of all ones. One exposure: open the shutter; for each $k$, light the scene with pattern $p_k$ and multiply the image by the mask $q_k$; after the last $k$, close the shutter. The photo is $c = \sum_k q_k \odot \mathbf{T} p_k = (\Pi \odot \mathbf{T})\mathbf{1}$, with the probing matrix $\Pi = \sum_k q_k p_k^\top$. The blocks under the renders draw that product: $\Pi$ is set by the patterns and masks, and $\mathbf{T}$ is never measured (O'Toole, PhD thesis 2016, Eq. 3.1; Gkioulekas, CMU 15-463).

- **Photo.** Every projector pixel on, every camera pixel open: $\Pi = \mathbf{1}\mathbf{1}^\top$, so $c = \mathbf{T}\mathbf{1}$, all the light. About a third of it is indirect.
- **Direct.** Open camera pixel $k$ only while projector pixel $k$ is on: $\Pi = I$. Light that reflects once returns along the same ray, so it is on the diagonal of $\mathbf{T}$; light that bounced more arrives mostly at other pixels. Hard shadows, no color bleeding. A little indirect light does return to the same pixel; here 2.7 % of it.
- **Indirect.** The complement, $\Pi = \mathbf{1}\mathbf{1}^\top - I$: everything except the diagonal. Soft light, the shadow behind the box filled in, color from the walls. The photo is the sum of the two.
- **Real scenes** (Nayar et al., SIGGRAPH 2006, Fig. 6). The same split without a coaxial setup: project a high-frequency pattern, such as a checkerboard with half the pixels on, and shift it. A camera pixel receives direct light only when its projector pixel is on. Global light (interreflections, subsurface scattering) arrives from many projector pixels, so it is about half its full value under any shifted pattern. Over the shifts, the maximum at a pixel is $L_{\max} = L_d + \frac12 L_g$ and the minimum is $L_{\min} = \frac12 L_g$, so $L_d = L_{\max} - L_{\min}$ and $L_g = 2 L_{\min}$. Eggs: the direct component has sharp shadows; the global component is the light the eggs reflect onto each other. Peppers: almost all their light is global, from subsurface scattering; the direct component is mostly the specular highlights.

The renders show the light in the room for each part; the strip under each is the probed photo the camera records.

One sentence: light paths are selected by masking the camera in sync with the projector, optically, in a single photograph.

No mouse interaction.
