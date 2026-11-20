/**
 * What the lidar slide shows at each moment of each build step, as a pure
 * function of the step and the time since it began: which light is drawn in
 * the scene and at what scene time (ns, 0 when a pulse leaves the laser),
 * how far the measurement plot is swept, and what the video of propagating
 * light shows. Four steps, each ending in a settled frame:
 *
 * - `video`: the scene's video of propagating light plays once;
 * - `measurement`: one measurement in one run. The pulse leaves the laser,
 *   its direct return comes back, the light from the visible point reaches
 *   the hidden object and returns, and the plot is swept once across both
 *   peaks; then the plot marks the time of flight;
 * - `relays`: the measurements at three other visible points, one after
 *   another, each from the moment its pulse reaches the point until its
 *   indirect light has returned to the point. The way from the laser and
 *   back to the detector is not played again: the plot is swept at the
 *   time the light now at the point reaches the detector;
 * - `scan`: the laser visits every scan point, the video fills in the
 *   scan's order, and then plays.
 *
 * Light moves at one playback speed throughout, in the scene, on the plot,
 * and in the video.
 */
import { RELAYS, VIDEO_SPAN } from './cornerScene.js';

/** The four build steps, in order. */
export const STEPS = ['video', 'measurement', 'relays', 'scan'];

/** Playback speed of the light: ms of the slide per ns of scene time. */
const MS_PER_NS = 340;

/** The pause before the video plays, in ms. */
const VIDEO_LEAD_MS = 100;
const VIDEO_MS = (VIDEO_SPAN.rest - VIDEO_SPAN.start) * MS_PER_NS;

/** The pause before the pulse leaves, in ms: the narration's first words name what is about to move. */
const PULSE_LEAD_MS = 1200;
/** How long the plot takes to appear and the video's light to fade when the measurement begins, in ms. */
const PLOT_IN_MS = 400;
/** Scene times (ns) of the first measurement: where its light starts, and where its indirect light has passed. */
const PULSE_START = -0.4;
const INDIRECT_END = RELAYS[0].direct + RELAYS[0].indirectEnd;
const SWEEP_END_MS = PULSE_LEAD_MS + (INDIRECT_END - PULSE_START) * MS_PER_NS;
/** The time of flight is marked on the plot from this moment, over this long (ms): as the narration names it. */
const FLIGHT_START_MS = SWEEP_END_MS + 900;
const FLIGHT_MS = 1200;

/** How long the first measurement's light takes to fade before the other points, in ms. */
const RELAYS_LEAD_MS = 150;
/**
 * The measurement of each further point runs over these delays (ns) about
 * the moment its pulse reaches it: from a little before, so the plot's
 * sweep starts ahead of the direct peak, until a little after its indirect
 * light has passed.
 */
const RELAY_LEAD = 0.4;
const RELAY_TAIL = 0.1;
/** How bright the plot draws the measurements before the current one. */
const EARLIER_LEVEL = 0.38;

/** When each further point's measurement starts, in ms into the `relays` step, and how long it lasts in ns; the step's length. */
const RELAY_SLOTS = [];
let relaysEndMs = RELAYS_LEAD_MS;
for (let relay = 1; relay < RELAYS.length; relay++) {
  const span = RELAY_LEAD + RELAYS[relay].indirectEnd + RELAY_TAIL;
  RELAY_SLOTS.push({ relay, startMs: relaysEndMs, span });
  relaysEndMs += span * MS_PER_NS;
}

/** When the scan starts and how long it takes, and the pause before the video plays, in ms. */
const SCAN_START_MS = 500;
const SCAN_MS = 4000;
const PLAY_START_MS = SCAN_START_MS + SCAN_MS + 250;

/** The plot's time axis ends here (ns): past the indirect light of every measured point. */
export const PLOT_END = Math.ceil(Math.max(...RELAYS.map((relay) => relay.direct + relay.indirectEnd))) + 1;

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function smoothstep(from, to, v) {
  const t = clamp01((v - from) / (to - from));
  return t * t * (3 - 2 * t);
}

/** The time into each step (ms) from which its frames no longer change. */
const SETTLED_MS = {
  video: VIDEO_LEAD_MS + VIDEO_MS,
  measurement: FLIGHT_START_MS + FLIGHT_MS,
  relays: relaysEndMs,
  scan: PLAY_START_MS + VIDEO_MS,
};

export function settledAt(step) {
  return SETTLED_MS[STEPS[step]];
}

/** A measurement's whole trace on the plot: swept to the end of its indirect light. */
function sweptTrace(relay, level) {
  return { sweep: RELAYS[relay].direct + RELAYS[relay].indirectEnd, level };
}

/** A frame with no light in the scene, the plot hidden, and the video at rest: each step changes what it shows. */
function restFrame() {
  return {
    relay: 0,
    time: 0,
    outgoing: false,
    returns: false,
    indirect: false,
    flash: false,
    trace: 0,
    glow: 0,
    path: 0,
    depth: 0,
    hiddenGlow: 0,
    spots: RELAYS.map(() => 0),
    scan: null,
    plot: { opacity: 0, traces: [], cursor: { at: 0, opacity: 0 }, direct: 0, indirect: 0, flight: 0 },
    video: { time: VIDEO_SPAN.rest, light: 1, blank: 0, reveal: null, markers: RELAYS.map(() => 0) },
    sceneLight: 0,
  };
}

const PHASES = {
  video(ms) {
    const frame = restFrame();
    frame.video.time = Math.min(VIDEO_SPAN.rest, VIDEO_SPAN.start + Math.max(0, ms - VIDEO_LEAD_MS) / MS_PER_NS);
    return frame;
  },

  measurement(ms) {
    const time = Math.min(INDIRECT_END, PULSE_START + Math.max(0, ms - PULSE_LEAD_MS) / MS_PER_NS);
    const { hit, direct } = RELAYS[0];
    const returning = time >= hit;
    const lit = smoothstep(hit - 0.1, hit + 0.25, time);
    const flight = smoothstep(FLIGHT_START_MS, FLIGHT_START_MS + FLIGHT_MS, ms);
    return {
      ...restFrame(),
      time,
      outgoing: !returning,
      returns: returning,
      indirect: returning,
      flash: true,
      trace: 1,
      glow: lit,
      path: returning ? 1 : 0,
      // The path between the mirrors and the point brightens while the time of flight is marked, then eases back.
      depth: Math.sin(Math.PI * flight) ** 2,
      hiddenGlow: 1,
      spots: RELAYS.map((_, relay) => (relay === 0 ? lit : 0)),
      plot: {
        opacity: smoothstep(0, PLOT_IN_MS, ms),
        traces: [{ sweep: time, level: 1 }],
        cursor: { at: time, opacity: 1 - smoothstep(INDIRECT_END - 0.4, INDIRECT_END, time) },
        direct: smoothstep(direct + 0.2, direct + 0.7, time),
        indirect: smoothstep(INDIRECT_END - 1.6, INDIRECT_END - 0.9, time),
        flight,
      },
      video: { time: VIDEO_SPAN.rest, light: 1 - smoothstep(0, PLOT_IN_MS, ms), blank: 0, reveal: null, markers: RELAYS.map((_, relay) => (relay === 0 ? lit : 0)) },
    };
  },

  relays(ms) {
    const frame = restFrame();
    frame.hiddenGlow = 1;
    frame.video.light = 0;
    frame.plot = { ...frame.plot, opacity: 1, direct: 1, indirect: 1 };

    if (ms < RELAYS_LEAD_MS) {
      // The first measurement's light fades; its point stays marked.
      const fade = 1 - smoothstep(0, RELAYS_LEAD_MS, ms);
      frame.time = INDIRECT_END;
      frame.indirect = true;
      frame.trace = fade;
      frame.glow = fade;
      frame.path = fade;
      frame.hiddenGlow = fade;
      frame.spots[0] = 1;
      frame.plot.traces = [sweptTrace(0, EARLIER_LEVEL + (1 - EARLIER_LEVEL) * fade)];
      frame.plot.flight = fade;
      // Its mark in the video stays, dimmed like its trace.
      frame.video.markers[0] = EARLIER_LEVEL + (1 - EARLIER_LEVEL) * fade;
      return frame;
    }

    const slot = RELAY_SLOTS.findLast(({ startMs }) => ms >= startMs);
    const last = slot === RELAY_SLOTS.at(-1);
    const { hit, direct, indirectEnd } = RELAYS[slot.relay];
    const delay = Math.min(indirectEnd + RELAY_TAIL, (ms - slot.startMs) / MS_PER_NS - RELAY_LEAD);
    // Each measurement but the last gives way to the next.
    const leaving = last ? 1 : 1 - smoothstep(indirectEnd + RELAY_TAIL - 0.6, indirectEnd + RELAY_TAIL, delay);
    const lit = smoothstep(-0.1, 0.25, delay);
    frame.relay = slot.relay;
    frame.time = hit + delay;
    frame.indirect = true;
    frame.flash = true;
    frame.trace = smoothstep(-RELAY_LEAD, -RELAY_LEAD + 0.3, delay) * leaving;
    frame.glow = lit * leaving;
    frame.path = leaving;
    frame.hiddenGlow = leaving;
    frame.spots = RELAYS.map((_, relay) => (relay < slot.relay ? 1 : relay === slot.relay ? lit : 0));
    frame.plot.traces = RELAYS.slice(0, slot.relay).map((_, relay) => sweptTrace(relay, EARLIER_LEVEL));
    frame.plot.traces.push({ sweep: direct + delay, level: 1 });
    frame.plot.cursor = {
      at: direct + delay,
      opacity: smoothstep(-RELAY_LEAD, -RELAY_LEAD + 0.15, delay) * (1 - smoothstep(indirectEnd + RELAY_TAIL - 0.4, indirectEnd + RELAY_TAIL, delay)),
    };
    // Earlier points stay marked in the video, dimmed like their traces; the point being measured is marked in full.
    frame.video.markers = RELAYS.map((_, relay) => (relay < slot.relay ? EARLIER_LEVEL : relay === slot.relay ? lit : 0));
    return frame;
  },

  scan(ms) {
    // The light of the last measurement fades, and the laser visits every scan point.
    const frame = restFrame();
    const fade = 1 - smoothstep(0, SCAN_START_MS, ms);
    const lastRelay = RELAYS.length - 1;
    frame.relay = lastRelay;
    frame.time = RELAYS[lastRelay].hit + RELAYS[lastRelay].indirectEnd + RELAY_TAIL;
    frame.indirect = true;
    frame.trace = fade;
    frame.glow = fade;
    frame.path = fade;
    frame.hiddenGlow = fade;
    frame.spots = RELAYS.map(() => fade);
    frame.scan = clamp01((ms - SCAN_START_MS) / SCAN_MS);
    frame.plot = {
      ...frame.plot,
      opacity: 1,
      traces: RELAYS.map((_, relay) => sweptTrace(relay, relay === lastRelay ? EARLIER_LEVEL + (1 - EARLIER_LEVEL) * fade : EARLIER_LEVEL)),
      direct: 1,
      indirect: 1,
    };
    // The video empties, fills in the scan's order, and then plays. Its light comes up before the first of it arrives.
    frame.video = {
      time: Math.min(VIDEO_SPAN.rest, VIDEO_SPAN.start + Math.max(0, ms - PLAY_START_MS) / MS_PER_NS),
      light: smoothstep(SCAN_START_MS + SCAN_MS, PLAY_START_MS, ms),
      blank: 1 - fade,
      reveal: frame.scan,
      markers: RELAYS.map((_, relay) => (relay === lastRelay ? 1 : EARLIER_LEVEL) * fade),
    };
    // The scene plays the same light, faintly, with the video.
    frame.sceneLight = frame.video.light;
    return frame;
  },
};

/**
 * The frame at `ms` into build step `step`:
 *
 * - `relay`: which of `RELAYS` is being measured, and `time`: the scene
 *   time of its measurement (ns from the moment its pulse leaves the
 *   laser);
 * - `outgoing`, `returns`, `indirect`: which light runs at `time`
 *   (the laser's pulse; the direct return and the indirect light back
 *   along the beam; the wavefronts from
 *   the point to the hidden object and back), and `flash`: whether the
 *   point flashes as the pulse reaches it;
 * - `trace`, `glow`, `path`: opacity of the beam's faint trace between the
 *   lidar and the point, of the glow at the point, and of the line between
 *   the point and the hidden object; `depth`: how much brighter the trace
 *   between the mirrors and the point is drawn;
 * - `spots`: for each of `RELAYS`, the opacity of the lit spot that marks
 *   a point once it has been measured;
 * - `hiddenGlow`: how much of the hidden object's faint light shows;
 * - `scan`: progress of the raster scan, 0 to 1, or null before it;
 * - `plot`: the measurement plot's opacity; its `traces`, one per measured
 *   point in the order of `RELAYS`, each drawn as far as `sweep` (ns) at
 *   brightness `level`; the cursor's place (ns) and opacity; and the
 *   opacities of its labels (`direct`, `indirect`, and `flight`, the time
 *   of flight, which is also how much of that mark is drawn);
 * - `video`: the video's `time` (ns); `light`, how much of the light at
 *   that time shows over the still image; `blank`, how far the pixels the
 *   scan has not reached have faded to black; `reveal`, the scan's
 *   progress when the video fills in its order, or null when every pixel
 *   shows; and `markers`, for each of `RELAYS`, the opacity of the ring
 *   that marks that point in it (earlier points dimmed, as their traces
 *   are);
 * - `sceneLight`: how much of the video's light at its `time` is drawn
 *   on the scene's surfaces, 0 to 1 (only while the scanned video plays).
 */
export function frameAt(step, ms) {
  const phase = PHASES[STEPS[step]];
  if (!phase) throw new Error(`lidarCapture: no build step ${step}; the slide has ${STEPS.length}`);
  return phase(ms);
}
