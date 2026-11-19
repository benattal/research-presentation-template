/**
 * Recording a run-through of a presentation (`npm run record`): which steps
 * are shown and for how long, how the frames a browser sends fill a video of
 * constant frame rate, and where each narration segment goes.
 *
 * A step is one key press of the audience view: one build step of one
 * slide. Times are in seconds. The functions that read files say so;
 * the rest are pure, and `scripts/record.mjs` drives the browser and ffmpeg
 * with what they return.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { stepCount } from '../client/presentation/model.js';

/** A presentation's optional file of holds, beside its `presentation.json`. */
export const RECORDING_FILE = 'recording.json';

/** The holds of a presentation whose `recording.json` does not set them. */
const DEFAULT_HOLD_S = 5;
const DEFAULT_SILENT_HOLD_S = 2.5;

/** Added to a step's own motion, so the end of the motion is on screen before the next key press. */
export const MOTION_MARGIN_S = 0.5;
/** Silence between the end of a step's narration and the next key press. */
export const NARRATION_GAP_S = 0.35;
/** How long the recording shows its opening frame before the first step's time. */
export const LEAD_IN_S = 1.5;

const SETTING_NAMES = ['defaultHold', 'silentHold', 'holds'];
const HOLD_FIELD_NAMES = ['seconds', 'oneShot'];

function isSeconds(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

// ─── The presentation's steps ─────────────────────────────────────────

/**
 * The slides a presentation shows, in order, each its `content.json` plus
 * its `id`. Reads `slides/<slide-id>/content.json` of every slide the
 * manifest lists; throws naming the first file that is missing or malformed.
 */
export function readListedSlides(presentation) {
  return presentation.manifest.sections.flatMap((section) => section.slides).map((id) => ({
    ...readJson(join(presentation.dir, 'slides', id, 'content.json')),
    id,
  }));
}

/**
 * Every step of `slides`, in the order the audience view shows them:
 * `[{ index, slideIndex, slide, step, layout }]`, where `index` counts steps
 * from 0 across the presentation, `slide` is the slide's id, and `step` is
 * the 0-based build step within it.
 */
export function slideSteps(slides) {
  return slides.flatMap((slide, slideIndex) => (
    Array.from({ length: stepCount(slide) }, (_, step) => ({ slideIndex, slide: slide.id, step, layout: slide.layout }))
  )).map((each, index) => ({ index, ...each }));
}

/** The name narration and holds know a step by. */
function stepKey(slide, step) {
  return `${slide}/${step}`;
}

// ─── recording.json ───────────────────────────────────────────────────

/**
 * Every problem of a parsed `recording.json`, as sentences; empty when it
 * is valid. `slides` is the presentation's listed slides (each with `id`
 * and its `buildSteps`): holds name slides by id and give one entry per
 * build step.
 */
export function recordingProblems(recording, slides) {
  if (!isObject(recording)) return [`${RECORDING_FILE} must be an object.`];
  const problems = [];
  for (const name of Object.keys(recording).filter((each) => !SETTING_NAMES.includes(each))) {
    problems.push(`${RECORDING_FILE} has an unknown field "${name}" (it takes ${SETTING_NAMES.join(', ')}).`);
  }
  for (const name of ['defaultHold', 'silentHold']) {
    if (name in recording && !isSeconds(recording[name])) {
      problems.push(`${RECORDING_FILE}: "${name}" must be a positive number of seconds.`);
    }
  }
  if (!('holds' in recording)) return problems;
  if (!isObject(recording.holds)) return [...problems, `${RECORDING_FILE}: "holds" must be an object of slide id → one entry per build step.`];

  const slidesById = new Map(slides.map((slide) => [slide.id, slide]));
  for (const [slideId, entries] of Object.entries(recording.holds)) {
    const slide = slidesById.get(slideId);
    if (!slide) {
      problems.push(`${RECORDING_FILE}: holds name slide "${slideId}", which presentation.json does not list.`);
      continue;
    }
    if (!Array.isArray(entries)) {
      problems.push(`${RECORDING_FILE}: holds of slide "${slideId}" must be an array, one entry per build step.`);
      continue;
    }
    if (entries.length !== stepCount(slide)) {
      problems.push(`${RECORDING_FILE}: slide "${slideId}" has ${stepCount(slide)} build steps but ${entries.length} holds.`);
    }
    entries.forEach((entry, step) => {
      const where = `${RECORDING_FILE}: hold ${step} of slide "${slideId}"`;
      if (!isObject(entry)) {
        problems.push(`${where} must be an object with "seconds".`);
        return;
      }
      if (!isSeconds(entry.seconds)) problems.push(`${where} needs "seconds", a positive number.`);
      if ('oneShot' in entry && typeof entry.oneShot !== 'boolean') problems.push(`${where}: "oneShot" must be true or false.`);
      for (const name of Object.keys(entry).filter((each) => !HOLD_FIELD_NAMES.includes(each))) {
        problems.push(`${where} has an unknown field "${name}".`);
      }
    });
  }
  return problems;
}

/**
 * The parsed `recording.json` of the presentation in `presentationDir`, or
 * null when it has none. Reads the file; throws naming it when it is not
 * JSON.
 */
export function readRecordingFile(presentationDir) {
  const path = join(presentationDir, RECORDING_FILE);
  return existsSync(path) ? readJson(path) : null;
}

/**
 * Every problem of the `recording.json` in `presentationDir`, for
 * `npm run check`: a file that is not JSON, or what `recordingProblems`
 * finds. Empty when the file is valid or absent.
 */
export function recordingFileProblems(presentationDir, slides) {
  let recording = null;
  try {
    recording = readRecordingFile(presentationDir);
  } catch (error) {
    return [`${RECORDING_FILE} is not valid JSON: ${error.message}`];
  }
  return recording === null ? [] : recordingProblems(recording, slides);
}

/**
 * The holds to record with: a valid parsed `recording.json` (or null, for a
 * presentation without one) with the defaults filled in.
 */
export function holdSettings(recording) {
  return {
    defaultHold: recording?.defaultHold ?? DEFAULT_HOLD_S,
    silentHold: recording?.silentHold ?? DEFAULT_SILENT_HOLD_S,
    holds: recording?.holds ?? {},
  };
}

// ─── The plan: how long each step is held ─────────────────────────────

/**
 * How long one step stays on screen before the next key press.
 *
 * `motion` is the step's entry in `recording.json` (`{ seconds, oneShot }`)
 * or undefined. Without narration (`narrated` false) a step is held for its
 * motion plus `MOTION_MARGIN_S`, or for `defaultHold` when it has no entry.
 * With narration it is held for its segment plus `NARRATION_GAP_S`, or for
 * `silentHold` when it has no segment; and never for less than a one-shot
 * motion plus its margin, so an animation that plays once is shown in full
 * however short its narration. A motion that loops may be cut.
 */
export function stepHold({ motion, segment, narrated, settings }) {
  if (!narrated) return motion ? motion.seconds + MOTION_MARGIN_S : settings.defaultHold;
  const spoken = segment ? segment.duration + NARRATION_GAP_S : settings.silentHold;
  return Math.max(spoken, motion?.oneShot ? motion.seconds + MOTION_MARGIN_S : 0);
}

/**
 * The recording plan: each of `steps` (from `slideSteps`) with its `hold`
 * and, when narrated, its `segment` (`{ id, file, duration }`) or null.
 * `narration` is the map `narrationSegments` returns, or null for a silent
 * recording.
 */
export function planHolds(steps, settings, narration) {
  return steps.map((each) => {
    const segment = narration?.get(stepKey(each.slide, each.step)) ?? null;
    const motion = settings.holds[each.slide]?.[each.step];
    return { ...each, segment, hold: stepHold({ motion, segment, narrated: narration !== null, settings }) };
  });
}

/**
 * The steps `--only <first>-<last>` selects from `plan`: both ends are step
 * indexes (`index` of `slideSteps`), inclusive. Throws when `range` is not
 * two indexes of the plan in order.
 */
export function selectSteps(plan, range) {
  const match = /^(\d+)-(\d+)$/.exec(range);
  const [first, last] = match ? [Number(match[1]), Number(match[2])] : [NaN, NaN];
  if (!match || first > last || last >= plan.length) {
    throw new Error(`--only takes <first>-<last>, two step indexes from 0 to ${plan.length - 1} in order; got "${range}".`);
  }
  return plan.slice(first, last + 1);
}

/** Seconds a recording of `plan` takes: the lead-in and every hold. */
export function plannedSeconds(plan) {
  return plan.reduce((sum, each) => sum + each.hold, LEAD_IN_S);
}

// ─── Narration ────────────────────────────────────────────────────────

/**
 * The narration segment of each step, from a narration directory's two
 * files: `manifest` (`{ segments: [{ id, file, duration_s, lufs_i? }] }`)
 * and `stepSegments` (`[{ slide, step, segment }]`, `segment` a segment id
 * or null). Returns a map from step (`"<slide-id>/<step>"`) to
 * `{ id, file, duration, loudness }`, with `file` as the manifest writes
 * it and `loudness` the segment's measured integrated loudness in LUFS
 * (`lufs_i`), or null when the manifest does not give it.
 *
 * Throws listing every problem: a step the presentation does not have (the
 * narration was made for other slides), a step listed twice, a segment the
 * manifest lacks, a segment without a positive duration. A step that the
 * files do not mention, or whose `segment` is null, has no narration.
 */
export function narrationSegments(manifest, stepSegments, steps) {
  if (!Array.isArray(manifest?.segments)) throw new Error('The narration manifest needs a "segments" array.');
  if (!Array.isArray(stepSegments)) throw new Error('The narration steps file must be an array of { slide, step, segment }.');

  const problems = [];
  const segmentsById = new Map(manifest.segments.map((segment) => [segment.id, segment]));
  for (const segment of manifest.segments) {
    if (typeof segment.file !== 'string' || !isSeconds(segment.duration_s)) {
      problems.push(`segment "${segment.id}" needs a "file" and a positive "duration_s".`);
    }
  }
  const known = new Set(steps.map((each) => stepKey(each.slide, each.step)));
  const narration = new Map();
  for (const { slide, step, segment: id } of stepSegments) {
    const key = stepKey(slide, step);
    if (!known.has(key)) {
      problems.push(`step ${step} of slide "${slide}" is narrated but the presentation has no such step.`);
      continue;
    }
    if (id === null || id === undefined) continue;
    const segment = segmentsById.get(id);
    if (!segment) problems.push(`step ${step} of slide "${slide}" names segment "${id}", which the manifest lacks.`);
    else if (narration.has(key)) problems.push(`step ${step} of slide "${slide}" is listed twice.`);
    else {
      const loudness = Number.isFinite(segment.lufs_i) ? segment.lufs_i : null;
      narration.set(key, { id, file: segment.file, duration: segment.duration_s, loudness });
    }
  }
  if (problems.length > 0) throw new Error(`The narration does not match the presentation:\n- ${problems.join('\n- ')}`);
  return narration;
}

/**
 * The narration in directory `dir` for `steps`: `narrationSegments` of its
 * `manifest.json` and `steps.json`, with each `file` resolved against `dir`.
 * Reads both files and throws when either is missing or malformed, when
 * they do not match the presentation, or when a segment's audio file does
 * not exist.
 */
export function readNarration(dir, steps) {
  const narration = narrationSegments(readJson(join(dir, 'manifest.json')), readJson(join(dir, 'steps.json')), steps);
  for (const segment of narration.values()) segment.file = resolve(dir, segment.file);
  const missing = [...narration.values()].filter((segment) => !existsSync(segment.file));
  if (missing.length > 0) {
    throw new Error(`Narration audio is missing:\n- ${missing.map((segment) => segment.file).join('\n- ')}`);
  }
  return narration;
}

/** The narration's loudness in the recording (LUFS, integrated) and its true-peak ceiling (dBTP). */
export const MIX_LOUDNESS = -16;
export const MIX_PEAK = -1.5;

/**
 * The ffmpeg filter graph that places narration under a recorded video:
 * audio input `i + 1` (input 0 is the video) starts `placements[i].at`
 * seconds in, and the inputs are summed without rescaling, at 48 kHz. Its
 * output pad is `[mix]`. `placements` must not be empty.
 *
 * Loudness: when every placement gives its segment's measured `loudness`
 * (LUFS), each segment gets the gain that brings it to `MIX_LOUDNESS`,
 * with a limiter at `MIX_PEAK` for the few peaks the gain lifts past it,
 * so every step sounds as loud as the next. (The narration tool levels
 * segments with gain alone and stops at the peak, which leaves a segment
 * with one loud consonant several decibels quieter than its neighbors.)
 * Without the measurements, the sum is normalized as a whole instead,
 * which sets the average and keeps the differences between segments.
 */
export function narrationMixFilter(placements) {
  if (placements.length === 0) throw new Error('narrationMixFilter needs at least one segment to place.');
  const measured = placements.every(({ loudness }) => Number.isFinite(loudness));
  // The limiter works on samples; half a decibel of margin keeps the true peak, between samples, under MIX_PEAK.
  const ceiling = (10 ** ((MIX_PEAK - 0.5) / 20)).toFixed(3);
  const placed = placements.map(({ at, loudness }, i) => {
    const level = measured ? `volume=${(MIX_LOUDNESS - loudness).toFixed(2)}dB,alimiter=limit=${ceiling}:level=0,` : '';
    return `[${i + 1}:a]${level}adelay=${Math.round(at * 1000)}:all=1[a${i}]`;
  });
  const inputs = placements.map((_, i) => `[a${i}]`).join('');
  const whole = measured ? '' : `loudnorm=I=${MIX_LOUDNESS}:TP=${MIX_PEAK}:LRA=11,`;
  return `${placed.join(';')};${inputs}amix=inputs=${placements.length}:normalize=0,${whole}aresample=48000[mix]`;
}

// ─── Frames on a constant-rate grid ───────────────────────────────────

/**
 * Lays frames that arrive at irregular times onto a video of `fps` frames
 * per second. The browser sends a frame when the page changes, not on a
 * clock, so a still slide sends none and an animation sends up to the
 * display's rate; a video file needs one frame per `1 / fps` seconds.
 *
 * `copiesUntil(seconds)` says how many video frames to write, of the frame
 * that was on screen, to bring the video up to `seconds` since the first
 * frame; call it when the next frame arrives (before replacing the frame on
 * screen) and once more at the end. It rounds each time to the nearest
 * video frame, so a frame is placed within half a video frame of when it
 * arrived, and it returns 0 for a frame replaced within the same video
 * frame: that frame is dropped. Times that go backwards write nothing.
 * `written` is the count so far; the video is `written / fps` seconds long.
 */
export function frameGrid(fps) {
  let written = 0;
  return {
    copiesUntil(seconds) {
      const copies = Math.max(0, Math.round(seconds * fps) - written);
      written += copies;
      return copies;
    },
    get written() {
      return written;
    },
  };
}

/** Columns and rows of a contact sheet of `count` tiles, `columns` wide at most. */
export function contactSheetGrid(count, columns) {
  return { columns: Math.min(count, columns), rows: Math.ceil(count / columns) };
}
