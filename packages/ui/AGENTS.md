# UI

The war room: one screen, no page scroll at 1280×720. Read the `terrarium-ui` skill before
writing React or Tailwind here, and run `verify-the-wall` after any layout change. jsdom has no
layout engine, so `tests/ui/` tests pure modules, never rendered components.

## Rules

- Components see `PublishedState`. Import types from `@terrarium/observation`, and constants /
  action & save *types* from `@terrarium/engine`; never `engine/src/state/*`, and never
  `init` / `step` / `replay` / `applyActions` / `runTick` outside `src/worker/**`.
- **Decisions live in pure `src/*.ts` modules with a test; components paint what they return.**
  A decision pushed into a component is untestable, and layout bugs here are invisible in review
  AND in jsdom. Each module's header comment carries its own rule and the incident behind it —
  read the header before changing the module.
- Every wall tile goes through `components/WallTile`. A tile fills its slot and clips; it never
  sizes to its content.
- One painter per shape: `TimeSeriesChart` for anything over time, `DonutChart` /
  `StackedAreaChart` for shares, `PhaseChart` for a product of two excesses. A chart scales the
  record it displays and never takes a dial face (ADR-0025); a dial face is fixed (ADR-0006).
- Import shared primitives from `components/ui`, never by reaching into a folder.
- Tailwind scans source *text*: spell class variants as literals, never template literals.
  Element defaults go in `@layer base`; an unlayered rule silently beats every utility.
- Label, ink and copy tables over engine id lists are total `Record`s, so a new id fails the
  build until it is named. Anything that *lists* what the game has (the manual, the cabinet, the
  drafting room) is generated from those lists, never typed by hand.
- Wherever the UI derives *access* — maturity, gating, what counts as fitted — it reads
  `pub.rules`, not just where the data arrives. `maturity.ts` once called 29 instruments
  unfitted under `fullInstrumentation`.
- Read the fog, never route around it: a share is taken against its own release's total, a
  quarter the office has not priced is dropped rather than carried forward, an unfunded survey
  returns `null` and never `0`. Exact registers (the census, the treasury's books) are the
  deliberate exceptions and say so.
- Gate dev-only code on `__DEV_TOOLS__`, never `import.meta.env.DEV` (ADR-0010;
  `tests/ui/dev-build-strip.test.ts` greps the bundle).
- View preferences (pins, the tour) are `localStorage`. The save is the country, the seed and
  the decisions. A save that will not load is refused with a sentence, never repaired.
