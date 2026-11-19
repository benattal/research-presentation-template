import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  LEAD_IN_S,
  MOTION_MARGIN_S,
  NARRATION_GAP_S,
  contactSheetGrid,
  frameGrid,
  holdSettings,
  narrationMixFilter,
  narrationSegments,
  planHolds,
  plannedSeconds,
  readNarration,
  recordingFileProblems,
  recordingProblems,
  selectSteps,
  slideSteps,
  stepHold,
} from '../core/tooling/recording.js';

const slides = [
  { id: 'title', layout: 'title' },
  { id: 'method', layout: 'progressiveBuild', buildSteps: [{}, {}, {}] },
  { id: 'card', layout: 'sectionCard' },
];
const steps = slideSteps(slides);

describe('slideSteps', () => {
  it('lists every build step of every slide in order, numbered across the presentation', () => {
    assert.deepEqual(steps.map(({ index, slide, step }) => [index, slide, step]), [
      [0, 'title', 0], [1, 'method', 0], [2, 'method', 1], [3, 'method', 2], [4, 'card', 0],
    ]);
    assert.deepEqual(steps[2], { index: 2, slideIndex: 1, slide: 'method', step: 1, layout: 'progressiveBuild' });
  });
});

describe('recording.json', () => {
  const problems = (recording) => recordingProblems(recording, slides);

  it('accepts holds for some slides, one entry per build step', () => {
    assert.deepEqual(problems({}), []);
    assert.deepEqual(problems({
      defaultHold: 6.5,
      silentHold: 2.5,
      holds: { title: [{ seconds: 3 }], method: [{ seconds: 3.5, oneShot: true }, { seconds: 2 }, { seconds: 2, oneShot: false }] },
    }), []);
  });

  it('reports every problem at once', () => {
    const found = problems({
      defaultHold: '6',
      silentHold: -1,
      speed: 2,
      holds: {
        missing: [{ seconds: 1 }],
        title: { seconds: 3 },
        method: [{ seconds: 'long' }, { seconds: 2, oneShot: 'yes', loop: true }],
        card: [3],
      },
    });
    const text = found.join('\n');
    assert.match(text, /"defaultHold" must be a positive number/);
    assert.match(text, /"silentHold" must be a positive number/);
    assert.match(text, /unknown field "speed"/);
    assert.match(text, /slide "missing", which presentation\.json does not list/);
    assert.match(text, /holds of slide "title" must be an array/);
    assert.match(text, /slide "method" has 3 build steps but 2 holds/);
    assert.match(text, /hold 0 of slide "method" needs "seconds"/);
    assert.match(text, /hold 1 of slide "method": "oneShot" must be true or false/);
    assert.match(text, /hold 1 of slide "method" has an unknown field "loop"/);
    assert.match(text, /hold 0 of slide "card" must be an object/);
    assert.equal(found.length, 10);
  });

  it('rejects a file that is not an object, or whose holds are not', () => {
    assert.equal(problems([]).length, 1);
    assert.equal(problems({ holds: [] }).length, 1);
  });

  it('is checked from the presentation directory, where it is optional', () => {
    const dir = mkdtempSync(join(tmpdir(), 'recording-test-'));
    assert.deepEqual(recordingFileProblems(dir, slides), []);
    writeFileSync(join(dir, 'recording.json'), '{ "holds": { "nowhere": [] } }');
    assert.match(recordingFileProblems(dir, slides).join('\n'), /"nowhere"/);
    writeFileSync(join(dir, 'recording.json'), '{ "holds": ');
    assert.match(recordingFileProblems(dir, slides).join('\n'), /not valid JSON/);
  });

  it('fills in the holds a presentation does not set', () => {
    assert.deepEqual(holdSettings(null), { defaultHold: 5, silentHold: 2.5, holds: {} });
    assert.deepEqual(holdSettings({ defaultHold: 3 }), { defaultHold: 3, silentHold: 2.5, holds: {} });
  });
});

describe('holds', () => {
  const settings = holdSettings({
    defaultHold: 6,
    silentHold: 2,
    holds: { method: [{ seconds: 4, oneShot: true }, { seconds: 10 }, { seconds: 3, oneShot: true }] },
  });
  const hold = (args) => stepHold({ settings, ...args });

  it('without narration, holds a step for its motion and a margin, or for the default', () => {
    assert.equal(hold({ motion: { seconds: 4, oneShot: true }, segment: null, narrated: false }), 4 + MOTION_MARGIN_S);
    assert.equal(hold({ motion: { seconds: 10 }, segment: null, narrated: false }), 10 + MOTION_MARGIN_S);
    assert.equal(hold({ motion: undefined, segment: null, narrated: false }), 6);
  });

  it('with narration, holds a step for its segment and a gap', () => {
    assert.equal(hold({ motion: undefined, segment: { duration: 7 }, narrated: true }), 7 + NARRATION_GAP_S);
  });

  it('cuts a looping motion to its narration but shows a one-shot motion in full', () => {
    assert.equal(hold({ motion: { seconds: 10 }, segment: { duration: 3 }, narrated: true }), 3 + NARRATION_GAP_S);
    assert.equal(hold({ motion: { seconds: 10, oneShot: true }, segment: { duration: 3 }, narrated: true }), 10 + MOTION_MARGIN_S);
    assert.equal(hold({ motion: { seconds: 2, oneShot: true }, segment: { duration: 3 }, narrated: true }), 3 + NARRATION_GAP_S);
  });

  it('holds a step without narration for the silent hold, or for its one-shot motion', () => {
    assert.equal(hold({ motion: undefined, segment: null, narrated: true }), 2);
    assert.equal(hold({ motion: { seconds: 10 }, segment: null, narrated: true }), 2);
    assert.equal(hold({ motion: { seconds: 10, oneShot: true }, segment: null, narrated: true }), 10 + MOTION_MARGIN_S);
  });

  it('plans every step, silent or narrated', () => {
    assert.deepEqual(planHolds(steps, settings, null).map((each) => each.hold), [
      6, 4 + MOTION_MARGIN_S, 10 + MOTION_MARGIN_S, 3 + MOTION_MARGIN_S, 6,
    ]);
    const narration = new Map([
      ['title/0', { id: 'a', file: 'a.wav', duration: 5 }],
      ['method/1', { id: 'b', file: 'b.wav', duration: 8 }],
    ]);
    const plan = planHolds(steps, settings, narration);
    assert.deepEqual(plan.map((each) => each.hold), [5 + NARRATION_GAP_S, 4 + MOTION_MARGIN_S, 8 + NARRATION_GAP_S, 3 + MOTION_MARGIN_S, 2]);
    assert.deepEqual(plan.map((each) => each.segment?.id ?? null), ['a', null, 'b', null, null]);
    assert.equal(plannedSeconds(plan), LEAD_IN_S + plan.reduce((sum, each) => sum + each.hold, 0));
  });

  it('selects a range of steps by index, and refuses a range outside the plan', () => {
    const plan = planHolds(steps, settings, null);
    assert.deepEqual(selectSteps(plan, '1-3').map((each) => each.index), [1, 2, 3]);
    assert.deepEqual(selectSteps(plan, '4-4').map((each) => each.index), [4]);
    for (const range of ['3-1', '2-5', '2', 'a-b', '-1-2']) assert.throws(() => selectSteps(plan, range), /--only takes/);
  });
});

describe('frameGrid', () => {
  /** Video frames written for each captured frame, given their times and the end of the recording. */
  function copies(fps, frameTimes, end) {
    const grid = frameGrid(fps);
    const counts = [...frameTimes.slice(1), end].map((time) => grid.copiesUntil(time));
    return { counts, written: grid.written };
  }

  it('repeats a still frame to fill the time until the next one', () => {
    assert.deepEqual(copies(30, [0, 1, 1.5], 2), { counts: [30, 15, 15], written: 60 });
  });

  it('places each frame within half a video frame of when it arrived', () => {
    // Frames at 0, 16 ms, and 34 ms: the second arrives during video frame 0 and takes it over at video frame 1.
    assert.deepEqual(copies(30, [0, 0.016, 0.034], 0.1).counts, [0, 1, 2]);
    assert.deepEqual(copies(30, [0, 0.017, 0.034], 0.1).counts, [1, 0, 2]);
  });

  it('drops frames that arrive faster than the video rate, and keeps the count exact', () => {
    const times = Array.from({ length: 121 }, (_, i) => i / 60);
    const { counts, written } = copies(30, times, 2 + 1 / 30);
    assert.equal(written, 61);
    assert.ok(counts.every((count) => count === 0 || count === 1));
  });

  it('writes nothing for a time that goes backwards, and loses no time over a long run', () => {
    const grid = frameGrid(30);
    assert.equal(grid.copiesUntil(1), 30);
    assert.equal(grid.copiesUntil(0.5), 0);
    assert.equal(grid.copiesUntil(1.1), 3);
    for (let second = 2; second <= 600; second += 1) grid.copiesUntil(second + 0.004);
    assert.equal(grid.written, 600 * 30);
  });
});

describe('narration', () => {
  const manifest = {
    segments: [
      { id: 'intro', file: 'audio/intro.wav', duration_s: 4.2, text: 'Hello' },
      { id: 'method-b', file: 'audio/method-b.wav', duration_s: 9 },
    ],
  };
  const stepSegments = [
    { index: 0, slide: 'title', step: 0, layout: 'title', segment: 'intro' },
    { index: 1, slide: 'method', step: 0, layout: 'progressiveBuild', segment: null },
    { index: 2, slide: 'method', step: 1, layout: 'progressiveBuild', segment: 'method-b' },
  ];

  it('gives each narrated step its segment', () => {
    const narration = narrationSegments(manifest, stepSegments, steps);
    assert.deepEqual([...narration], [
      ['title/0', { id: 'intro', file: 'audio/intro.wav', duration: 4.2, loudness: null }],
      ['method/1', { id: 'method-b', file: 'audio/method-b.wav', duration: 9, loudness: null }],
    ]);
  });

  it('keeps the measured loudness of a segment when the manifest gives it', () => {
    const measured = { segments: manifest.segments.map((segment) => ({ ...segment, lufs_i: -19.4 })) };
    assert.equal(narrationSegments(measured, stepSegments, steps).get('title/0').loudness, -19.4);
  });

  it('refuses narration made for other slides, listing every mismatch', () => {
    assert.throws(() => narrationSegments(
      { segments: [...manifest.segments, { id: 'broken', file: 'broken.wav', duration_s: 0 }] },
      [
        ...stepSegments,
        { slide: 'removed', step: 0, segment: 'intro' },
        { slide: 'method', step: 5, segment: 'intro' },
        { slide: 'method', step: 2, segment: 'unknown' },
        { slide: 'title', step: 0, segment: 'method-b' },
      ],
      steps,
    ), (error) => {
      assert.match(error.message, /segment "broken" needs/);
      assert.match(error.message, /step 0 of slide "removed" is narrated but the presentation has no such step/);
      assert.match(error.message, /step 5 of slide "method"/);
      assert.match(error.message, /names segment "unknown"/);
      assert.match(error.message, /step 0 of slide "title" is listed twice/);
      return true;
    });
    assert.throws(() => narrationSegments({}, stepSegments, steps), /"segments" array/);
    assert.throws(() => narrationSegments(manifest, {}, steps), /must be an array/);
  });

  it('reads a narration directory and requires its audio files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'narration-test-'));
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ segments: [{ id: 'intro', file: 'intro.wav', duration_s: 4.2 }] }));
    writeFileSync(join(dir, 'steps.json'), JSON.stringify(stepSegments.slice(0, 2)));
    assert.throws(() => readNarration(dir, steps), /Narration audio is missing:\n- .*intro\.wav/);
    writeFileSync(join(dir, 'intro.wav'), '');
    assert.equal(readNarration(dir, steps).get('title/0').file, join(dir, 'intro.wav'));
  });

  it('places each segment at the time its step was shown, then normalizes the mix', () => {
    assert.equal(
      narrationMixFilter([{ at: 1.5 }, { at: 12.3456 }]),
      '[1:a]adelay=1500:all=1[a0];[2:a]adelay=12346:all=1[a1];'
      + '[a0][a1]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[mix]',
    );
    // With every segment's measured loudness, each gets its own gain to −16 LUFS and a limiter; no pass over the sum.
    assert.equal(
      narrationMixFilter([{ at: 1.5, loudness: -19.4 }, { at: 12.3456, loudness: -25.2 }]),
      '[1:a]volume=3.40dB,alimiter=limit=0.794:level=0,adelay=1500:all=1[a0];'
      + '[2:a]volume=9.20dB,alimiter=limit=0.794:level=0,adelay=12346:all=1[a1];'
      + '[a0][a1]amix=inputs=2:normalize=0,aresample=48000[mix]',
    );
    // One segment without a measurement: the whole sum is normalized instead.
    assert.match(narrationMixFilter([{ at: 0, loudness: -19 }, { at: 5, loudness: null }]), /^\[1:a\]adelay=0.*loudnorm=I=-16/);
    assert.throws(() => narrationMixFilter([]), /at least one segment/);
  });
});

describe('contactSheetGrid', () => {
  it('fills rows of a fixed width, and narrows for a few tiles', () => {
    assert.deepEqual(contactSheetGrid(13, 5), { columns: 5, rows: 3 });
    assert.deepEqual(contactSheetGrid(10, 5), { columns: 5, rows: 2 });
    assert.deepEqual(contactSheetGrid(3, 5), { columns: 3, rows: 1 });
  });
});
