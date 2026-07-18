# Terrarium — working notes for Claude

Economic policy game per docs/ (read `docs/tech-architecture.md` before touching structure).
pnpm monorepo; M0+M1 are built.

## Hard rules (lint-enforced, but know why)

- `packages/engine` is pure: no DOM, no React, no other workspace packages, no `Math.random`
  or `Date.now`. All randomness via `rngFor(seed, stepName, tick)` substreams.
- `packages/ui` may import types from `@terrarium/observation` and action types from
  `@terrarium/engine`, but never `engine/src/state/*` — the UI must be unable to name true state.
- Pipeline step order in `engine/src/pipeline/pipeline.ts` is versioned; reordering is a
  schema-version event.
- Every behavioral constant lives in `engine/src/constants.ts` — tune there, nowhere else.

## Workflows

- Engine change → `pnpm test` breaks golden replays → run `pnpm diff-state` and review what
  moved (that review IS the economics review) → `pnpm bless` if intentional.
- Balance work → `pnpm batch -- --runs 1000 --ticks 120 --policy random` (and
  `--policy passive --ticks 400`). Healthy passive baseline: u ≈ 7%, inflation ≈ 0,
  growth ≈ 1.6%/yr, 0% deposed. Random policy: ~35% deposed, no NaN, no price explosions.
- The M1 exit-criteria tests (`tests/properties/fuel-tax.test.ts`, `subsidy.test.ts`) are the
  design's load-bearing claims. If a change breaks them, the change is wrong, not the test.

## Hard-won tuning lessons (violate at your peril)

- Unit costs in the price step are computed at NORMAL_UTILIZATION, not realized output —
  otherwise demand dips mechanically raise unit cost and spiral (stagflation death loop).
- Wages: Phillips slack anchor + productivity passthrough near full employment + downward
  stickiness. Removing any leg breaks the century: no anchor → drift to 50% unemployment;
  no productivity passthrough → permanent deflation; symmetric flexibility → 1870s-depth busts.
- Households spend against EMA "habitual" income (same EMA approval judges against) —
  permanent-income smoothing is the main cycle damper. The wage/employment gains in
  constants.ts were lowered until the business cycle stopped resonating with the 16-quarter
  election period.
- Bond coupons are household income; redemptions go to household savings. Money paid to
  bondholders must not vanish, or every tax rise becomes an austerity bomb.
- Init self-calibrates spending to the tax base (see `init.ts`) — an unbalanced opening
  budget compounds into a scripted depression.
