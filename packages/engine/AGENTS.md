# Engine

The pure, deterministic simulation: `init → applyActions → step`, one quarter a step. State is
derived from `(params, seed, rules, appointedAt, actionLog)`; a save stores no state (ADR-0001).
Any behaviour change goes through the `economics-review` skill before `pnpm bless`.

## Rules

- Return a new state; never mutate. Steps communicate only through state.
- `TICK_ORDER` in `pipeline/pipeline.ts` is versioned; reordering is a schema event (ADR-0005).
  `statistics` runs before `politics` on purpose — politics reads the published headline.
- `state/schema.ts` owns the shapes and the id tuples. Downstream tables are total `Record`s so
  a new id fails the build until handled. **Append new indicators at the end of
  `INDICATOR_SPECS`**: the step inserts into `stats.series` in record order and the state hash
  does not sort keys, so reordering moves every long-run hash while every published value stays
  bit-identical (`tests/unit/indicator-specs.test.ts` pins the prefix).
- Fog draws come from `obs:*` substreams, orthogonal to the economic RNG; wire copy from
  `obs:news:*`. Rewording a headline must not move the economy. `technology.ts` keeps one
  deliberately stranded `rng.next()` for this reason — its comment says why.
- The wire never prints a figure: it is written from true state, so a number in a headline is
  an un-lagged survey the player did not pay for (ADR-0031). Downstream filters on `event` or
  `kind`, never on prose. → `add-an-event` skill.
- Posted is not delivered, three times over: `taxEfficiency`, `adminEffectiveness`,
  `statuteCompliance`. A reader of any register reads the effective value (`statuteForce`,
  `effectiveConsumptionWeights`), never the record.
- Bloc power is derived, never authored; only what a bloc *wants* is authored. Blocs make levers
  expensive, never impossible. `Stance` is a `Partial`, so a new bloc compiles with no opinion
  about anything — → `add-bloc-or-institution` skill.

## Shipping a mechanic

- **It ships inert at its default, and `pnpm diff-state --moved-only` is the proof** —
  `meta.schemaVersion` and nothing else. A safety, statute, rule or dial whose *absence* moves
  the economy is a balance change hiding behind a switch.
- When a mechanic is *meant* to move the baseline, the passive/developmental split is the
  calibration test: passive holds while the country that develops pays (pollution, the basket).
  If a retune moves passive, the mechanic has become a tax on existence.
- The goldens see forty quarters. A stock with a long half-life, or a regime reached only after
  debt hits zero, is invisible to them; the ADR names the tool that is the evidence instead
  (`pnpm surplus`, `pnpm currency`, `pnpm events`, `pnpm inheritance`, the 400-quarter batches).
- The goldens and the default batch both run Meridia — the reference country, and twice the one
  country where a bug could not show. Use `--country all` for anything the catalogue varies.
- A mechanic you cannot reach is not a mechanic. Measure what a threshold gates under passive,
  random *and* deliberately bad play before shipping it.
- Political responses are reference-dependent (an EMA, the 1946 settlement, experienced
  conditions), and each was a bug fix for an absolute threshold. Measure the resting value
  before picking a constant.
- An experiment may be lenient about capacity orders it cannot afford; it must never be lenient
  about the thing under test, or two identical arms read as "the lever does nothing".
- `init` seeds any EMA on the same basis the step recomputes it on, or the first years walk down
  a basis change nobody ordered.

## Where the reasoning is

Every feature with a rule that is not obvious from the code has an ADR — `docs/adr/README.md`
is the index; read it before touching the feature. `docs/tuning-lessons.md` is the failure each
constant's value prevents; read it beside the constant. `docs/metrics-changelog.md` gets an entry
on every `SCHEMA_VERSION` bump.
