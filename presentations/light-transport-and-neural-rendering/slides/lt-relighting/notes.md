The columns of $\mathbf{T}$ are useful on their own. Light adds, so the photo under any lighting $p$ is the sum of the columns of $\mathbf{T}$, each weighted by how bright its element is: $c = \sum_k p_k \mathbf{T}_{:,k}$.

The thumbnails on the right are the columns: each is a photo of the room lit by one element. They are the same photos at every step; a column is drawn at full strength when its element is on and faded when it is off.

- **One element.** The column from the previous slide; its photo is the one at full strength.
- **Two elements.** The room is the sum of the two columns.
- **Any pattern.** A gradient from bright on the left to off on the right; the bars hanging from the ceiling are the weights $p_k$, and each column is drawn at its weight. The large room is the weighted sum.
- **Light stage.** The same idea for a face (Debevec et al., SIGGRAPH 2000), shown in place of the room: the light stage on the left, and on the right the reflectance field, one photo per light direction. Any new lighting of the face is a weighted sum of those photos.

The two strips under the thumbnails are a check: the photo computed as the sum of the columns, and the photo of the room under the same lighting computed directly by the light transport solver. They are the same image.

The question this slide invites: what does relighting cost? Measuring the columns takes one photo per light (here 19 elements; for the light stage, one per light direction). After that, every new lighting is a weighted sum of stored photos, with no further rendering or capture.

To remember: measure the columns once, and relighting is a weighted sum.

Mouse: click a thumbnail to switch that element on or off, or drag across the ceiling of the room to paint elements on (or off, if the first one was on). The check updates with every change.
