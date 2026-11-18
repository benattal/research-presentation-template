import { useState } from 'react';
import { useAnimation, useStepTransition } from '../canvas/canvas.js';

/**
 * Progress, from 0 to 1, of the move into build step `step`: it rises over
 * `duration` ms after the slide moves forward by one step, and is 1
 * otherwise (on arriving at the slide, after moving back, in still frames).
 * The plane slides draw a step as the previous step's picture plus
 * `progress` of what the step adds.
 *
 * Call it from a component that stays mounted across build steps: a
 * component mounted by the step change counts as arriving and settles at
 * once (`useAnimation`).
 */
export function useStepProgress(step, duration) {
  const from = useStepTransition(step);
  const [progress, setProgress] = useState({ step, value: 1 });
  useAnimation(step, from === null ? 0 : duration, (value) => setProgress({ step, value }));
  if (progress.step === step) return progress.value;
  // The render between the step change and the animation's first frame shows the start.
  return from === null ? 1 : 0;
}
