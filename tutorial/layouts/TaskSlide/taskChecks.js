/**
 * Whether a task slide's task is done, decided from the deck's own data.
 *
 * A task slide asks the reader to edit a file of this presentation. Saving
 * the file reloads the page with the new data, so the slide can tell
 * whether the edit was made by looking at itself: no timer, no button.
 *
 * A check is an object in the slide's `content.json`:
 *
 *   { "field": "title", "differs": "Change this title" }   the field is no longer its starting value
 *   { "field": "bullets", "longerThan": 2 }                the list has more entries than it started with
 *   { "field": "subtitle", "contains": "$" }               the text has this in it
 *   { "slideListed": "my-slide" }                          a section of presentation.json lists this slide
 *
 * A slide without a check has a task that cannot be seen from its data
 * (a note in the presenter window, a color in the theme): its state is
 * `manual`, and the slide never claims that it was done.
 */

/** A task's states, in the order a reader meets them. */
export const TASK_STATES = ['manual', 'todo', 'done'];

/** How a field's value is compared with what the check names; each returns whether the task is done. */
const FIELD_TESTS = {
  differs: (value, start) => value !== undefined && JSON.stringify(value) !== JSON.stringify(start),
  longerThan: (value, length) => Array.isArray(value) && value.length > length,
  contains: (value, part) => typeof value === 'string' && value.includes(part),
};

/**
 * The state of the task of `slide`: `manual` without a check, otherwise
 * `todo` or `done`. `sections` is the presentation's section list, each
 * with its `slideIds`. Throws on a check it cannot read, so that a typing
 * mistake in a check shows instead of leaving a task that never ticks.
 */
export function taskState(slide, sections) {
  const { check } = slide;
  if (check === undefined) return 'manual';
  if (check.slideListed !== undefined) {
    return sections.some((section) => section.slideIds.includes(check.slideListed)) ? 'done' : 'todo';
  }
  const test = Object.keys(FIELD_TESTS).find((name) => name in check);
  if (typeof check.field !== 'string' || !test) {
    throw new Error(
      `Slide "${slide.id}": a check needs "slideListed", or "field" with one of ${Object.keys(FIELD_TESTS).join(', ')}.`,
    );
  }
  return FIELD_TESTS[test](slide[check.field], check[test]) ? 'done' : 'todo';
}
