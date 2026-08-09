# Tests — proof and regression

Tests protect claims, not implementation shapes. Read every source-package guide that applies
to the behavior under test before changing this tree.

## Suite ownership

- `unit/` pins local pure-function behavior and invariants.
- `golden/` pins exact deterministic replays using cases in `tools/golden-cases.ts` and data in
  `packages/fixtures/golden/`.
- `properties/` measures economic and political claims across seeds.
- `contract/` protects architectural/data boundaries, including what crosses the worker and
  how agent guidance is composed.
- `ui/` tests pure UI decisions. It is not a substitute for a browser layout engine.
- `visual/` owns Playwright interaction and screenshot baselines.
- `tools/` tests developer tooling such as the architecture analyzer.

## Golden and economic review

- A golden failure is a request for explanation, not an instruction to run `pnpm bless`.
- For an intentional engine change, follow `economics-review`: inspect `pnpm diff-state`, read
  the movement economically, compare passive and random baselines, then bless in a separate
  step only after the change is understood.
- `properties/fuel-tax.test.ts` and `subsidy.test.ts` are M1 exit criteria. If a change breaks
  their causal claims, the change is wrong; do not relax the test.
- Preserve reproducible seed names and print the first failing seeds in statistical tests.

## UI and browser proof

- Keep layout-independent decisions in pure modules and test those directly. A jsdom render
  test can pass while the instrument wall clips every value it publishes.
- Use the `verify-the-wall` skill after wall, gauge, rack, overlay, or `wallPlan` changes.
- At 1280x720, prove no page/horizontal scroll, no below-fold content and a clean console.
  Exercise smaller drawer/tablet states when affected.
- Update visual baselines only after inspecting the rendered difference. A changed screenshot
  is evidence to review, not an automatic blessing target.

## Coverage and validation

- `pnpm coverage` enforces an 80% floor over the pure core (`engine` and `observation`). Raise
  the floor as coverage improves; never lower it to green a build.
- Run the narrowest relevant test while iterating, then the repository gates proportionate to
  the change. CI runs typecheck, lint, coverage and a 200 x 120 random-policy batch.
- A test may import internal modules to inspect behavior, but must not create a production
  dependency or an alternate engine path.
- Keep filesystem contract tests rooted from `import.meta.url`, not the process working
  directory, so they pass from the repo root and package runners.
