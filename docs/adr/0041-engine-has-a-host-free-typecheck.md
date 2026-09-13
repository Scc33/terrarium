# ADR-0041 — The engine has its own host-free typecheck

**Status:** Accepted · **Date:** 2026-09-13

## Context

The engine must not read Node or browser APIs. Its path-aware lint rule rejects imports that
leave `packages/engine/src` and undeclared host globals, but the root TypeScript project also
includes the engine with `types: ["node"]` for the runner, tools and tests. The compiler
therefore accepted `process.env` in engine source. [Issue #247](https://github.com/Scc33/terrarium/issues/247)
measured the gap and proposed a separate compiler check.

## Decision

Typecheck `packages/engine/src` in its own `tsconfig.json`, extending the shared options with
`types: []`. Run that check in `pnpm typecheck` before the existing root and UI projects. Keep
the root project for Node-using code, and keep lint as the authority for import paths and host
access. This is an additional no-emit check, not a package build or a project-reference graph.

## Alternatives considered

- **Lint alone.** Its import and global rules already cover this case, but the compiler and
  editor would still accept Node globals in a package whose contract forbids them.
- **Full project references.** They could separate package compilation and share incremental
  outputs, but require composite projects, declaration output and a build-mode workflow. This
  repository consumes workspace TypeScript source directly and has no demonstrated need for
  that migration to enforce this one environment rule.

## Consequences

The engine is checked under its intended ambient environment by both TypeScript versions used
here: TS 7 for `pnpm typecheck` and TS 6 for typed linting's project service. The new check
duplicates some work: root and UI programs still compile engine source through imports.
`types: []` only removes automatic ambient type inclusion; it does not prohibit an import or
types explicitly brought in by one. The lint allowlist remains load-bearing. Revisit the extra
compiler pass if its measured CI cost becomes material.
