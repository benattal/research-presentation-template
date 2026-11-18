import { fixedPointIterates, solve } from './linear.js';
import { normalize, spectralMatrix } from './plane.js';
import VectorPlane, { Arrow, FixedPointUpdates, Ring, fitView } from './VectorPlane.jsx';

/** Line widths, arrowheads, dots, and ring of the section's slides, in stage pixels. */
const SLIDE_MARKS = { width: 3.5, head: 16, dot: 5, ring: 10 };

/**
 * The picture of the Neumann series section, for its divider and the
 * outline: the updates x_{k+1} = b + A x_k from x_0 = 0 stepping to the
 * solution (the ring), drawn as on the section's slides, still. `example`
 * is the section's example (`eigenvectors`, `lambda`, `b`, as in the
 * slides' data); the picture is `width` × `height` stage pixels with `pad`
 * to spare around the origin, b, and the solution, and draws `updates`
 * updates. `marks` sizes the lines (`width`), arrowheads (`head`),
 * iterates (`dot`), and ring (`ring`), in stage pixels: smaller pictures
 * draw them smaller than the slides do.
 */
export default function IterationPicture({ example, width, height, updates, marks = SLIDE_MARKS, pad = 48, className }) {
  const A = spectralMatrix(example.eigenvectors.map(normalize), example.lambda);
  const { b } = example;
  const solution = solve(A, b);
  const view = fitView([[0, 0], b, solution], width, height, pad);
  return (
    <VectorPlane view={view} className={className}>
      <FixedPointUpdates
        view={view}
        b={b}
        iterates={fixedPointIterates(A, b, [0, 0], updates)}
        shown={updates}
        width={marks.width}
        head={marks.head}
        dot={marks.dot}
      />
      <Arrow view={view} from={[0, 0]} to={b} className="la-ink-emission" width={marks.width} head={marks.head} />
      <Ring view={view} at={solution} r={marks.ring} />
    </VectorPlane>
  );
}
