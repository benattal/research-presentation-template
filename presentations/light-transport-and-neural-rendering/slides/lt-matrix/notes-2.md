Another element, above the box: a different image, so a different column of $\mathbf{T}$. As on the previous click, each line from a surface to the camera is one pixel's ray, drawn in the color of that pixel's value, and the strip under the room is the same values side by side. This element is outside the camera's view, so all the light of this column has bounced at least once.

Question to the class: a column is the image under one light. What is a row of $\mathbf{T}$, row $j$ for one pixel $j$? What does its entry $\mathbf{T}_{jk}$ hold, and which light does it add up?

Answer (on the next clicks): row $j$ holds, for every element $k$, how much of element $k$'s light ends up in pixel $j$. That light arrives along every path from element $k$ to the surface imaged by pixel $j$, with any number of bounces: expanding the inverse, $\mathbf{T} = C(I + A + A^2 + \cdots)E$, and the term $A^n$ holds the paths of $n$ bounces. The next clicks add these paths one term at a time.
