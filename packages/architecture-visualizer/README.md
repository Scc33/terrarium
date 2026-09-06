# The engine atlas — scanner

This package **scans the repository**. It does not draw it: the atlas is in the game, at
`packages/ui/src/panels/AtlasOverlay.tsx`, over the derivations in `packages/ui/src/atlas.ts`
(ADR-0038). What lives here is the TypeScript-AST walk and the snapshot it writes.

The scan reads:

- `TICK_ORDER` and the source comments beside it, from `pipeline/pipeline.ts`;
- every production module, its named exports, and its resolved internal imports;
- the top-level `TrueState` regions each pipeline step references;
- the load-bearing worker, observation, action-pricing, RNG and pipeline seams, anchored to
  source lines.

It excludes its own package, so the map is of the simulation and not of the thing describing it.

```sh
pnpm architecture:scan    # redraw the map and write the snapshot
pnpm architecture:check   # fail if the checked-in map no longer describes the repository
```

The snapshot is **checked in** (`src/generated/architecture.ts`) so the game builds without
running a scan, and `--check` is what stops it drifting: CI runs it on every push and pull
request. The comparison normalizes `revision` away, because that field records the commit the
scan was taken at and is one commit behind by construction — the commit that lands a rescan
cannot contain its own hash.

`tests/ui/atlas.test.ts` makes the same guarantee specific where it matters most: it compares
the scanned pipeline against the engine's live `TICK_ORDER`, so a step added, renamed or
reordered without a rescan fails by name in the ordinary test run.

Add a pipeline step, a workspace package or a seam, and rescan.
