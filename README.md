# Terrarium

You've just taken control of a nation's economy in 1946 — and you can't even see it clearly.
A browser-based policy game: quarterly decisions, an emergent 5-cohort × 5-sector economy,
and statistics that are late, noisy, and quietly revised after you've bet your career on them.

Design docs live in [docs/](docs/) — start with [game-description.md](docs/game-description.md),
then [proposal-1.md](docs/proposal-1.md) (design) and [tech-architecture.md](docs/tech-architecture.md)
(architecture). The current build implements **M0 + M1**: the full engine skeleton and the
v0.1 terrarium.

## Play it

```sh
pnpm install
pnpm dev        # → http://localhost:5173
```

Read the instruments, stage dial changes, advance the quarter. Elections every 16 quarters.
Saves are `{seed, actionLog}` — autosaved to IndexedDB every turn, exportable as JSON, and
replayed deterministically on load.

## Workspace

| Package | What it is |
| --- | --- |
| `packages/engine` | The sim. Pure TS, zero dependencies, fully deterministic. `init` / `applyActions` / `step`. |
| `packages/observation` | Presentation-only projection of engine-made prints into `PublishedState`, the only state types the UI may see. |
| `packages/ui` | React instrument panel. Runs the engine in a Web Worker; renders `PublishedState` only. |
| `packages/runner` | Headless batch CLI — the balance dashboard. |
| `packages/fixtures` | Shared countries, scripts, golden snapshots. |
| `packages/architecture-visualizer` | Code-derived engine atlas: pipeline order, package seams, and module relationships. |

## Commands

```sh
pnpm test          # unit + golden + property suites (incl. the M1 exit criteria)
pnpm typecheck
pnpm lint          # includes import-boundary rules and the Math.random ban
pnpm architecture  # scan the source and open the engine atlas on localhost:4174
pnpm batch -- --runs 1000 --ticks 120 --policy random
pnpm bless         # re-bless golden snapshots after intentional engine changes
pnpm diff-state    # see exactly which state variables moved before you bless
```

## The two claims the tests enforce (M1 exit criteria)

- **A fuel tax raises bread prices** — through energy → transport → agriculture in the
  input–output table. No scripted arrow exists; `tests/properties/fuel-tax.test.ts` proves it
  across 60 seeds.
- **A subsidy in a low-capacity state does more harm than good** — leakage takes most of it,
  the budget takes all of it; `tests/properties/subsidy.test.ts`.

Plus the standing invariants: replay determinism, no NaN across thousands of runs, budget
identity, prices bounded.
