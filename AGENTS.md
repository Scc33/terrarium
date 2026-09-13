# Terrarium — working notes

Economic policy game about governing a country you cannot see clearly. pnpm monorepo. Read
`docs/tech-architecture.md` before touching structure.

## Where guidance lives

This file holds only what is true everywhere; it is loaded on every task, so it stays short.

- **`packages/engine/AGENTS.md`, `packages/ui/AGENTS.md`** — the rules of that subtree. Read
  the closest one before editing there. Codex only composes guides from the root down to its
  launch directory, so a root-launched task has to open them itself.
- **`.agents/skills/`** — procedures, loaded by description when the task matches (table below).
- **`docs/tech-architecture.md`** is *what* the code is. **`docs/adr/`** is *why* — each
  decision with the alternatives it beat and the costs it carries; read the ADR before touching
  the feature it governs. **`docs/investigations/`** is what was measured and is not yet
  believed. **`docs/tuning-lessons.md`** is the failure each constant's value prevents; read it
  beside the constant you are about to touch. `docs/game-description.md` is the pitch; proposed
  work lives in GitHub issues; `docs/archive/` is provenance, not guidance.
- Every `CLAUDE.md` is exactly `@AGENTS.md`. `tests/contract/docs.test.ts` enforces that, the
  size budget, and that the architecture doc's pipeline table still matches `TICK_ORDER`.

## Architecture

```
ui → observation → engine        (never the reverse; lint-enforced)
```

- `packages/engine` is pure: no DOM, React, other workspace packages, `Math.random` or
  `Date.now`. All randomness via `rngFor(seed, stepName, tick)` substreams (ADR-0002).
- Only `ui/src/worker/**` runs the engine (ADR-0004). Components see `PublishedState`, enforced
  at the import boundary (lint) and the data boundary (`tests/contract/published-state.test.ts`).
- The fog is MADE in the engine (`pipeline/statistics.ts`), because politics reads the published
  headline, not the truth (ADR-0003). `packages/observation` is presentation only — never grow
  measurement back into it.
- Every behavioural constant lives in `engine/src/constants.ts` (ADR-0007). Pipeline step order
  is versioned; reordering is a schema event (ADR-0005).
- The **economy** and the **politics** are separate machines meeting in two places:
  `institutions` reads the economy to decide who has power, and the veto players price every
  action in `actions/apply.ts`. Keep that seam narrow. The passive century baseline is an
  economy fact — if a politics change moves it, the seam has leaked (`pnpm batch --policy
  passive` is the check).
- `politicalCostOfAction` is the single source of truth for what an order costs. Quote and
  charge are never computed twice; `observe.ts` publishes reform prices straight from it.

## Skills

| Skill | For |
|---|---|
| `economics-review` | any engine change: reading the state diff, the baselines, `pnpm bless` |
| `add-indicator` | a new published metric, or a dial face that has drifted |
| `add-bloc-or-institution` | the politics layer — power, favour, veto pricing |
| `add-an-event` | the news wire — a new dispatch, an era's voice, or what the desk reports |
| `terrarium-ui` | anything in `packages/ui` — tokens, the wall, charts, layout contracts |
| `verify-the-wall` | proving a UI change fits, in a real browser at 1280×720 |
| `document-a-decision` | choosing between an ADR, an investigation, and a tuning lesson |

## Workflows

- Engine change or balance work → `economics-review`. `pnpm bless` overwrites the goldens with
  whatever the engine now produces and cannot tell an improvement from a broken economy, so the
  diff review IS the economics review (ADR-0008). `pnpm diff-state --moved-only` on any
  schema-adding change, or new fields bury the economics.
- A `SCHEMA_VERSION` bump owes `docs/metrics-changelog.md` an entry.
- A balance question about a REAL game → `pnpm replay <save-or-export.json>`. The runner's
  policies are sampling strategies; a played century is the only sample of what a person does.
- `tests/properties/fuel-tax.test.ts` and `subsidy.test.ts` are the design's load-bearing
  claims. If a change breaks them, the change is wrong, not the test.
- `pnpm coverage` enforces an 80% floor over the pure core. Raise it; never lower it to green a
  build.
- CI gates every push on typecheck → lint → `architecture:check` → coverage → a 200×120
  random-policy batch.
- Two TypeScripts on purpose (ADR-0009): `tsc` is TS 7 via `@typescript/native`; the package
  named `typescript` is the TS 6 API `typescript-eslint` needs. Don't "fix" the alias.

## Commands

| | |
|---|---|
| `pnpm dev` · `pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm coverage` | the ordinary gates |
| `pnpm test:visual` | Playwright at 1280×720 — the only thing that sees layout |
| `pnpm diff-state --moved-only` → `pnpm bless` | the golden review, in that order |
| `pnpm batch -- --runs 1000 --ticks 400 --policy passive --country all` | a baseline; the default is the generated frame around Meridia, not the catalogue |
| `pnpm ranges` | measure a surveyed century for dial faces |
| `pnpm architecture:check` | the in-game atlas still describes this repository |

The `tools/measure-*.ts` studies run as `pnpm <name>` scripts (`package.json`); the ADR that
needed a measurement names its tool.
