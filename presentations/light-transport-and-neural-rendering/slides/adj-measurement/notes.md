The value of one camera pixel is a weighted sum of the light leaving the surfaces in its wedge: $m = \langle q, x \rangle = \sum_j q_j x_j$. The sum runs over every surface element and direction $j$; $q_j$ is the pixel's response, nonzero only for the rays inside the pixel's wedge (the cyan wedge, labelled $q$).

In inverse rendering, $m$ is compared with a photograph, and its derivative is needed with respect to every scene parameter: millions of them for a neural scene representation (the recipe of the neural rendering section).
