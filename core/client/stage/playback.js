/**
 * Time on a slide: the step clock that layouts animate by, and the virtual
 * clock the record view (`?mode=record`) drives it with, so a recording
 * shows the same frames however slowly the machine renders them.
 */
import { useEffect, useRef } from 'react';
import { stillFrames } from './canvas.js';

/**
 * The time, in ms, a still frame shows by default: longer than any slide's
 * animation, so one that eases to an end shows its end.
 */
export const SETTLED_MS = 60_000;

/**
 * The record view's virtual clock, once it has started: `ms` is the time
 * the recorder last sought to, and `redraws` holds a redraw for every step
 * clock on the page. A record page shows one slide step and is then
 * reloaded, so the clock never stops.
 */
let virtual = null;

/**
 * Switch every step clock on the page to a virtual clock that moves only
 * when `seek(ms)` sets it. The record view calls it during render, before
 * any layout's effect asks for the time; later calls return the same clock.
 * `seek` redraws every step clock synchronously; `subscribers` counts them.
 */
export function startVirtualClock() {
  virtual ??= { ms: 0, redraws: new Set() };
  return {
    get subscribers() {
      return virtual.redraws.size;
    },
    seek(ms) {
      virtual.ms = ms;
      for (const redraw of virtual.redraws) redraw();
    },
  };
}

/**
 * Where a step clock reads its time. Each source starts drawing with
 * `draw(ms)` and returns `redraw`, which draws the current time again, and
 * `stop`.
 */
const CLOCK_SOURCES = {
  /** The record view's clock: time moves only when the recorder seeks. */
  virtual: (draw) => {
    const startedAt = virtual.ms;
    const redraw = () => draw(virtual.ms - startedAt);
    virtual.redraws.add(redraw);
    return { redraw, stop: () => virtual.redraws.delete(redraw) };
  },
  /** One still frame (the capture view, reduced motion). */
  still: (draw, still) => ({ redraw: () => draw(still), stop: () => {} }),
  /** Real time, on every animation frame. */
  frames: (draw) => {
    // Time from the first frame's timestamp: a frame's timestamp is when the
    // frame began, which can precede this effect, and time must not start below 0.
    let start = null;
    let handle = 0;
    const tick = (now) => {
      start ??= now;
      draw(now - start);
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    // The next frame draws whatever changed.
    return { redraw: () => {}, stop: () => cancelAnimationFrame(handle) };
  },
};

function clockSource() {
  if (virtual) return 'virtual';
  return stillFrames() ? 'still' : 'frames';
}

/**
 * Call `draw(ms)` with the time since `key` (usually the build step) began,
 * arrival on the slide included: on every animation frame in the audience,
 * presenter, and preview views; once with `still` (default `SETTLED_MS`)
 * when `stillFrames()` holds (the capture view, reduced motion); and in the
 * record view whenever the recorder seeks its virtual clock
 * (`startVirtualClock().seek`), which also makes the slide count as
 * animated there.
 *
 * Without a running clock (still, virtual) the frame is drawn again after
 * every render of the layout, so a canvas that a render resized or cleared,
 * or state that changed (a model that finished loading), shows up. `draw`
 * may change on every render; the latest one draws. The clock stops on
 * unmount and starts over from 0 when `key` changes.
 */
export function useStepClock(key, draw, { still = SETTLED_MS } = {}) {
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const redrawRef = useRef(null);

  useEffect(() => {
    const source = CLOCK_SOURCES[clockSource()]((ms) => drawRef.current(ms), still);
    redrawRef.current = source.redraw;
    return () => {
      source.stop();
      redrawRef.current = null;
    };
  }, [key, still]);

  // Declared after the effect above, so on mount and on a new key this draws the first frame.
  useEffect(() => {
    redrawRef.current();
  });
}
