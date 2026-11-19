/**
 * What the lidar slide shows at each moment of each build step, as a pure
 * function of the step and the time since it began: the scene time of the
 * light (ns, 0 when the pulse leaves the laser), which light is drawn, and
 * how far the measurement plot is swept. The direct and indirect steps each
 * run the measurement from the pulse leaving the laser, so the light is seen
 * going out before it comes back. Each step ends in a settled frame.
 */
import { BUNNY, LIGHT_SPEED, MIRRORS_TO_RELAY, RELAY_POINT, TIMES, distance } from './cornerScene.js';

/** The four build steps, in order. */
export const STEPS = ['pulse', 'direct', 'indirect', 'scan'];

/** Playback speed of the light: ms of the slide per ns of scene time. */
const MS_PER_NS = 420;
/** Per step, the pause before its light moves, in ms: the narration's first words name what is about to move. */
const LEAD_MS = { pulse: 2000, direct: 700, indirect: 500 };
/** When the plot's axes appear in the first step, in ms: as the narration turns to the measurement. */
const AXES_IN_MS = [6200, 6900];
/** When the scan starts and how long it takes, in ms. */
const SCAN_START_MS = 600;
const SCAN_MS = 5200;

/** Scene times (ns): where each step's light starts and ends. */
const PULSE_START = -0.4;
const PULSE_END = TIMES.hit + 0.8;
const DIRECT_END = TIMES.direct + 1.5;
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

/** Scene time (ns) at `ms` into a step whose light runs from `start` to `end` after `lead` ms. */
function sceneTime(ms, lead, start, end) {
  return Math.min(end, start + Math.max(0, ms - lead) / MS_PER_NS);
}

/** The time into a step (ms) at which its light is at scene time `time`. */
function msAt(time, lead, start) {
  return lead + (time - start) * MS_PER_NS;
}

/**
 * The moment of each step a still frame shows (ms into the step): the
 * pulse on its way to x_p; the direct return measured; the wavefront from
 * x_p crossing the hidden object; the scan complete.
 */
const HIDDEN_CENTER = [BUNNY.position[0], BUNNY.height / 2, BUNNY.position[2]];
const STILL_MS = {
  pulse: msAt(TIMES.hit - (0.42 * MIRRORS_TO_RELAY) / LIGHT_SPEED, LEAD_MS.pulse, PULSE_START),
  direct: msAt(DIRECT_END, LEAD_MS.direct, PULSE_START),
  indirect: msAt(TIMES.hit + distance(RELAY_POINT, HIDDEN_CENTER) / LIGHT_SPEED, LEAD_MS.indirect, PULSE_START),
  scan: SCAN_START_MS + SCAN_MS + 1000,
};

export function stillAt(step) {
  return STILL_MS[STEPS[step]];
}

/**
 * The frame at `ms` into build step `step`:
 *
 * - `time`: scene time (ns);
 * - `outgoing`, `directReturn`, `indirect`: which light runs at `time`
 *   (the laser's pulse; its direct return from x_p; the light from x_p to
 *   the hidden object and back);
 * - `trace`, `spot`, `path`: opacity of the beam's faint trace between the
 *   lidar and x_p, of the lit spot at x_p, and of the line between x_p and
 *   the hidden object;
 * - `hiddenGlow`: how much of the hidden object's faint light shows (none
 *   before the indirect step; the scan fades it);
 * - `scan`: progress of the raster scan, 0 to 1, or null before it;
 * - `plot`: the measurement plot's opacity, how far its trace is drawn
 *   (`sweep`, ns), the cursor's opacity, and its two labels' opacities.
 */
export function frameAt(step, ms) {
  const phase = STEPS[step];
  if (!phase) throw new Error(`lidarCapture: no build step ${step}; the slide has ${STEPS.length}`);
  const frame = {
    time: 0,
    outgoing: false,
    directReturn: false,
    indirect: false,
    trace: 1,
    spot: 1,
    path: 0,
    hiddenGlow: 0,
    scan: null,
    plot: { opacity: 1, sweep: DIRECT_END, cursor: 0, direct: 1, indirect: 0 },
  };

  if (phase === 'pulse') {
    frame.time = sceneTime(ms, LEAD_MS.pulse, PULSE_START, PULSE_END);
    frame.outgoing = true;
    frame.spot = smoothstep(TIMES.hit - 0.1, TIMES.hit + 0.25, frame.time);
    // The empty plot, waiting at the moment the pulse reached x_p.
    frame.plot = { opacity: smoothstep(...AXES_IN_MS, ms), sweep: Math.min(frame.time, TIMES.hit), cursor: 1, direct: 0, indirect: 0 };
    return frame;
  }

  if (phase === 'direct') {
    // The measurement again from the start: the pulse leaves the laser, then its direct return comes back.
    frame.time = sceneTime(ms, LEAD_MS.direct, PULSE_START, DIRECT_END);
    frame.outgoing = frame.time < TIMES.hit;
    frame.directReturn = !frame.outgoing;
    frame.spot = smoothstep(TIMES.hit - 0.1, TIMES.hit + 0.25, frame.time);
    frame.plot.sweep = frame.time;
    frame.plot.cursor = 1 - smoothstep(DIRECT_END - 0.4, DIRECT_END, frame.time);
    frame.plot.direct = smoothstep(TIMES.direct + 0.2, TIMES.direct + 0.7, frame.time);
    return frame;
  }

  frame.path = 1;
  frame.hiddenGlow = 1;
  frame.plot.sweep = INDIRECT_END;
  frame.plot.indirect = 1;

  if (phase === 'indirect') {
    // The measurement once more: the pulse leaves the laser, then the light from x_p reaches the hidden object and returns.
    frame.time = sceneTime(ms, LEAD_MS.indirect, PULSE_START, INDIRECT_END);
    frame.outgoing = frame.time < TIMES.hit;
    frame.indirect = !frame.outgoing;
    frame.spot = smoothstep(TIMES.hit - 0.1, TIMES.hit + 0.25, frame.time);
    frame.path = frame.indirect ? 1 : 0;
    // The plot waits where the direct return left it until the light's time passes that point.
    frame.plot.sweep = Math.max(DIRECT_END, frame.time);
    frame.plot.cursor = frame.time > DIRECT_END ? 1 - smoothstep(INDIRECT_END - 0.4, INDIRECT_END, frame.time) : 0;
    frame.plot.indirect = smoothstep(INDIRECT_END - 1.6, INDIRECT_END - 0.9, frame.time);
    return frame;
  }

  // The scan: the light of the one measurement fades and the laser visits every scan point.
  const fade = 1 - smoothstep(0, SCAN_START_MS, ms);
  frame.time = INDIRECT_END;
  frame.trace = fade;
  frame.spot = fade;
  frame.path = fade;
  frame.hiddenGlow = fade;
  frame.scan = clamp01((ms - SCAN_START_MS) / SCAN_MS);
  return frame;
}
