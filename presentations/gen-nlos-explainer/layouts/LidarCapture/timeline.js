/**
 * What the lidar slide shows at each moment of each build step, as a pure
 * function of the step and the time since it began: the scene time of the
 * light (ns, 0 when the pulse leaves the laser), which light is drawn, and
 * how far the measurement plot is swept. The first step is one measurement
 * in one run: the pulse leaves the laser, its direct return comes back, the
 * light from x_p reaches the hidden object and returns, and the plot is
 * swept once across both peaks. The second step is the scan. Each step ends
 * in a settled frame.
 */
import { TIMES } from './cornerScene.js';

/** The two build steps, in order. */
export const STEPS = ['measurement', 'scan'];

/** Playback speed of the light: ms of the slide per ns of scene time. */
const MS_PER_NS = 340;
/** The pause before the pulse leaves, in ms: the narration's first words name what is about to move. */
const LEAD_MS = 1200;
/** When the scan starts and how long it takes, in ms. */
const SCAN_START_MS = 600;
const SCAN_MS = 5200;

/** Scene times (ns): where the measurement's light starts, and where its indirect light has passed. */
const PULSE_START = -0.4;
const INDIRECT_END = TIMES.direct + 9;

/** The plot's time axis ends here (ns). */
export const PLOT_END = Math.ceil(INDIRECT_END) + 1;

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function smoothstep(from, to, v) {
  const t = clamp01((v - from) / (to - from));
  return t * t * (3 - 2 * t);
}

/** The moment of each step a still frame shows (ms into the step): the measurement complete; the scan complete. */
const STILL_MS = {
  measurement: LEAD_MS + (INDIRECT_END - PULSE_START) * MS_PER_NS,
  scan: SCAN_START_MS + SCAN_MS + 1000,
};

export function stillAt(step) {
  return STILL_MS[STEPS[step]];
}

/** The time into each step (ms) from which its frames no longer change: the measurement complete (its still frame); the scan complete. */
const SETTLED_MS = {
  measurement: STILL_MS.measurement,
  scan: SCAN_START_MS + SCAN_MS,
};

export function settledAt(step) {
  return SETTLED_MS[STEPS[step]];
}

/**
 * The frame at `ms` into build step `step`:
 *
 * - `time`: scene time (ns);
 * - `outgoing`, `directReturn`, `indirect`: which light runs at `time`
 *   (the laser's pulse; its direct return from x_p; the light from x_p to
 *   the hidden object and back). The two returns run together;
 * - `trace`, `spot`, `path`: opacity of the beam's faint trace between the
 *   lidar and x_p, of the lit spot at x_p, and of the line between x_p and
 *   the hidden object;
 * - `hiddenGlow`: how much of the hidden object's faint light shows (the
 *   scan fades it);
 * - `scan`: progress of the raster scan, 0 to 1, or null before it;
 * - `plot`: the measurement plot's opacity, how far its trace is drawn
 *   (`sweep`, ns), the cursor's opacity, and its two labels' opacities.
 */
export function frameAt(step, ms) {
  const phase = STEPS[step];
  if (!phase) throw new Error(`lidarCapture: no build step ${step}; the slide has ${STEPS.length}`);

  if (phase === 'measurement') {
    const time = Math.min(INDIRECT_END, PULSE_START + Math.max(0, ms - LEAD_MS) / MS_PER_NS);
    const returning = time >= TIMES.hit;
    return {
      time,
      outgoing: !returning,
      directReturn: returning,
      indirect: returning,
      trace: 1,
      spot: smoothstep(TIMES.hit - 0.1, TIMES.hit + 0.25, time),
      path: returning ? 1 : 0,
      hiddenGlow: 1,
      scan: null,
      plot: {
        opacity: 1,
        sweep: time,
        cursor: 1 - smoothstep(INDIRECT_END - 0.4, INDIRECT_END, time),
        direct: smoothstep(TIMES.direct + 0.2, TIMES.direct + 0.7, time),
        indirect: smoothstep(INDIRECT_END - 1.6, INDIRECT_END - 0.9, time),
      },
    };
  }

  // The scan: the light of the one measurement fades and the laser visits every scan point.
  const fade = 1 - smoothstep(0, SCAN_START_MS, ms);
  return {
    time: INDIRECT_END,
    outgoing: false,
    directReturn: false,
    indirect: false,
    trace: fade,
    spot: fade,
    path: fade,
    hiddenGlow: fade,
    scan: clamp01((ms - SCAN_START_MS) / SCAN_MS),
    plot: { opacity: 1, sweep: INDIRECT_END, cursor: 0, direct: 1, indirect: 1 },
  };
}
