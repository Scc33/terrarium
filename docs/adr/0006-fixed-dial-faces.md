# ADR-0006 — Instrument dial faces are fixed, never derived from data

**Status:** Accepted · **Date:** M5.5

## Context

The wall is a room of analog instruments. Each indicator has a dial with a printed face and a
needle. The obvious implementation auto-scales the face to the trailing window of data, the way
every charting library does by default.

That is wrong here, and wrongly in a way that is invisible in review.

**A face redrawn under its own needle makes needle position meaningless.** If the scale
rescales to the data, the needle sits mid-dial forever: unemployment at 4% and unemployment at
28% both render as "needle near the middle," and the player learns nothing from a glance. The
instrument metaphor promises that *position means magnitude* — auto-scaling silently breaks
that promise while looking perfectly reasonable.

It also destroys comparison across time: a needle that hasn't moved between two screenshots
may represent a tripled value.

## Decision

`ui/src/domains.ts` holds a **fixed `INDICATOR_FACE` entry per indicator**, measured once with
`pnpm ranges` over a surveyed century and rounded outward to roughly p01–p99. Faces are never
derived from the trailing window.

Values outside the face **peg at the rail with a chevron** — going off the dial is information,
not an error to be scaled away. A pegged needle says "this is off the charts," which is exactly
what it means.

`capital_stock` is the sole exception: it ratchets monotonically, because a stock that only
grows has no meaningful fixed ceiling across a century.

`tests/ui/gauge-domains.test.ts` re-measures a surveyed century and **rejects a face an
instrument spends more than 2% of its life pegged against**. It re-measures rather than
snapshots, so a retune that pushes an instrument off its dial fails by name.

## Alternatives considered

- **Auto-scale to the trailing window.** Rejected for the reasons above.
- **Auto-scale but hold the zero point.** Fixes the worst of it; still leaves the needle's
  position incomparable between two moments.
- **Hand-picked faces without a test.** This is what fixed faces degenerate into without
  `gauge-domains` — a retune quietly pushes an instrument off its dial and nobody notices for
  months.

## Consequences

**Good:**

- Needle position means magnitude, permanently and comparably.
- Pegging is a legible signal in its own right.
- A retune that changes an indicator's lived range fails a named test rather than degrading the
  instrument silently.

**Bad:**

- Adding an indicator requires running `pnpm ranges` and making a judgment call — it is not
  automatic, and a lazy face is a lasting cost.
- A deliberate rebalance that shifts an indicator's range means re-measuring and updating the
  face; the test failure is correct but is extra work at exactly the moment you're busy.
- The 2% pegging threshold is a calibrated constant like any other, and is only as good as the
  century it was surveyed over.
