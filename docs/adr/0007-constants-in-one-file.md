# ADR-0007 — Every behavioral constant lives in one file

**Status:** Accepted · **Date:** M1

## Context

This is a balance-driven game. The work is not mostly writing new systems; it is tuning
existing ones and watching what a century does. That workflow — change a number, run
`pnpm batch`, read the distribution — only works if the numbers are findable.

Constants scattered at their point of use are individually more readable (the magic number sits
next to the formula that uses it) but collectively invisible. You cannot answer "what governs
the credit cycle's amplitude?" without reading five files, and you cannot tell whether two
steps are quietly fighting over the same behavior with two different coefficients.

## Decision

**Every behavioral constant lives in `engine/src/constants.ts`**, grouped by subsystem with
§-references to the design doc. Tune there, nowhere else.

Pipeline steps import what they need. A literal in a step file is a code smell unless it is
structural (an array index, a unit conversion, `0` or `1` as identity).

## Alternatives considered

- **Constants at point of use.** Better local readability. Rejected: it makes the balance
  workflow — the primary workflow — require a repo-wide search per question.
- **Per-subsystem constants files** (`constants/finance.ts`, `constants/labor.ts`). Tempting
  as the file grows past a few hundred lines. Rejected so far because the cross-subsystem
  interactions are exactly what needs to be visible together: `ASSET_REVERT` must out-muscle
  the collateral feedback at the margin, and seeing those two constants in the same file is how
  that stays true. Worth revisiting if the file becomes genuinely unnavigable.
- **Runtime-configurable parameters.** Rejected: they would become part of the save (ADR-0001)
  and turn every tuning change into a schema migration.

## Consequences

**Good:**

- The whole behavioral surface of the game is one file you can read top to bottom.
- Interactions between constants are visible in the place they matter.
- Diffing a rebalance shows exactly what moved.

**Bad:**

- The file is long and keeps growing, and its organization is maintained by convention.
- A step's formula is no longer self-contained — reading `finance.ts` means jumping to
  `constants.ts` and back.
- The rule is lint-adjacent but not fully lint-enforced; a stray literal in a step can slip
  through review.
