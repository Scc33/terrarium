# ADR-0037 — The atlas is a scan of the repository, and the game is the only thing that draws it

**Status:** Accepted · **Date:** 2026-09-06 · **Issue:** [#128](https://github.com/Scc33/terrarium/issues/128)

## Context

The game explains itself at every level except the last one. A dial carries a tooltip, a lever
carries a handbook entry, a published figure carries a methodology chapter (ADR-0024). Under all
of that is a simulation, and about the simulation the game said nothing.

Something already existed. `packages/architecture-visualizer` scanned the repository with the
TypeScript AST — the tick order and its source comments, every module's exports and resolved
imports, the top-level state regions each pipeline step touches, the load-bearing seams — and
rendered three views of it in a standalone Vite app behind `pnpm architecture`.

[#128](https://github.com/Scc33/terrarium/issues/128) reported the two things wrong with that:
it could not be seen from the game, and it was not being rebuilt. Both were true. The checked-in
snapshot was **137 commits behind** the repository it claimed to describe, and nothing in CI or
in the test suite could tell.

The staleness is the more interesting half, because of *how* it fails. An architecture map that
has fallen behind does not look broken. It looks like a smaller, simpler codebase — which is
precisely what a reader opened it to believe. Missing pipeline steps read as an engine that does
less; missing modules read as a system with fewer parts. This is ADR-0024's argument about the
manual, one floor down: the silent failure is worse than the absent feature, because the reader
stops asking.

## Decision

**The scan is a build input of the game, and the game is the only thing that renders it.**

Three parts:

- **`packages/architecture-visualizer` is a scanner.** It keeps `scripts/analyze.ts`,
  `scripts/generate.ts`, the `model.ts` shapes and the generated snapshot, and it exports them as
  an ordinary workspace package. Its Vite app — `index.html`, 452 lines of `main.ts`, 423 lines of
  hand-written CSS — is deleted. It was a second renderer of the same data in a second visual
  language, and it was the one nobody opened.
- **`ui/src/atlas.ts` derives, `panels/AtlasOverlay.tsx` paints.** The usual split, for the usual
  reason: what goes in a component cannot be tested. The overlay is reached from the offices menu
  and from the handbook, which is the floor above it.
- **`pnpm architecture:check` re-scans and fails if the checked-in snapshot has drifted**, and CI
  runs it on every push and pull request. `tests/ui/atlas.test.ts` makes the same guarantee
  specific where it matters most: it crosses the import boundary the way `manual.test.ts` does and
  compares the scanned pipeline against the engine's live `TICK_ORDER`, so a step added, renamed
  or reordered without a rescan fails by name in the ordinary test run.

Four consequences are load-bearing.

**The snapshot is fetched, not bundled.** It is 400KB of scanned repository and has no business
in the bundle a player downloads to run a country. The overlay imports it dynamically, so it
becomes its own chunk that only a reader who opens the atlas ever pays for — and `atlas.ts` takes
the snapshot as an argument, which is what keeps it pure and testable.

**A source link is a permalink at the revision the map was drawn at**, never at `master`. The line
numbers came from that commit. A link to the moving branch degrades in the one way that never
looks broken: the file opens, the anchor lands, and the code under it is not the code the atlas
was describing — further off every month. This also replaces the old renderer's editor endpoint,
which worked only under its own dev server and fell back to copying `path:line` to the clipboard
everywhere else.

**The check normalizes `revision` away, and it has to.** The field records the commit the scan was
taken at, so it is one commit behind by construction — the commit that lands a rescan cannot
contain its own hash. Compared literally the check would fail on every commit and therefore mean
nothing. Compared without it, the check answers the question actually being asked: does this map
still describe this repository?

**The layering is derived from the measured imports.** The retired renderer hard-coded
`ui → observation → engine` and placed `runner` and `fixtures` by hand, so a sixth workspace
package would have been silently absent from the system map. Depth now falls out of the scanned
package edges, and `tests/ui/atlas.test.ts` asserts every package is placed exactly once.

## Alternatives

**Keep the standalone app and add an in-game view.** Nothing is destroyed, and there are then two
renderers of one snapshot. They cannot disagree about facts — the data is shared — but they drift
in feature and register, and the unloved one is the one that just went 137 commits stale. The
handbook's "one portal" argument applies unchanged.

**Build the atlas as a static site into the game's output and link to it from the menu.** Cheap,
and it ships a second visual language one click from the war room. It also leaves the atlas
outside everything that makes the rest of the UI honest: no shared primitives, no import
boundary, no test that opens it.

**Regenerate the scan on every build instead of checking it in.** Always current, at the cost of a
git call and a TypeScript AST walk in front of every build, and a working tree that is dirty after
every local build. The checked-in artifact is also reviewable: a rescan shows up in the diff as
what actually changed about the shape of the repository.

**A hand-written architecture page.** This is `docs/tech-architecture.md`, which is the right
document for contributors and the wrong register for the game — and it is maintained by hand,
which is the failure this ADR exists to remove rather than repeat.

## Consequences

- The atlas can no longer go quietly stale. It can still be *wrong* in its authored parts — the
  five seams and the five `PIPELINE_NOTES` asides are written, not scanned — but a note whose step
  no longer exists fails the test suite by name, and the seams are asserted to resolve to files
  that were actually found.
- `pnpm architecture` is gone as a dev server; `pnpm architecture:scan` redraws the map and
  `pnpm architecture:check` is what CI runs. The atlas itself is in the game, at 1280×720, in the
  same browser as everything else.
- The scanner excludes its own package from the walk, so the atlas does not map itself and the
  game's import of the snapshot does not appear as an edge. That is a small honest gap rather than
  a bug: the map is of the simulation, and the map is not part of it.
- Adding a workspace package, a pipeline step or a seam now has a place it must be re-scanned
  into. That cost is one command, and it is the cost of the guarantee.
