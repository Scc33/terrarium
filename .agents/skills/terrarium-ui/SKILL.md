---
name: terrarium-ui
description: Build or change UI in Terrarium's packages/ui — the instrument wall, gauges, rack strips, cabinet, overlays, or any chart. Use before writing React or Tailwind in this repo. Covers the design tokens, the board/rack/docked layout model, the import boundary the engine enforces, the WallTile contract, the shared primitives in components/ui, and the four layout bugs that are invisible in both code review and jsdom.
---

# Working in packages/ui

The war room is a **single screen with no page scroll at desktop sizes**. Everything below
follows from that constraint.

## The import boundary

`packages/ui` may import:

- types from `@terrarium/observation`
- constants, and action/save **types**, from `@terrarium/engine`

It must **never** import `engine/src/state/*`, and never the engine's state-running functions
(`init` / `step` / `replay` / `applyActions` / `runTick`) outside `ui/src/worker/**`. Only the
worker runs the engine (ADR-0004); components see `PublishedState` and nothing else.

Enforced twice — at the import boundary by lint, and at the data boundary by
`tests/contract/published-state.test.ts`. If you find yourself wanting true state in a
component, you want the dev console instead (see below).

## Visual registers

Four token families in `packages/ui/src/index.css`, surfaced as Tailwind utilities
(`bg-dossier-paper`, `text-terminal-primary`, …):

| Register | Tokens | Used for |
|---|---|---|
| `dossier-*` | `paper` `felt` `brass` `ink` `warn` | the analog era — paper, brass, ministry wording |
| `terminal-*` | `bg` `primary` `alert` `grid` | the electronic era — phosphor green on near-black |
| `map-*` | `field` `line` | the quieter cartographic register |
| `wire-*` | `paper` `ink` | the news wire |

Which register an instrument is drawn in is **diegetic and derived, not chosen**: maturity
comes from `ui/src/maturity.ts` — `unmeasured` / `dossier` / `terminal`, graduating at
`TERMINAL_AT = 0.5` statistical capacity. Components receive that derived contract. They do
not infer it from whether a series happens to be present.

## The wall: board + rack + docked

Up to `BOARD_SLOTS` (4) pinned instruments at full size, then every instrument as a
fixed-height strip, then the ledger and corridor. Pins are a `localStorage` view preference —
**not part of the save**.

Three pure modules own the decisions, so they can be tested. Anything pushed into a component
becomes untestable:

- **`ui/src/wallPlan.ts`** — the height budget. The wall's minimum height is a NUMBER, pinned
  against 1280×720 by `tests/ui/wall-plan.test.ts`. `rackHeadroom()` says how many more
  indicators fit; **at zero, the wall needs a real layout decision, not a smaller font.**
  Adding a tile means adding it here too.
- **`ui/src/domains.ts`** — fixed per-indicator dial faces, measured with `pnpm ranges`, never
  derived from the trailing window (ADR-0006). Off-scale pegs at the rail with a chevron —
  going off the dial is information. Only `capital_stock` ratchets.
- **`ui/src/shares.ts`** — pie and stacked-band geometry, pinned by `tests/ui/shares.test.ts`.
  Pure because a wedge that emits `NaN` into its path draws nothing, which in review is
  indistinguishable from a category with no money in it.

## Reuse the primitives

Import from `components/ui`, never reach into an individual folder:

- Input: `Button`, `SegmentedControl`, `SliderField`, `DisclosureSection`
- Display: `Metric`, `ProgressBar`, `SectionBar`, `SectionHeading`
- Layout / a11y: `Panel`, `Modal`, `OverlayLayout`, `EmptyState`, `useFocusTrap`
- Charts: `ChartFrame` (title + unit + current value + legend + plot + accessible summary),
  then `LineChart`, `DonutChart`, `StackedAreaChart`

`DonutChart` and `StackedAreaChart` paint what `shares.ts` returns and know nothing about
budgets — **reuse them rather than hand-rolling a chart.** `SHARE_INKS` stops at six, the
widest split the books have; bucket a tail into "other" rather than extend the ramp.

The label/ink tables in `panels/LedgerOverlay.tsx` are total `Record`s over the engine's id
lists, so a new tax or spending line fails the build until it has been named and given an ink.

## Every wall tile goes through WallTile

`components/WallTile/WallTile.tsx`. **A tile fills its slot and clips; it never sizes to its
content.** It owns `overflow-hidden`, `minmax(0,1fr)` rows, and `min-h-0` on the body.

Its module comment is the canonical list of the four ways this breaks — all four shipped at
least once, and all four are invisible in review AND in jsdom:

1. a `flex-col` tile whose flexing child lacks `min-h-0`, so the child floors at content
   height and pushes past the slot;
2. an SVG with `h-full w-full` in an auto-height parent, falling back to its viewBox ratio
   (400px tall in a 175px bay — this is what happened to the corridor plot);
3. a grid band with implicit `auto` rows, where a child's `h-full` resolves against its own
   content instead of the band;
4. definite rows but an implicit `auto` **column**, resolving to max-content — the widest
   child sets a track wider than the tile and `overflow-hidden` silently shears the right edge
   off every sibling. `min-w-0` on the root does **not** prevent this.

That last one hid a gauge's upper-bound label for four milestones, and only appeared when a
dial needed three digits instead of two.

## The Tailwind trap

Tailwind scans source **text**. A template-literal class — `grid-rows-[${rows}]` — exists in
the DOM and in no stylesheet, and fails completely silently. **Spell variants out as
literals.**

The same failure with the opposite cause: `index.css` sets `button, input { font: inherit }`
**unlayered**, and an unlayered rule beats every `@layer` — including Tailwind v4's
`utilities`. So a font utility on a `<button>` or `<input>` is in the source, in the DOM, in
the stylesheet, and **inert**: `text-[9px]`, `font-semibold` and `font-mono` all lose to the
shorthand. This bites `TooltipLabel` and `Button`, which render buttons. **Put the type size on
the parent row and let the button inherit** — the census overlay's pyramid stats row is the
pattern. Colour, tracking and everything outside the `font` shorthand still apply, which is
what makes it hard to see: the label is the right colour and the wrong size.

## Dev tooling

- Backtick opens the dev console in `pnpm dev` (ADR-0010). SCENARIO runs a real game to a
  given year; TRUTH shows what the fog is hiding, as an anonymous `DevNode` tree so the UI
  still cannot *name* a true-state field. Scenario logic is pure in `ui/src/devScenario.ts`.
- `/?gallery=1` opens the deterministic component gallery — populated charts, empty and locked
  states, controls, every visual register, the shared overlay anatomy.

Gate anything that must never ship on **`__DEV_TOOLS__`**, never `import.meta.env.DEV` — the
latter derives from ambient `NODE_ENV`, so `NODE_ENV=test pnpm build` ships the true-state
serializer and `--mode production` does not save you. `tests/ui/dev-build-strip.test.ts`
builds the bundle and greps it; if that test goes, the guarantee goes with it.

## Then verify

`tests/ui/` tests pure modules, not rendered components, because jsdom has no layout engine —
a render test passes happily while the wall clips every figure it publishes.

**Run the `verify-the-wall` skill after any wall change.** It is not optional.
