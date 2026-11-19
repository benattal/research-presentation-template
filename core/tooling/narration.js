/**
 * A presentation's notes as a narration script.
 *
 * The narration of a deck is its notes: each build step speaks the notes
 * file it shows, and a step without notes of its own is silent. This module
 * reads the notes in deck order into the two files a narration directory
 * starts with (`script.json` for `narration/narrate.py`, `steps.json` for
 * the recorder), counts their words, and says where the Python
 * environments live. It runs no Python and changes no wording: the
 * pronunciation map is applied by `narrate.py`.
 * See docs/implementation/narration.md.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { buildPresentation, indexNotes, notesFileName, stepCount } from '../client/presentation/model.js';
import { REPO_ROOT } from './presentations.js';

/** The Python tools: `narrate.py`, `transcribe.py`, `voices.json`, `setup.sh`. */
export const NARRATION_DIR = join(REPO_ROOT, 'narration');

/** Speaking rate the duration estimate assumes unless one is given. */
export const DEFAULT_WORDS_PER_MINUTE = 160;

/** A presentation's optional pronunciation map: term → spoken spelling. */
export const PRONUNCIATION_FILE = 'pronunciation.json';

/**
 * Where `narration/setup.sh` puts the Python environments
 * (`venvs/<backend>/`) and where the model weights are cached: the
 * `NARRATION_HOME` environment variable, or a directory in the user's home.
 * `setup.sh` states the same default; `tests/narration.test.mjs` fails when
 * the two differ.
 */
export function narrationHome() {
  return process.env.NARRATION_HOME || join(homedir(), '.research-presentation-narration');
}

/** A venv keeps its interpreter in a different place on Windows. */
const VENV_PYTHON = process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python';

/** The Python interpreter of one backend's environment (it may not exist yet). */
export function backendPython(backend) {
  return join(narrationHome(), 'venvs', backend, VENV_PYTHON);
}

/** The voice presets of `narration/voices.json`: preset name → voice object with its `backend`. */
export function readVoices() {
  return JSON.parse(readFileSync(join(NARRATION_DIR, 'voices.json'), 'utf-8'));
}

/**
 * The slides of a presentation in deck order, and their notes.
 *
 * Reads the files directly, without Vite, and orders and validates the
 * slides with `buildPresentation`, so the order is the one every view
 * navigates and a broken presentation fails here with every problem
 * listed. Layout components need Vite to load, so every layout a slide
 * names counts as registered; `npm run check` is what reports an unknown
 * layout.
 *
 * @param {{ id: string, dir: string, manifest: object }} presentation  as `core/tooling/presentations.js` returns it
 * @returns {{ slides: object[], notesBySlide: Object<string, Object<string, string>> }}
 *   `notesBySlide` maps slide id → notes file name → text, as `indexNotes` returns it.
 */
export function readDeck(presentation) {
  const slidesDir = join(presentation.dir, 'slides');
  const slideContents = {};
  const noteFiles = {};
  for (const entry of readdirSync(slidesDir, { withFileTypes: true })) {
    const slideDir = join(slidesDir, entry.name);
    if (!entry.isDirectory() || !existsSync(join(slideDir, 'content.json'))) continue;
    slideContents[entry.name] = JSON.parse(readFileSync(join(slideDir, 'content.json'), 'utf-8'));
    for (const fileName of readdirSync(slideDir).filter((name) => /^notes(-\d+)?\.md$/.test(name))) {
      noteFiles[`slides/${entry.name}/${fileName}`] = readFileSync(join(slideDir, fileName), 'utf-8');
    }
  }
  const sourcesPath = join(presentation.dir, 'sources.json');
  const { slides } = buildPresentation({
    id: presentation.id,
    manifest: presentation.manifest,
    slideContents,
    layouts: Object.fromEntries(Object.values(slideContents).map((content) => [content.layout, true])),
    baseUrl: '/',
    sources: existsSync(sourcesPath) ? JSON.parse(readFileSync(sourcesPath, 'utf-8')) : {},
  });
  return { slides, notesBySlide: indexNotes(noteFiles) };
}

/** Number of words in `text`: runs of characters between whitespace. */
export function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Seconds it takes to speak `words` words at `wordsPerMinute`. Speech only:
 * the silence `narrate.py` adds before and after each segment is not in it.
 */
export function estimateSeconds(words, wordsPerMinute = DEFAULT_WORDS_PER_MINUTE) {
  return (words / wordsPerMinute) * 60;
}

/** Markdown and math a voice cannot speak, each with its name in a warning. An underscore inside a word (`snake_case`) is not emphasis. */
const MARKUP = [
  [/\*|(?<!\w)_\w|\w_(?!\w)/, 'emphasis marks'],
  [/`/, 'backticks'],
  [/\$/, 'dollar signs'],
  [/^#{1,6}\s/m, 'a heading'],
  [/^\s*([-+]|\d+\.)\s/m, 'a list'],
  [/\]\(/, 'a link'],
];

/**
 * Why a step's notes would not narrate well, as a list of phrases; empty
 * when they would. A text-to-speech model reads each step on its own and
 * reads every character, so the notes of a narrated step are one or more
 * complete sentences of plain prose. `text` is one step's notes as written
 * in the file, without the white space around them, and not empty.
 */
export function speechProblems(text) {
  const problems = [];
  if (!/^["'“‘(]?[\p{Lu}\p{N}]/u.test(text)) problems.push('does not start with a capital letter or a digit');
  if (!/[.!?]["'”’)]?$/.test(text)) problems.push('does not end with a period, question mark, or exclamation mark');
  const markup = MARKUP.filter(([pattern]) => pattern.test(text)).map(([, name]) => name);
  if (markup.length > 0) problems.push(`has Markdown or math, which a voice reads aloud or drops (${markup.join(', ')})`);
  return problems;
}

/**
 * Every build step of a deck in order, with what it says.
 *
 * A step speaks the notes file `notesFileName` picks for it, the first time
 * a step of its slide shows that file: `notes.md` at step 0, `notes-<k>.md`
 * at step k. A later step that falls back to `notes.md` again is silent, as
 * is a step whose file is missing or blank. A segment's id is
 * `<NN>-<slide-id>-<step>`, with NN the step's index in the deck, padded to
 * the width of the deck's largest index (two digits at least), so segment
 * files sort in deck order.
 *
 * @param {object[]} slides  the deck's slides in order (`id`, `layout`, `buildSteps`)
 * @param {Object<string, Object<string, string>>} notesBySlide  slide id → notes file name → text
 * @returns {{ index, slide, step, layout, segment, text, words, problems }[]}
 *   `index` and `step` are 0-based. For a silent step `segment` and `text`
 *   are null, `words` is 0, and `problems` is empty. `text` is the notes
 *   file with each run of whitespace (line breaks included) as one space,
 *   and nothing else changed.
 */
export function narrationSteps(slides, notesBySlide) {
  const positions = slides.flatMap((slide) => Array.from({ length: stepCount(slide) }, (_, step) => ({ slide, step })));
  const indexWidth = Math.max(2, String(positions.length - 1).length);
  const spoken = new Set();
  return positions.map(({ slide, step }, index) => {
    const notes = notesBySlide[slide.id] ?? {};
    const fileName = notesFileName(Object.keys(notes), step);
    const key = `${slide.id}/${fileName}`;
    const written = spoken.has(key) ? '' : (notes[fileName] ?? '').trim();
    spoken.add(key);
    const position = { index, slide: slide.id, step, layout: slide.layout };
    if (written === '') return { ...position, segment: null, text: null, words: 0, problems: [] };
    return {
      ...position,
      segment: `${String(index).padStart(indexWidth, '0')}-${slide.id}-${step}`,
      text: written.split(/\s+/).join(' '),
      words: countWords(written),
      problems: speechProblems(written),
    };
  });
}

/** `script.json`, the input of `narration/narrate.py`: the voice and the narrated steps' text. */
export function narrationScript(steps, voice) {
  return {
    voice,
    segments: steps.filter((step) => step.segment !== null).map((step) => ({ id: step.segment, text: step.text })),
  };
}

/**
 * `steps.json`, the recorder's map from the deck to the audio: every build
 * step in order, with the id of its segment or null for a silent step.
 */
export function narrationStepsFile(steps) {
  return steps.map(({ index, slide, step, layout, segment }) => ({ index, slide, step, layout, segment }));
}

/**
 * Problems of a parsed `pronunciation.json`, as a list of sentences; empty
 * when it is a flat object of non-empty strings. A term is matched as
 * written, so one with spaces at its ends would never match.
 */
export function pronunciationProblems(map) {
  if (map === null || typeof map !== 'object' || Array.isArray(map)) {
    return [`${PRONUNCIATION_FILE} must be an object of term → spoken spelling.`];
  }
  const problems = [];
  for (const [term, spoken] of Object.entries(map)) {
    if (term === '' || term !== term.trim()) problems.push(`${PRONUNCIATION_FILE}: term ${JSON.stringify(term)} is empty or has spaces at its ends.`);
    if (typeof spoken !== 'string' || spoken.trim() === '') problems.push(`${PRONUNCIATION_FILE}: "${term}" needs its spoken spelling, a non-empty string.`);
  }
  return problems;
}

/**
 * A presentation's pronunciation map and its problems:
 * `{ map, problems }`. Without the file the map is empty; with problems
 * (unreadable JSON included) the map is null.
 */
export function readPronunciationMap(presentation) {
  const path = join(presentation.dir, PRONUNCIATION_FILE);
  if (!existsSync(path)) return { map: {}, problems: [] };
  let map;
  try {
    map = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (error) {
    return { map: null, problems: [`${PRONUNCIATION_FILE}: ${error.message}`] };
  }
  const problems = pronunciationProblems(map);
  return { map: problems.length > 0 ? null : map, problems };
}
