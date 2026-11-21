# Live tracking documents

`docs/tracking/` contains the live execution state for active plans. Use one
tracking document per active plan and give both files the same stem:

- `docs/plans/<stem>.md` defines the goal, execution order, fixed contracts,
  and remaining tasks;
- `docs/tracking/<stem>.md` records current status, evidence, active jobs, and
  the exact resume point.

Update the tracking document when work lands or operational state changes.
Treat it as a stack: add the newest dated entry at the top, before older
entries. Consolidate superseded operational notes into a short current-state
handoff rather than growing a transcript of individual probe calls. Stable
findings belong in the appropriate concept or guide, not in the live tracker.

An entry records what happened, forward: the direction that started it
(quoted, with its date), what changed (commits, files), what each check
showed, and what comes next. A disproved hypothesis recorded as disproved is
a result.

When a plan is complete, archive its plan and tracker under
`docs/archive/<date>/` after promoting durable decisions into the maintained
documentation.

## Entry skeleton

```markdown
## YYYY-MM-DD HH:MM — <one-line status>

User direction (YYYY-MM-DD): "<quoted direction>".

- Done: <what landed>, commit <sha>.
- Checked: <npm run check, npm test, capture run data/captures/<id>/<time>/>.
- Next: <what, and the check that decides it>.
```

## Active trackers

- [Template restructure](template-restructure.md), for
  [its plan](../plans/template-restructure.md).
- [Framework consolidation](framework-consolidation.md), for
  [its plan](../plans/framework-consolidation.md).
- [Reviewing a deck on an iPad or iPhone](ipad-review.md), for
  [its plan](../plans/ipad-review.md).
