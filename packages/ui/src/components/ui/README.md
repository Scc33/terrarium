# Terrarium UI components

This folder is the shared, role-based interface layer for the game. Import from
`components/ui` rather than reaching into an individual folder.

- `Button`, `SegmentedControl`, `SliderField`, and `DisclosureSection` cover game input and progressive disclosure.
- `Metric`, `ProgressBar`, `SectionBar`, and `SectionHeading` cover dense information display.
- `Panel`, `Modal`, `OverlayLayout`, and `EmptyState` establish layout and accessibility contracts.
- `useFocusTrap` keeps temporary drawers and modal paperwork keyboard-contained and restores the invoking control when they close.
- `ChartFrame` gives every analytical figure the same title, unit, current-value,
  legend, plot-region, and accessible-summary anatomy.
- `TimeSeriesChart` is **the** painter for anything over time — lines, areas, uncertainty
  ribbons, the region between two series — in any of the three registers. It replaced five
  hand-rolled charts that disagreed about the y-axis, the hover readout and the accessible
  summary. Geometry lives in `ui/src/plot.ts`; pass `face` to frame against a dial (it extends
  past it rather than clamping — ADR-0016), `include` to pin zero or an index baseline,
  `rules` for reference lines, and `overlay` for instrument-specific ink.
- `LineChart` is a compact labelled preset over it, for dense bays.
- `DonutChart` and `StackedAreaChart` paint what `ui/src/shares.ts` returns.
- All of them are exact-data visualizations; their callers own the subject matter, labels,
  colors, and units.

Every component lives in its own folder beside its server-rendered contract tests.
Domain instruments such as `AnalogGauge` and `TerminalTicker` follow the same
folder-and-test convention one level above, but are not generic library exports.

Instrument access is derived once in `maturity.ts`: `unfunded`, `awaiting`, and
`reporting` are separate states, and every unlock threshold comes from the same
engine constant used by the statistics pipeline. Wall components receive that
derived contract; they do not guess from the presence or absence of a series.

## Visual review

In development, `/?gallery=1` opens the deterministic component gallery. It
includes populated charts, empty and locked states, controls, every visual
register, and the shared overlay anatomy.

`pnpm test:visual` compares the gallery and game states against the committed
screenshots in `tests/visual/__screenshots__`. Use `pnpm test:visual:update`
only after reviewing an intentional visual change.
