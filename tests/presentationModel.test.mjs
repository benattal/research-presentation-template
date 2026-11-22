import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  PresentationError,
  buildPresentation,
  formatCredit,
  indexNotes,
  mergeLayouts,
  notesFileName,
  parseJsonFile,
  prefixAssetPaths,
  slideIdFromPath,
  stepCount,
} from '../core/client/presentation/model.js';
import { notesFormulas, notesMathProblems } from '../core/client/presentation/notesMath.js';

describe('parseJsonFile', () => {
  it('returns the value of a valid file and adds no problem', () => {
    const problems = [];
    assert.deepEqual(parseJsonFile('slides/a/content.json', '{ "layout": "title" }', problems), { layout: 'title' });
    assert.deepEqual(problems, []);
  });

  it('names a file that is not valid JSON, with where the mistake is', () => {
    const problems = [];
    const missingComma = '{\n  "layout": "content"\n  "title": "A"\n}';
    assert.equal(parseJsonFile('slides/a/content.json', missingComma, problems), undefined);
    assert.equal(parseJsonFile('presentation.json', '', problems), undefined);
    assert.equal(problems.length, 2);
    assert.match(problems[0], /^slides\/a\/content\.json is not valid JSON: .*line 3/);
    assert.match(problems[1], /^presentation\.json is not valid JSON: /);
  });
});

const Layout = () => null;
const layouts = { title: Layout, content: Layout };

function build(overrides = {}) {
  return buildPresentation({
    id: 'demo',
    manifest: {
      title: 'Demo',
      sections: [
        { id: 'one', title: 'One', slides: ['intro', 'body'] },
        { id: 'two', title: 'Two', slides: ['end'] },
      ],
    },
    slideContents: {
      intro: { layout: 'title', title: 'Intro', background: '/slides/intro/bg.jpg' },
      body: { layout: 'content', buildSteps: [{}, {}, {}] },
      end: { layout: 'title' },
      draft: { layout: 'content' },
    },
    layouts,
    baseUrl: '/demo/',
    ...overrides,
  });
}

describe('buildPresentation', () => {
  it('flattens sections into an ordered slide list with position fields', () => {
    const presentation = build();
    assert.deepEqual(presentation.slides.map((slide) => slide.id), ['intro', 'body', 'end']);
    assert.deepEqual(
      presentation.slides.map(({ index, sectionId, sectionIndex, indexInSection }) => [index, sectionId, sectionIndex, indexInSection]),
      [[0, 'one', 0, 0], [1, 'one', 0, 1], [2, 'two', 1, 0]],
    );
    assert.equal(presentation.defaultTransition, 'fade');
    assert.equal(presentation.backLink, null);
  });

  it('resolves asset paths against the base URL', () => {
    assert.equal(build().slides[0].background, '/demo/slides/intro/bg.jpg');
  });

  it('lists slide directories the manifest does not use', () => {
    assert.deepEqual(build().unlistedSlideIds, ['draft']);
  });

  it('reports every problem at once', () => {
    assert.throws(() => build({
      manifest: { title: '', sections: [{ id: 'one', slides: ['intro', 'missing', 'intro', 'bad'] }] },
      slideContents: { intro: { layout: 'title' }, bad: { layout: 'nope' } },
    }), (error) => {
      assert.ok(error instanceof PresentationError);
      const problems = error.problems.join('\n');
      assert.equal(error.problems.length, 4);
      assert.match(problems, /"title"/);
      assert.match(problems, /"missing"/);
      assert.match(problems, /more than once/);
      assert.match(problems, /"nope"/);
      return true;
    });
  });

  it('reports a LaTeX command whose backslash JSON read as an escape', () => {
    const problems = (slideContents) => {
      try {
        build({ slideContents: { intro: { layout: 'title' }, body: { layout: 'content' }, end: { layout: 'title' }, ...slideContents } });
        return [];
      } catch (error) {
        return error.problems;
      }
    };
    assert.deepEqual(problems({ end: { layout: 'title', label: '$\\theta$', lines: [{ tex: 'F_\\theta' }] } }), []);
    const tab = problems({ end: { layout: 'title', lines: [{ tex: 'F_\theta' }] } });
    assert.equal(tab.length, 1);
    assert.match(tab[0], /slide "end".*U\+0009/);
    const newline = problems({ end: { layout: 'title', title: 'Gradient $\nabla f$' } });
    assert.equal(newline.length, 1);
    assert.match(newline[0], /inline formula .* contains a newline/);
  });

  it('does not share content objects between builds', () => {
    const slideContents = { intro: { layout: 'title', nested: { a: 1 } } };
    const manifest = { title: 'T', sections: [{ id: 's', slides: ['intro'] }] };
    const first = buildPresentation({ id: 'x', manifest, slideContents, layouts, baseUrl: '/' });
    first.slides[0].nested.a = 2;
    assert.equal(slideContents.intro.nested.a, 1);
  });
});

describe('prefixAssetPaths', () => {
  it('prefixes only /slides/ strings, at any depth', () => {
    assert.deepEqual(
      prefixAssetPaths({ a: '/slides/x.png', b: ['/slides/y.mp4', 'https://e.com/slides/z'], c: 3 }, './'),
      { a: './slides/x.png', b: ['./slides/y.mp4', 'https://e.com/slides/z'], c: 3 },
    );
    assert.equal(prefixAssetPaths('/slides/x.png', '/'), '/slides/x.png');
  });
});

describe('stepCount', () => {
  it('counts build steps, with one step for a plain slide', () => {
    assert.equal(stepCount({ buildSteps: [{}, {}] }), 2);
    assert.equal(stepCount({ buildSteps: [] }), 1);
    assert.equal(stepCount({}), 1);
  });
});

describe('mergeLayouts', () => {
  it('adds presentation layouts and rejects a clash with a core layout', () => {
    assert.deepEqual(Object.keys(mergeLayouts(layouts, { custom: Layout })), ['title', 'content', 'custom']);
    assert.throws(() => mergeLayouts(layouts, { title: Layout }), PresentationError);
  });
});

describe('notes', () => {
  it('indexes notes files by slide id and file name', () => {
    assert.equal(slideIdFromPath('/presentations/demo/slides/intro/notes.md'), 'intro');
    assert.deepEqual(
      indexNotes({ '../slides/a/notes.md': 'A', '../slides/a/notes-1.md': 'A1', 'C:\\p\\slides\\b\\notes.md': 'B' }),
      { a: { 'notes.md': 'A', 'notes-1.md': 'A1' }, b: { 'notes.md': 'B' } },
    );
  });

  it('reads and writes a per-step file only for its own step', () => {
    assert.equal(notesFileName(['notes.md', 'notes-1.md'], 1), 'notes-1.md');
    assert.equal(notesFileName(['notes.md', 'notes-1.md'], 2), 'notes.md');
    assert.equal(notesFileName([], 0), 'notes.md');
  });

  it('finds formulas as the Markdown parser does, with Markdown kept out of them', () => {
    const notes = 'Step 1: $w_i = T_i\\,\\alpha_i$ and *emphasis*, then `$code$`:\n\n$$\nx = e + A_k x\n$$\n';
    assert.deepEqual(notesFormulas(notes), [
      { math: 'w_i = T_i\\,\\alpha_i', display: false },
      { math: 'x = e + A_k x', display: true },
    ]);
  });

  it('reports a notes formula that does not render', () => {
    assert.deepEqual(notesMathProblems('fine $x^2$', 'n.md'), []);
    const [problem, ...rest] = notesMathProblems('broken $\\frac{1}{$', 'slides/a/notes.md');
    assert.equal(rest.length, 0);
    assert.match(problem, /^slides\/a\/notes\.md: the formula "\\frac\{1\}\{" does not render/);
  });
});

describe('credits', () => {
  const sources = {
    doe2020: { authors: 'Doe et al.', title: 'A paper', venue: 'CVPR', year: 2020 },
    roe2021: { authors: 'Roe', title: 'A thesis', year: 2021 },
  };
  const withCredits = (credits) => build({
    sources,
    slideContents: {
      intro: { layout: 'title', credits },
      body: { layout: 'content', credits: ['roe2021', { source: 'doe2020' }] },
      end: { layout: 'title' },
    },
  });

  it('formats a credit as authors, venue and year, then what was taken', () => {
    assert.equal(formatCredit(sources.doe2020, 'Fig. 3'), 'Doe et al., CVPR 2020, Fig. 3');
    assert.equal(formatCredit(sources.roe2021), 'Roe, 2021');
  });

  it('gives each credited slide its credit line and lists citations in order of first use', () => {
    const presentation = withCredits([{ source: 'doe2020', what: 'Fig. 1' }]);
    assert.equal(presentation.slides[0].creditLine, 'Doe et al., CVPR 2020, Fig. 1');
    assert.equal(presentation.slides[1].creditLine, 'Roe, 2021 · Doe et al., CVPR 2020');
    assert.equal(presentation.slides[2].creditLine, undefined);
    assert.deepEqual(presentation.citations.map((c) => [c.key, c.slideIds]), [['doe2020', ['intro', 'body']], ['roe2021', ['body']]]);
  });

  it('reports a credit to a source that sources.json does not have', () => {
    assert.throws(() => withCredits(['nobody1999']), (error) => error instanceof PresentationError
      && error.problems.some((problem) => problem.includes('"nobody1999"')));
  });
});

