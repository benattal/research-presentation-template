#!/usr/bin/env node
/**
 * Record a run-through video of a presentation: every slide and build step
 * in order, each held for its animation or its narration, filmed from the
 * audience view in a headless browser with the GPU.
 *
 *   npm run record -- <id> [--out <dir>] [--narration <dir>]
 *                          [--only <first>-<last>] [--channel msedge|chrome]
 *                          [--size 1920x1080] [--fps 30] [--url <running deck>]
 *
 * Writes data/recordings/<id>/<YYYYmmdd-HHMMSS>/ (ignored by git), or the
 * directory `--out` names:
 *   run-through.mp4     H.264 at a constant frame rate; with `--narration`,
 *                       with the narration mixed in
 *   video-only.mp4      with `--narration`: the same video without sound
 *   timeline.json       when each step was shown, and what the run measured
 *   contact-sheet.png   the last frame of every step, in order
 *
 * It starts its own Vite server for the presentation; `--url` films a deck
 * that is already served instead. It needs ffmpeg on PATH and an installed
 * Edge or Chrome. The capture is real time, not frame exact: see
 * docs/implementation/recording.md for how it works and its limits.
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { positionStorageKey } from '../core/client/navigation/position.js';
import { REPO_ROOT, selectOnePresentation } from '../core/tooling/presentations.js';
import {
  LEAD_IN_S,
  contactSheetGrid,
  frameGrid,
  holdSettings,
  narrationMixFilter,
  planHolds,
  plannedSeconds,
  readListedSlides,
  readNarration,
  readRecordingFile,
  recordingProblems,
  selectSteps,
  slideSteps,
} from '../core/tooling/recording.js';
import { createViteConfig } from '../core/tooling/viteConfig.js';

/**
 * The browsers that can film a deck: installed ones, because Playwright's
 * own Chromium has no H.264 decoder and would show slides' MP4 videos blank.
 */
const CHANNELS = { msedge: 'Microsoft Edge', chrome: 'Google Chrome' };
const DEFAULT_CHANNEL = process.platform === 'win32' ? 'msedge' : 'chrome';

/** The ANGLE backend that reaches the GPU, by platform; elsewhere Chromium picks its own. */
const ANGLE_BACKENDS = { win32: 'd3d11', darwin: 'metal' };

/** WebGL renderer names of Chromium's software fallbacks. */
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|software|basic render/i;

/** The first page load has Vite transform every module; later waits are for media and layouts' `prepare`. */
const LOAD_TIMEOUT_MS = 300000;
const FIRST_FRAME_TIMEOUT_MS = 15000;

/**
 * How long frames must stop arriving, after a change, before the capture
 * starts the screencast again to get the page as it is (see `requestFreshFrame`).
 */
const QUIET_BEFORE_FRESH_FRAME_MS = 150;
/** A frame or a key press that takes longer than this to show means the machine is not keeping up, in seconds. */
const BEHIND_S = 0.25;

const JPEG_QUALITY = 92;
const CONTACT_SHEET_COLUMNS = 5;
const CONTACT_SHEET_TILE_WIDTH = 384;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: 'string' },
    narration: { type: 'string' },
    only: { type: 'string' },
    channel: { type: 'string', default: DEFAULT_CHANNEL },
    size: { type: 'string', default: '1920x1080' },
    fps: { type: 'string', default: '30' },
    url: { type: 'string' },
  },
});

function parseSize(text) {
  const match = /^(\d+)x(\d+)$/.exec(text);
  const [width, height] = match ? [Number(match[1]), Number(match[2])] : [NaN, NaN];
  // H.264 with 4:2:0 color needs even dimensions.
  if (!match || width === 0 || height === 0 || width % 2 || height % 2) {
    throw new Error(`--size takes <width>x<height> in pixels, both even; got "${text}".`);
  }
  return { width, height };
}

function requireFfmpeg() {
  if (spawnSync('ffmpeg', ['-version']).status === 0) return;
  throw new Error(
    'ffmpeg is not on PATH; recording encodes with it. Install it '
    + '(Windows: winget install Gyan.FFmpeg; macOS: brew install ffmpeg; Linux: apt install ffmpeg).',
  );
}

async function launchBrowser(channel) {
  const backend = ANGLE_BACKENDS[process.platform];
  try {
    return await chromium.launch({
      channel,
      args: [
        '--headless=new',
        '--enable-gpu',
        '--ignore-gpu-blocklist',
        ...(backend ? [`--use-angle=${backend}`] : []),
        '--autoplay-policy=no-user-gesture-required',
        '--disable-lcd-text',
      ],
    });
  } catch (error) {
    const other = Object.keys(CHANNELS).find((each) => each !== channel);
    throw new Error(`Could not start ${CHANNELS[channel]}. Install it, or pass --channel ${other} to use ${CHANNELS[other]}.\n${error.message}`);
  }
}

/** The name of the renderer WebGL draws with in `context`, or null when it has no WebGL. */
async function webglRenderer(context) {
  const page = await context.newPage();
  try {
    return await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return null;
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      return gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
    });
  } finally {
    await page.close();
  }
}

function runFfmpeg(args, input) {
  const { status, error } = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { input, stdio: ['pipe', 'inherit', 'inherit'] });
  if (status !== 0) throw new Error(`ffmpeg failed (${error?.message ?? `status ${status}`}) with: ${args.join(' ')}`);
}

// ─── What to record ───────────────────────────────────────────────────

const presentation = selectOnePresentation(positionals[0]);
const size = parseSize(values.size);
const fps = Number(values.fps);
if (!Number.isInteger(fps) || fps <= 0) throw new Error(`--fps takes a whole number of frames per second; got "${values.fps}".`);
if (!CHANNELS[values.channel]) throw new Error(`--channel takes ${Object.keys(CHANNELS).join(' or ')}; got "${values.channel}".`);
requireFfmpeg();

const slides = readListedSlides(presentation);
const recording = readRecordingFile(presentation.dir);
const problems = recording === null ? [] : recordingProblems(recording, slides);
if (problems.length > 0) throw new Error(`presentations/${presentation.id}:\n- ${problems.join('\n- ')}`);

const steps = slideSteps(slides);
const narration = values.narration ? readNarration(resolve(values.narration), steps) : null;
const wholePlan = planHolds(steps, holdSettings(recording), narration);
const plan = values.only ? selectSteps(wholePlan, values.only) : wholePlan;
// A recording that starts after the first step opens on the step before
// it, so its first step arrives by a key press and plays its entrance.
const opening = plan[0].index === 0 ? null : wholePlan[plan[0].index - 1];

const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const outDir = values.out ? resolve(values.out) : join(REPO_ROOT, 'data/recordings', presentation.id, stamp);
mkdirSync(outDir, { recursive: true });
// With narration the frames are encoded first, and the sound is added once the run has placed it.
const narrated = plan.some((each) => each.segment);
const videoFile = join(outDir, narrated ? 'video-only.mp4' : 'run-through.mp4');
console.log(`${presentation.id}: ${plan.length} steps, ${plannedSeconds(plan).toFixed(0)} s planned, ${size.width}×${size.height} at ${fps} fps`);

// ─── The page ─────────────────────────────────────────────────────────

const server = values.url ? null : await createServer(createViteConfig({
  presentation,
  base: '/',
  live: false,
  server: { port: 0, host: '127.0.0.1', hmr: false },
}));
await server?.listen();
// `bars=hidden` shows the stage alone (core/client/audience/AudienceView.jsx).
const deckUrl = new URL(values.url ?? server.resolvedUrls.local[0]);
deckUrl.searchParams.set('bars', 'hidden');

let browser = null;
let ffmpeg = null;
let exitCode = 0;
try {
  browser = await launchBrowser(values.channel);
  const context = await browser.newContext({ viewport: size, deviceScaleFactor: 1 });
  const renderer = await webglRenderer(context);
  console.log(`WebGL renderer: ${renderer ?? 'none'}`);
  if (!renderer || SOFTWARE_RENDERER.test(renderer)) {
    console.warn('warning: WebGL does not reach the GPU here; slides that draw with WebGL will not keep up in real time.');
  }

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error.stack ?? error)));
  page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()); });
  if (opening) {
    await page.addInitScript(([key, position]) => {
      if (window === window.top) sessionStorage.setItem(key, position);
    }, [positionStorageKey(presentation.id), JSON.stringify({ index: opening.slideIndex, step: opening.step })]);
  }

  // When the page handled each key press, on the wall clock in milliseconds: the time narration is placed at.
  await page.addInitScript(() => {
    if (window !== window.top) return;
    window.__recordedKeyPresses = [];
    window.addEventListener('keydown', () => window.__recordedKeyPresses.push(performance.timeOrigin + performance.now()), true);
  });

  await page.goto(deckUrl.href, { timeout: LOAD_TIMEOUT_MS });
  await page.waitForSelector('.slide, [data-load-error]', { timeout: LOAD_TIMEOUT_MS });
  const loadError = await page.evaluate(() => document.querySelector('[data-load-error]')?.innerText ?? null);
  if (loadError) throw new Error(`The presentation did not load:\n${loadError}`);
  try {
    await page.waitForSelector('body[data-slides-ready="true"]', { timeout: LOAD_TIMEOUT_MS });
  } catch {
    throw new Error(`The audience view did not report its slides ready within ${LOAD_TIMEOUT_MS / 1000} s. A deck given with --url must be served by this version of the framework.`);
  }
  await page.evaluate(() => document.fonts.ready);
  const shownSlide = () => page.evaluate(() => document.querySelector('.slide').dataset.slideId);
  const openingSlide = (opening ?? plan[0]).slide;
  if (await shownSlide() !== openingSlide) {
    throw new Error(`The page opened on slide "${await shownSlide()}", not "${openingSlide}": is ${deckUrl.origin} serving "${presentation.id}"?`);
  }

  // ─── Frames: from the browser's screencast to ffmpeg ─────────────────

  ffmpeg = spawn('ffmpeg', [
    '-v', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-vf', `scale=${size.width}:${size.height}:flags=lanczos,format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15',
    '-movflags', '+faststart', '-map_metadata', '-1', videoFile,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const failures = [];
  const encoded = new Promise((done) => {
    ffmpeg.on('error', (error) => { failures.push(error); done(null); });
    ffmpeg.on('close', done);
  });
  ffmpeg.stdin.on('error', (error) => failures.push(error));

  // The screencast sends a frame when the page changes, stamped with its
  // time; `grid` repeats the frame on screen to fill the video up to then.
  const grid = frameGrid(fps);
  const client = await context.newCDPSession(page);
  const capture = { framesReceived: 0, framesOutOfOrder: 0, framesRecovered: 0, maxFrameDelay: 0, maxPressToFrame: 0 };
  /** Wall-clock time of the first frame, in seconds: the video's time 0. The browser stamps frames with the clock Node reads. */
  let firstFrameTime = null;
  const clock = () => Date.now() / 1000 - firstFrameTime;
  let frameOnScreen = null;
  let frameOnScreenAt = 0;
  const writeUntil = (seconds) => {
    for (let copies = grid.copiesUntil(seconds); copies > 0; copies -= 1) ffmpeg.stdin.write(frameOnScreen);
  };

  // The last frame of each step, for the contact sheet. A frame belongs
  // to the step whose key press precedes it; while a press is being
  // timed, frames wait in `framesDuringPress` until its time is known.
  const timeline = [];
  const lastFrames = [];
  let openingFrame = null;
  let framesDuringPress = null;
  const noteFrame = (at, frame) => {
    const step = timeline.findLast((each) => each.at <= at);
    if (!step) {
      openingFrame = frame;
      return;
    }
    lastFrames[timeline.indexOf(step)] = frame;
    if (step.pressed && step.firstFrameAt === null) {
      step.firstFrameAt = at;
      capture.maxPressToFrame = Math.max(capture.maxPressToFrame, at - step.at);
    }
  };

  // The browser keeps at most three frames waiting for their
  // acknowledgement and drops the frames after them. When the page then
  // stops changing, nothing more is sent, and the capture would show the
  // page as it was before the dropped frames until the next change. So
  // once frames stop arriving after a change, the screencast is started
  // again, which sends the page as it is now. If that frame differs from
  // the frame on screen, a change had been lost.
  const screencast = { format: 'jpeg', quality: JPEG_QUALITY, maxWidth: size.width, maxHeight: size.height, everyNthFrame: 1 };
  let quietTimer = null;
  let awaitingFreshFrame = false;
  // One restart at a time: a second stop sent before the first restart's
  // start would be followed by two starts, and the browser refuses the
  // second ("Screencast is already active"). A request made while a
  // restart is under way is met by it, because its start comes later.
  let restarting = null;
  const requestFreshFrame = () => {
    awaitingFreshFrame = true;
    restarting ??= client.send('Page.stopScreencast')
      .then(() => client.send('Page.startScreencast', screencast))
      .catch((error) => failures.push(error))
      .finally(() => { restarting = null; });
  };

  client.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    client.send('Page.screencastFrameAck', { sessionId }).catch((error) => failures.push(error));
    if (metadata.deviceWidth !== size.width || metadata.deviceHeight !== size.height) {
      failures.push(new Error(`The browser sent a frame of a ${metadata.deviceWidth}×${metadata.deviceHeight} page; the recording is ${size.width}×${size.height}.`));
      return;
    }
    firstFrameTime ??= metadata.timestamp;
    const at = metadata.timestamp - firstFrameTime;
    capture.framesReceived += 1;
    capture.maxFrameDelay = Math.max(capture.maxFrameDelay, clock() - at);
    // The browser encodes frames in parallel, so one can overtake another; a frame older than the one on screen is dropped.
    if (frameOnScreen && at <= frameOnScreenAt) {
      capture.framesOutOfOrder += 1;
      return;
    }
    const frame = Buffer.from(data, 'base64');
    const changed = !frameOnScreen || !frame.equals(frameOnScreen);
    if (frameOnScreen) writeUntil(at);
    if (awaitingFreshFrame && changed) capture.framesRecovered += 1;
    awaitingFreshFrame = false;
    frameOnScreen = frame;
    frameOnScreenAt = at;
    if (framesDuringPress) framesDuringPress.push([at, frame]);
    else noteFrame(at, frame);
    if (changed) {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(requestFreshFrame, QUIET_BEFORE_FRESH_FRAME_MS);
    }
  });
  await client.send('Page.startScreencast', screencast);
  for (let waited = 0; firstFrameTime === null; waited += 50) {
    if (waited >= FIRST_FRAME_TIMEOUT_MS) throw new Error(`The browser sent no screencast frame within ${FIRST_FRAME_TIMEOUT_MS / 1000} s.`);
    await sleep(50);
  }

  // ─── The run-through ─────────────────────────────────────────────────

  const waitUntil = (seconds) => sleep(Math.max(0, (seconds - clock()) * 1000));
  /** Press the key for the next step; resolves to the time the page handled it, on the video's clock. */
  async function pressNext(pressCount) {
    framesDuringPress = [];
    await page.keyboard.press('ArrowRight');
    const pressTimes = await page.evaluate(() => window.__recordedKeyPresses);
    if (pressTimes.length !== pressCount) throw new Error(`The page handled ${pressTimes.length} key presses of the ${pressCount} sent.`);
    return pressTimes.at(-1) / 1000 - firstFrameTime;
  }
  let pressCount = 0;
  let due = LEAD_IN_S;
  for (const each of plan) {
    await waitUntil(due);
    if (failures.length > 0) throw failures[0];
    // The first step of the presentation is on screen from the start; every other step arrives by a key press.
    const pressed = each !== plan[0] || opening !== null;
    const at = pressed ? await pressNext(pressCount += 1) : LEAD_IN_S;
    timeline.push({ ...each, at, pressed, firstFrameAt: null });
    for (const [frameAt, frame] of framesDuringPress ?? []) noteFrame(frameAt, frame);
    framesDuringPress = null;
    due = at + each.hold;
    if (timeline.length % 8 === 0) console.log(`step ${timeline.length}/${plan.length} at ${at.toFixed(1)} s (${each.slide})`);
  }
  await waitUntil(due);
  const seconds = clock();
  clearTimeout(quietTimer);
  await restarting;
  await client.send('Page.stopScreencast');
  writeUntil(seconds);
  ffmpeg.stdin.end();
  const status = await encoded;
  if (failures.length > 0) throw failures[0];
  if (status !== 0) throw new Error(`ffmpeg stopped with status ${status} while encoding ${videoFile}.`);
  if (await shownSlide() !== plan.at(-1).slide) {
    throw new Error(`The run-through ended on slide "${await shownSlide()}", not "${plan.at(-1).slide}": the key presses and the plan came apart.`);
  }

  // ─── Outputs ─────────────────────────────────────────────────────────

  // A step during which no frame arrived shows what the step before it left on screen.
  const stepFrames = [];
  for (const [index] of timeline.entries()) stepFrames.push(lastFrames[index] ?? stepFrames.at(-1) ?? openingFrame);
  const sheet = contactSheetGrid(stepFrames.length, CONTACT_SHEET_COLUMNS);
  runFfmpeg([
    '-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-',
    '-vf', `scale=${CONTACT_SHEET_TILE_WIDTH}:-2,tile=${sheet.columns}x${sheet.rows}:padding=6:margin=6`,
    '-frames:v', '1', '-update', '1', join(outDir, 'contact-sheet.png'),
  ], Buffer.concat(stepFrames));

  if (narrated) {
    const voiced = timeline.filter((each) => each.segment);
    runFfmpeg([
      '-i', videoFile, ...voiced.flatMap((each) => ['-i', each.segment.file]),
      '-filter_complex', narrationMixFilter(voiced.map((each) => ({ at: each.at, loudness: each.segment.loudness }))),
      '-map', '0:v', '-map', '[mix]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
      '-t', seconds.toFixed(3), '-movflags', '+faststart', '-map_metadata', '-1', join(outDir, 'run-through.mp4'),
    ]);
  }

  writeFileSync(join(outDir, 'timeline.json'), JSON.stringify({
    presentation: presentation.id,
    recordedAt: new Date().toISOString(),
    browser: `${values.channel} ${browser.version()}`,
    renderer,
    size: values.size,
    fps,
    seconds,
    framesWritten: grid.written,
    capture,
    pageErrors,
    steps: timeline.map(({ slideIndex, segment, pressed, ...step }) => ({ ...step, narration: segment ? basename(segment.file) : null })),
  }, null, 2));

  console.log(`\n${capture.framesReceived} frames received over ${seconds.toFixed(1)} s (${(capture.framesReceived / seconds).toFixed(1)} per second), ${grid.written} written at ${fps} fps.`);
  console.log(`Key presses showed in the capture within ${Math.round(capture.maxPressToFrame * 1000)} ms; frames reached the recorder within ${Math.round(capture.maxFrameDelay * 1000)} ms.`);
  if (capture.framesRecovered > 0) {
    console.warn(`warning: changes whose frame the browser dropped: ${capture.framesRecovered}. Each shows in the video late, from when the page went quiet.`);
  }
  if (capture.maxFrameDelay > BEHIND_S || capture.maxPressToFrame > BEHIND_S) {
    console.warn('warning: the capture fell behind the page, so the video shows changes late; record again when the machine is idle.');
  }
  if (pageErrors.length > 0) console.warn(`warning: the page reported ${pageErrors.length} errors (timeline.json lists them); the first: ${pageErrors[0]}`);
  console.log(`Recording: ${join(outDir, 'run-through.mp4')}`);
  console.log(`Contact sheet: ${join(outDir, 'contact-sheet.png')}`);
} catch (error) {
  console.error(error.message);
  exitCode = 1;
} finally {
  if (ffmpeg && ffmpeg.exitCode === null) ffmpeg.kill();
  await browser?.close();
  await server?.close();
}
process.exit(exitCode);
