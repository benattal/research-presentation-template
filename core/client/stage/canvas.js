/**
 * Canvas plumbing for interactive layouts: a canvas drawn
 * at the resolution it is shown at, an animation clock, and the still-frame
 * switch the capture view uses.
 */
import { MotionGlobalConfig } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * True when animations must not play: the capture view sets framer-motion's
 * `skipAnimations` (it owns that switch), and viewers may ask for reduced
 * motion. Animated layouts then draw their settled frame at once.
 */
export function stillFrames() {
  return MotionGlobalConfig.skipAnimations === true
    || (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

/**
 * A ref for a <canvas> and the device-pixel ratio to draw it at, so lines
 * stay sharp however much the 1280×720 stage is scaled. Give the canvas
 * `width={w * ratio} height={h * ratio}` and CSS size w × h, and draw after
 * `ctx.setTransform(ratio, 0, 0, ratio, 0, 0)` in stage pixels.
 */
export function useStageCanvas() {
  const ref = useRef(null);
  const [ratio, setRatio] = useState(1);
  useLayoutEffect(() => {
    const canvas = ref.current;
    const measure = () => {
      const scale = canvas.offsetWidth ? canvas.getBoundingClientRect().width / canvas.offsetWidth : 1;
      setRatio(Math.min(3, Math.max(1, Math.round(scale * (window.devicePixelRatio || 1) * 4) / 4)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return [ref, ratio];
}

/** How long after a layout mounts its animations still count as arriving on the slide, in ms. */
const ARRIVAL_MS = 400;

/**
 * Run `frame(progress)` on every animation frame for `duration` ms, with
 * progress from 0 to 1, whenever `key` changes; `frame(1)` alone in still
 * mode and on arriving at the slide (within ARRIVAL_MS of mounting). Cancels
 * on unmount and when `key` changes mid-animation.
 */
export function useAnimation(key, duration, frame) {
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const mountedAt = useRef(null);
  useEffect(() => {
    mountedAt.current ??= performance.now();
    // Arriving on a slide shows its settled frame: an animation plays only
    // for a change made while the slide is shown (a build step, a click).
    // The canvas measures its pixel ratio just after mounting, which changes
    // `key` once more; that is still the arrival.
    const arriving = performance.now() - mountedAt.current < ARRIVAL_MS;
    if (duration <= 0 || stillFrames() || arriving) {
      frameRef.current(1);
      return undefined;
    }
    let handle = 0;
    // Time from the first frame's timestamp: a frame's timestamp is when the frame began, which
    // can precede a performance.now() read here, and progress must not start below 0.
    let start = null;
    const tick = (now) => {
      if (start === null) start = now;
      const progress = Math.min(1, (now - start) / duration);
      frameRef.current(progress);
      if (progress < 1) handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [key, duration]);
}

/**
 * The build step a slide moved forward from (`step - 1`) when it moved
 * forward by one, otherwise null: the step to animate from. It stays the
 * same for as long as the slide stays on `step`, however often the layout
 * re-renders meanwhile (a layout that updates state during its animation
 * must not see the animation's start change and jump to its end).
 */
export function useStepTransition(step) {
  const [transition, setTransition] = useState({ step, from: null });
  if (transition.step !== step) {
    const next = { step, from: step === transition.step + 1 ? transition.step : null };
    setTransition(next);
    return next.from;
  }
  return transition.from;
}

/** Smooth ease in and out, for progress in [0, 1]. */
export function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}
