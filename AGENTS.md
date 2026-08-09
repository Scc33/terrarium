# Terrarium — repository guide

Economic policy game. pnpm monorepo; built through M6. Read `docs/tech-architecture.md`
before changing structure.

## How guidance is scoped

`AGENTS.md` is the canonical shared instruction format. Every colocated `CLAUDE.md` contains
exactly `@AGENTS.md`; never duplicate shared guidance in a tool-specific wrapper.

Codex loads guidance only from the repository root down to its launch directory, while Claude
can discover descendant guidance as it reads files. Therefore, before editing a scoped
subtree, **read its closest `AGENTS.md` explicitly**. A cross-directory task must read every
applicable guide.

| Directory | Guide owns |
|---|---|
| `packages/engine/` | true-state simulation, schema, pipeline, RNG, tuning lessons |
| `packages/observation/` | published read model and presentation boundary |
| `packages/ui/` | player interaction, worker boundary, game UI and browser verification |
| `packages/runner/` | deterministic replay, batch sweeps and calibration reports |
| `tests/` | regression strategy, goldens, properties, contracts and visual coverage |
| `docs/` | architecture, ADR, investigation and data-contract registers |

Put always-true directory constraints in the closest guide. Put a cross-cutting task sequence
in a skill. Do not repeat a skill's checklist in several guides. Add a narrower guide only
after a directory develops a distinct invariant that has caused repeated mistakes.

## Architecture contract

Dependency direction is law and lint-enforced:

```text
ui -> observation -> engine        (never the reverse)
tests and developer tools -> runtime packages
```

- The engine owns true state and measurement. UI components see `PublishedState`; only
  `packages/ui/src/worker/**` may host the engine.
- The economy and politics are separate machines meeting in two places: `institutions` reads
  the economy to derive power, and veto players price actions in `actions/apply.ts`. If a
  politics-only change moves the passive century economy, that seam has leaked.
- `politicalCostOfAction` is the single source of truth for both quoted and charged action
  costs. Downstream packages delegate to it rather than recreating prices.
- `packages/architecture-visualizer` is a developer-only, code-derived atlas. Runtime packages
  must never depend on it or its generated snapshot.
- `Math.random` and `Date.now` are banned repo-wide. Simulation randomness comes from named
  `rngFor(seed, stepName, tick)` substreams; browser-only entropy may use Web Crypto.

## Skills

Procedures live in `.agents/skills/`, symlinked to `.claude/skills` and `.codex/skills` so both
agents read one copy. Read the applicable skill completely before acting.

| Skill | Use for |
|---|---|
| `add-indicator` | a new published metric or a dial face that drifted |
| `economics-review` | any engine behavior change, golden diff, tuning, or `pnpm bless` |
| `add-bloc-or-institution` | power, favour, reform stocks, stances, or veto pricing |
| `terrarium-ui` | any React, Tailwind, instrument, cabinet, overlay, or chart work |
| `verify-the-wall` | real-browser proof that UI fits at 1280x720 |
| `document-a-decision` | choosing an ADR, investigation, or tuning-lesson register |

## Repository workflow

- Use Node 24 and pnpm. Packages are consumed as TypeScript source; there is no per-package
  build step for the runtime packages.
- CI gates pushes and PRs in this order: typecheck, lint, coverage, then a 200-run x 120-tick
  random-policy batch.
- Two TypeScripts are intentional (ADR-0009): `tsc` is TS 7 via `@typescript/native`, while
  the dependency named `typescript` is the TS 6 API required by `typescript-eslint`. Do not
  collapse the alias until typescript-eslint supports TS 7.
- Preserve unrelated work in dirty worktrees. Stage only files in the requested change.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | run the game UI |
| `pnpm build` | production-build the game UI |
| `pnpm typecheck` | typecheck every workspace target |
| `pnpm lint` | enforce imports, determinism and style |
| `pnpm test` | run the Vitest suite |
| `pnpm coverage` | run tests with the pure-core coverage floor |
| `pnpm test:visual` | run Playwright visual coverage |
| `pnpm batch -- --runs 1000 --ticks 120 --policy random` | run a balance sweep |
| `pnpm architecture` | regenerate and open the engine atlas |
| `pnpm architecture:build` | regenerate and build the engine atlas |
