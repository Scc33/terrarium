# ADR-0024 — Charts own their analytical scale and shared range inspection

**Status:** Accepted · **Date:** 2026-08-21 · **Supersedes:** [ADR-0016](0016-a-chart-frames-a-dial-face.md) · **Preserves:** [ADR-0006](0006-fixed-dial-faces.md)

## Context

ADR-0016 fixed a real failure: the terminal chart clamped every value to the analog dial face,
so an excursion beyond the rail became a flat line. It kept the face as the chart's starting
scale, extended beyond it when necessary, and ruled the crossed bound as **DIAL LIMIT**.

That removed the silent clamp but left the chart borrowing a constraint from a different
instrument. Issue [#106](https://github.com/Scc33/terrarium/issues/106) reported the consequence
directly: the orange limit is weird and unnecessary. It reads as though the chart itself has a
forbidden region, even though the trace can and does continue through it. Keeping a wide fixed
face also compresses the small movements in a quiet 40-quarter window, where the chart's printed
axis could describe a more useful scale without ambiguity.

Issue [#109](https://github.com/Scc33/terrarium/issues/109) exposes the other half of the same
instrument problem. A crosshair can read one print, but policy play is about change between two
prints. The player needs to drag over an interval and read its endpoints, change, and observed
range. Implementing that only in the terminal ticker would recreate the five-chart disagreement
that the shared `TimeSeriesChart` was introduced to remove.

## Decision

**A dial keeps a fixed face. A chart owns the analytical scale of the record it displays.**

- `TimeSeriesChart` has no dial-face input and paints no DIAL LIMIT. Its y-axis derives from the
  plotted points plus explicit, subject-matter anchors supplied through `include` (known rule
  lines from `FACE_MARK`, 100 for a 1946-base index, and so on). It never clamps a point.
- Changing 40Q, ALL, or a rolling window may change the y-axis. The printed axis numbers make
  that scale explicit; visual position is comparable within the figure, not to an analog needle
  or a different window.
- Every chart that offers point inspection also offers range inspection. Pointer drag and
  Shift+Arrow choose two actual points from the lead series. The shared painter shades the
  interval and reports the start and end readings, absolute change, elapsed quarters, and the
  low/high readings observed inside it. Short strips use the same facts in a compact readout so
  the annotation does not hide the trace. Escape or a click clears the selection.
- Selection is inspection, not zoom. The axis does not rescale around the selected interval,
  because moving the trace while the player is still choosing endpoints makes the gesture a
  moving target.
- Missing survey quarters remain missing. Endpoints snap to prints and elapsed time comes from
  their quarter stamps; the readout never invents intermediate observations.

## Alternatives considered

- **Keep ADR-0016's framed face and rename or soften DIAL LIMIT.** This preserves vertical
  comparability with the gauge, but it keeps the irrelevant constraint and still flattens a
  quiet window inside a face sized for crisis tails. The reported problem is semantic, not copy.
- **Hide the DIAL LIMIT rule but retain the face as an invisible minimum domain.** Less chrome,
  but now the constraint becomes silent again and the chart remains less legible for no visible
  reason.
- **Zoom the chart to the dragged interval.** Useful in a dedicated analysis workspace, but poor
  for the fitted wall: the graph moves underneath the gesture, hides the surrounding episode,
  and needs a second reset interaction. The selected interval can become a future explicit zoom
  control without changing the inspection contract chosen here.
- **Implement drag comparison in `TerminalTicker` only.** Smaller initial diff, but every ledger,
  finance, census, and policy chart would retain a different interaction. The shared painter
  exists specifically so chart instrumentation is systemic.

## Consequences

**Good:**

- The chart no longer suggests that a gauge rail is a forbidden analytical boundary.
- Every plotted value remains drawable, and quiet windows use the space available to describe
  their movement.
- One implementation gives every interactive time series pointer and keyboard range comparison.
- Range math is pure in `plot.ts`, so reverse drags, gaps, and low/high calculations are pinned
  without relying on jsdom layout.

**Bad:**

- The same value can occupy a different vertical position in 40Q and ALL. The axis labels are
  now the comparison contract; glancing at trace height alone is insufficient across views.
- A single extreme print can still compress the rest of the displayed record. This is honest
  and unclamped, but a future explicit zoom may still be useful.
- Interactive SVGs now carry pointer capture, focus, keyboard shortcuts, and a live readout.
  Browser-level tests remain required because static component tests cannot prove that overlay
  fits inside a board slot.
