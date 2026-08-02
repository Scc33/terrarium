# Terrarium — working notes

Economic policy game. Read `docs/tech-architecture.md` before touching structure.
pnpm monorepo; built through M6.

The **economy** and the **politics** are separate machines meeting in two places: `institutions`
reads the economy to decide who has power, and the veto players price every action in
`actions/apply.ts`. Keep that seam narrow. The passive century baseline is an economy fact —
if a politics change moves it, the seam has leaked (`pnpm batch --policy passive` is the check).

Docs: `tech-architecture.md` is **what** the code is; `docs/adr/` is **why** (each decision
with the alternatives it beat and the costs it carries); `proposal-1.md` is the design doc
whose § numbers ~65 code comments cite — don't renumber it. `docs/archive/` is unmaintained.

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
- **`ui/src/components/WallTile.tsx`** — **every wall tile goes through it.** A tile fills its
  slot and clips; it never sizes to its content. It owns `overflow-hidden`, `minmax(0,1fr)`
  rows and `min-h-0` on the body.
- **`ui/src/shares.ts`** — pie and stacked-band geometry, pinned by `tests/ui/shares.test.ts`.
  `InkPie` / `InkStack` paint what it returns and know nothing about budgets: reuse them
  rather than hand-rolling a chart. Pure for the usual reason — a wedge that emits `NaN` into
  its path draws nothing, which in review is indistinguishable from a category with no money
  in it. `SHARE_INKS` stops at six, the widest split the books have; bucket a tail into
  "other" rather than extend the ramp. The label/ink tables in `panels/LedgerOverlay.tsx` are
  total `Record`s over the engine's id lists, so a new tax or spending line fails the build
  until it has been named and given an ink.

Layout bugs here are invisible in review AND in jsdom — a `flex-col` child missing `min-h-0`,
an `h-full` SVG in an auto-height parent falling back to its viewBox ratio, a grid band with
implicit `auto` rows — so the browser check below is not optional. Also: Tailwind scans source
*text*, so a template-literal class (`grid-rows-[${rows}]`) exists in the DOM and in no
stylesheet, failing silently. Spell variants out as literals.

## Workflows

- Engine change → `pnpm test` breaks golden replays → `pnpm diff-state` and review what moved
  (that review IS the economics review) → `pnpm bless` if intentional.
- On a `SCHEMA_VERSION` bump, add an entry to `docs/metrics-changelog.md` (the engine's
  inputs/outputs contract — new indicators + their `fundedAt`, new levers/params,
  pipeline-order changes).
- Balance work → `pnpm batch -- --runs 1000 --ticks 120 --policy random` (and
  `--policy passive --ticks 400`). Healthy passive baseline: growth ≈ 2.5%/yr, inflation ≈ 0,
  u ≈ 12.4% century mean (the elevated u is the DESIGNED §8 youth-bulge bomb an unschooled
  do-nothing government earns; funding education absorbs it to ~7% and lifts growth past 3%),
  ~7% deposed by 400q. Random policy 120q: ~30% deposed (M6's coups on top of the pre-M6 ~24%),
  no NaN, no price explosions. M6 deliberately left the PASSIVE baseline untouched.
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

Steps 3–4 are compile-enforced (both tables are total `Record<IndicatorId, …>`).

1. `engine`: add to `INDICATOR_IDS` + a spec in `pipeline/statistics.ts` (with its `fundedAt`
   capacity gate). Schema-version event → `metrics-changelog.md`.
2. `observation`: a `PRESENTATION` entry (label + unit).
3. `ui/src/components/labels.ts`: a `NAMES` entry — four names. Keep `short` to 10 characters
   or the rack truncates it.
4. `ui/src/domains.ts`: an `INDICATOR_FACE` entry. Run **`pnpm ranges`** and take a face
   covering roughly p01–p99, rounded outward; let the extremes peg.
5. `pnpm test` — `wall-plan` fails if the wall is out of room, `gauge-domains` re-measures a
   surveyed century and rejects a face an instrument spends >2% of its life pegged against,
   `revision-stamp` fails if the fog stopped biting or started biting everywhere.
6. Verify in the browser at 1280×720 (below) — none of the above sees layout.

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

`tests/ui/` tests pure modules, not rendered components: jsdom has no layout engine, so a
render test passes happily while the wall clips every figure it publishes. After any wall
change, run the dev server, size to 1280×720, and confirm both values are `false` / `0`:

```js
(()=>{const w=document.querySelector('main > div'),b=w.getBoundingClientRect();let n=0;
w.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();if(r.bottom>b.bottom+1&&r.height>0)n++});
return {scrolls:w.scrollHeight>b.height+1, belowFold:n}})()
```

### Adding an institution or a bloc

Both id lists are total `Record`s across engine, observation and UI, so the build walks you
through most of it. What is NOT compile-enforced, and what M6 got wrong first time:

1. `INSTITUTION_IDS` / `BLOC_IDS` in `state/schema.ts`; a stance row in **both** tables in
   `actions/apply.ts` (`DIAL_STANCE` for levers, `REFORM_STANCE` for reforms).
2. A bloc's POWER is derived from the economy in `pipeline/institutions.ts` — never a constant —
   and needs a `BLOC_FAVOR_BASE` entry **measured** so the 1946 settlement reads neutral.
3. A bloc needs exactly one economic channel for its hostility, through machinery that already
   exists (a risk premium, an investment factor, a wage move). A bloc that only taxes PC is
   set dressing.
4. `ui/src/components/labels.ts`: `BLOC_NAMES` + `BLOC_NOTES`, or `INSTITUTION_NAMES`. A new
   cabinet group also needs `CABINET_GROUPS` in `cabinetNavigation.ts`.
5. Re-measure. `tests/properties/institutions.test.ts` pins the claims; check the passive
   baseline did not move.

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
