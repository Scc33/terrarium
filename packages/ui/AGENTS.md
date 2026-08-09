# UI — player interaction

Read the `terrarium-ui` skill before writing React or Tailwind here. After changing the wall,
a gauge, rack strip, overlay, or `wallPlan`, also run the `verify-the-wall` skill; jsdom cannot
prove layout.

## Data and worker boundary

- Components consume `PublishedState` from `@terrarium/observation`. They may import engine
  constants and action/save types, but never true-state internals.
- Only `src/worker/**` may call engine-running functions such as `init`, `step`, `replay`,
  `applyActions`, or `runTick`. Even the worker uses the engine's public API.
- `src/worker/protocol.ts` is the single wire contract. Normal worker messages carry published
  state, action types, and replay saves—never typed `TrueState`.
- Dev truth crosses only as anonymous `DevNode` trees. Do not give components names for true
  engine fields or add a second inspection channel.

## Player decision flow

The playable loop is draft, quote, review, enact:

1. Controls stage at most one action per stable action key in `gameStore`.
2. The worker previews every staged action through the engine's `politicalCostOfAction`.
3. The UI shows legality, per-action cost, total cost and affordability before advance.
4. Advance sends the staged actions once, clears the draft, applies them in the worker, steps
   one quarter, publishes, and autosaves the replay log.

Do not compute a political price in a component or charge from a different code path than the
preview. Pins are a `localStorage` view preference, not save state. New games, country changes,
and save loads reset drafts; they must not create an alternate engine lifecycle.

## Visual language and shared primitives

- The game is a single-screen war room at desktop sizes, using diegetic per-instrument maturity,
  `dossier-*` / `terminal-*` tokens and the quieter `map-*` / `wire-*` register.
- Import shared primitives from `components/ui`, never by reaching into a primitive's folder.
- Keep decision-making geometry and state transitions in pure modules so Vitest can pin them;
  components should paint those decisions.
- Tailwind scans source text. Spell dynamic variants as literal complete class names; a class
  assembled as `grid-rows-[${rows}]` reaches the DOM without ever reaching the stylesheet.

## Instrument wall

The wall is board + rack + docked: up to `BOARD_SLOTS` pinned full-size instruments, then every
instrument as a fixed-height strip, then ledger and corridor.

- `src/wallPlan.ts` owns the numeric height budget. `rackHeadroom()` reaching zero requires a
  real layout decision, not an untested height increase.
- `src/domains.ts` owns fixed per-indicator dial faces measured by `pnpm ranges`. Never derive a
  face from the trailing window. Off-scale values peg at the rail with a chevron; only
  `capital_stock` may ratchet monotonically.
- Every wall tile goes through `components/WallTile/WallTile.tsx`. A tile fills its slot, clips,
  and preserves `minmax(0,1fr)` rows plus `min-h-0` body behavior.
- `src/shares.ts` owns donut and stacked-band geometry. Reuse `DonutChart` and
  `StackedAreaChart`; bucket a tail into `other` instead of extending `SHARE_INKS` past six.
- Label and ink tables over engine ids are total records. A new published line must fail the
  build until it is named and given an ink.

## Dev-only tooling

Gate anything that must never ship on `__DEV_TOOLS__`, not `import.meta.env.DEV`. The latter
depends on ambient `NODE_ENV` and can retain the true-state serializer in a production build.
`tests/ui/dev-build-strip.test.ts` builds and greps the bundle; do not remove or weaken it.

The backtick console's SCENARIO tab constructs a real replayable game from country parameters,
seed and overrides. Its TRUTH tab renders an anonymous tree. Keep scenario logic pure in
`src/devScenario.ts`, not embedded in the panel.

## Validation

- Read `tests/AGENTS.md` before adding or changing tests.
- Use unit tests for pure decisions, browser interaction for accessibility and behavior, and
  Playwright/real-browser checks for layout.
- At 1280x720, require no page or horizontal scroll, no below-fold game content, and a clean
  console. Verify smaller drawer/tablet states when the change can affect them.
- Reload once after HMR-heavy edits and inspect a fresh console; transient HMR state can hide a
  missing import or stale component definition.
