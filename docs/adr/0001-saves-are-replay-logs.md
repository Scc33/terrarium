# ADR-0001 — Saves are replay logs, not state snapshots

**Status:** Accepted · **Date:** 2025-Q4 (M0)

## Context

A century-long run is ~420 quarters of a state object carrying five sectors, five cohorts, an
age pyramid, a banking system, and a statistical office's full print history. We need saves,
autosave, crash recovery, and a bug-report format.

The obvious approach — serialize `TrueState` every tick — makes the save grow with the run and
makes every schema change a migration problem: a save written at schema 7 has to be mechanically
upgraded through 8, 9, 10, 11 or it dies.

## Decision

The save file is `{version, params, seed, actionLog, tick}`. **No derived state is stored.**
`replay(save, untilTick?)` reconstructs any point in the run by re-running the pipeline from
`init`.

This is only possible because the engine is pure and its randomness is seeded (ADR-0002).
The save model and the determinism discipline are the same decision viewed from two sides.

## Alternatives considered

- **Full state snapshots.** Simple, no purity requirement, robust to engine changes — an old
  save keeps working because it never re-runs anything. Rejected: saves grow without bound,
  and every schema bump needs a hand-written migration.
- **Snapshots every N ticks + log replay from the nearest one.** The standard compromise.
  Rejected as premature: replay is ~7ms for a 60-quarter run, so there is nothing to optimize.
  Worth revisiting only if load time exceeds ~1s.

## Consequences

**Good:**

- A save is a few KB regardless of run length, and autosave is just appending this turn's
  actions.
- Export/import doubles as the bug-report format: a report is a save file plus "look at Q83."
- Determinism is not merely tested, it is *load-bearing* — a nondeterminism bug corrupts saves,
  so it cannot be quietly tolerated.

**Bad — and these are real costs, not theoretical:**

- **An engine change can invalidate old saves.** Replaying an old log through new code gives a
  different run. This is why `SCHEMA_VERSION` exists and why pipeline reordering is a schema
  event (ADR-0005).
- **Arbitrary state cannot be injected.** There is no supported way to say "set GDP to 5000
  right now" — that state is not representable as (params, seed, actionLog). Dev tooling must
  work through *scenario* parameters at `init` and fast-forward, not through state pokes. Any
  future debug facility that mutates true state directly must be recorded in the action log or
  it breaks the save model.
- `applyAction` must **reject loudly**. An illegal action encountered during replay means a bug
  or a version mismatch; silently skipping it would desynchronize the reconstruction.
