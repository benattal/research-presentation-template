import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  PresentationError,
  buildPresentation,
  indexNotes,
  mergeLayouts,
  notesFileName,
  prefixAssetPaths,
  slideIdFromPath,
  stepCount,
} from '../core/client/presentation/model.js';

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
});
