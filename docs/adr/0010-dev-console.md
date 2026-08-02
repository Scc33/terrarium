# ADR-0010 — The dev console shows truth without weakening the boundary

**Status:** Accepted · **Date:** 2026-08-02

## Context

Testing anything that happens after 1950 meant advancing a quarter at a time — reaching 1975
is 116 clicks — and there was no way to see whether a suspicious published figure was a
statistics bug or the economy genuinely doing that. The fog that makes the game good makes it
hard to debug, and the batch runner only reports distributions, not a single run's insides.

Two things collide here:

1. **There is no "set GDP to 5000."** State is derived from (params, seed, actionLog)
   (ADR-0001). Arbitrary state is not representable, so a dev tool cannot offer it without
   either breaking saves or smuggling a mutation into the action log.
2. **A true-state inspector is exactly what ADR-0004 forbids.** The worker exists so that
   `TrueState` cannot reach the UI. An inspector needs it to.

## Decision

**Scenarios instead of state pokes.** The console specifies *opening conditions* — seed,
starting capacities, development, population scale, openness — and a year to fast-forward to.
The run is an ordinary game: same `init`, same pipeline, same RNG, a real save. A scenario is
fully described by its own fields, so a bug found at 1975 is reachable by anyone holding the
scenario. The arithmetic lives in `ui/src/devScenario.ts`, pure and tested.

**Truth crosses as an anonymous tree.** `DevNode` is `{key, value?, children?}` — the worker
reflects `TrueState` into label/scalar pairs and the panel renders a tree it cannot name. No
component can be written against `state.sectors[0].output`, because that path does not exist
on the UI side of the wire. The inspector is useful; the vocabulary never arrives.

**Gated on `__DEV_TOOLS__`, not `import.meta.env.DEV`.** This distinction is load-bearing and
was found the hard way: `import.meta.env.DEV` derives from ambient `NODE_ENV`, so
`NODE_ENV=test pnpm build` — precisely what happens when a test or CI step shells out to the
build — emits a "production" bundle **with the true-state serializer still inside it**, and
`--mode production` does not override it. `__DEV_TOOLS__` is defined in `vite.config.ts` from
the vite *command* (`serve` vs `build`), which is what we actually mean.

`tests/ui/dev-build-strip.test.ts` builds the app and greps the bundle. It is the only test in
the suite that asserts on build output, because it is the only claim that is about the bundler
rather than the code.

## Alternatives considered

- **A `devSet` action that pokes true state, recorded in the log.** Stays replayable, and
  genuinely would allow "set GDP to 5000". Rejected: it widens the `Action` union that
  `apply.ts` and every golden replay depend on, and any save touched by it is dev-tainted
  while looking like an ordinary save. The scenario approach gets most of the value with none
  of that.
- **Type the inspector payload as `TrueState`.** Far more convenient — a real typed inspector
  with per-field formatting. Rejected: it hands every UI component the vocabulary the
  architecture spent a worker boundary removing, and a lint exception for one panel is a hole
  that stays open.
- **A separate dev-only entry point / route.** Cleanest isolation, but doubles the app shell
  and the dev tool then can't observe the real running game.
- **Ship it to players as an "observer mode".** Tempting as a feature. It would delete the
  game (ADR-0003), so it is gated rather than styled.

## Consequences

**Good:**

- Reaching an arbitrary year with an arbitrary country is one form submission.
- The published/true gap is directly visible — the thing the fog is made of.
- The inspector needs no maintenance as the schema grows: reflection is generic, so a new
  field on `TrueState` appears for free.
- The `__DEV_TOOLS__` flag is now available for anything else that must never ship.

**Bad:**

- The dev console is **out of the game's fiction on purpose** and styled to be unmistakable
  about it. That is a deliberate inconsistency in a codebase whose UI is otherwise strictly
  diegetic, and it will look wrong to anyone who doesn't know why.
- The opaque tree is less convenient than a typed inspector: no units, no formatting beyond
  rounding, no cross-referencing against the published figure. That cost is the point.
- One more guard to get right. The strip test is what keeps it honest; if it is ever deleted,
  the guarantee is gone and nothing else will notice.
- `TrueState` must remain reflection-friendly plain data — already required by ADR-0004, now
  depended on twice.
