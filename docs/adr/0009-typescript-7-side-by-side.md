# ADR-0009 — TypeScript 7 runs side-by-side with the TS 6 API

**Status:** Accepted · **Date:** 2026-08-02

## Context

TypeScript 7 is the native Go port of the compiler. On this repo it typechecks in **0.14s
against 0.94s** for TS 6 — a 6.8× improvement on a check that runs on every save, every
pre-commit, and every CI push.

`typescript-eslint` does not support TS 7 and does not degrade gracefully: it throws on load
(`typescript-eslint does not support TS 7.0`), taking the whole lint step with it. Per
[typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)
the blocker is upstream of them — ESLint has no async parser support, which tsgo's WASM
bindings need — so this is months away, not weeks.

Lint is a CI gate here and enforces the import boundaries that ADR-0004 depends on. Dropping it
is not an option.

## Decision

Install both, using the aliasing scheme from the TypeScript 7 release notes:

```jsonc
"@typescript/native": "npm:typescript@^7.0.2",           // TS 7 — provides `tsc`
"typescript": "npm:@typescript/typescript6@^6.0.2",      // TS 6 API — what typescript-eslint resolves
```

`pnpm typecheck` gets the native compiler; `typescript-eslint` resolves `typescript` to the TS 6
API package and is satisfied. `tsc6` remains available for comparison.

## Alternatives considered

- **Stay on TS 6.** Zero risk, forgoes the speedup. Reasonable, but the speedup is on the
  tightest feedback loop in the repo.
- **TS 7 and drop linting.** Rejected: lint enforces the architectural boundaries, and CI gates
  on it.
- **TS 7 with `typescript-eslint` untyped rules only.** The type-aware rules aren't what
  enforce our boundaries (`no-restricted-imports` is syntactic), so this nearly works — but
  typescript-eslint throws at *load*, not at rule evaluation, so there is nothing to configure.

## Consequences

**Good:**

- 6.8× faster typecheck, and TS 7 typechecked the existing codebase with **zero errors** — no
  source changes were needed.
- Lint keeps working unchanged.

**Bad:**

- **Two TypeScript versions in the tree**, and the one named `typescript` is *not* the one that
  typechecks the project. This is genuinely confusing and is the main cost.
- Type-aware lint rules see the TS 6 type system. In principle a construct TS 7 accepts could be
  parsed differently by the linter; in practice the two share a language version and this has
  not been observed.
- `pnpm outdated` reports on the aliases oddly, and the alias must be maintained in both the
  root and `packages/ui`.

## Revisit when

typescript-eslint ships TS 7 support (tracked in #10940). At that point collapse back to a
single `typescript: ^7.x` dependency and delete the `@typescript/native` alias.
