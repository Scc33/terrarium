# Engine — true-state simulation

This package is the simulation authority. Read the root guide and `docs/tech-architecture.md`
before changing its structure. Any behavior change also requires the `economics-review` skill.

## Core contract

- The engine is pure TypeScript: no DOM, React, I/O, console, or other workspace packages.
- All randomness comes from `rngFor(seed, stepName, tick)`. A consumer gets a named substream;
  adding a draw must not shift another subsystem's sequence.
- `TrueState` is plain immutable data. Return new objects; do not mutate an input state.
- Saves are replay logs derived from `{params, seed, actionLog, tick}`. Do not store a state
  snapshot or add a path that bypasses `init`, `applyActions`, and `step`.
- Every behavioral number lives in `src/constants.ts`. Do not hide tuning constants in a
  pipeline step, action handler, or initializer.

## Schema, pipeline and measurement

- `src/state/schema.ts` owns state shapes and id tuples. Prefer total `Record<Id, ...>` tables
  downstream so a new id breaks the build until it is handled.
- Any state shape change, published contract change, or pipeline reorder bumps
  `SCHEMA_VERSION` and adds an entry to `docs/metrics-changelog.md`.
- `TICK_ORDER` in `src/pipeline/pipeline.ts` is versioned. Steps communicate through state,
  never by calling one another or using side channels.
- The statistics step makes the fog: funding gates, lags, noise, revisions and rumor news.
  Politics reads the published headline, so measurement must remain in the engine.
  `packages/observation` only projects existing prints for presentation.
- Observation randomness uses the `obs:*` substream family so measurement noise never perturbs
  the underlying economy.

## Economy and politics seam

The economy and politics meet only where `src/pipeline/institutions.ts` derives power from the
economy and where `src/actions/apply.ts` prices actions through veto players. Keep that seam
narrow:

- Bloc power is derived, never authored. Only bloc preferences are authored.
- Politics may make a lever expensive, not impossible. A hard veto can silently break the M1
  policy claims.
- A politics-only change must leave the passive century economy unchanged. Check with the
  passive baseline carried by the `economics-review` skill.

Use `add-bloc-or-institution` before changing a bloc, institution, stance, favour, power, or
veto price. Use `add-indicator` before adding or retuning anything the player can see.

## Review and validation

- Read `pnpm diff-state` before blessing an intentional behavior change. `pnpm bless` only
  overwrites snapshots; it cannot distinguish a better economy from a broken one.
- On schema-adding changes, run `pnpm diff-state --moved-only` so new fields do not bury the
  economic movements under infinite relative diffs.
- Review passive and random-policy baselines through `economics-review`; add a deliberately bad
  policy or all-country matrix when a new threshold or scenario needs reachability evidence.
- Never weaken `tests/properties/fuel-tax.test.ts` or `subsidy.test.ts`. They are the M1
  load-bearing claims, not ordinary regression snapshots.
- Read `tests/AGENTS.md` before changing tests or goldens.

## Hard-won tuning lessons

- Unit costs in the price step are computed at `NORMAL_UTILIZATION`, not realized output —
  otherwise demand dips mechanically raise unit cost and spiral into stagflation.
- Wages need all three legs: Phillips slack anchor (else drift to 50% unemployment),
  productivity passthrough near full employment (else permanent deflation), and downward
  stickiness (else 1870s-depth busts).
- Households spend against EMA habitual income, the same EMA approval judges against.
  Permanent-income smoothing is the main cycle damper; the wage/employment gains stay below
  the point where the cycle resonates with the 16-quarter election period.
- Bond coupons are household income; redemptions go to household savings. Money paid to
  bondholders must not vanish, or every tax rise becomes an austerity bomb.
- Growth needs both valves: Lewis investment (`INVESTMENT_SLACK_GAIN`) and subsistence
  absorption (`SUBSISTENCE_ABSORPTION_Q`) capped by the rural labor force; uncapped absorption
  recreates the Malthusian trap. Vital rates read the income level (`LIVING_STANDARD_1946`);
  the report card reads income against the country's own 1946 baseline. Do not conflate those
  anchors.
- Init self-calibrates spending to the tax base. An unbalanced opening budget compounds into a
  scripted depression.
- Finance is a loop that wants to ratchet: assets raise collateral, credit and assets again.
  `ASSET_REVERT` must out-muscle collateral/spirits feedback at the margin, while the passive
  calm versus active boom separation comes from `ASSET_FUND_RATE_GAIN` and
  `CREDIT_RATE_GAIN`. Only a policy-rate cut or genuine profit surge should inflate a bubble,
  so the player's cheap money earns the crisis. The bank-capital cap stays slack in booms and
  bites after crisis losses.
- Political responses are reference-dependent. Cohort approval judges income against its EMA;
  bloc favour judges policy against `BLOC_FAVOR_BASE`; unrest judges hardship against
  experience. Absolute thresholds made a passive government inherit a capital strike and
  pinned unrest so flat that reform windows and revolts were unreachable. Measure the resting
  value before choosing a new response constant.
- A mechanic that cannot be reached is not a mechanic. Measure a threshold under passive,
  random, and deliberately bad play; two M6 mechanics shipped dead at plausible-looking
  numbers. Unrest must read household experience; rebuilding it from unemployment is
  wrong-signed because subsistence work can hide poverty.
- Suppression must cost something the boot cannot pay. Repression damps grievance
  multiplicatively, never to zero, and corridor strain is added outside that damping. A linear
  subtraction makes the extractive path strictly dominant.
- A warning that never turns off is not a warning. The REVISED stamp needs both a first-print
  error beyond twice the confessed band and enough correction to move the needle by 6% of its
  dial, reducing a roughly 67% stamp rate to about 10%. Judging against the current band
  divides later final prints by zero.
- Player-facing constants are calibrated, not guessed, and pinned against a measured century
  as a rate with `pnpm ranges` and the UI range tests. Those tests re-measure so a retune that
  pushes an instrument off its face fails by name.
