# ADR-0042 — Import cycles are a lint rule, not a scanner assertion

**Status:** Accepted · **Date:** 2026-09-13

## Context

Nothing detected import cycles. In a package whose tick order is versioned and whose seams are
the architecture, a cycle is the one kind of structural drift that compiles, tests and reviews
clean. [Issue #242](https://github.com/Scc33/terrarium/issues/242) measured the graph from the
checked-in atlas (ADR-0039): 0 value-level cycles, 22 type-only ones, every one of them benign
— each pipeline step reading its `StepFn` from `pipeline.ts`, and the
`constants` ↔ `state/schema` ↔ `state/finance` triangle. So the rule is pure regression
protection today, and it has to ignore type-only edges or it is 22 disables on day one.

Two homes were live: `eslint-plugin-import-x`'s `no-cycle`, or a few lines of Tarjan over the
edges `pnpm architecture:check` already resolves. The issue asked for the first to be profiled
and the owner's rule was stated up front: buy unless it is too slow.

## Decision

`import-x/no-cycle` runs in `eslint.config.js` over every TypeScript file in the repository —
tests and tools included, which the scanner never sees. A value-level cycle fails `pnpm lint`
at both of its ends, by file and line. Type-only edges are skipped by the rule itself: an
`import type`, or an import whose every specifier is inline `type`.

The block carries three settings, and each one is load-bearing. The plugin's defaults are
JavaScript's, so without `.ts` in `import-x/extensions` the export map refuses every file and
the rule reports nothing; without `.ts` in the resolver's extensions the repository's ~800
extensionless relative imports resolve to nothing; and `ignoreExternal` — needed to keep the
walk out of `node_modules` — classifies a resolved path outside the linted file's own package
as external, which is what `@terrarium/engine` looks like from `packages/ui` once the pnpm
symlink is realpathed. `import-x/internal-regex: '^@terrarium/'` is consulted first and keeps
the workspace inside. Each was proved by removing it against a planted cycle: the first and
third report nothing, the second drops the alias end.

## Alternatives considered

- **A cycle assertion in `architecture:check`.** No dependency and a few lines, and it sits
  beside the atlas test that already fails by name when the pipeline moves. Rejected on the
  owner's stated preference: it is a second module graph whose resolution, type-tagging and
  coverage (`packages/*` only, no tests) would be ours to keep honest, for a problem an
  upgradable package already solves.
- **`no-cycle` without `ignoreExternal`.** Walks into `node_modules` on every external import.
  Slower for nothing: a cycle through a published package is not something this repository can
  fix.

## Consequences

Measured at this commit: the rule costs **1.39 s, 14.5 % of rule time**, fourth behind three
type-checked rules already in the config, and **+1.3–1.7 s wall on a ~14 s `pnpm lint`**.
One new dependency, nine packages in the tree.

The plugin has a bug this repository now lives with: `export type { X } from './y'` is read as
a value edge, because `ExportMap` checks `importKind` and a typescript-estree
`ExportNamedDeclaration` carries `exportKind` (`export type * from` is handled correctly). It
only matters when such a re-export sits on a cycle. The one that did — `state/schema.ts`
re-exporting `FinanceState` — is now an `import type` plus a bare `export type { FinanceState }`,
which is the same export with no edge. Until it is fixed upstream, a type re-export on a cycle
has to be written that way, or the rule will report it as a cycle it is not.
