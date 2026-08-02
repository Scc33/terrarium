# ADR-0005 — Pipeline step order is versioned

**Status:** Accepted · **Date:** M0

## Context

The tick is an ordered fold over `TICK_ORDER`. Because every step reads the state the previous
step wrote, **order is semantics**. Running `prices` before `production` rather than after is
not a refactor; it is a different economic model.

Two orderings in the current pipeline are load-bearing and non-obvious:

- `statistics` runs immediately before `politics`, so political capital accrues from published
  numbers rather than truth (ADR-0003, §3.4).
- `shocks` runs first, so a rupture lands before anyone produces, trades, or votes in that
  quarter.

Meanwhile, saves are replay logs (ADR-0001) — reordering steps silently changes what every
existing save replays to.

## Decision

`TICK_ORDER` in `engine/src/pipeline/pipeline.ts` is explicit, versioned, and **reordering it
is a `SCHEMA_VERSION` event** — the same class of change as altering the state shape, and it
gets an entry in `docs/metrics-changelog.md`.

Steps communicate only through state. No side channels, no step-to-step calls.

## Alternatives considered

- **Declare dependencies and topologically sort.** More self-documenting, and it would catch
  a step reading a field nothing has written yet. Rejected as overkill at 14 steps, and it
  doesn't actually remove the problem: several orderings are economically meaningful but not
  expressible as data dependencies (`statistics` before `politics` is a *design* constraint,
  not a read-after-write one), so the sort would happily produce a valid-but-wrong order.
- **Treat order as an implementation detail.** Rejected outright — it silently invalidates
  saves and golden replays.

## Consequences

**Good:**

- Adding a feature is adding a step, not edits scattered across five files. `finance` (M5)
  slotted in as one insertion.
- The step list reads as documentation of the economic model's causal order, and each line
  carries the schema version that introduced it.
- Golden replays catch an accidental reorder immediately.

**Bad:**

- Insertions are not free: putting a new step in the middle changes what every later step sees
  that tick, so it needs the same `diff-state` review as an economics change.
- Steps that "obviously" commute still cost a schema bump to reorder, because proving
  commutation across 14 steps and a century of ticks is harder than paying the version.
