# ADR-0026 — A product of two excesses is drawn as a phase plot, not as two time charts

**Status:** Accepted · **Date:** 2026-08-22 · **Extends:** [ADR-0025](0025-charts-own-their-analytical-scale.md)

## Context

Every figure in the game plots something against time. That is the right default: the subject
is a century, and `TimeSeriesChart` exists so the wall, the ledger, the accounts, the census and
the policy record all agree about scales, inspection and accessibility.

The banking-crisis hazard does not fit it. `pipeline/finance.ts` computes

```text
hazard = CRISIS_BASE_P
       + CRISIS_FRAGILITY_P × max(0, creditToGdp − CRISIS_LEVERAGE_SAFE)
                            × max(0, assetPrice  − CRISIS_ASSET_SAFE)
       + imported pressure
```

a **product** of two excesses. Either one alone contributes nothing. The finance overlay
(issue [#108](https://github.com/Scc33/terrarium/issues/108)) drew leverage and valuation as two
unthresholded line charts side by side, which cannot express that: a country with heavy
borrowing and cheap capital and a country with dear capital and no borrowing both draw one
alarming line and one calm one, and neither is in any danger.

The problem is not presentational. Measured across the catalogue (36 runs × 100 years per
configuration, at the merge-base of this change):

| Stance | credit/GDP p95 | fragility > 0 | crises/century |
|---|---|---|---|
| Default — 4 % rate, no purchases, 6 % floor | 0.60 | 0.0 % | 0.72 |
| Easy money — 0 % rate, maximum purchases, 3 % floor | 0.92 | 23.2 % | 3.64 |
| The same easy money under a 25 % floor | 0.21 | 0.0 % | 0.67 |
| Tight — 8 % rate, no purchases, 25 % floor | 0.40 | 0.0 % | 0.78 |

Row three is the whole argument. Maximum asset purchases still carry valuation to a median of
1.43 there — a full-blown asset boom — and *nothing happens*, because the capital floor keeps
leverage on the ground. A player reading two time charts sees an alarming valuation line and
concludes the opposite of the truth.

## Decision

**When a mechanic reads the product of two measured quantities, the figure plots them against
each other and shades the region where both exceed their thresholds.**

- `plot.ts` gains `phasePlot`, the same shape as `timePlot`: pure geometry, two `Axis` values,
  scale functions, a `path` through the points in tick order, and a `corner` rectangle.
  It knows nothing about finance, exactly as `timePlot` knows nothing about indicators.
- `PhaseChart` in `components/ui` paints it and is the only component that does. A second
  hand-rolled two-axis figure is the five-chart divergence `TimeSeriesChart` was built to end.
- **ADR-0025 continues to hold on both axes.** Each is derived from the displayed record plus
  explicit semantic anchors supplied through `include`; neither borrows a dial face, and no
  point is ever clamped. The thresholds reach the chart as anchors from the caller, so the
  danger corner is always on the drawn face.
- **The corner clips to the face rather than disappearing.** Once a country is deep inside the
  region, the corner's origin falls off the bottom-left of the drawn data; hiding it there would
  remove the warning at the exact moment it is most earned.
- **The thresholds are imported from the engine, never copied.** `CRISIS_LEVERAGE_SAFE` and
  `CRISIS_ASSET_SAFE` are exported for the same reason `DEBT_RISK_PREMIUM_AT` already was: the
  government knows the rule exactly and only its own position against it is fogged.
- A phase plot **supplements** the time charts; it does not replace them. "When did this
  happen" remains a question only a time axis answers, so the overlay carries both.

## Alternatives considered

- **Compute a single fragility index and draw it as an ordinary time series.** The cheapest
  option, and it reuses everything. Rejected because the index is zero for most of every run and
  the player learns nothing from a flat line at zero — worse, it collapses the two dimensions
  into one, so it can say "you are safe" but never *which* excess to fix. The product's shape is
  the actionable content, and a scalar deletes it.
- **Keep the two time charts and just mark the thresholds on each.** Shipped as part of this
  change and worth having, but insufficient alone: two independently marked charts still invite
  reading each crossing as dangerous by itself, which is precisely the misconception. This is
  the option that looks like it solves the problem and does not.
- **Publish the hazard as a probability the player can read directly.** Rejected: the crisis
  clock is true state, and quoting it would hand over the very number the fog exists to withhold
  (ADR-0003). The player gets the two fogged coordinates and the exactly-known rule, and does the
  multiplication themselves — which is the game.
- **Shade a danger band on the valuation chart, conditioned on current leverage.** Rejected as
  actively misleading: the band would move under a century of history that never had today's
  leverage, so a past quarter would be shaded by a fact from the present.
- **Skip the figure and explain the product in the handbook.** Rejected. The handbook already
  says it in words (ADR-0024), and issue #108 asked for an overlay that is *impactful*; the
  mechanism is geometric and a picture is the honest register for it.

## Consequences

**Good:** the product structure is legible at a glance, and the two safe corners are visibly
safe rather than merely unmentioned; the geometry is pure and tested, so a wedge emitting `NaN`
cannot silently draw nothing; the danger corner is defined by the engine's own constants, so a
retune of the hazard moves the shading with it; future mechanics with the same shape have a
figure to reach for.

**Bad:** a second chart component to keep in step with `TimeSeriesChart` — it does not yet offer
range comparison, and point inspection is nearest-in-pixel rather than snapped along an axis;
a phase plot has no time axis, so the trail cannot say *when* without the hover readout, and a
century of quarters overlaps heavily in the middle of the plane where most of them sit; and the
figure is only as good as its thresholds, so a mechanic whose hazard stops being a clean product
would need this reconsidered rather than re-parameterised.
