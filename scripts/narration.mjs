#!/usr/bin/env node
/**
 * Export a presentation's notes as a narration script.
 *
 *   npm run narration -- <id> [--out <dir>] [--voice <preset>] [--wpm 160]
 *
 * Writes into the narration directory (default
 * presentations/<id>/assets/narration/<YYYYmmdd-HHMMSS>/, ignored by git):
 *   script.json   { voice, segments: [{ id, text }] }, the input of narration/narrate.py
 *   steps.json    every build step of the deck in order, with its segment id or null
 *   pron.json     a copy of the presentation's pronunciation.json ({} without one)
 *
 * Prints every build step with its word count and the seconds it takes to
 * speak at `--wpm` words per minute, warns about steps whose notes are not
 * complete sentences of plain prose, and prints the commands that
 * synthesize the script and check it by transcription. It runs no Python.
 * `--voice` names a preset of narration/voices.json (default kokoro-heart).
 * `--out` may name a directory that already holds an export; its three
 * files are replaced, so a corrected script can be rendered again there.
 * See docs/implementation/narration.md.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import {
  DEFAULT_WORDS_PER_MINUTE,
  NARRATION_DIR,
  backendPython,
  estimateSeconds,
  narrationScript,
  narrationSteps,
  narrationStepsFile,
  readDeck,
  readPronunciationMap,
  readVoices,
} from '../core/tooling/narration.js';
import { selectOnePresentation } from '../core/tooling/presentations.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: 'string' },
    voice: { type: 'string', default: 'kokoro-heart' },
    wpm: { type: 'string', default: String(DEFAULT_WORDS_PER_MINUTE) },
  },
});

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** A path as a command line takes it in any shell: relative to the working directory when inside it, forward slashes, quoted if it has spaces. */
function shellPath(path) {
  const fromHere = relative(process.cwd(), path);
  const shown = (fromHere.startsWith('..') ? path : fromHere).replaceAll('\\', '/');
  return shown.includes(' ') ? `"${shown}"` : shown;
}

const presentation = selectOnePresentation(positionals[0]);

const wordsPerMinute = Number(values.wpm);
if (!(wordsPerMinute > 0)) fail(`--wpm must be a positive number, got "${values.wpm}".`);

const voices = readVoices();
const voice = voices[values.voice];
if (!voice) fail(`No voice "${values.voice}" in narration/voices.json. Known: ${Object.keys(voices).join(', ')}.`);

const pronunciation = readPronunciationMap(presentation);
if (pronunciation.problems.length > 0) fail(pronunciation.problems.join('\n'));

const { slides, notesBySlide } = readDeck(presentation);
const steps = narrationSteps(slides, notesBySlide);
const narrated = steps.filter((step) => step.segment !== null);
if (narrated.length === 0) fail(`${presentation.id} has no notes to narrate: write slides/<slide-id>/notes.md.`);

const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const outDir = values.out ?? join(presentation.dir, 'assets/narration', stamp);
mkdirSync(outDir, { recursive: true });
const writeJson = (name, value) => writeFileSync(join(outDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
writeJson('script.json', narrationScript(steps, values.voice));
writeJson('steps.json', narrationStepsFile(steps));
writeJson('pron.json', pronunciation.map);

const slideWidth = Math.max(5, ...steps.map((step) => step.slide.length));
const row = (index, slide, step, words, seconds, segment) =>
  `${index.padStart(5)}  ${slide.padEnd(slideWidth)}  ${step.padStart(4)}  ${words.padStart(5)}  ${seconds.padStart(7)}  ${segment}`;
console.log(row('index', 'slide', 'step', 'words', 'seconds', 'segment'));
for (const step of steps) {
  console.log(step.segment === null
    ? row(String(step.index), step.slide, String(step.step), '-', '-', '(silent)')
    : row(String(step.index), step.slide, String(step.step), String(step.words), estimateSeconds(step.words, wordsPerMinute).toFixed(1), step.segment));
}
const totalWords = narrated.reduce((sum, step) => sum + step.words, 0);
console.log(
  `\n${presentation.id}: ${steps.length} build steps, ${narrated.length} narrated, ${totalWords} words, `
  + `about ${estimateSeconds(totalWords, wordsPerMinute).toFixed(0)} s of speech at ${wordsPerMinute} words per minute `
  + '(narrate.py adds silence around each segment)',
);

const flagged = narrated.filter((step) => step.problems.length > 0);
for (const step of flagged) console.log(`warning: ${step.segment} ${step.problems.join('; ')}`);
if (flagged.length > 0) console.log('A voice reads each step on its own: write the notes of a narrated step as complete sentences of plain prose.');

const synthesisPython = backendPython(voice.backend);
const transcriptionPython = backendPython('eval');
console.log(`\nWrote script.json, steps.json, pron.json in ${shellPath(outDir)}`);
console.log(`\nSynthesize (${values.voice}, on this machine):`);
console.log(`  ${shellPath(synthesisPython)} ${shellPath(join(NARRATION_DIR, 'narrate.py'))} ${shellPath(join(outDir, 'script.json'))} --out ${shellPath(outDir)} --pron ${shellPath(join(outDir, 'pron.json'))}`);
console.log('Check it by transcription:');
console.log(`  ${shellPath(transcriptionPython)} ${shellPath(join(NARRATION_DIR, 'transcribe.py'))} ${shellPath(join(outDir, 'manifest.json'))}`);
const missing = [[voice.backend, synthesisPython], ['eval', transcriptionPython]].filter(([, python]) => !existsSync(python));
if (missing.length > 0) {
  console.log(`\nNo ${missing.map(([backend]) => backend).join(' or ')} environment in NARRATION_HOME yet; create it with:`);
  console.log(`  bash narration/setup.sh ${missing.map(([backend]) => backend).join(' ')}`);
}
