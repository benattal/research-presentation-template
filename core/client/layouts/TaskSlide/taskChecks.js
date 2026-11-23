/**
 * Whether a task slide's task is done, decided from the deck's own data.
 *
 * A task slide asks the reader to change this presentation, by editing a
 * file or by asking a coding agent to. Saving a file reloads the page with
 * the new data, so the slide can tell whether the change was made by
 * looking at the deck: no timer, no button.
 *
 * A check is an object in the slide's `content.json`:
 *
 *   { "field": "title", "differs": "Change this title" }   the field is no longer its starting value
 *   { "field": "bullets", "longerThan": 2 }                the list has more entries than it started with
 *   { "field": "subtitle", "contains": "$" }               the text has this in it
 *   { "slide": "webgl", "field": "layout", "is": "spinningShape" }
 *                                                          the same tests on another slide of the deck;
 *                                                          not done while that slide is not listed
 *   { "slideListed": "my-slide" }                          a section of presentation.json lists this slide
 *   { "slideListed": ["my-poll", "my-poll-results"] }      ... every one of these
 *   { "section": "mine" }                                  presentation.json has a section with this id
 *   { "section": "mine", "longerThan": 2 }                 ... that lists more slides than this
 *
 * A slide without a check has a task that cannot be seen from the deck's
 * data (a note in the presenter window, a color in the theme, a server
 * that was started): its state is `manual`, and the slide never claims
 * that it was done.
 */

/** A task's states, in the order a reader meets them. */
export const TASK_STATES = ['manual', 'todo', 'done'];

/** How a value is compared with what the check names; each returns whether the task is done. */
const VALUE_TESTS = {
  differs: (value, start) => value !== undefined && JSON.stringify(value) !== JSON.stringify(start),
  longerThan: (value, length) => Array.isArray(value) && value.length > length,
  contains: (value, part) => typeof value === 'string' && value.includes(part),
  is: (value, expected) => JSON.stringify(value) === JSON.stringify(expected),
};

/** The one test a check names, as `[name, argument]`, or undefined. */
function testOf(check) {
  const name = Object.keys(VALUE_TESTS).find((candidate) => candidate in check);
  return name && [name, check[name]];
}

/**
 * The state of the task of `slide`: `manual` without a check, otherwise
 * `todo` or `done`. `sections` is the presentation's section list, each
 * with its `slideIds`, and `slides` its listed slides. Throws on a check
 * it cannot read, so that a typing mistake in a check shows instead of
 * leaving a task that never ticks.
 */
export function taskState(slide, sections, slides) {
  const { check } = slide;
  if (check === undefined) return 'manual';
  const done = (isDone) => (isDone ? 'done' : 'todo');
  const test = testOf(check);

  if (check.slideListed !== undefined) {
    const listed = sections.flatMap((section) => section.slideIds);
    return done([check.slideListed].flat().every((slideId) => listed.includes(slideId)));
  }
  if (check.section !== undefined) {
    const section = sections.find((candidate) => candidate.id === check.section);
    if (!section) return 'todo';
    return done(test ? VALUE_TESTS[test[0]](section.slideIds, test[1]) : true);
  }
  if (typeof check.field !== 'string' || !test) {
    throw new Error(
      `Slide "${slide.id}": a check needs "slideListed", "section", or "field" with one of ${Object.keys(VALUE_TESTS).join(', ')}.`,
    );
  }
  const subject = check.slide === undefined ? slide : slides.find((candidate) => candidate.id === check.slide);
  if (!subject) return 'todo';
  return done(VALUE_TESTS[test[0]](subject[check.field], test[1]));
}
