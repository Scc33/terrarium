# ADR-0002 — Randomness comes from substreams keyed by step name

**Status:** Accepted · **Date:** 2025-Q4 (M0)

## Context

Saves are replay logs (ADR-0001), so determinism is not a nice property — it is the storage
format. Any nondeterminism corrupts saves.

A single shared PRNG stream makes determinism brittle in a specific, insidious way: every draw
is positional. Adding one `rng.next()` inside the labor step shifts every subsequent draw in
the tick, so the trade step — which nobody touched — produces different numbers. Every golden
test fails, and the diff tells you nothing about whether the change was economically correct.

## Decision

One root seed. Every consumer derives a **named substream**: `rngFor(seed, stepName, tick)`.
The pipeline hands each step its own stream automatically:

```ts
for (const step of TICK_ORDER) s = step.run(s, rngFor(s.meta.seed, step.name, s.meta.tick))
```

`Math.random` and `Date.now` are lint-banned repo-wide.

The fog draws from a separate `obs:*` substream family, orthogonal to the economic streams.

## Alternatives considered

- **Single global stream.** Simplest, and standard in small sims. Rejected for the
  golden-test-shrapnel problem above: it makes the test suite unable to isolate a change.
- **Explicit per-step seeds stored in state.** Equivalent power, but the seeds become schema,
  and adding a step means a migration. Deriving from the step's *name* costs nothing and needs
  no storage.

## Consequences

**Good:**

- A step's draws are isolated. Adding a step, or a draw inside one step, never shifts another
  step's sequence — golden tests for untouched systems keep passing, so a failing golden test
  is *evidence about the thing you changed*.
- The `obs:*` split means measurement noise is reproducible without perturbing the economy.
  Re-rolling the fog cannot accidentally move GDP, which keeps ADR-0003 honest.
- Renaming a step is a behavioral change, since the name keys the stream. This is surprising
  but correct: it's caught immediately by golden tests.

**Bad:**

- Any code needing randomness must be *inside* a step, or be explicitly handed a stream.
  Helper functions can't quietly draw. In practice this has pushed randomness up to step level,
  which is where it's reviewable.
- `rngFor` is called per step per tick, so the derivation must stay cheap.
