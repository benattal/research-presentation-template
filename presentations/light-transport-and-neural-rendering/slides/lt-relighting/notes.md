Transition: Light adds, so the photo under any lighting $p$ is the sum of the columns of $\mathbf{T}$, each weighted by its element's brightness.

- Step 1: The thumbnails are the columns, the room under each element, faded when it is off. One element gives the column of the last slide.
- Step 2: Two elements: the sum of their two columns.
- Step 3: A gradient, with its weights as bars on the ceiling. The room is the weighted sum of columns, and rendering it directly gives the same image.
- Step 4: The same for a face (Debevec et al., 2000): the light stage takes one photo per light direction, and any new lighting is a weighted sum of them.

Remember: measure the columns once, and relighting is a weighted sum.

Stop (optional): what does relighting cost? Answer: one photo per light, to measure the columns. After that, every new lighting is a weighted sum of stored photos, with no further rendering or capture.

Mouse: click a thumbnail to switch its element on or off, or drag across the ceiling to paint elements on, or off if the first one was on.
