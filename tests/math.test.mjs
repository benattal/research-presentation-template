import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderMath, splitMath } from '../core/client/stage/math.js';

describe('slide math', () => {
  it('splits text into plain segments and formulas', () => {
    assert.deepEqual(splitMath('a $x$ b $$y$$ \\$5'), [
      { text: 'a ' },
      { math: 'x', display: false },
      { text: ' b ' },
      { math: 'y', display: true },
      { text: ' $5' },
    ]);
  });

  it('renders a formula once and returns the same HTML on repeats, inline and display apart', () => {
    const inline = renderMath('\\frac{a}{b}');
    assert.equal(renderMath('\\frac{a}{b}'), inline);
    const display = renderMath('\\frac{a}{b}', true);
    assert.notEqual(display, inline);
    assert.match(display, /katex-display/);
    assert.doesNotMatch(inline, /katex-display/);
  });

  it('keeps rendering correctly past the cache bound', () => {
    for (let i = 0; i < 1500; i += 1) renderMath(`x_{${i}}`);
    assert.equal(renderMath('x_{0}'), renderMath('x_{0}'));
    assert.match(renderMath('x_{1499}'), /1499/);
  });

  it('throws on malformed math every time, caching nothing', () => {
    assert.throws(() => renderMath('\\frac{a}'));
    assert.throws(() => renderMath('\\frac{a}'));
  });
});
