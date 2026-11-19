import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_WORDS_PER_MINUTE,
  countWords,
  estimateSeconds,
  narrationHome,
  narrationScript,
  narrationSteps,
  narrationStepsFile,
  pronunciationProblems,
  readDeck,
  readPronunciationMap,
  readVoices,
  speechProblems,
} from '../core/tooling/narration.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const slides = [
  { id: 'title', layout: 'title' },
  { id: 'card', layout: 'sectionCard' },
  { id: 'method', layout: 'panels', buildSteps: [{}, {}, {}, {}] },
  { id: 'summary', layout: 'content', buildSteps: [{}, {}] },
];
const notesBySlide = {
  title: { 'notes.md': 'Generative view synthesis\nfrom propagating light.\n' },
  method: {
    'notes.md': 'We capture a video of light. The direct light gives depth.',
    'notes-2.md': 'The indirect light reveals hidden geometry.',
    'notes-3.md': '  \n',
  },
  summary: { 'notes-0.md': 'In summary, it works.', 'notes.md': 'Thank you.' },
  draft: { 'notes.md': 'A slide the deck does not list.' },
};

describe('narrationSteps', () => {
  const steps = narrationSteps(slides, notesBySlide);

  it('lists every build step of the deck in order', () => {
    assert.deepEqual(
      steps.map(({ index, slide, step, layout }) => [index, slide, step, layout]),
      [
        [0, 'title', 0, 'title'],
        [1, 'card', 0, 'sectionCard'],
        [2, 'method', 0, 'panels'],
        [3, 'method', 1, 'panels'],
        [4, 'method', 2, 'panels'],
        [5, 'method', 3, 'panels'],
        [6, 'summary', 0, 'content'],
        [7, 'summary', 1, 'content'],
      ],
    );
  });

  it('names a segment after the index of its step, its slide, and its step', () => {
    assert.deepEqual(
      steps.map((step) => step.segment),
      ['00-title-0', null, '02-method-0', null, '04-method-2', null, '06-summary-0', '07-summary-1'],
    );
  });

  it('speaks a notes file once, at the first step that shows it', () => {
    const byIndex = (index) => steps[index].text;
    assert.equal(byIndex(2), 'We capture a video of light. The direct light gives depth.');
    assert.equal(byIndex(3), null, 'step 1 shows notes.md again, already spoken at step 0');
    assert.equal(byIndex(4), 'The indirect light reveals hidden geometry.');
    assert.equal(byIndex(6), 'In summary, it works.', 'notes-0.md wins at step 0');
    assert.equal(byIndex(7), 'Thank you.', 'notes.md is first shown at step 1');
  });

  it('keeps a step without notes, or with blank notes, silent', () => {
    for (const index of [1, 3, 5]) {
      assert.deepEqual(
        { segment: steps[index].segment, text: steps[index].text, words: steps[index].words, problems: steps[index].problems },
        { segment: null, text: null, words: 0, problems: [] },
      );
    }
  });

  it('joins the lines of a notes file and changes nothing else', () => {
    assert.equal(steps[0].text, 'Generative view synthesis from propagating light.');
    assert.equal(steps[0].words, 6);
  });

  it('pads segment indexes to the width of the largest one', () => {
    const long = narrationSteps(
      Array.from({ length: 101 }, (_, index) => ({ id: `s${index}`, layout: 'content' })),
      { s0: { 'notes.md': 'First.' }, s100: { 'notes.md': 'Last.' } },
    );
    assert.equal(long[0].segment, '000-s0-0');
    assert.equal(long[100].segment, '100-s100-0');
  });

  it('exports the script and the steps file the narration directory holds', () => {
    assert.deepEqual(narrationScript(steps, 'kokoro-heart'), {
      voice: 'kokoro-heart',
      segments: [
        { id: '00-title-0', text: 'Generative view synthesis from propagating light.' },
        { id: '02-method-0', text: 'We capture a video of light. The direct light gives depth.' },
        { id: '04-method-2', text: 'The indirect light reveals hidden geometry.' },
        { id: '06-summary-0', text: 'In summary, it works.' },
        { id: '07-summary-1', text: 'Thank you.' },
      ],
    });
    const file = narrationStepsFile(steps);
    assert.equal(file.length, 8);
    assert.deepEqual(file[1], { index: 1, slide: 'card', step: 0, layout: 'sectionCard', segment: null });
    assert.deepEqual(file[4], { index: 4, slide: 'method', step: 2, layout: 'panels', segment: '04-method-2' });
  });
});

describe('speechProblems', () => {
  it('accepts complete sentences of plain prose', () => {
    assert.deepEqual(speechProblems('The direct light gives depth. Is that enough?'), []);
    assert.deepEqual(speechProblems('20 seeds agree (all of them).'), []);
    assert.deepEqual(speechProblems('"Light," she said, "is enough."'), []);
    assert.deepEqual(speechProblems('The loss is the mean_squared_error of the two.'), []);
  });

  it('reports notes that do not start or end as a sentence', () => {
    assert.deepEqual(speechProblems('and then the lamp'), [
      'does not start with a capital letter or a digit',
      'does not end with a period, question mark, or exclamation mark',
    ]);
    assert.equal(speechProblems('Point at the lamp').length, 1);
    assert.equal(speechProblems('Three things:').length, 1);
  });

  it('reports Markdown and math, which a voice would read aloud', () => {
    assert.deepEqual(speechProblems('Press **P** to open `notes.md`.'), [
      'has Markdown or math, which a voice reads aloud or drops (emphasis marks, backticks)',
    ]);
    assert.match(speechProblems('The weight is $w_i$.').at(-1), /\(dollar signs\)/);
    assert.match(speechProblems('# Title\n\nA sentence.').at(-1), /\(a heading\)/);
    assert.match(speechProblems('Three things.\n\n- One.\n- Two.').at(-1), /\(a list\)/);
    assert.match(speechProblems('See [the paper](https://example.org).').at(-1), /\(a link\)/);
  });

  it('is what a narrated step carries', () => {
    const [step] = narrationSteps([{ id: 'a', layout: 'content' }], { a: { 'notes.md': 'A list:\n\n- one\n' } });
    assert.equal(step.problems.length, 2);
    assert.equal(step.text, 'A list: - one');
  });
});

describe('duration estimate', () => {
  it('counts words between white space', () => {
    assert.equal(countWords('  Light  transport,\nin 3D-GTR and non-line-of-sight scenes. '), 7);
    assert.equal(countWords(''), 0);
  });

  it('is the words over the speaking rate, in seconds', () => {
    assert.equal(estimateSeconds(160), 60);
    assert.equal(estimateSeconds(80, DEFAULT_WORDS_PER_MINUTE), 30);
    assert.equal(estimateSeconds(300, 150), 120);
    assert.equal(estimateSeconds(0, 150), 0);
  });
});

describe('readDeck', () => {
  const dir = join(ROOT, 'tests/fixtures/ui-showcase');
  const manifest = JSON.parse(readFileSync(join(dir, 'presentation.json'), 'utf-8'));
  const deck = readDeck({ id: 'ui-showcase', dir, manifest });
  const steps = narrationSteps(deck.slides, deck.notesBySlide);

  it('reads the slides in the order of presentation.json', () => {
    assert.deepEqual(deck.slides.map((slide) => slide.id), manifest.sections.flatMap((section) => section.slides));
    assert.deepEqual(steps.map((step) => step.index), steps.map((_, index) => index));
  });

  it('reads each slide\'s notes files', () => {
    assert.deepEqual(Object.keys(deck.notesBySlide.progressive).sort(), ['notes-1.md', 'notes.md']);
    const progressive = steps.filter((step) => step.slide === 'progressive');
    assert.equal(progressive[0].text, 'Shared notes for the progressive slide.');
    assert.equal(progressive[0].segment, `${String(progressive[0].index).padStart(2, '0')}-progressive-0`);
    assert.equal(progressive[1].text, 'Notes for step two only.');
    assert.ok(progressive.slice(2).every((step) => step.segment === null));
  });

  it('fails with every problem when the presentation is broken', () => {
    const broken = { ...manifest, sections: [{ id: 'one', title: 'One', slides: ['title', 'no-such-slide'] }] };
    assert.throws(() => readDeck({ id: 'ui-showcase', dir, manifest: broken }), /no-such-slide/);
  });
});

describe('pronunciation map', () => {
  it('accepts a flat object of non-empty strings', () => {
    assert.deepEqual(pronunciationProblems({ NLOS: 'en-loss', 'Lyra 2': 'Lyra two' }), []);
    assert.deepEqual(pronunciationProblems({}), []);
  });

  it('reports anything else', () => {
    assert.equal(pronunciationProblems(['NLOS']).length, 1);
    assert.equal(pronunciationProblems(null).length, 1);
    assert.equal(pronunciationProblems({ NLOS: '', LoRA: 3, ' CGLS': 'C G L S' }).length, 3);
  });

  it('is optional, and read from pronunciation.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'narration-test-'));
    assert.deepEqual(readPronunciationMap({ dir }), { map: {}, problems: [] });
    writeFileSync(join(dir, 'pronunciation.json'), '{ "NLOS": "en-loss" }');
    assert.deepEqual(readPronunciationMap({ dir }), { map: { NLOS: 'en-loss' }, problems: [] });
    writeFileSync(join(dir, 'pronunciation.json'), '{ "NLOS": ');
    const unreadable = readPronunciationMap({ dir });
    assert.equal(unreadable.map, null);
    assert.equal(unreadable.problems.length, 1);
  });
});

describe('narration environments', () => {
  it('have one default home, stated alike in Node and in setup.sh', () => {
    const saved = process.env.NARRATION_HOME;
    delete process.env.NARRATION_HOME;
    try {
      const directoryName = narrationHome().replaceAll('\\', '/').split('/').at(-1);
      const setup = readFileSync(join(ROOT, 'narration/setup.sh'), 'utf-8');
      assert.ok(setup.includes(`NARRATION_HOME="\${NARRATION_HOME:-$HOME/${directoryName}}"`), `narration/setup.sh does not default to ~/${directoryName}`);
      process.env.NARRATION_HOME = '/somewhere/else';
      assert.equal(narrationHome(), '/somewhere/else');
    } finally {
      if (saved === undefined) delete process.env.NARRATION_HOME;
      else process.env.NARRATION_HOME = saved;
    }
  });

  it('have a backend that setup.sh creates for every voice preset', () => {
    const setup = readFileSync(join(ROOT, 'narration/setup.sh'), 'utf-8');
    for (const [name, voice] of Object.entries(readVoices())) {
      assert.ok(setup.includes(`setup_${voice.backend}()`), `voice "${name}" uses backend "${voice.backend}", which narration/setup.sh does not create`);
    }
  });
});
