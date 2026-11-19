# Working together

Several people, and several agent sessions, work on this repository at the
same time: on different machines, on the same branch. These are the habits
that keep their work from colliding.

## Branches and folders

- A project's work is on that project's branch, checked out in the main
  folder. Do not commit a project's slides to another project's branch, and
  do not keep long-lived side checkouts in sibling folders: the user looks
  in the main folder.
- Framework changes (`core/`, `scripts/`, `tests/`, shared docs) are made
  on a short-lived branch from `main`, reach `main` after the browser
  tests pass, and are then merged into project branches.
- The remote holds `main` and one branch per presentation. A helper
  branch (framework work, a builder's task, work in progress) is pushed
  only while its work is in flight and deleted from the remote when it is
  merged; before deleting one, confirm that a kept branch has every commit
  on it.
- A git worktree is for one task: made when the task starts, removed when
  its work is merged. Before removing any directory tree, list the links
  inside it; never create links between checkouts in the first place (a
  recursive delete follows a junction and empties its target).

## Pushing

- **Fetch and merge before every push**, and before starting a pass of
  work. A rejected push means someone else pushed: merge their work, do not
  force.
- **Small commits, pushed often.** A conflict in a ten-line commit takes a
  minute; a conflict after a day of unpushed work does not.
- **Resolve a conflict in favor of the decision.** When two people changed
  the same lines for different reasons, keep each one's decision on what
  they were changing (their styling on their classes, your structure on
  your slide) and re-apply the other on top.
- After every merge, run `npm run check` and `npm test`, and look at the
  slides the other person changed before touching them.

## Directions

- Each person's directions are recorded where they were given: quoted and
  dated in the tracker's "Standing directions", newest first. Read the
  newest entries after every merge; a collaborator's session writes there
  too.
- When a collaborator's change conflicts with a direction someone else
  gave (a color, a font, a slide's order), leave both visible and tell the
  people: it is theirs to settle.
- A reviewer's finding does not outrank a person's direction.

## Media

- Media are not in git: `public/` and `assets/` are ignored, and their
  durable copy is the bucket ([DATA.md](../../DATA.md)). After merging
  someone's slides, pull their media (`npm run assets -- pull <id>`); after
  changing media, push them. Copy only; never sync.
- The scripts that build media are code and belong in git, under the
  presentation's `media/` directory. A script kept only in the bucket has
  no history and cannot be merged.
- Do not delete a media file that a slide on the branch still names; check
  with `npm run check` before and after.

## Agents

- Builders touch only the files of their task and merge the branch's
  newest state before their final commit.
- Stop every server and browser a session starts, by process id, when its
  task ends; a server left running holds its folder open and wastes the
  machine.
- One heavy job at a time on a laptop: captures, recordings, and browser
  tests give wrong timings when they run together.
