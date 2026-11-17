import { useCallback, useEffect, useMemo, useReducer } from 'react';
import {
  clampPosition,
  directionBetween,
  isFirstPosition,
  isLastPosition,
  nextPosition,
  previousPosition,
} from './position.js';

function storageKey(presentationId) {
  return `${presentationId}:slide-position`;
}

function readStoredPosition(presentationId) {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey(presentationId))) ?? { index: 0, step: 0 };
  } catch {
    return { index: 0, step: 0 };
  }
}

function moveTo(state, position) {
  const direction = directionBetween(state.position, position);
  if (direction === 0) return state;
  return { position, direction };
}

function reducer(state, action) {
  switch (action.type) {
    case 'next':
      return moveTo(state, nextPosition(action.slides, state.position));
    case 'previous':
      return moveTo(state, previousPosition(action.slides, state.position));
    case 'set':
      return moveTo(state, clampPosition(action.slides, action.position));
    default:
      throw new Error(`Unknown slide position action "${action.type}"`);
  }
}

/**
 * The current slide position of one window, and the moves that change it.
 *
 * The position is restored from and saved to `sessionStorage` under a key
 * that includes the presentation id, so a reload returns to the same slide
 * and two presentations served from one origin do not share a position.
 * `direction` is +1 after a forward move and -1 after a backward one; slide
 * transitions read it.
 */
export default function useSlidePosition(presentation, { persist = true } = {}) {
  const { slides } = presentation;
  const [state, dispatch] = useReducer(reducer, null, () => ({
    position: clampPosition(slides, persist ? readStoredPosition(presentation.id) : { index: 0, step: 0 }),
    direction: 1,
  }));

  useEffect(() => {
    if (!persist) return;
    try {
      sessionStorage.setItem(storageKey(presentation.id), JSON.stringify(state.position));
    } catch {
      // Storage can be unavailable (private windows, sandboxed iframes); the position then lasts until reload.
    }
  }, [persist, presentation.id, state.position]);

  const next = useCallback(() => dispatch({ type: 'next', slides }), [slides]);
  const previous = useCallback(() => dispatch({ type: 'previous', slides }), [slides]);
  const setPosition = useCallback((position) => dispatch({ type: 'set', slides, position }), [slides]);
  const goTo = useCallback((index) => dispatch({ type: 'set', slides, position: { index, step: 0 } }), [slides]);

  return useMemo(() => ({
    slide: slides[state.position.index],
    position: state.position,
    direction: state.direction,
    isFirst: isFirstPosition(state.position),
    isLast: isLastPosition(slides, state.position),
    next,
    previous,
    goTo,
    setPosition,
  }), [slides, state, next, previous, goTo, setPosition]);
}
