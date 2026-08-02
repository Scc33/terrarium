# ADR-0003 — Measurement lives in the engine, not the observation package

**Status:** Accepted · **Date:** M2, schema v3 (`fce4edf`) · **Supersedes** the v0.1 architecture

## Context

The original design put the fog in `packages/observation`: `observe(trueState, history, rng)`
applied noise, lag, and revisions on the way to the UI. Clean layering — the engine computes
truth, a projection layer degrades it for display.

That arrangement contains a bug that only shows up once politics is implemented.

**The player's approval and political capital must respond to the numbers that were
*published*, not to the truth.** A government whose GDP print is revised down two years later
was, at the time, governing on the optimistic figure — and so were its voters. If measurement
happens on the way to the UI, then by construction the engine's `politics` step can only see
truth, and the fog becomes a purely cosmetic overlay: the player is misled but the simulated
electorate is not. That destroys the central mechanic (§3.4).

## Decision

The statistics office **is a pipeline step** (`engine/src/pipeline/statistics.ts`), running at
position 13, immediately before `politics`. It owns prints, revision schedules, error bands,
and rumor news, drawing from `obs:*` substreams (ADR-0002).

`StatsOffice` is part of `TrueState` — the published record is state, because later ticks must
be able to revise earlier prints.

`packages/observation` is **presentation-only**: it projects the already-made prints into
`PublishedState` and owns their labels and units. Measurement logic must never grow back into
it.

## Alternatives considered

- **Keep the fog in `observation`, and feed published numbers back into the engine.** Would
  require the UI layer to be in the tick loop — a circular dependency that breaks the
  `ui → observation → engine` direction and makes headless runs (the batch runner) impossible.
- **Compute the fog twice** — once in the engine for politics, once in `observation` for
  display. Rejected: two implementations of the same noise that must agree exactly is a
  desynchronization bug waiting to happen.

## Consequences

**Good:**

- Politics reads published headlines, so the fog is a genuine game mechanic rather than a
  cosmetic filter. Funding the statistical capacity changes *outcomes*, not just visibility.
- The batch runner sees exactly what a player would, so balance sweeps measure the real game.
- Revisions are expressible: a print made at Q10 can be corrected at Q18 because the office's
  history is state.

**Bad:**

- The engine is bigger and now contains something that isn't economics. The `obs:*` substream
  separation (ADR-0002) is what keeps this from contaminating economic determinism.
- `packages/observation` is now a thin package whose name overstates its job, and there is a
  standing temptation to "just put this bit of measurement logic here" — which is why the rule
  is written into CLAUDE.md and this ADR exists.
- Two boundaries now need enforcing rather than one: the import boundary and the data boundary
  (§1.1), since `PublishedState` is no longer the only thing that *could* cross the wire.
