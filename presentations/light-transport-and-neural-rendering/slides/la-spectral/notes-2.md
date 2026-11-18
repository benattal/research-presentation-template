Question to the class: using the two lines above it, what is $\sum_k A^k b$ written in the eigenbasis? Give them a minute.

Answer: apply $A^k$ to $b = c_1 v_1 + c_2 v_2$. Since $A^k v_i = \lambda_i^k v_i$, we get $A^k b = c_1 \lambda_1^k v_1 + c_2 \lambda_2^k v_2$. Summing over $k$ and grouping by eigenvector:

$$\sum_k A^k b = \sum_i c_i \left(1 + \lambda_i + \lambda_i^2 + \cdots\right) v_i.$$

Each bracket is a geometric series in a number, which converges because $|\lambda_i| < 1$. A follow-up for whoever answers first: what does each bracket sum to? $\frac{1}{1 - \lambda_i}$, which is the slide's last line.

Next click: the answer, and the two series drawn along the eigenvector lines.
