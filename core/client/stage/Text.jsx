import { Fragment } from 'react';
import 'katex/dist/katex.min.css';
import { renderMath, splitMath } from './math.js';

/**
 * Slide text with its math rendered: wrap any text field from
 * `content.json` in it (`<Text>{slide.title}</Text>`). Formulas were
 * checked when the presentation loaded, so rendering does not fail here.
 */
export default function Text({ children }) {
  if (typeof children !== 'string') throw new Error('Text expects a string');
  return splitMath(children).map((segment, i) => (segment.math === undefined
    ? <Fragment key={i}>{segment.text}</Fragment>
    : (
      <span
        key={i}
        className={segment.display ? 'math math--display' : 'math'}
        dangerouslySetInnerHTML={{ __html: renderMath(segment.math, segment.display) }}
      />
    )));
}
