# ADR-0016 — A chart frames the dial face; only the dial obeys it

**Status:** Superseded by [ADR-0024](0024-charts-own-their-analytical-scale.md) · **Date:** M6.5 · **Refines:** [ADR-0006](0006-fixed-dial-faces.md)

## Context

ADR-0006 fixed every indicator's dial face and made values outside it **peg at the rail with a
chevron**. That is right for a needle: the whole promise of a dial is that position means
magnitude, permanently and comparably, and a pegged needle says "off the charts," which is
exactly what it means.

The terminal-era instrument then reused the same face for its **line chart's y-axis**, and
carried the pegging rule across with it as a clamp:

```ts
const clampY = (v: number) => Math.min(hi, Math.max(lo, v))
```

On a needle, pegging costs you one number for one quarter and tells you so. On a trace it
erases the shape of an entire episode and says nothing at all: the line simply runs flat along
the rail, so a hyperinflation and a calm plateau draw identically. There is no chevron, because
there is nowhere on a time axis to put one.

This was not a rare edge. Re-measured with `pnpm ranges` over 12 seeds × 6 countries × 400
quarters, most indicators leave their face somewhere in the tails:

| indicator | face | measured range |
|---|---|---|
| `price_fuel` | 40–130 | 38.6 … **152.1** |
| `price_food` | 50–160 | 45.1 … **189.2** |
| `gdp_growth` | −15–15 | **−33.3 … 53.7** |
| `inflation` | −15–15 | −18.5 … **41.9** |
| `unrest` | 0–60 | −12.5 … **75.9** |
| `asset_prices` | 50–140 | 58.5 … **158.2** |

So the chart failed silently at precisely the moments a player most wants to read it — the fuel
shock, the crash, the inflation that ends a government. Reported as "graphs have some limits?
It seemed to visually cap at 130" ([#34](https://github.com/Scc33/terrarium/issues/34)); 130 is
`price_fuel`'s upper rail.

## Decision

**A dial obeys its face. A chart frames against it.**

`plot.ts`'s `yAxis` takes the face as a starting frame and may only move the rails **outward**:

- while the data is inside the face, the axis IS the face — pixel-identical to the old
  behaviour, so the trace's height stays comparable with the needle beside it and between the
  40Q and ALL windows;
- where the data leaves the face, the rail extends to the next readable gridline and the
  face's own bound is reported back as `Axis.faceLo` / `faceHi`;
- the painter rules that bound as a dashed **DIAL LIMIT** line, drawn *after* the trace, so the
  excursion is visibly above the line it crossed.

The face is never shrunk inside. A calm decade is still drawn against the whole dial.

This is a refinement of ADR-0006, not a reversal: `INDICATOR_FACE` is unchanged, the dial still
pegs with a chevron, and `gauge-domains.test.ts` still rejects a face an instrument spends more
than 2 % of its life against. What changes is only that the *chart* — which has printed axis
numbers and can therefore describe its own scale — stops pretending it is a needle.

## Alternatives considered

- **Keep the face, draw off-scale chevrons at the rail.** The strictest reading of ADR-0006:
  clip the trace and print the extreme value beside a chevron. Rejected because it preserves
  the one thing that was actually lost — the *shape* of the excursion — while adding chrome.
  Knowing inflation exceeded 15 % is worth much less than seeing it go to 42 and come back.
- **Auto-scale to the data in view.** What every charting library does by default, and what
  ADR-0006 was written to prevent. The trace's vertical position would stop being comparable
  between two quarters or between two windows.
- **Extend to a robust bound (say p99) rather than the maximum.** Keeps a single spike from
  compressing normal history — but it reintroduces clipping, quietly, for exactly the values
  that matter most.

## Consequences

**Good:**

- Every published value is drawable. No chart in the game clips its own data.
- Going off the dial became *more* legible, not less: a ruled limit with the excursion visibly
  past it says more than a needle against a stop.
- A normal century is unchanged, so the dial-to-chart reading a player has already learned
  still holds.

**Bad:**

- A single extreme quarter compresses the rest of the window — a century containing one 54 %
  print draws its ordinary ±3 % wiggle small. That is the honest picture of that window, and
  the 40Q view is the zoom, but it is a real cost and the alternative above was rejected
  knowing it.
- The axis is no longer a per-indicator constant, so two screenshots of the same instrument can
  carry different rails. The DIAL LIMIT rule is what keeps them comparable, and it only appears
  when they are not.
- One more thing a new chart has to opt into: passing `face` is what buys the framing, and a
  caller that forgets gets a plain auto-scaled axis.
