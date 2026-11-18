Transition: Relighting uses the columns of $\mathbf{T}$. Its transpose gives an image from where the projector stands.

- Step 1: After Sen et al. (2005). The light from projector pixel $k$ to camera pixel $j$ is $\mathbf{T}_{jk}$, and by Helmholtz reciprocity the reversed path carries the same light. So if a virtual projector at the camera showed $c$, a virtual camera at the projector would record $\mathbf{T}^\top c$, computed from the measured $\mathbf{T}$. The identity on the right says the same with inner products.
- Step 2: The camera sees the back of a playing card and a book page. Light from the card's face reaches the camera only off the page, yet the dual image shows the face, the king of hearts, coarse with one pixel per projector block.

Remember: the transpose of the transport matrix exchanges the source and the sensor.

Stop (optional): where does the image of the face come from, if no camera saw it? Answer: each projector pixel lights one spot of the face, and that spot's light reaches the camera through the page. So the sum of column $k$ of $\mathbf{T}$ follows how bright spot $k$ is, and $\mathbf{T}^\top \mathbf{1}$, those sums side by side, is an image of the face.

If asked:
- Where does this come back? The adjoint section uses the same identity.
