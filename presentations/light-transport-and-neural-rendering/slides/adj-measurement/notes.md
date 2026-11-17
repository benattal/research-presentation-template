A camera pixel measures light from a few surfaces. Its value is a weighted sum of the outgoing light, $m = \langle q, x \rangle$, where $q$ is the pixel's response: which rays reach it and with what weight.

In inverse rendering, $m$ is compared with a photograph, and we need its derivative with respect to every scene parameter: millions of them for a neural scene representation (the recipe of section 4).
