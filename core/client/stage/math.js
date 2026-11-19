import katex from 'katex';

/**
 * Math in slide text: `$…$` is inline math and `$$…$$` display math,
 * rendered by KaTeX; `\$` is a literal dollar sign. This module owns the
 * KaTeX options, so the browser and `npm run check` render alike.
 *
 * `\htmlClass{name}{…}` is allowed, so a layout or theme can color terms
 * (`\htmlClass{term-emission}{e}`) with CSS instead of hard-coded colors.
 */
const OPTIONS = {
  throwOnError: true,
  strict: 'ignore',
  trust: (context) => context.command === '\\htmlClass',
};

const MATH = /(?<!\\)\$\$([\s\S]+?)(?<!\\)\$\$|(?<!\\)\$((?:\\.|[^$\\])+?)(?<!\\)\$/g;

/**
 * In JSON, `\t`, `\b`, `\f`, `\r`, and `\n` are escapes, so a LaTeX command
 * written with one backslash becomes a control character: `"\theta"` is a
 * TAB followed by "heta", and `"\nabla"` a newline followed by "abla".
 * Slide text has no other use for a control character, nor for a newline
 * inside an inline formula.
 */
const CONTROL_CHARACTER = /[\u0000-\u0009\u000B-\u001F]/;

/**
 * Split text into segments: `{ text }` for plain text (with `\$`
 * unescaped) and `{ math, display }` for formulas, in order.
 */
export function splitMath(text) {
  const segments = [];
  let last = 0;
  for (const match of text.matchAll(MATH)) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index).replaceAll('\\$', '$') });
    segments.push(match[1] !== undefined ? { math: match[1], display: true } : { math: match[2], display: false });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last).replaceAll('\\$', '$') });
  return segments;
}

/**
 * Rendered formulas by source, least recently used first. Text re-renders
 * with its component (an animated layout on every frame, the presenter
 * window on every update), so KaTeX runs once per formula and repeats are
 * lookups. Bounded, because a layout may format changing values into TeX.
 */
const RENDERED_LIMIT = 1000;
const rendered = new Map();

/** KaTeX HTML for one formula, cached (see `rendered`). Throws on malformed math. */
export function renderMath(source, display = false) {
  const key = `${display ? 'display' : 'inline'}:${source}`;
  let html = rendered.get(key);
  if (html === undefined) html = katex.renderToString(source, { ...OPTIONS, displayMode: display });
  else rendered.delete(key);
  rendered.set(key, html);
  if (rendered.size > RENDERED_LIMIT) rendered.delete(rendered.keys().next().value);
  return html;
}

/**
 * Every malformed formula in any string inside `value` (a slide's content,
 * walked recursively), as messages prefixed with `where`. A string with a
 * control character, or an inline formula with a newline, is malformed too:
 * a backslash is missing (see CONTROL_CHARACTER).
 */
export function mathProblems(value, where) {
  if (typeof value === 'string') {
    const control = value.match(CONTROL_CHARACTER);
    const escapes = control
      ? [`${where}: the text ${JSON.stringify(value)} contains the control character U+${control[0].charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}; in JSON, write a LaTeX backslash as \\\\ ("\\\\theta", not "\\theta").`]
      : [];
    return escapes.concat(splitMath(value)
      .filter((segment) => segment.math !== undefined)
      .flatMap((segment) => {
        if (!segment.display && segment.math.includes('\n')) {
          return [`${where}: the inline formula ${JSON.stringify(segment.math)} contains a newline; in JSON, write a LaTeX backslash as \\\\ ("\\\\nabla", not "\\nabla").`];
        }
        try {
          renderMath(segment.math, segment.display);
          return [];
        } catch (error) {
          return [`${where}: the formula "${segment.math}" does not render (${error.message.replace(/^KaTeX parse error: /, '')}).`];
        }
      }));
  }
  if (Array.isArray(value)) return value.flatMap((item) => mathProblems(item, where));
  if (value && typeof value === 'object') return Object.values(value).flatMap((item) => mathProblems(item, where));
  return [];
}
