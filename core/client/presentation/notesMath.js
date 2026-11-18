import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { renderMath } from '../stage/math.js';

/**
 * Math in presenter notes. Notes are Markdown, so a formula is found by the
 * Markdown parser with the math extension (`$…$` inline, `$$…$$` on its own
 * lines), not by `splitMath`: Markdown escapes, emphasis, and code spans
 * must not reach inside a formula. The formulas render with `renderMath`,
 * the same KaTeX options as slide text.
 */
export const NOTES_REMARK_PLUGINS = [remarkMath];

const parser = unified().use(remarkParse).use(NOTES_REMARK_PLUGINS);

/** Every formula of a notes file, in order: `{ math, display }`. */
export function notesFormulas(markdown) {
  const formulas = [];
  const visit = (node) => {
    if (node.type === 'inlineMath' || node.type === 'math') formulas.push({ math: node.value, display: node.type === 'math' });
    node.children?.forEach(visit);
  };
  visit(parser.parse(markdown));
  return formulas;
}

/** Every formula of a notes file that does not render, as messages prefixed with `where`. */
export function notesMathProblems(markdown, where) {
  return notesFormulas(markdown).flatMap(({ math, display }) => {
    try {
      renderMath(math, display);
      return [];
    } catch (error) {
      return [`${where}: the formula "${math}" does not render (${error.message.replace(/^KaTeX parse error: /, '')}).`];
    }
  });
}
