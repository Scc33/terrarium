# Terrarium Engine Atlas

A development-only map of the simulation architecture. It is generated from the repository rather than maintained as a second architecture document.

The scanner uses the TypeScript AST to:

- read `TICK_ORDER` and its source comments from `pipeline/pipeline.ts`;
- inventory production modules, named exports, and resolved internal imports;
- infer the top-level `TrueState` regions referenced by each pipeline step;
- anchor the load-bearing worker, observation, action-pricing, RNG, and pipeline seams to source lines.

Run it from the repository root:

```sh
pnpm architecture
```

The scan runs before the Vite server starts. Use `pnpm architecture:scan` to refresh the checked-in snapshot or `pnpm architecture:build` to verify the static production build.

The three views answer different questions:

1. **Tick pipeline** — what happens within a quarter, in what order, and which state regions a step references.
2. **System map** — which workspace package depends on which, and where the architectural invariants live.
3. **Module explorer** — named exports and the import/imported-by neighborhood for every production source file.

Source links use Vite's local editor endpoint during development. In a static preview they fall back to copying `path:line`.
