Light adds. The photo under any lighting $p$ is the sum of the columns of $\mathbf{T}$, each weighted by how bright its element is: $c = \sum_k p_k \mathbf{T}_{:,k}$.

The thumbnails on the right are the columns: each is a photo of the room lit by one element. They are the same photos at every step; a column is drawn at full strength when its element is on and faded when it is off.

- **One element.** The column from the previous slide; its photo is the one at full strength.
- **Two elements.** The room is the sum of the two columns.
- **Any pattern.** A gradient from bright on the left to off on the right; the bars hanging from the ceiling are the weights $p_k$, and each column is drawn at its weight. The large room is the weighted sum.
- **Light stage.** The same idea for a face (Debevec et al., SIGGRAPH 2000), shown in place of the room: the light stage on the left, and on the right the reflectance field, one photo per light direction. Any new lighting of the face is a weighted sum of those photos.

The check (the two strips under the thumbnails): the photo computed as the sum of the columns, and the photo of the room solved directly under the same lighting with the full light transport solver. They are the same image.

One sentence: measure the columns once, and relighting needs no further rendering.

Mouse: click a thumbnail to switch that element on or off, or drag across the ceiling of the room to paint elements on (or off, if the first one was on). The check updates with every change.
