import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  clampPosition,
  directionBetween,
  isFirstPosition,
  isLastPosition,
  nextPosition,
  previousPosition,
} from '../core/client/navigation/position.js';

// Three slides: one step, three build steps, one step.
const slides = [{}, { buildSteps: [{}, {}, {}] }, {}];

describe('slide positions', () => {
  it('walks forward through build steps, then to the next slide, and stops at the end', () => {
    const visited = [{ index: 0, step: 0 }];
    for (let i = 0; i < 6; i += 1) visited.push(nextPosition(slides, visited.at(-1)));
    assert.deepEqual(visited.map(({ index, step }) => `${index}.${step}`), ['0.0', '1.0', '1.1', '1.2', '2.0', '2.0', '2.0']);
  });

  it('walks back onto the last build step of the previous slide, and stops at the start', () => {
    assert.deepEqual(previousPosition(slides, { index: 2, step: 0 }), { index: 1, step: 2 });
    assert.deepEqual(previousPosition(slides, { index: 1, step: 1 }), { index: 1, step: 0 });
    assert.deepEqual(previousPosition(slides, { index: 0, step: 0 }), { index: 0, step: 0 });
  });

  it('clamps positions that arrive from outside', () => {
    assert.deepEqual(clampPosition(slides, { index: 9, step: 9 }), { index: 2, step: 0 });
    assert.deepEqual(clampPosition(slides, { index: 1, step: 7 }), { index: 1, step: 2 });
    assert.deepEqual(clampPosition(slides, { index: -3, step: 'x' }), { index: 0, step: 0 });
    assert.deepEqual(clampPosition(slides, {}), { index: 0, step: 0 });
  });

  it('knows the ends and the direction of a move', () => {
    assert.ok(isFirstPosition({ index: 0, step: 0 }));
    assert.ok(isLastPosition(slides, { index: 2, step: 0 }));
    assert.ok(!isLastPosition(slides, { index: 1, step: 2 }));
    assert.equal(directionBetween({ index: 1, step: 2 }, { index: 2, step: 0 }), 1);
    assert.equal(directionBetween({ index: 1, step: 2 }, { index: 1, step: 1 }), -1);
    assert.equal(directionBetween({ index: 1, step: 1 }, { index: 1, step: 1 }), 0);
  });
});
