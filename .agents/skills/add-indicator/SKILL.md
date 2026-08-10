---
name: add-indicator
description: Add a new published indicator to Terrarium's instrument wall, or retune an existing one's dial face. Use when adding a metric the player can see (a rate, an index, a survey result), when a new series needs a fundedAt capacity gate, or when `pnpm ranges` / the gauge-domains test says a face has drifted. Covers the six tables that must agree, the schema bump, and the measurement step.
---

# Adding an indicator

An indicator is a **published** number: fogged by the statistical office, gated on capacity,
and drawn on a fixed dial face. Six tables have to agree. Five are total `Record`s and the
build walks you through them; **one is an array and fails silently** — that is the trap.

## The tables

| # | What | Where | Enforced? |
|---|------|-------|-----------|
| 1 | `INDICATOR_IDS` | `packages/engine/src/state/schema.ts` | source of truth |
| 2 | `INDICATOR_SPECS` | `packages/engine/src/pipeline/statistics.ts` | **NO — array** |
| 3 | `INDICATOR_FUNDED_AT` | `packages/engine/src/constants.ts` | `Record` ✓ |
| 4 | `PRESENTATION` | `packages/observation/src/observe.ts` | `Record` ✓ |
| 5 | `NAMES` | `packages/ui/src/components/labels.ts` | `Record` ✓ |
| 6 | `INDICATOR_FACE` | `packages/ui/src/domains.ts` | `Record` ✓ |

**`INDICATOR_SPECS` is an array, not a `Record`.** Add an id without a spec and everything
compiles, every test passes, and the instrument shows a blank plate forever because nothing
ever publishes it. Check this first when a new indicator "doesn't appear".

## Steps

### 1. `INDICATOR_IDS` + a spec

Add the id to `INDICATOR_IDS`, then a spec to `INDICATOR_SPECS`:

- `trueValue(record, q)` — reads `StatRecord[]`; use `q-1` for growth rates, guard the
  divide (`prev > 1e-9`) and the `q === 0` case.
- `baseSd` — first-print noise **in indicator units at zero capacity**. Set `relativeSd: true`
  for level series so noise scales with the value instead of swamping a small one.
- `fastLag: true` only for things read off a market same-quarter (the price boards). Everything
  else waits for the office.

Measurement lives in the engine and nowhere else (ADR-0003). Do not compute this in
`packages/observation` — that package is presentation-only.

### 2. The capacity gate

`INDICATOR_FUNDED_AT` in `constants.ts` (every behavioral constant lives there — ADR-0007;
it is *not* a field on the spec). `statistics.ts` skips the print entirely while
`capacity.statistical` is below it, so this number decides when the instrument exists at all.

Place it against the existing ladder — 0 (national accounts) through 0.55 (gini, credit
growth). Ask what institution actually produces the number and price it beside its neighbours.
Two indicators sharing a threshold unlock together, which the rail advertises as one event.

### 3. `PRESENTATION` — label + unit

Sentence case, unit as displayed (`'% / yr'`, `'1946=100'`, `'M jobs'`).

### 4. `NAMES` — five names, not four

`dossier` (ministry wording, with units) · `terminal` (wire mnemonic) · `plate` (engraved, no
units) · `short` (**≤10 characters** or the rack truncates) · `needs` (the institution the
player must fund, e.g. `'HOUSEHOLD SURVEY'` — this is what the blank plate promises them).

### 5. `INDICATOR_FACE` — measure it, never guess

```bash
pnpm ranges
```

Take a face covering roughly **p01–p99, rounded outward** to a readable number, and let the
extremes peg. A dial redrawn under its own needle teaches nothing (ADR-0006), so faces are
fixed constants. Use `'ratchet'` only for a series that grows an order of magnitude over the
century and therefore has no single honest face — today `capital_stock`, `income_real` and
`productivity`, all three of them levels indexed against 1946 rather than rates that revert.

Reach for it when the measured range spans a factor of ten or so: on a fixed face wide enough
for the end of the century, the first thirty years live in the bottom fifth of the dial and the
decade that matters most teaches nothing.

**`gauge-domains` will not tell you a face is too wide** — it fails on pegging, so it only
catches faces that are too narrow. Read the `pnpm ranges` percentiles yourself.

### 6. Schema bump + changelog

Bump `SCHEMA_VERSION` in `schema.ts` and add an entry to `docs/metrics-changelog.md` under a
new version heading: the indicator, its unit, its `fundedAt`, and whether it is fogged or
exact. That file is the engine's data contract — a new output that isn't in it isn't shipped.

### 7. Verify

```bash
pnpm test
```

- `gauge-domains` re-measures a surveyed century and **rejects a face pegged >2% of its life**.
- `wall-plan` fails if the wall has run out of vertical room — at that point you owe a real
  layout decision, not a smaller font.
- `revision-stamp` fails if the fog stopped biting or started biting everywhere.
- Golden replays will break on the schema bump. That is expected → **`economics-review` skill**,
  and use `pnpm diff-state --moved-only` because new fields otherwise sort as infinite
  relative change and bury the review.

Then **`verify-the-wall` skill** — none of the tests above can see layout, and jsdom has no
layout engine.

## Before you add one at all

Not every number deserves an instrument. `docs/investigations/` records at least one indicator
that was built and then abandoned on measurement (`fb07b27`). If the series turns out to be
degenerate — saturated, wrong-signed, or measuring something the player already reads
elsewhere — write the investigation and delete the code. That is a successful outcome, and the
**`document-a-decision` skill** covers which register it goes in.
