/**
 * The tutorial deck's tasks: the checks that decide whether a task is done,
 * and that every task slide of the deck has a check which its own edit
 * satisfies. A reader's working copy has tasks already done, so nothing
 * here depends on the state the tutorial's files are in.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { tmpdir } from 'node:os';
import { REPO_ROOT, commandNameOf, selectPresentations } from '../core/tooling/presentations.js';
import { TASK_STATES, taskState } from '../tutorial/layouts/TaskSlide/taskChecks.js';

const TUTORIAL = join(REPO_ROOT, 'tutorial');
const NO_SECTIONS = [];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

/** Every slide of the tutorial that uses the task layout: `{ id, ...content }`. */
const taskSlides = readdirSync(join(TUTORIAL, 'slides'))
  .map((id) => ({ id, ...readJson(join(TUTORIAL, 'slides', id, 'content.json')) }))
  .filter((slide) => slide.layout === 'task');

describe('task checks', () => {
  it('have three states, and a slide without a check is never done', () => {
    assert.deepEqual(TASK_STATES, ['manual', 'todo', 'done']);
    assert.equal(taskState({ id: 'a', title: 'Anything' }, NO_SECTIONS), 'manual');
  });

  it('see a field that no longer has its starting value', () => {
    const check = { field: 'title', differs: 'Change this title' };
    assert.equal(taskState({ id: 'a', title: 'Change this title', check }, NO_SECTIONS), 'todo');
    assert.equal(taskState({ id: 'a', title: 'My first edit', check }, NO_SECTIONS), 'done');
    assert.equal(taskState({ id: 'a', check }, NO_SECTIONS), 'todo', 'a deleted field is not an edit');
  });

  it('see a list that grew, and text that contains something', () => {
    const longer = { field: 'bullets', longerThan: 2 };
    assert.equal(taskState({ id: 'a', bullets: ['one', 'two'], check: longer }, NO_SECTIONS), 'todo');
    assert.equal(taskState({ id: 'a', bullets: ['one', 'two', 'three'], check: longer }, NO_SECTIONS), 'done');
    assert.equal(taskState({ id: 'a', check: longer }, NO_SECTIONS), 'todo', 'no list at all');
    const contains = { field: 'subtitle', contains: '$' };
    assert.equal(taskState({ id: 'a', subtitle: 'Put a formula here', check: contains }, NO_SECTIONS), 'todo');
    assert.equal(taskState({ id: 'a', subtitle: 'Euler: $e^{i\\pi} + 1 = 0$', check: contains }, NO_SECTIONS), 'done');
  });

  it('see a slide that a section lists', () => {
    const slide = { id: 'a', check: { slideListed: 'my-slide' } };
    assert.equal(taskState(slide, [{ id: 'build', slideIds: ['a'] }]), 'todo');
    assert.equal(taskState(slide, [{ id: 'build', slideIds: ['a', 'my-slide'] }]), 'done');
  });

  it('refuse a check they cannot read, naming the slide', () => {
    assert.throws(() => taskState({ id: 'broken', check: { field: 'title' } }, NO_SECTIONS), /Slide "broken"/);
    assert.throws(() => taskState({ id: 'broken', check: { differs: 'x' } }, NO_SECTIONS), /Slide "broken"/);
  });
});

describe('the tutorial deck', () => {
  it('is a presentation that the commands take by its directory', () => {
    const [tutorial] = selectPresentations(['./tutorial']);
    assert.equal(tutorial.id, 'tutorial');
    assert.equal(tutorial.dir, TUTORIAL);
    assert.throws(() => selectPresentations(['./docs']), /not a presentation/);
  });

  it('is named in messages by what a command takes: an id under presentations/, a directory elsewhere', () => {
    const [tutorial] = selectPresentations(['./tutorial']);
    assert.equal(commandNameOf(tutorial), './tutorial');
    for (const presentation of selectPresentations([])) assert.equal(commandNameOf(presentation), presentation.id);
    const outside = join(tmpdir(), 'decks', 'talk');
    assert.equal(commandNameOf({ id: 'talk', dir: outside }), outside.replaceAll('\\', '/'));
  });

  it('has task slides, each with what to do, what to open or run, and what to say to an agent', () => {
    assert.ok(taskSlides.length >= 6, `${taskSlides.length} task slides`);
    for (const slide of taskSlides) {
      const where = `tutorial/slides/${slide.id}`;
      for (const field of ['title', 'task', 'ask']) {
        assert.equal(typeof slide[field], 'string', `${where}: "${field}"`);
      }
      const edits = slide.files ?? [{ file: slide.file, snippet: slide.snippet }];
      assert.ok(edits.every((edit) => edit.file || edit.snippet), `${where}: a file to open or a text to use`);
      // A file a task tells the reader to open is there, unless making it is the task.
      for (const { file } of edits.filter((edit) => edit.file && !slide.files)) {
        assert.ok(existsSync(join(TUTORIAL, file)) || existsSync(join(TUTORIAL, 'slides', slide.id, file)), `${where}: "${file}" exists`);
      }
    }
  });

  // Each check, tried on the slide as the task leaves it and as it starts:
  // the edit the slide asks for must be the edit its check sees.
  it('has checks that the edit each task asks for satisfies', () => {
    const edits = {
      differs: (slide, check) => ({ ...slide, [check.field]: `${JSON.stringify(check.differs)} changed` }),
      longerThan: (slide, check) => ({ ...slide, [check.field]: Array.from({ length: check.longerThan + 1 }, () => 'entry') }),
      contains: (slide, check) => ({ ...slide, [check.field]: `with ${check.contains} in it` }),
    };
    const starts = {
      differs: (slide, check) => ({ ...slide, [check.field]: check.differs }),
      longerThan: (slide, check) => ({ ...slide, [check.field]: Array.from({ length: check.longerThan }, () => 'entry') }),
      contains: (slide, check) => ({ ...slide, [check.field]: 'plain text' }),
    };
    for (const slide of taskSlides.filter((task) => task.check)) {
      const where = `tutorial/slides/${slide.id}`;
      if (slide.check.slideListed) {
        assert.equal(taskState(slide, [{ id: 's', slideIds: [slide.id] }]), 'todo', where);
        assert.equal(taskState(slide, [{ id: 's', slideIds: [slide.id, slide.check.slideListed] }]), 'done', where);
        continue;
      }
      const kind = Object.keys(edits).find((name) => name in slide.check);
      assert.ok(kind, `${where}: a check of a known kind`);
      assert.equal(taskState(starts[kind](slide, slide.check), NO_SECTIONS), 'todo', `${where}: undone at its start`);
      assert.equal(taskState(edits[kind](slide, slide.check), NO_SECTIONS), 'done', `${where}: done by its edit`);
    }
  });
});
