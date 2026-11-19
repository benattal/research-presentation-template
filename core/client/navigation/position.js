/**
 * Slide positions and the moves between them.
 *
 * A position is `{ index, step }`: the slide's index in the flat slide list
 * and its 0-based build step. Pure functions only; `useSlidePosition` owns
 * the state.
 */
import { stepCount } from '../presentation/model.js';

/** The position after `position`, or `position` itself at the end. */
export function nextPosition(slides, position) {
  if (position.step < stepCount(slides[position.index]) - 1) {
    return { index: position.index, step: position.step + 1 };
  }
  if (position.index < slides.length - 1) {
    return { index: position.index + 1, step: 0 };
  }
  return position;
}

/**
 * The position before `position`, or `position` itself at the start.
 * Stepping back onto a slide lands on its last build step, so going back
 * shows the slide as it was left.
 */
export function previousPosition(slides, position) {
  if (position.step > 0) {
    return { index: position.index, step: position.step - 1 };
  }
  if (position.index > 0) {
    const index = position.index - 1;
    return { index, step: stepCount(slides[index]) - 1 };
  }
  return position;
}

/**
 * The nearest valid position to a requested one: the index is clamped to
 * the slide list and the step to that slide's build steps. Used for
 * positions that arrive from outside (storage, the presenter, the URL).
 */
export function clampPosition(slides, { index, step }) {
  const safeIndex = Number.isInteger(index) ? Math.min(Math.max(index, 0), slides.length - 1) : 0;
  const lastStep = stepCount(slides[safeIndex]) - 1;
  const safeStep = Number.isInteger(step) ? Math.min(Math.max(step, 0), lastStep) : 0;
  return { index: safeIndex, step: safeStep };
}

/**
 * The `sessionStorage` key a window keeps its position under, as JSON. It
 * includes the presentation id: every presentation of the live gateway
 * shares one origin. `npm run record` writes it to open a presentation at
 * the step a recording starts from.
 */
export function positionStorageKey(presentationId) {
  return `${presentationId}:slide-position`;
}

export function isFirstPosition(position) {
  return position.index === 0 && position.step === 0;
}

export function isLastPosition(slides, position) {
  return position.index === slides.length - 1
    && position.step === stepCount(slides[position.index]) - 1;
}

/** +1 when `to` is after `from`, -1 when before, 0 when equal. */
export function directionBetween(from, to) {
  if (to.index !== from.index) return Math.sign(to.index - from.index);
  return Math.sign(to.step - from.step);
}
