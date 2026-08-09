# Observation — published read model

This package is presentation-only. It projects engine-owned prints and exact government books
into `PublishedState`; it does not measure the economy.

## Boundary

- `src/published.ts` owns the only state vocabulary UI components may consume.
- `observe(state)` is a pure projection. It may select, clone, label, grade, or assemble values
  that already exist, but it must not introduce lag, noise, revisions, funding gates, or RNG.
- Measurement belongs in `packages/engine/src/pipeline/statistics.ts` because politics reads the
  same published headline as the player. Moving measurement here would let politics and the UI
  disagree about what was known.
- Preserve the fog. Do not expose a true-state value merely because `observe` can access it.
  Exact treasury, census, dial, or end-of-run values must be intentional parts of the published
  contract.

## Total presentation tables

- Presentation tables over engine id lists should be total `Record`s. A new indicator, bloc,
  institution, revenue source, or outlay must fail typechecking until it has a public name and
  representation.
- A published indicator requires the `add-indicator` skill. Its engine spec, funding gate,
  observation label/unit, UI face, tests, fixtures, changelog and schema version move together.
- Reform prices delegate to the engine's `politicalCostOfAction`; do not independently quote
  an action here.
- `PublishedState` changes are data-contract changes. Coordinate them with engine schema and
  `docs/metrics-changelog.md`, then update `tests/contract/published-state.test.ts`.

## Validation

- Run the published-state contract and the relevant observation/property tests.
- Run typecheck whenever a total presentation table or exported type changes.
- If observable engine behavior moved, also follow `packages/engine/AGENTS.md` and the
  `economics-review` skill.
- If UI consumes the change, read `packages/ui/AGENTS.md` and verify it at the presentation
  surface rather than weakening the boundary.
