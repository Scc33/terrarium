# Terrarium — Technical Architecture

*How the code is actually arranged, as of schema 23. Companion to the design doc
(`proposal-1.md`), which owns the §-numbered design rationale that code comments cite.*

Country recipe and calibration workflow: `docs/country-scenarios.md`.

*This doc describes what exists. Where a decision had live alternatives and lasting
consequences, the reasoning lives in an ADR under `docs/adr/` rather than here — this file
says **what**, the ADRs say **why**.*

---

## 1. Repo Structure

Monorepo (pnpm workspaces). Dependency direction is law and is lint-enforced:

```
ui → observation → engine        (never the reverse)
tests → everything
```

```
terrarium/
├── tsconfig.base.json
├── eslint.config.js              # incl. import-boundary rules (§1.1)
├── vitest.config.ts              # test include + coverage floor over the pure core
│
├── packages/
│   ├── engine/                   # THE SIM. Pure TS. Zero DOM, zero React, zero I/O.
│   │   ├── src/
│   │   │   ├── index.ts          # public API: init, applyActions, step, replay, saves
│   │   │   ├── countries.ts      # curated + deterministic procedural country recipes
│   │   │   ├── constants.ts      # EVERY behavioral constant (ADR-0007)
│   │   │   ├── math.ts, hash.ts  # helpers; hashState for golden replays
│   │   │   ├── state/
│   │   │   │   ├── schema.ts     # all state interfaces + id lists + SCHEMA_VERSION
│   │   │   │   ├── validate.ts   # invariant checks
│   │   │   │   └── init.ts       # country generation; self-calibrating opening budget
│   │   │   ├── pipeline/         # one file per step, in TICK_ORDER (§4)
│   │   │   │   ├── pipeline.ts   # the ordered fold; TICK_ORDER lives here
│   │   │   │   ├── shocks.ts demography.ts technology.ts world.ts finance.ts
│   │   │   │   ├── production.ts trade.ts fiscal.ts monetary.ts prices.ts
│   │   │   │   ├── labor.ts cohorts.ts statistics.ts politics.ts
│   │   │   │   └── derive.ts     # pure read-models over state (no step owns them)
│   │   │   ├── actions/          # Action union + apply/legality
│   │   │   └── rng/rng.ts        # seeded PRNG + substream derivation (§6)
│   │   └── package.json          # no dependencies, by rule
│   │
│   ├── observation/              # PRESENTATION of the prints. Not measurement (ADR-0003).
│   │   ├── src/
│   │   │   ├── observe.ts        # projects TrueState → PublishedState
│   │   │   └── published.ts      # PublishedState types — the ONLY types ui may import
│   │   └── package.json
│   │
│   ├── ui/                       # React app. See the terrarium-design skill for the spec.
│   │   ├── src/
│   │   │   ├── worker/           # the ONLY engine host (ADR-0004)
│   │   │   │   ├── sim.worker.ts # owns TrueState; emits PublishedState only
│   │   │   │   └── protocol.ts   # worker message types — the single shared contract
│   │   │   ├── store/            # zustand game store + IndexedDB persistence
│   │   │   ├── panels/           # header, rail, news wire, ledger, overlays
│   │   │   ├── components/       # gauges, tiles, ink charts, labels
│   │   │   ├── wallPlan.ts       # the height budget (pure, tested)
│   │   │   ├── domains.ts        # FIXED per-indicator dial faces (ADR-0006)
│   │   │   ├── shares.ts         # pie / stacked-band geometry (pure, tested)
│   │   │   ├── maturity.ts       # diegetic per-instrument visual maturity
│   │   │   └── devScenario.ts    # dev-console scenarios (pure, tested) — ADR-0010
│   │   └── package.json
│   │
│   ├── runner/                   # headless batch + long-horizon stability CLIs (Node)
│   │   └── src/                  # run · policies · batch · stability analysis/reporting
│   │
│   ├── fixtures/                 # shared test data
│   │   ├── countries/standard.ts # parameter vectors
│   │   └── scripts/scripts.ts    # named action scripts ("passive", "fuelTaxAtQ8", …)
│   │
│   └── architecture-visualizer/  # dev-only, code-derived engine atlas
│       ├── scripts/analyze.ts    # TS AST scan: modules, imports, exports, TICK_ORDER
│       └── src/                  # pipeline, package-seam, and module explorer views
│
├── tests/
│   ├── unit/                     # pure-function tests (rng, leontief, hash, actions)
│   ├── golden/                   # exact replay tests (§7.1)
│   ├── properties/               # statistical claims across seeds (§7.2)
│   ├── contract/                 # the UI↔engine data boundary (§1.1)
│   └── ui/                       # pure UI modules — NOT rendered components (§7.4)
│
└── tools/
    ├── bless.ts                  # re-bless golden snapshots after intentional changes
    ├── diff-state.ts             # show which variables moved between two states
    ├── golden-cases.ts           # the golden case table
    └── indicator-ranges.ts       # `pnpm ranges` — measures a century for dial faces
```

### 1.1 Boundary enforcement

The dependency direction is enforced at two independent levels, because either alone leaks.

**At the import boundary** (`eslint.config.js`):

- `engine` has **no dependencies**. React, other `@terrarium/*` packages, and `console` are
  banned inside it.
- `Math.random` and `Date.now` are banned **repo-wide** — all randomness comes from the
  seeded RNG (§6), and the sim never reads a wall clock.
- `ui` may not import `engine/src/state/*` at all, and may not import the engine's
  state-running functions (`init` / `step` / `replay` / `applyActions` / `runTick`) outside
  `ui/src/worker/**`. Components may import constants and action/save *types*.
- Even the worker uses the engine's public API, not its state internals.

**At the data boundary** (`tests/contract/published-state.test.ts`): a lint rule stops you
importing a true-state *type*, but not from posting a true-state *value* through a
structurally-compatible channel. The contract test asserts what actually crosses the wire.

If the UI can't name the type of a true value, it can't accidentally render it — and if it
somehow obtains one anyway, the contract test fails.

---

## 2. Core API

The live engine is three functions; country recipes materialize their immutable input:

```ts
export function init(params: CountryParams, seed: Seed, mode?: GameMode): TrueState
export function applyActions(s: TrueState, actions: Action[]): TrueState
export function step(s: TrueState): TrueState          // one quarter
export function createCountryParams(id: CountryScenarioId, seed: Seed): CountryParams
export function generateCountryParams(seed: Seed, options?): CountryParams
```

All pure. A game is:

```ts
let s = init(params, seed, mode)
for (const turn of actionLog) s = step(applyActions(s, turn.actions))
```

The save file is literally `{version, params, seed, mode, actionLog, tick}` — state is *derived*,
never stored (ADR-0001). `mode` is immutable for the run (`standard` or the testing-oriented
`god` mode). `replay(save, untilTick?)` reconstructs any point in the run; pre-v21 saves omit
`mode` and load as `standard` (ADR-0015).

---

## 3. State Schema

One root object. Plain data — no classes, no methods — so it's structured-clone-able across
the worker boundary, hashable, and diffable. `schema.ts` is the authority; this is the shape:

```ts
interface TrueState {
  meta: { schemaVersion; engineVersion; tick: Qtr; seed: Seed; mode: GameMode }
  params: CountryParams        // immutable after init
  demography: DemographyState  // the age pyramid; cohort sizes derive from it
  tech: TechState              // global frontier + domestic attainment; research moves both
  finance: FinanceState        // credit, asset prices, bank capital
  cohorts: Cohort[]            // 5
  sectors: Sector[]            // 5: agri, manuf, energy, services, transport
  io: IOTable                  // Leontief coefficients
  market: MarketState
  gov: GovernmentState         // dials, spending rules, capacities, itemised budget, debt
  external: ExternalState      // partners, world prices, reserves, exchange rate
  politics: PoliticalState
  ledger: FragilityLedger
  stats: StatsOffice           // prints, revision history — the fog's own state
  score: { discountedWelfare; discountWeight }   // §3.3, accumulated as the run happens
}
```

Id lists in `schema.ts` are the single source of truth and are exported as `const` tuples, so
downstream tables typed as total `Record<Id, …>` **fail the build** until a new id is handled:

`SECTOR_IDS` · `COHORT_IDS` · `CAPACITY_IDS` (tax, statistical, administrative, education) ·
`INDICATOR_IDS` · `REVENUE_SOURCE_IDS` · `OUTLAY_IDS` · `SPENDING_PROGRAM_IDS` · `AGE_BANDS` ·
`PARTNER_IDS`

**Schema rules:**

1. Everything derivable is either not stored or explicitly marked cached; `validate.ts`
   recomputes and asserts.
2. Any shape change bumps `SCHEMA_VERSION` **and** gets an entry in `docs/metrics-changelog.md`
   — that file is the engine's inputs/outputs contract over time.
3. Reordering pipeline steps is a schema-version event too (§4), not just a shape change.

### 3.1 PublishedState (what the UI sees)

```ts
interface PublishedState {
  tick: Qtr
  country: string
  mode: GameMode              // exact immutable opening rule
  indicators: Partial<Record<IndicatorId, IndicatorSeries>>  // only FUNDED ones appear
  dials: DialState                 // you always know your own settings
  spendingRules: SpendingRules     // fixed, CPI-indexed, or official-GDP-share
  policy: PolicyPoint[]            // …and what they were every quarter before now
  revenue: RevenueSplit            // the treasury keeps exact books on itself
  outlays: OutlaySplit
  news: NewsItem[]                 // qualitative signals; how the fog stays playable
  reportCard?: ReportCard          // only once the run is over — no mid-run truth leak
}
```

A point in an `IndicatorSeries` is a `StatPrint` — the figure *exactly as released*, carrying
`forQtr`, `publishedAt`, `value`, `revision`, and the error band the office confessed.

---

## 4. Pipeline

Each subsystem is a step. The tick is an ordered fold, and each step gets its own RNG
substream keyed by its own name:

```ts
export function runTick(state: TrueState): TrueState {
  let s = state
  for (const step of TICK_ORDER) s = step.run(s, rngFor(s.meta.seed, step.name, s.meta.tick))
  s = resolveSpendingRules(s) // prepare next quarter from releases now on the desk
  return { ...s, meta: { ...s.meta, tick: s.meta.tick + 1 } }
}
```

`TICK_ORDER` (`pipeline/pipeline.ts`) — the comment on each line names the schema version that
introduced it:

| # | step | what it does |
|---|------|--------------|
| 1 | `shocks` | the crisis clock: ruptures land before anyone works |
| 2 | `demography` | the pyramid ages; cohort sizes are derived from it |
| 3 | `technology` | the frontier advances; attainment chases it; research splits by position |
| 4 | `world` | partner cycles set export demand and world prices |
| 5 | `finance` | credit, asset prices, banking crises — the fragility clock |
| 6 | `production` | output given prices, capital, labor, I/O table |
| 7 | `trade` | books external flows, reserves, exchange rate |
| 8 | `fiscal` | capacity-gated collection; spending with leakage |
| 9 | `monetary` | expectations adapt; printing feeds them |
| 10 | `prices` | tâtonnement with cost anchor |
| 11 | `labor` | employment, wages, capital accumulation |
| 12 | `cohorts` | incomes, savings, approval drifts toward experienced truth |
| 13 | `institutions` | societal power, veto players, and revolutionary pressure |
| 14 | `statistics` | the office measures, publishes, revises — **the fog is made here** |
| 15 | `politics` | PC accrual from PUBLISHED numbers, elections, revolt, and coup |

**Rules:**

- Order is explicit and **versioned** — reordering changes results, so it's a schema-version
  event (ADR-0005).
- Steps communicate only through state. No side channels, no step-to-step calls.
- Recurring spending rules resolve after the fold, preparing the dials the next quarter reads.
  CPI rules consume new first-release `inflation` prints once; GDP-share rules consume the latest
  published nominal level carried by `gdp_growth`. Neither reads the hidden live denominator, and
  this preparation does not add or reorder a pipeline step.
- `statistics` runs *before* `politics` on purpose: politics reads the published headline, not
  the truth (§3.4). That ordering is the whole point of ADR-0003.
- Adding a feature = adding a step (or a field a step reads), not edits scattered across five
  files.
- Immutability: return a new state, never mutate the input.

Technology is deliberately a gap rather than a tree (ADR-0012). The historical world frontier
advances without player input. `spending.research` becomes effective only after administrative
delivery and skilled staffing, then accumulates into a decaying research stock rather than
becoming technique the same quarter (ADR-0013) — so a programme coasts through a bad budget year
and takes years to strangle. Behind the frontier it raises the existing catch-up rate; near it
the same budget funds original work, which lands as a stochastic breakthrough rather than a drip,
and which the incumbents can veto exactly as they veto absorption (§4.3). The split is derived
per sector, so one economy can imitate in the fields and invent in the machine shops.

The player sees two fogged instruments and never the frontier, sector attainment, or TFP:
`technology_attainment` (the ratio — are we catching up?) and `productivity` (the level — output
per worker against our own 1946). Two are needed because the ratio saturates: research pushes the
frontier it is measured against, so the better the programme the quieter its own dial goes.

Finance has three player inputs that meet in its existing balance sheets (ADR-0017). The policy
rate prices overnight money; the QE purchase pace lowers the common private funding rate without
being booked as fiscal printing; and the capital requirement changes the bank-equity ceiling on
credit. Their inherited settings (4%, zero, and 6%) preserve the passive economy. QE remains
available at the zero-rate floor but can inflate the same credit/asset pair that raises crisis
risk, while a tighter capital floor leans directly against that leverage.

---

## 5. Actions

```ts
type Action =
  | { kind: 'setDial'; path: DialPath; value: number }              // Layer 1
  | { kind: 'setSpendingRule'; programme; mode; value }             // Layer 1
  | { kind: 'investCapacity'; target: CapacityId; amount: Money }   // Layer 2

interface TurnActions { tick: Qtr; actions: Action[] }
type ActionLog = TurnActions[]
```

`applyAction` validates legality (PC affordability, dial bounds) and **rejects loudly**
(`IllegalActionError`) — an illegal action in a replay means a bug or a version mismatch,
never a silent skip.

`setSpendingRule` modes are `fixed` (nominal money/quarter), `indexed` (the current amount moves
once per new first-release official CPI print), and `gdpShare` (0..1 of the latest officially
published nominal GDP). Legacy `setDial` spending actions remain valid and mean `fixed`, so old
action logs replay without migration.

---

## 6. RNG Discipline

The single biggest determinism footgun. Rules:

- One root seed. Every consumer derives a **named substream**: `rngFor(seed, stepName, tick)`.
- A step's draws are therefore isolated: adding a new step, or a draw inside an existing one,
  never shifts another step's sequence — golden tests for untouched systems keep passing.
- The fog draws from its own `obs:*` substream family, orthogonal to the economic RNG, so
  measurement noise is reproducible without perturbing the economy (ADR-0002).
- `Math.random` and `Date.now` are lint-banned repo-wide.

---

## 7. Test Layout

### 7.1 Golden replays (`tests/golden/`)

Case table in `tools/golden-cases.ts`; snapshots are state hashes plus key series. Runs in
milliseconds. `pnpm diff-state` shows exactly which variables moved and by how much, then
`pnpm bless` regenerates. **The diff review *is* the economics review** (ADR-0008).

### 7.2 Property suites (`tests/properties/`)

Statistical claims over many seeds. `fuel-tax.test.ts` and `subsidy.test.ts` are the M1
exit criteria — the design's load-bearing claims. *If a change breaks them, the change is
wrong, not the test.* Standing invariants: no NaN/Infinity, prices within per-tick caps,
budget identity holds, replay determinism (run twice, hash-compare).

`future-stability.test.ts` is the long-horizon balance gate. It runs passive and
capacity-building governments through 2050 across every country recipe, truncates each
balance trajectory at deposition, and pins post-2000 inflation, real-growth, unemployment,
first-release wall prints, drought-response tails, survivor trend growth, and the number of
governments reaching 2050. Raw post-deposition failures remain visible to engine diagnostics,
but cannot be mislabeled as gameplay.

The same definitions power `pnpm stability`: four fixed eras, p01/p50/p99 quarterly tails,
and shock-conditioned peaks and reversals for droughts, fuel ruptures, banking crises, and
foreign-partner crises.
It also reports “quiet” true and wall tails after excluding each shock onset and the following
eight quarters. Those tails separate background late-economy instability from a transient
event response; a shock retune must improve the latter without worsening the former. Runner-only
driver rows decompose quiet GDP into output-per-worker and employment contributions beside TFP,
labor force, utilization, real wages, demand satisfaction, and final-demand components. The
population identity additionally splits aggregate growth into per-capita and population growth,
then per-capita growth into productivity, employment-rate, and labor-force-share contributions.
These diagnostics consume true state in the headless runner and never enter `PublishedState`.
Use `--policy passive|developmental|random|all` and `--country baseline|all|<recipe>` to narrow
a sweep. The opening comparison starts in 1956 because exact goldens own the first decade's
initialization convergence.

### 7.3 Contract (`tests/contract/`)

`published-state.test.ts` guards the data boundary described in §1.1.

### 7.3.1 Build output (`tests/ui/dev-build-strip.test.ts`)

Builds the app for production and greps the bundle for the dev console. The only test that
asserts on build output, because it is the only claim that is about the bundler (ADR-0010).

### 7.4 UI (`tests/ui/`)

Tests **pure modules, not rendered components**. jsdom has no layout engine, so a render test
passes happily while the wall clips every figure it publishes. What is covered:
`wall-plan` (the height budget against 1280×720), `gauge-domains` (re-measures a surveyed
century and rejects a face an instrument spends >2% of its life pegged against),
`revision-stamp` (the fog still bites, and doesn't bite everywhere), `shares` (chart geometry).

Layout itself is verified **in a browser at 1280×720** — see CLAUDE.md for the check. There is
no Playwright suite; that was planned in v0.1 and never built.

### 7.5 Coverage

`pnpm coverage` enforces an **80% floor** over the pure core (`engine` + `observation`) —
currently ~99% statements. It is a floor to prevent regression; raise it, never lower it to
green a build. The UI is deliberately excluded: it's verified in the browser, not here.

---

## 8. Persistence (no backend)

- **Saves:** `{version: {engine, schema}, params, seed, actionLog, tick}` in IndexedDB. A few
  KB per save regardless of run length, because state is derived (ADR-0001).
- **Autosave** = append the turn's actions to the open save every tick. Crash recovery is free
  replay.
- **Export/import** as a JSON blob — doubles as the bug-report format: a report is a save file
  plus "look at Q83."
- Replay cost is negligible (~7ms for a 60-quarter run), so no state snapshots are needed.

---

## 9. Build & Tooling

- **pnpm** workspaces, **Vite** for the UI, **Vitest** everywhere, packages consumed directly
  as TS source via path aliases (no per-package build step).
- **TypeScript 7** (the native Go compiler) does the typechecking. `typescript-eslint` has no
  TS 7 support yet and hard-errors on it, so it gets the TS 6 API side-by-side: `typescript`
  is aliased to `@typescript/typescript6` and TS 7 rides as `@typescript/native` — which is
  what provides `tsc`. See ADR-0009; revisit when typescript-eslint ships TS 7 support.
- Worker built as a module worker via Vite (`worker.format: 'es'`); `protocol.ts` is the
  single shared contract.
- **`__DEV_TOOLS__`** (defined in `vite.config.ts` from the vite command) gates anything that
  must never reach a player — currently the dev console. Do **not** use `import.meta.env.DEV`
  for this: it derives from ambient `NODE_ENV`, so `NODE_ENV=test pnpm build` produces a
  bundle with the dev code still in it. See ADR-0010.
- **CI order:** typecheck → lint → coverage → a 200×120 random-policy batch (no NaN, no price
  explosions). Node 24.

### 9.1 Commands

| command | what it does |
|---------|--------------|
| `pnpm dev` | the UI dev server |
| `pnpm test` | the whole suite |
| `pnpm coverage` | suite + the 80% floor over the pure core |
| `pnpm diff-state` | what moved between two states — read before blessing |
| `pnpm bless` | re-bless golden snapshots after an intentional change |
| `pnpm ranges` | measure a surveyed century; the input to dial faces |
| `pnpm stability -- --runs 120 --policy all --country all` | player-reachable macro tails through 2050 |
| `pnpm export-feedback -- --runs 40 --openness all` | paired foreign-demand and household-feedback counterfactuals |
| `pnpm architecture` | scan the source and open the engine atlas on localhost:4174 |
| `pnpm architecture:build` | regenerate and production-build the engine atlas |
| `pnpm batch -- --runs 1000 --ticks 120 --policy random` | balance sweep |

---

## 10. Where the design lives

- `proposal-1.md` — the working design doc. **Its § numbers are cited from ~65 code comments**
  (`§3.4` political capital, `§8` demographics, `§9` technology, `§10` the world, `§12`
  fragility). Renumbering it orphans them.
- `metrics-changelog.md` — the engine's inputs/outputs contract, updated on every
  `SCHEMA_VERSION` bump.
- `docs/adr/` — architectural decisions with their alternatives and consequences.
- `docs/investigations/` — open questions about the model, with the measurements that raised
  them. Evidence, not decisions.
- `docs/archive/` — superseded documents, kept for provenance. Not maintained.
- `CLAUDE.md` — the operating manual: hard rules, workflows, and the hard-won tuning lessons.
- The `terrarium-design` skill — the spec for all `packages/ui` work.
