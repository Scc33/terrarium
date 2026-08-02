# ADR-0008 — Golden replays are the economics review

**Status:** Accepted · **Date:** M1

## Context

Most changes to this codebase are economic, and economic changes are hard to review by reading
a diff. A three-line edit to the wage equation is legible as *code* and completely opaque as
*consequence*: nothing in the diff tells you it moves century-mean unemployment by four points,
or that it makes the business cycle resonate with the 16-quarter election period.

Unit tests don't close this gap. They assert what you thought to assert, and the interesting
failures in a simulation are always in what you didn't think of.

## Decision

A table of golden cases (`tools/golden-cases.ts`) pins full replays — state hashes plus key
series — and `tests/golden/replay.test.ts` fails on any behavioral change at all, intended or
not.

The workflow is deliberately a **speed bump with a mandatory reading step**:

```
engine change → pnpm test fails → pnpm diff-state → review what moved → pnpm bless
```

`pnpm diff-state` shows exactly which variables moved and by how much. **That review is the
economics review.** Blessing without reading the diff defeats the entire mechanism.

Golden replays are backed by two other layers that catch different things: property suites
(`tests/properties/`) assert directional claims across many seeds, and the M1 exit criteria
(`fuel-tax.test.ts`, `subsidy.test.ts`) encode the design's load-bearing claims — *if a change
breaks those, the change is wrong, not the test.*

## Alternatives considered

- **Property tests alone.** They state real claims and don't need blessing. Rejected as
  insufficient: they only catch violations of properties someone already articulated, and a
  change that halves growth while preserving every stated property sails through.
- **Golden tests that auto-bless in CI.** Removes the friction, and removes the entire value.
- **No golden tests, review by batch-running before and after.** This is what `pnpm batch` does
  for balance work, and it's good at distributions but blind to a specific seed's trajectory
  changing shape.

## Consequences

**Good:**

- No behavioral change reaches master unexamined.
- The diff is quantitative, so "I expected this to move fuel prices" becomes checkable against
  what actually moved.
- Determinism (ADR-0001, ADR-0002) is continuously verified as a side effect.

**Bad:**

- **The mechanism is only as good as the discipline.** `pnpm bless` is one command, and a
  reflexive bless produces a green build with an unreviewed economics change. Nothing
  technical prevents this; it's why the workflow is written into CLAUDE.md.
- Every engine change costs a bless cycle, including ones that are obviously fine.
- RNG substreams (ADR-0002) are what keep the failure informative — without them every change
  would fail every golden case and the diff would be noise.
