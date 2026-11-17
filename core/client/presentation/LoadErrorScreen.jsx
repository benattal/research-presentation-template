/**
 * Shown instead of the presentation when its files do not load: every
 * problem `buildPresentation` found, so all of them can be fixed in one
 * pass. The capture pipeline looks for `data-load-error`.
 */
export default function LoadErrorScreen({ error }) {
  const problems = error.problems ?? [String(error.stack ?? error)];
  return (
    <div className="load-error" data-load-error="true">
      <h1>This presentation could not be loaded</h1>
      <ul>
        {problems.map((problem) => <li key={problem}>{problem}</li>)}
      </ul>
      <p>Run <code>npm run check</code> for the same list from the command line.</p>
    </div>
  );
}
