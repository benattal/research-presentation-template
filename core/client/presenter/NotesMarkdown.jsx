import Markdown from 'react-markdown';
import 'katex/dist/katex.min.css';
import { NOTES_REMARK_PLUGINS } from '../presentation/notesMath.js';
import { renderMath } from '../stage/math.js';

/**
 * One formula of the notes. `npm run check` reports a formula that does not
 * render, so this fails only on a formula typed into the notes editor; that
 * one shows as its source with KaTeX's message, in place, until it is fixed.
 */
function Formula({ source, display }) {
  let html;
  try {
    html = renderMath(source, display);
  } catch (error) {
    return <code className="presenter-notes-math-error" title={error.message}>{display ? `$$${source}$$` : `$${source}$`}</code>;
  }
  const Tag = display ? 'div' : 'span';
  return <Tag className={display ? 'math math--display' : 'math'} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * remark-math turns `$…$` into `<code class="math-inline">` and `$$…$$` into
 * `<pre><code class="math-display">`; these replace both with the rendered
 * formula, and leave other code as it is.
 */
const COMPONENTS = {
  code({ node, className = '', children, ...props }) {
    const display = /\bmath-display\b/.test(className);
    if (!display && !/\bmath-inline\b/.test(className)) return <code className={className} {...props}>{children}</code>;
    return <Formula source={String(children).replace(/\n$/, '')} display={display} />;
  },
  pre({ node, children, ...props }) {
    const classes = node?.children?.[0]?.properties?.className ?? [];
    return classes.includes('math-display') ? children : <pre {...props}>{children}</pre>;
  },
};

/** Presenter notes: Markdown with math rendered as on the slides. */
export default function NotesMarkdown({ children }) {
  return <Markdown remarkPlugins={NOTES_REMARK_PLUGINS} components={COMPONENTS}>{children}</Markdown>;
}
