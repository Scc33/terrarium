# Runner — replay and calibration

This package is the headless evidence path. It runs the ordinary engine; it is not a second
simulation and must not patch state, fork the pipeline, or carry runner-only economics.

## Deterministic runs

- `runOne` materializes params from an explicit vector, a country recipe, or the historical
  generated baseline, then uses the normal `init`, `applyActions`, and `step` path.
- Policy randomness comes from `rngFor(seed, 'runner:policy', tick)`. Never use process time or
  unseeded randomness.
- The trajectory is the shared input to metrics, property tests, and reports. Add a trajectory
  field only when a measured claim needs it; do not turn it into a second `TrueState`.
- Golden replays run strict. Exploratory scripts and random policy may skip illegal actions in
  lenient mode, but must count and report those skips.

## Batch evidence

- Omitting `--country` preserves the historical baseline. `--country <id>` selects one recipe;
  `--country all` distributes runs across the full catalogue and prints a per-country matrix.
- Every batch reports NaN and price-explosion counts and exits nonzero when either occurs.
  Never filter unstable runs out of summary statistics.
- Passive, random, and deliberately bad policy answer different questions. Do not use a calm
  passive century as reachability evidence or a random sweep as a replacement for a causal
  property test.
- Keep reporting deterministic and text-oriented so CI output can identify the first failing
  seeds and reproduce them.

## Change workflow

- Engine behavior changes require `packages/engine/AGENTS.md` and the `economics-review` skill;
  runner output is evidence for that review, not permission to bless goldens.
- A new country recipe must be replay-safe, accepted by the runner, and exercised through an
  all-country stability matrix.
- Add metric helpers in `src/metrics.ts`, run construction in `src/run.ts`, orchestration in
  `src/batch.ts`, and formatting in `src/report.ts`. Keep these responsibilities separate.
- Read `tests/AGENTS.md` before changing runner or calibration tests.

Useful checks:

```text
pnpm batch -- --runs 200 --ticks 120 --policy random
pnpm batch -- --runs 200 --ticks 120 --policy passive
pnpm batch -- --runs 600 --ticks 120 --policy random --country all
```
