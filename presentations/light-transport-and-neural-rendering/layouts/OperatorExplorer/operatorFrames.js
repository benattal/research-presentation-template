/**
 * The operator explorer's states ("frames"): a light-field vector, its
 * kind, the symbolic terms it is the sum of, and the operation that made
 * it from the previous frame. Pure functions; the component draws them.
 *
 * Forward light and adjoint importance run the same machine. Light:
 * e (leaving surfaces) —G→ arriving at surfaces —S→ leaving again, so
 * A = SG. Importance: q (arriving at the surfaces the pixel sees) —Sᵀ→
 * leaving them —Gᵀ→ arriving at the next surfaces, so Aᵀ = GᵀSᵀ.
 */
import {
  addVectors, bounce, bounceAdjoint, outgoingFlux, propagate, propagateAdjoint, scatter, scatterAdjoint,
} from '../flatland/transport.js';

export const DIRECTIONS = {
  forward: {
    source: 'e',
    sourceKind: 'outgoing',
    exactTex: '(I - A)^{-1} e',
    operators: {
      G: { tex: 'G', name: 'propagation', from: 'outgoing', to: 'incident', letters: 'G', apply: propagate },
      S: { tex: 'S', name: 'scattering', from: 'incident', to: 'outgoing', letters: 'S', apply: scatter },
      A: { tex: 'A', name: 'one bounce', from: 'outgoing', to: 'outgoing', letters: 'SG', apply: bounce },
    },
  },
  adjoint: {
    source: 'q',
    sourceKind: 'arriving',
    exactTex: '(I - A^\\top)^{-1} q',
    operators: {
      S: { tex: 'S^\\top', name: 'scattering', from: 'arriving', to: 'leaving', letters: 'S', apply: scatterAdjoint },
      G: { tex: 'G^\\top', name: 'propagation', from: 'leaving', to: 'arriving', letters: 'G', apply: propagateAdjoint },
      A: { tex: 'A^\\top', name: 'one bounce', from: 'arriving', to: 'arriving', letters: 'GS', apply: bounceAdjoint },
    },
  },
};

/** The source frame: e for light, q for importance. */
export function sourceFrame(direction, state) {
  return { direction, state, kind: DIRECTIONS[direction].sourceKind, terms: [''], op: null, from: null };
}

/** Apply operator `key` ('G', 'S', or 'A'). Throws when the kinds do not match. */
export function applyOperator(transport, frame, key) {
  const op = DIRECTIONS[frame.direction].operators[key];
  if (op.from !== frame.kind) throw new Error(`${key} takes ${op.from} light, not ${frame.kind}`);
  return {
    direction: frame.direction,
    state: op.apply(transport, frame.state),
    kind: op.to,
    terms: frame.terms.map((letters) => op.letters + letters),
    op: key,
    from: frame,
  };
}

/** Which operators can be applied to a frame, and whether the source can be added. */
export function allowedOperations(frame) {
  const { operators, sourceKind } = DIRECTIONS[frame.direction];
  const allowed = Object.keys(operators).filter((key) => operators[key].from === frame.kind);
  return { operators: allowed, addSource: frame.kind === sourceKind };
}

/** Add `addition` (with its symbolic terms) to a frame of the same kind. */
export function addFrame(frame, addition, terms) {
  return {
    direction: frame.direction,
    state: addVectors(frame.state, addition),
    kind: frame.kind,
    terms: [...frame.terms, ...terms],
    op: 'add',
    added: addition,
    from: frame,
  };
}

function bounces(letters) {
  return [...letters].filter((letter) => letter === 'S').length;
}

/** The CSS term class of a symbolic term, by bounce count (theme.css). */
export function termClass(direction, letters) {
  if (direction === 'adjoint') return 'term-adjoint';
  const k = bounces(letters);
  return k === 0 ? 'term-emission' : `term-bounce-${Math.min(4, k)}`;
}

/** TeX of one symbolic term: letters (operators, leftmost applied last) then the source. */
export function termTex(direction, letters) {
  const { operators, source } = DIRECTIONS[direction];
  const pair = operators.A.letters;
  const tokens = [];
  for (let i = 0; i < letters.length;) {
    if (letters.startsWith(pair, i)) {
      tokens.push('A');
      i += pair.length;
    } else {
      tokens.push(letters[i]);
      i += 1;
    }
  }
  let tex = '';
  for (let i = 0; i < tokens.length;) {
    let j = i;
    while (j < tokens.length && tokens[j] === tokens[i]) j += 1;
    const base = operators[tokens[i]].tex;
    const count = j - i;
    if (count === 1) tex += `${base} `;
    else tex += base.includes('^') ? `(${base})^{${count}} ` : `${base}^{${count}} `;
    i = j;
  }
  return `${tex}${source}`;
}

/** TeX of a frame: the sum of its terms, colored by bounce, shortened when long. */
export function frameTex(frame) {
  if (frame.displayTex) return frame.displayTex;
  if (frame.exactTex) return frame.exactTex;
  const terms = [...frame.terms].sort((a, b) => a.length - b.length);
  const shown = terms.length > 5 ? [...terms.slice(0, 3), null, terms.at(-1)] : terms;
  return shown
    .map((letters) => (letters === null ? '\\cdots' : `\\htmlClass{${termClass(frame.direction, letters)}}{${termTex(frame.direction, letters)}}`))
    .join(' + ');
}

/**
 * The frames a mode steps through, one per build step.
 *
 * - construct: the source, then G, then S, then the same light named A = SG
 *   (with `mergeNamed`, A is named on the S step: three frames instead of
 *   four, since the last two show the same light);
 * - iterate: the source and its bounces A^k (k = 1…4);
 * - sum: the partial sums of the Neumann series (k = 0…4), then the exact solve.
 */
export function scriptedFrames(mode, direction, { transport, source, exact, mergeNamed = false }) {
  const start = sourceFrame(direction, source);
  if (mode === 'construct') {
    const propagated = applyOperator(transport, start, DIRECTIONS[direction].operators.A.letters[1]);
    const scattered = applyOperator(transport, propagated, DIRECTIONS[direction].operators.A.letters[0]);
    const op = DIRECTIONS[direction].operators;
    const namedTex = `\\htmlClass{${termClass(direction, op.A.letters)}}{${op.A.tex}\\, ${DIRECTIONS[direction].source} = ${op[op.A.letters[0]].tex}\\, ${op[op.A.letters[1]].tex}\\, ${DIRECTIONS[direction].source}}`;
    if (mergeNamed) {
      scattered.displayTex = namedTex;
      return [start, propagated, scattered];
    }
    // Before A is named, the scattered light reads S G e (G^T S^T q), not A e.
    scattered.displayTex = `\\htmlClass{${termClass(direction, op.A.letters)}}{${op[op.A.letters[0]].tex}\\, ${op[op.A.letters[1]].tex}\\, ${DIRECTIONS[direction].source}}`;
    const named = { ...applyOperator(transport, start, 'A'), state: scattered.state };
    named.exactTex = namedTex;
    return [start, propagated, scattered, named];
  }
  if (mode === 'iterate') {
    const frames = [start];
    while (frames.length < 5) frames.push(applyOperator(transport, frames.at(-1), 'A'));
    return frames;
  }
  if (mode === 'sum') {
    const frames = [start];
    let term = start;
    while (frames.length < 5) {
      term = applyOperator(transport, term, 'A');
      frames.push({ ...addFrame(frames.at(-1), term.state, term.terms), bounce: term.state });
    }
    const last = frames.at(-1);
    frames.push({
      ...last,
      state: exact,
      terms: [...last.terms, 'more'],
      op: 'add',
      added: exact.map((value, i) => value - last.state[i]),
      from: last,
      exactTex: `\\htmlClass{${termClass(direction, 'SG')}}{${DIRECTIONS[direction].exactTex}}`,
    });
    return frames;
  }
  throw new Error(`Unknown operator explorer mode "${mode}"`);
}

/** The terms A^k v (k = 0…count−1), for the bounce strip. */
export function bounceTerms(transport, direction, source, count) {
  const step = DIRECTIONS[direction].operators.A.apply;
  const terms = [source];
  while (terms.length < count) terms.push(step(transport, terms.at(-1)));
  return terms;
}

/** Share of the steady-state light a partial sum is still missing (by flux). */
export function remainingShare(transport, partial, exact) {
  return 1 - outgoingFlux(transport, partial) / outgoingFlux(transport, exact);
}
