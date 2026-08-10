# Terrarium — working notes

Economic policy game. Read `docs/tech-architecture.md` before touching structure.
pnpm monorepo; built through M6.

The **economy** and the **politics** are separate machines meeting in two places: `institutions`
reads the economy to decide who has power, and the veto players price every action in
`actions/apply.ts`. Keep that seam narrow. The passive century baseline is an economy fact —
if a politics change moves it, the seam has leaked (`pnpm batch --policy passive` is the check).

Docs: `tech-architecture.md` is **what** the code is; `docs/adr/` is **why** (each decision
with the alternatives it beat and the costs it carries); `docs/investigations/` is **what we
measured and don't yet believe** (open questions with evidence attached — read before
re-deriving one); `proposal-1.md` is the design doc whose § numbers ~65 code comments cite —
don't renumber it. `docs/archive/` is unmaintained.

## Skills

Procedures live in `.agents/skills/`, symlinked to `.claude/skills` and `.codex/skills` so
Claude Code and Codex share one copy. Both auto-load them by `description`; **read the skill
before starting one of these tasks** rather than working from this file's summary.

| Skill | For |
|---|---|
| `add-indicator` | a new published metric, or a dial face that has drifted |
| `economics-review` | any engine change: reading the state diff, the baselines, `pnpm bless` |
| `add-bloc-or-institution` | the politics layer — power, favour, veto pricing |
| `terrarium-ui` | anything in `packages/ui` — tokens, the wall, charts, layout contracts |
| `verify-the-wall` | proving a UI change fits, in a real browser at 1280×720 |
| `document-a-decision` | choosing between an ADR, an investigation, and a tuning lesson |

## Hard rules (mostly lint-enforced, but know why)

- `packages/engine` is pure: no DOM, no React, no other workspace packages, no `Math.random`
  or `Date.now`. All randomness via `rngFor(seed, stepName, tick)` substreams.
- `packages/ui` may import types from `@terrarium/observation`, and constants / action & save
  *types* from `@terrarium/engine`, but never `engine/src/state/*`, and never the engine's
  state-running functions (`init`/`step`/`replay`/`applyActions`/`runTick`) outside
  `ui/src/worker/**` — only the worker runs the engine; components see `PublishedState`.
  Enforced at the import boundary (lint) and the data boundary
  (`tests/contract/published-state.test.ts`).
- Pipeline step order in `engine/src/pipeline/pipeline.ts` is versioned; reordering is a
  schema-version event.
- The fog is MADE in the engine (`pipeline/statistics.ts`: prints, revisions, rumor news, via
  `obs:*` substreams orthogonal to the economic RNG) because politics reads the published
  headline, not the truth (§3.4). `packages/observation` is presentation-only — never grow
  measurement logic back into it.
- Every behavioral constant lives in `engine/src/constants.ts` — tune there, nowhere else.

## UI

All `packages/ui` work follows the local visual language: diegetic per-instrument maturity,
`dossier-*` / `terminal-*` tokens, the quieter `map-*` / `wire-*` register, and a
single-screen war room with no page scroll at desktop sizes.

The wall is **board + rack + docked**: up to `BOARD_SLOTS` pinned instruments at full size,
then every instrument as a fixed-height strip, then ledger and corridor. Pins are a
`localStorage` view preference, not part of the save. Pure modules own the decisions so they
can be tested — anything pushed into a component becomes untestable:

- **`ui/src/wallPlan.ts`** — the height budget; the wall's minimum height is a NUMBER, pinned
  against 1280×720 by `tests/ui/wall-plan.test.ts`. `rackHeadroom()` says how many more
  indicators fit; at zero the wall needs a real layout decision.
- **`ui/src/domains.ts`** — FIXED per-indicator dial faces, measured with `pnpm ranges`, never
  derived from the trailing window (a face redrawn under its own needle makes needle position
  meaningless). Off-scale pegs at the rail with a chevron — going off the dial is information.
  Only `capital_stock` ratchets, monotonically.
- **`ui/src/components/WallTile/WallTile.tsx`** — **every wall tile goes through it.** A tile
  fills its slot and clips; it never sizes to its content. It owns `overflow-hidden`,
  `minmax(0,1fr)` rows and `min-h-0` on the body. Its module comment lists the four ways this
  breaks, all of which shipped at least once.
- **`ui/src/shares.ts`** — pie and stacked-band geometry, pinned by `tests/ui/shares.test.ts`.
  `DonutChart` / `StackedAreaChart` (in `components/ui`) paint what it returns and know nothing
  about budgets: reuse them rather than hand-rolling a chart. Pure for the usual reason — a
  wedge that emits `NaN` into its path draws nothing, which in review is indistinguishable from
  a category with no money in it. `SHARE_INKS` stops at six, the widest split the books have;
  bucket a tail into "other" rather than extend the ramp. The label/ink tables in
  `panels/LedgerOverlay.tsx` are total `Record`s over the engine's id lists, so a new tax or
  spending line fails the build until it has been named and given an ink.

Import shared primitives from `components/ui`, never by reaching into a folder.

Layout bugs here are invisible in review AND in jsdom, and Tailwind scans source *text* — so a
template-literal class (`grid-rows-[${rows}]`) exists in the DOM and in no stylesheet, failing
silently. Spell variants out as literals. **`terrarium-ui` skill** has the full contract;
**`verify-the-wall` skill** is how you prove it, and it is not optional.

## Workflows

- Engine change or balance work → **`economics-review` skill**. `pnpm bless` overwrites the
  goldens with whatever the engine now produces and cannot tell an improvement from a broken
  economy, so the diff review IS the economics review (ADR-0008). The skill carries the passive
  and random-policy baselines; keep them there rather than copying them back here.
- On a `SCHEMA_VERSION` bump, add an entry to `docs/metrics-changelog.md` (the engine's
  inputs/outputs contract — new indicators + their `fundedAt`, new levers/params,
  pipeline-order changes).
- The M1 exit-criteria tests (`tests/properties/fuel-tax.test.ts`, `subsidy.test.ts`) are the
  design's load-bearing claims. If a change breaks them, the change is wrong, not the test.
- `pnpm coverage` enforces an 80% floor over the pure core (currently ~99% stmts / ~90%
  branch). It's a floor to prevent regression — raise it, never lower it to green a build.
- CI gates every push/PR on typecheck → lint → coverage → a 200×120 random-policy batch.
- **Two TypeScripts on purpose** (ADR-0009): `tsc` is TS 7 (native, ~7× faster) via the
  `@typescript/native` alias, while the dependency literally named `typescript` is the TS 6
  API that `typescript-eslint` needs — it throws on TS 7 rather than degrading. Don't
  "fix" the alias; collapse it when typescript-eslint ships TS 7 support.

### Adding an indicator

→ **`add-indicator` skill.** Six tables must agree; five are total `Record`s the compiler
checks, but `INDICATOR_SPECS` is an **array**, so a missing spec compiles clean and the
instrument simply never publishes.

### The dev console (ADR-0010)

Backtick opens it in `pnpm dev`. Two tabs:

- **SCENARIO** — seed, year, development, population scale, openness, starting capacities →
  runs a real game to that year. Reaching 1975 with a well-surveyed country is one submission
  instead of 116 clicks. Raise `statistical` to fit every instrument at once. There is no
  "set GDP": state is derived from (params, seed, log), so you specify a country and let it
  live. The logic is pure in `ui/src/devScenario.ts` — tested, not in the component.
- **TRUTH** — what the fog is hiding, beside what the wall published. Arrives as an anonymous
  tree (`DevNode`), so the UI still cannot *name* a true-state field.

Gate anything that must never ship on **`__DEV_TOOLS__`**, never `import.meta.env.DEV` — the
latter derives from ambient `NODE_ENV`, so `NODE_ENV=test pnpm build` ships the true-state
serializer, and `--mode production` does not save you. `tests/ui/dev-build-strip.test.ts`
builds the bundle and greps it; if that test goes, the guarantee goes with it.

### Verifying the wall

→ **`verify-the-wall` skill.** `tests/ui/` tests pure modules, not rendered components: jsdom
has no layout engine, so a render test passes happily while the wall clips every figure it
publishes. The dev server at 1280×720 is the only thing that sees layout.

### Adding an institution or a bloc

→ **`add-bloc-or-institution` skill.** The id lists are total `Record`s and the build walks you
through most of it — but `Stance` is a **`Partial`** over `BlocId`, so a new bloc compiles
perfectly with no opinion about anything in the game. That is what M6 got wrong first time.

## Hard-won tuning lessons (violate at your peril)

- Unit costs in the price step are computed at NORMAL_UTILIZATION, not realized output —
  otherwise demand dips mechanically raise unit cost and spiral (stagflation death loop).
- Wages need all three legs: Phillips slack anchor (else drift to 50% unemployment),
  productivity passthrough near full employment (else permanent deflation), downward
  stickiness (else 1870s-depth busts).
- Households spend against EMA "habitual" income (the same EMA approval judges against) —
  permanent-income smoothing is the main cycle damper. The wage/employment gains were lowered
  until the business cycle stopped resonating with the 16-quarter election period.
- Bond coupons are household income; redemptions go to household savings. Money paid to
  bondholders must not vanish, or every tax rise becomes an austerity bomb.
- Growth needs both valves: Lewis investment (`INVESTMENT_SLACK_GAIN`) and the subsistence
  valve (`SUBSISTENCE_ABSORPTION_Q`, capped by the rural labor force — uncapped it recreates
  the Malthusian trap). Vital rates read the income LEVEL (`LIVING_STANDARD_1946`), the report
  card reads income vs your own 1946 — don't conflate the two anchors.
- Init self-calibrates spending to the tax base (`init.ts`) — an unbalanced opening budget
  compounds into a scripted depression.
- Finance is a loop that WANTS to ratchet (assets↑ → collateral↑ → credit↑ → assets↑). Two
  rules keep it a cycle: `ASSET_REVERT` must out-muscle the collateral/spirits feedback at the
  margin (else a passive economy spontaneously bubbles), and the passive-calm vs active-boom
  separation is carried by the real-rate channel (`ASSET_FUND_RATE_GAIN` / `CREDIT_RATE_GAIN`)
  — only a policy rate cut or a genuine profit surge inflates a bubble. The crisis a player
  gets is the one their own cheap money earned. The bank-capital cap is deliberately SLACK in
  booms and bites only after a crisis writes capital down — that IS the forced deleveraging.
- **Political responses are reference-dependent, and it is load-bearing.** Cohort approval
  judges income against an EMA of itself; bloc favour judges policy against the 1946 settlement
  (`BLOC_FAVOR_BASE`); unrest judges hardship against experienced conditions. Each was a *bug
  fix*: absolute thresholds made a do-nothing government inherit a capital strike, and pinned
  unrest so flat that reform windows and revolts were both unreachable. Centre any new
  political response the same way and **measure the resting value** before picking the constant.
- **A mechanic you cannot reach is not a mechanic.** Before shipping a threshold, measure the
  distribution of the thing it gates under passive, random AND deliberately bad play. Two M6
  mechanics were dead on arrival at plausible-looking numbers. Unrest also has to read the
  hardship households *experienced* (cohort approval already aggregates it) — rebuilt from
  unemployment it was wrong-signed, because the subsistence valve keeps the impoverished
  nominally employed.
- **Suppression must cost something the boot cannot pay.** Repression damps grievance
  *multiplicatively* (never to zero) and corridor strain is added *outside* that damping.
  Subtract it linearly and the extractive path becomes strictly dominant.
- **Bloc power is DERIVED, never authored** — that is what makes "a crisis is a political
  opening" fall out for free. What is authored is only what each bloc *wants*: a preference,
  the same primitive as a consumption weight. And blocs make levers expensive, never
  impossible — a hard veto would silently break the M1 exit-criteria scripts.
- **`politicalCostOfAction` is the single source of truth for what an order costs.** Quote and
  charge must never be computed twice; `observe.ts` publishes reform prices straight from it.
- **`pnpm diff-state --moved-only` on any schema-adding change.** New fields sort as infinite
  relative change and bury the economics review the bless workflow depends on.
- **A warning that never turns off is not a warning.** The REVISED stamp once fired on ~67% of
  instrument-quarters. It now needs two gates (~10%): wrong by more than twice the band
  confessed ON THE FIRST PRINT, *and* far enough to visibly move the needle (6% of the dial).
  Judging against the *current* band cannot work — a final print admits no error, so every
  later correction divides by zero.
- Player-facing constants get calibrated, not guessed, and pinned as a rate against a measured
  century (`pnpm ranges`, the sweep in `tests/ui/revision-stamp.test.ts`). The tests re-measure
  rather than snapshot, so a retune that pushes an instrument off its dial fails by name.
- **`gauge-domains` catches a face that is too NARROW, never one that is too wide.** It fails on
  pegging, and a needle parked against the left rail without crossing it is not pegged — which is
  how `government_demand_share` shipped a 0–20 face for a series that lived at 1–3 %. Read the
  `pnpm ranges` percentiles when you add a face; a passing test is not evidence the dial is
  legible.
- **A ratio to a moving target saturates, and a saturated dial is a silent one.**
  `technology_attainment` is attainment ÷ frontier, and research pushes the frontier — so the
  better the programme, the harder its own dial is to move. Measured: a maximum research
  programme moves it ten points in its first decade and four in the eighty years after, while
  output per worker triples. That is why `productivity` exists beside it. When an indicator
  divides by something the player can change, check it still moves at the top of the range.
- **An aggregate index can fall while every component of it rises.** `technologyAttainment` is
  output-weighted, and growth shifts output toward services — the sector Baumol keeps furthest
  from its frontier. So funding research can lower the index it is supposed to raise. Assert
  policy claims per sector; the composition effect belongs to the measure, not the policy.
- **Preserve the expectation when you make a mechanic stochastic.** Breakthroughs are a hazard
  process whose `hazard × size` equals the deterministic term they replaced, so the calibrated
  century survives and only any single century became a gamble. The corollary is a test
  discipline: a claim about a lumpy mechanic has to be asserted over seeds, never one run.
- **Research is a stock, and that is what makes a research programme political.** Money enters
  `tech.researchStock` and decays; gains read the stock, not the cheque. A steady programme is
  arithmetically identical to the old flow model — only the transients moved — which is how a
  behavioural change ships without a recalibration.
- **Give components of one identity RELATIVE noise, not one absolute band.** The expenditure
  shares span two orders of magnitude (consumption ~78 %, government <1 %), so a band honest
  about the big one prints the small ones negative — and a share below zero cannot be drawn as a
  wedge at all (`donutSlices` drops it). See `docs/investigations/0002`.
