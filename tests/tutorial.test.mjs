/**
 * The task layout's checks, which decide whether a task is done, and the
 * two tutorial decks' task slides: each has what a reader needs, and a
 * check that the change it asks for satisfies. A reader's working copy has
 * tasks already done, so nothing here depends on the state the tutorials'
 * files are in.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { TASK_STATES, taskState } from '../core/client/layouts/TaskSlide/taskChecks.js';
import { commandNameOf, directoryOf, selectPresentations } from '../core/tooling/presentations.js';

const NO_SECTIONS = [];
const NO_SLIDES = [];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

/** A tutorial deck and its task slides, each `{ id, ...content }`, in the deck's order. */
function deckOf(id) {
  const [presentation] = selectPresentations([id]);
  const slideIds = presentation.manifest.sections.flatMap((section) => section.slides);
  const slides = slideIds.map((slideId) => ({ id: slideId, ...readJson(join(presentation.dir, 'slides', slideId, 'content.json')) }));
  return { ...presentation, slideIds, taskSlides: slides.filter((slide) => slide.layout === 'task') };
}

const tutorial = deckOf('tutorial');
const agents = deckOf('tutorial-agents');

describe('task checks', () => {
  it('have three states, and a slide without a check is never done', () => {
    assert.deepEqual(TASK_STATES, ['manual', 'todo', 'done']);
    assert.equal(taskState({ id: 'a', title: 'Anything' }, NO_SECTIONS, NO_SLIDES), 'manual');
  });

  it('see a field that no longer has its starting value', () => {
    const check = { field: 'title', differs: 'Change this title' };
    assert.equal(taskState({ id: 'a', title: 'Change this title', check }, NO_SECTIONS, NO_SLIDES), 'todo');
    assert.equal(taskState({ id: 'a', title: 'My first edit', check }, NO_SECTIONS, NO_SLIDES), 'done');
    assert.equal(taskState({ id: 'a', check }, NO_SECTIONS, NO_SLIDES), 'todo', 'a deleted field is not an edit');
  });

  it('see a list that grew, text that contains something, and a value that is exactly something', () => {
    const longer = { field: 'bullets', longerThan: 2 };
    assert.equal(taskState({ id: 'a', bullets: ['one', 'two'], check: longer }, NO_SECTIONS, NO_SLIDES), 'todo');
    assert.equal(taskState({ id: 'a', bullets: ['one', 'two', 'three'], check: longer }, NO_SECTIONS, NO_SLIDES), 'done');
    assert.equal(taskState({ id: 'a', check: longer }, NO_SECTIONS, NO_SLIDES), 'todo', 'no list at all');
    const contains = { field: 'subtitle', contains: '$' };
    assert.equal(taskState({ id: 'a', subtitle: 'Put a formula here', check: contains }, NO_SECTIONS, NO_SLIDES), 'todo');
    assert.equal(taskState({ id: 'a', subtitle: 'Euler: $e^{i\\pi} + 1 = 0$', check: contains }, NO_SECTIONS, NO_SLIDES), 'done');
    const is = { field: 'layout', is: 'content' };
    assert.equal(taskState({ id: 'a', layout: 'contents', check: is }, NO_SECTIONS, NO_SLIDES), 'todo');
    assert.equal(taskState({ id: 'a', layout: 'content', check: is }, NO_SECTIONS, NO_SLIDES), 'done');
  });

  it('see another slide of the deck, once it is listed', () => {
    const slide = { id: 'a', check: { slide: 'webgl', field: 'layout', is: 'spinningShape' } };
    assert.equal(taskState(slide, NO_SECTIONS, [slide]), 'todo', 'no such slide yet');
    assert.equal(taskState(slide, NO_SECTIONS, [slide, { id: 'webgl', layout: 'content' }]), 'todo');
    assert.equal(taskState(slide, NO_SECTIONS, [slide, { id: 'webgl', layout: 'spinningShape' }]), 'done');
    const steps = { id: 'b', check: { slide: 'webgl', field: 'buildSteps', longerThan: 1 } };
    assert.equal(taskState(steps, NO_SECTIONS, [{ id: 'webgl' }]), 'todo');
    assert.equal(taskState(steps, NO_SECTIONS, [{ id: 'webgl', buildSteps: [{}, {}] }]), 'done');
  });

  it('see a slide that a section lists, and several', () => {
    const slide = { id: 'a', check: { slideListed: 'my-slide' } };
    assert.equal(taskState(slide, [{ id: 'build', slideIds: ['a'] }], NO_SLIDES), 'todo');
    assert.equal(taskState(slide, [{ id: 'build', slideIds: ['a', 'my-slide'] }], NO_SLIDES), 'done');
    const both = { id: 'a', check: { slideListed: ['poll', 'results'] } };
    assert.equal(taskState(both, [{ id: 'live', slideIds: ['a', 'poll'] }], NO_SLIDES), 'todo', 'one of the two');
    assert.equal(taskState(both, [{ id: 'live', slideIds: ['a', 'poll'] }, { id: 'more', slideIds: ['results'] }], NO_SLIDES), 'done');
  });

  it('see a section, and how many slides it lists', () => {
    const exists = { id: 'a', check: { section: 'mine' } };
    assert.equal(taskState(exists, [{ id: 'start', slideIds: ['a'] }], NO_SLIDES), 'todo');
    assert.equal(taskState(exists, [{ id: 'mine', slideIds: [] }], NO_SLIDES), 'done');
    const three = { id: 'a', check: { section: 'mine', longerThan: 2 } };
    assert.equal(taskState(three, [{ id: 'mine', slideIds: ['x', 'y'] }], NO_SLIDES), 'todo');
    assert.equal(taskState(three, [{ id: 'mine', slideIds: ['x', 'y', 'z'] }], NO_SLIDES), 'done');
  });

  it('refuse a check they cannot read, naming the slide', () => {
    assert.throws(() => taskState({ id: 'broken', check: { field: 'title' } }, NO_SECTIONS, NO_SLIDES), /Slide "broken"/);
    assert.throws(() => taskState({ id: 'broken', check: { differs: 'x' } }, NO_SECTIONS, NO_SLIDES), /Slide "broken"/);
  });
});

describe('a presentation in messages and on slides', () => {
  it('is named by what a command takes: an id under presentations/, a directory elsewhere', () => {
    for (const presentation of selectPresentations([])) assert.equal(commandNameOf(presentation), presentation.id);
    const [fixture] = selectPresentations(['./tests/fixtures/ui-showcase']);
    assert.equal(fixture.id, 'ui-showcase');
    assert.equal(commandNameOf(fixture), './tests/fixtures/ui-showcase');
    const outside = join(tmpdir(), 'decks', 'talk');
    assert.equal(commandNameOf({ id: 'talk', dir: outside }), outside.replaceAll('\\', '/'));
    assert.throws(() => selectPresentations(['./docs']), /not a presentation/);
  });

  it('has its directory written from the repository root, with forward slashes', () => {
    assert.equal(directoryOf(tutorial), 'presentations/tutorial');
    assert.equal(directoryOf(selectPresentations(['./tests/fixtures/ui-showcase'])[0]), 'tests/fixtures/ui-showcase');
    const outside = join(tmpdir(), 'decks', 'talk');
    assert.equal(directoryOf({ id: 'talk', dir: outside }), outside.replaceAll('\\', '/'));
  });
});

/** A sections list and a slides list in which the task of `slide` is done, or is not yet. */
function worlds(slide) {
  const { check } = slide;
  const section = (id, slideIds) => ({ id, slideIds });
  if (check.slideListed !== undefined) {
    const wanted = [check.slideListed].flat();
    return {
      todo: [[section('s', [slide.id, ...wanted.slice(1)])], [slide]],
      done: [[section('s', [slide.id, ...wanted])], [slide]],
    };
  }
  if (check.section !== undefined) {
    const length = (check.longerThan ?? -1) + 1;
    const ids = Array.from({ length }, (_, index) => `slide-${index}`);
    return {
      todo: [[section('s', [slide.id]), ...(length > 0 ? [section(check.section, ids.slice(1))] : [])], [slide]],
      done: [[section('s', [slide.id]), section(check.section, ids)], [slide]],
    };
  }
  const values = {
    differs: { todo: check.differs, done: `${JSON.stringify(check.differs)} changed` },
    longerThan: { todo: Array.from({ length: check.longerThan }, () => 'entry'), done: Array.from({ length: check.longerThan + 1 }, () => 'entry') },
    contains: { todo: 'plain text', done: `with ${check.contains} in it` },
    is: { todo: `not ${check.is}`, done: check.is },
  };
  const kind = Object.keys(values).find((name) => name in check);
  assert.ok(kind, `slide ${slide.id}: a check of a known kind`);
  const subjectId = check.slide ?? slide.id;
  const withValue = (value) => {
    const subject = { ...(subjectId === slide.id ? slide : { id: subjectId }), [check.field]: value };
    return subjectId === slide.id ? [subject, [subject]] : [slide, [slide, subject]];
  };
  const [todoSlide, todoSlides] = withValue(values[kind].todo);
  const [doneSlide, doneSlides] = withValue(values[kind].done);
  return { todo: [NO_SECTIONS, todoSlides, todoSlide], done: [NO_SECTIONS, doneSlides, doneSlide] };
}

for (const deck of [tutorial, agents]) {
  describe(`the deck ${deck.id}`, () => {
    it('is listed with the presentations, and has task slides', () => {
      assert.ok(selectPresentations([]).some((presentation) => presentation.id === deck.id));
      assert.ok(deck.taskSlides.length >= 6, `${deck.taskSlides.length} task slides`);
    });

    // Each check, tried on the deck as the task leaves it and as it starts:
    // the change the slide asks for must be the change its check sees.
    it('has checks that the change each task asks for satisfies', () => {
      for (const slide of deck.taskSlides.filter((task) => task.check)) {
        const { todo, done } = worlds(slide);
        assert.equal(taskState(todo[2] ?? slide, todo[0], todo[1]), 'todo', `${deck.id}/${slide.id}: undone at its start`);
        assert.equal(taskState(done[2] ?? slide, done[0], done[1]), 'done', `${deck.id}/${slide.id}: done by its change`);
      }
    });
  });
}

describe('the first tutorial', () => {
  it('gives each task what to do, what to open or run, and what to say to an agent', () => {
    for (const slide of tutorial.taskSlides) {
      const where = `tutorial/slides/${slide.id}`;
      for (const field of ['title', 'task', 'ask']) {
        assert.equal(typeof slide[field], 'string', `${where}: "${field}"`);
      }
      const edits = slide.files ?? [{ file: slide.file, snippet: slide.snippet }];
      assert.ok(edits.every((edit) => edit.file || edit.snippet), `${where}: a file to open or a text to use`);
      // A file a task tells the reader to open is there, unless making it is the task.
      for (const { file } of edits.filter((edit) => edit.file && !slide.files)) {
        assert.ok(existsSync(join(tutorial.dir, file)) || existsSync(join(tutorial.dir, 'slides', slide.id, file)), `${where}: "${file}" exists`);
      }
    }
  });
});

describe('the second tutorial', () => {
  it('gives each task words to say, and names the deck in every prompt that changes it', () => {
    for (const slide of agents.taskSlides) {
      const where = `tutorial-agents/slides/${slide.id}`;
      for (const field of ['title', 'task', 'prompt']) {
        assert.equal(typeof slide[field], 'string', `${where}: "${field}"`);
      }
      if (slide.check) {
        assert.match(slide.prompt, /\btutorial-agents\b/, `${where}: a prompt that changes the deck says which deck`);
      }
      if (!slide.check) assert.match(slide.task, /cannot tick itself/, `${where}: a task without a check says that it cannot tick itself`);
      assert.ok(existsSync(join(agents.dir, 'slides', slide.id, 'notes.md')), `${where}: notes with a hint`);
    }
  });

  it('ships with its planted flaw: a title that the validation task has the agent shorten', () => {
    const flawed = agents.taskSlides.find((slide) => slide.id === 'task-validate');
    assert.equal(flawed.check.field, 'title');
    assert.ok(flawed.check.differs.length > 70, 'a title long enough to wrap');
  });
});
