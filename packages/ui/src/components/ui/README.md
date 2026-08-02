# Terrarium UI components

This folder is the shared, role-based interface layer for the game. Import from
`components/ui` rather than reaching into an individual folder.

- `Button`, `SegmentedControl`, and `SliderField` cover game input.
- `Metric`, `ProgressBar`, and `SectionHeading` cover dense information display.
- `Panel`, `Modal`, and `EmptyState` establish layout and accessibility contracts.
- `LineChart`, `DonutChart`, and `StackedAreaChart` are exact-data visualizations;
  their callers own the subject matter, labels, colors, and units.

Every component lives in its own folder beside its server-rendered contract tests.
Domain instruments such as `AnalogGauge` and `TerminalTicker` follow the same
folder-and-test convention one level above, but are not generic library exports.
