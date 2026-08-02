# Terrarium UI components

This folder is the shared, role-based interface layer for the game. Import from
`components/ui` rather than reaching into an individual folder.

- `Button`, `SegmentedControl`, `SliderField`, and `DisclosureSection` cover game input and progressive disclosure.
- `Metric`, `ProgressBar`, `SectionBar`, and `SectionHeading` cover dense information display.
- `Panel`, `Modal`, `OverlayLayout`, and `EmptyState` establish layout and accessibility contracts.
- `ChartFrame` gives every analytical figure the same title, unit, current-value,
  legend, plot-region, and accessible-summary anatomy.
- `LineChart`, `DonutChart`, and `StackedAreaChart` are exact-data visualizations;
  their callers own the subject matter, labels, colors, and units.

Every component lives in its own folder beside its server-rendered contract tests.
Domain instruments such as `AnalogGauge` and `TerminalTicker` follow the same
folder-and-test convention one level above, but are not generic library exports.

## Visual review

In development, `/?gallery=1` opens the deterministic component gallery. It
includes populated charts, empty and locked states, controls, every visual
register, and the shared overlay anatomy.

`pnpm test:visual` compares the gallery and game states against the committed
screenshots in `tests/visual/__screenshots__`. Use `pnpm test:visual:update`
only after reviewing an intentional visual change.
