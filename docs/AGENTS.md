# Docs — durable project knowledge

Use the `document-a-decision` skill whenever the correct register is not obvious. These files
have different jobs and lifecycles; putting knowledge in the wrong one makes it either invisible
or falsely permanent.

## Registers

- `tech-architecture.md` describes **what exists now**. Update it when structure or an active
  contract changes; keep decision rationale in ADRs.
- `adr/` records **why a structural choice won** over live alternatives and the consequences
  still carried. Accepted ADRs are immutable. Revisit one with a superseding ADR and update
  only the Status lines of both.
- `investigations/` records **what was measured and is not yet believed**. Stamp measurements
  with the commit used, keep open questions distinct from decisions, and close rather than
  delete resolved or disproved investigations.
- `packages/engine/AGENTS.md` holds living **tuning lessons** beside the engine constants and
  failure modes they govern.
- `metrics-changelog.md` is the engine input/output contract. Every `SCHEMA_VERSION` bump adds
  an entry for state/published shapes, indicator funding gates, levers, params, or pipeline
  order.

## Stable sources

- `proposal-1.md` is the working design document whose section numbers are cited by roughly 65
  code comments. Never renumber its sections.
- `archive/` is provenance, not maintained guidance. Do not add new material there or cite it
  as current.
- `agent-guidance-scope.md` is the implementation proposal for ADR-0012. The accepted ADR and
  live `AGENTS.md` hierarchy own the resulting constraint.

## Writing rules

- An ADR states the decision as a future constraint, names the alternatives that were genuinely
  available, and records both benefits and costs. Add it to `adr/README.md`.
- An investigation records the command/method, evidence, commit and implication. Add it to
  `investigations/README.md` with a status.
- A tuning lesson states the rule and the concrete failure it prevents; write it in
  `packages/engine/AGENTS.md`, not an ADR.
- Keep historical accepted ADR prose intact even when a filename or current tool name changes.
  Modernize active indexes, architecture docs, skills and code comments instead.
- Use `AGENTS.md` as the shared canonical instruction source. Every colocated `CLAUDE.md` stays
  exactly `@AGENTS.md`.

## Validation

- Run `git diff --check` for every documentation change.
- When changing the guidance hierarchy or wrappers, run
  `pnpm exec vitest run tests/contract/agent-guidance.test.ts`, typecheck, and lint.
- Prose-only changes do not require engine golden or visual-baseline updates. If either moves,
  the change is no longer documentation-only and must follow the owning package workflow.
