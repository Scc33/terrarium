# Terrarium — Technical Architecture

*How the code is actually arranged, as of schema 31. The short player-facing design is in
`game-description.md`; accepted structural rationale lives in `docs/adr/`.*

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
│   │   │   │   ├── foreignInvestment.ts production.ts trade.ts fiscal.ts
│   │   │   │   ├── monetary.ts prices.ts
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
│   ├── ui/                       # React app. See the terrarium-ui skill for the spec.
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
export function init(params: CountryParams, seed: Seed, rules?: GameMode | Partial<GameRules>, appointedAt?: Qtr): TrueState
export function applyActions(s: TrueState, actions: Action[]): TrueState
export function step(s: TrueState): TrueState          // one quarter
export function createCountryParams(id: CountryScenarioId, seed: Seed): CountryParams
export function generateCountryParams(seed: Seed, options?): CountryParams
export function runInterregnum(params, seed, rules, appointedAt): { state, actionLog }
```

All pure. A game is:

```ts
let s = init(params, seed, rules, appointedAt)
for (const turn of actionLog) s = step(applyActions(s, turn.actions))
```

The save file is literally `{version, params, seed, rules, appointedAt, actionLog, tick}` — state
is *derived*, never stored (ADR-0001). `rules` and `appointedAt` are immutable for the run, and
both are replay inputs for the same reason: the same country, seed and log produce a different
century without them. `replay(save, untilTick?)` reconstructs any point in the run; pre-v27 saves
carry a `mode` scalar instead of `rules` (ADR-0015/0020) and pre-v28 saves omit `appointedAt`,
which means 1946 (ADR-0021).

`runInterregnum` is the fourth function, and it is only `init` plus that loop: on a later
appointment a caretaker administration governs the quarters before the player arrives, and it
returns both the state handed over and the orders that produced it, which the save then carries
in its own `actionLog`.

---

## 3. State Schema

One root object. Plain data — no classes, no methods — so it's structured-clone-able across
the worker boundary, hashable, and diffable. `schema.ts` is the authority; this is the shape:

```ts
interface TrueState {
  meta: { schemaVersion; engineVersion; tick: Qtr; seed: Seed; rules: GameRules; appointedAt: Qtr }
  params: CountryParams        // immutable after init
  demography: DemographyState  // age pyramid + slow workforce-skills stock
  tech: TechState              // global frontier + domestic attainment; research moves both
  finance: FinanceState        // credit, asset prices, bank capital
  cohorts: Cohort[]            // 5
  sectors: Sector[]            // 5: agri, manuf, energy, services, transport
  io: IOTable                  // Leontief coefficients
  market: MarketState
  gov: GovernmentState         // dials, migration ceiling, spending rules, capacities, books
  external: ExternalState      // partners, prices, reserves, FX, foreign-owned capital
  politics: PoliticalState
  ledger: FragilityLedger
  stats: StatsOffice           // prints, revision history, industrial census — the fog's own state
  score: { discountedWelfare; discountWeight }   // accumulated as the run happens
}
```

Id lists in `schema.ts` are the single source of truth and are exported as `const` tuples, so
downstream tables typed as total `Record<Id, …>` **fail the build** until a new id is handled:

`SECTOR_IDS` · `COHORT_IDS` · `CAPACITY_IDS` (tax, statistical, administrative, education) ·
`INDICATOR_IDS` · `INDUSTRY_TABLE_IDS` · `REVENUE_SOURCE_IDS` · `OUTLAY_IDS` ·
`SPENDING_PROGRAM_IDS` · `AGE_BANDS` · `PARTNER_IDS`

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
  appointedAt: Qtr            // the quarter the player took office (0 = the 1946 posting)
  country: string
  rules: GameRules            // exact immutable safeties chosen at the posting
  indicators: Partial<Record<IndicatorId, IndicatorSeries>>  // only FUNDED ones appear,
                                   // unless rules.fullInstrumentation fits them all
  industry: IndustryPoint[]        // the industrial census: value added and employment by
                                   // sector, fogged. A VECTOR release, not an indicator (§3.2)
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

### 3.2 Not every fogged output is an indicator

`industry` is the exception, and the shape is reusable. The industrial census publishes a
**vector** — two tables (`INDUSTRY_TABLE_IDS`: `valueAdded`, `employment`) over `SECTOR_IDS` —
on the office's ordinary clock: the same funding gate (`INDUSTRY_CENSUS_FUNDED_AT`), the same
capacity-dependent lag, the same three revisions, the same `noiseScale`. What it does not have
is a dial face, because it could not have an honest one: five sectors × two tables is ten
instruments against the wall's remaining headroom, and a fixed face (ADR-0006) cannot serve
countries that open anywhere between 5% and 60% agricultural.

Two properties follow and both are load-bearing:

- **Each figure is drawn independently**, with noise *relative* to it, so the published parts do
  not sum to the published GDP — the same confession the expenditure accounts make. The
  worksheet behind them does sum exactly: `sectorValueAdded` is `output × (1 − Σᵢ coeff[i][j])`,
  the arithmetic `production` already runs for the headline, at **base** prices.
- **One band per table**, because the two are surveyed to different accuracy. `errorBand` is a
  `Record<IndustryTableId, number>` read from the same constant that draws the noise, in the same
  loop iteration, so the quote and the wobble cannot become two accounts of the same survey.

Reach for this shape when what you want to publish is a *composition* rather than a number.

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
| 2 | `demography` | births, deaths and migration move the pyramid; cohort sizes and workforce skills derive from it |
| 3 | `technology` | the frontier advances; attainment chases it; research splits by position |
| 4 | `world` | partner cycles set export demand and world prices |
| 5 | `finance` | credit, asset prices, banking crises — the fragility clock |
| 6 | `foreignInvestment` | attracts inward productive capital; prices foreign ownership |
| 7 | `production` | output given prices, capital, labor, I/O table |
| 8 | `trade` | books trade, FDI, remittances, reserves, and exchange rate |
| 9 | `fiscal` | capacity-gated collection; spending with leakage |
| 10 | `monetary` | expectations adapt; printing feeds them |
| 11 | `prices` | tâtonnement with cost anchor |
| 12 | `labor` | employment, wages, capital and foreign-owned stock accumulation |
| 13 | `cohorts` | domestic incomes, savings, approval drifts toward experienced truth |
| 14 | `institutions` | societal power, veto players, and revolutionary pressure |
| 15 | `statistics` | the office measures, publishes, revises — **the fog is made here** |
| 16 | `politics` | PC accrual from PUBLISHED numbers, elections, revolt, and coup |

**Rules:**

- Order is explicit and **versioned** — reordering changes results, so it's a schema-version
  event (ADR-0005).
- Steps communicate only through state. No side channels, no step-to-step calls.
- Recurring spending rules resolve after the fold, preparing the dials the next quarter reads.
  CPI rules consume new first-release `inflation` prints once; GDP-share rules consume the latest
  published nominal level carried by `gdp_growth`. Neither reads the hidden live denominator, and
  this preparation does not add or reorder a pipeline step.
- `statistics` runs *before* `politics` on purpose: politics reads the published headline, not
  the truth. That ordering is the whole point of ADR-0003.
- Adding a feature = adding a step (or a field a step reads), not edits scattered across five
  files.
- Immutability: return a new state, never mutate the input.

Migration is a relative outside-option flow (ADR-0022), not an authored population target.
Domestic mean log consumption progress is compared with a frontier-linked alternative and the
current labor-market gap. `immigrationLimit` clips attractive-country arrivals as an annual share
of population; it never clips emigration. The realized flow moves young-adult age bands, is
published through the statistical fog as `net_migration`, and later in the same tick changes bloc
favor and high-inflow unrest in `institutions`.

Technology is deliberately a gap rather than a tree (ADR-0012). The historical world frontier
advances without player input. `spending.research` becomes effective only after administrative
delivery and skilled staffing, then accumulates into a decaying research stock rather than
becoming technique the same quarter (ADR-0013) — so a programme coasts through a bad budget year
and takes years to strangle. Behind the frontier it raises the existing catch-up rate; near it
the same budget funds original work, which lands as a stochastic breakthrough rather than a drip,
and which the incumbents can veto exactly as they veto absorption. The split is derived
per sector, so one economy can imitate in the fields and invent in the machine shops.

The player sees two fogged instruments and never the frontier, sector attainment, or TFP:
`technology_attainment` (the ratio — are we catching up?) and `productivity` (the level — output
per worker against our own 1946). Two are needed because the ratio saturates: research pushes the
frontier it is measured against, so the better the programme the quieter its own dial goes.

Human capital is a slow stock carried by the workforce, not another name for school capacity
(ADR-0023). `gov.capacity.education` is the Layer-2 institution the cabinet builds;
`demography.humanCapital` closes one percent of the gap to it each quarter. Technology absorption,
research staffing, fertility and societal power all read the stock, so a two-year school project
does not educate a country on the construction schedule. The player sees only the lagged, fogged
`human_capital` / **Workforce skills** instrument; the exact stock remains engine truth.

Foreign direct investment is an owned capital stock, not another name for openness (ADR-0018).
Small-country scale and external access set the structural FDI/GDP draw; the mean of sector
frontier gaps supplies composition-invariant catch-up room. Current administration, after-tax
returns, export intensity, confidence, price stability, tariffs,
foreign activity and crises move it. Inflows join the ordinary investment order book and bring reserves in; imported
plant is gross capital formation but lands on the import bill instead of domestic demand. The
foreign-owned share of after-tax profits is remitted later, leaving reserves and never entering
domestic household income. Only the fogged `fdi_inflows` flow reaches the wall; ownership and
remittances remain engine truth.

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
  | { kind: 'enact'; statute: StatuteId; level: number }            // the statute book

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

`enact` writes a rule rather than setting a number (ADR-0027). `level` indexes the statute's own
named ladder in `STATUTE_LEVELS`; rung 0 is "no statute". Three things distinguish it from a dial
and are the reason it is a separate register: it phases in over `STATUTE_PHASE_IN_QTRS` rather
than taking effect at once, repeal carries an entrenchment premium that rises with how long the
rule has stood, and **what reaches the economy is never the posted level**. `statuteForce(state,
id)` is posted strength × `statuteCompliance` × phase-in, and every step that reads a statute
reads that — reading `gov.statutes` directly is reading the announcement instead of the effect.
Compliance is derived from the civil service, the courts, and the effective power and anger of
every bloc that minds the rule, read off the same `STATUTE_STANCE` table that priced the
enactment. It is the third instance of a gap the engine already models twice, after capacity-gated
tax collection and leaky programme delivery.

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

Statistical claims over many seeds. `fuel-tax.test.ts` and `subsidy.test.ts` are the
design's load-bearing mechanism claims. *If a change breaks them, the change is
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

Bulk runners retain only what their report consumes. `runOne` still returns a detailed
trajectory and exact final-state hash by default; `pnpm batch` streams each trajectory into a
single aggregate row, while `pnpm stability` retains the detailed trajectories but skips the
unused final-state hashes. These are runner storage choices only — every path executes the same
engine ticks and policy actions.

The named `developmental` policy isolates the effect of repeatedly building all four state
capacities; it deliberately leaves the inherited fixed-cash programme rules alone and is not a
historical fiscal baseline. `pnpm debt-baselines -- --runs 200 --ticks 400` pairs it with
no-tax-capacity and GDP-share counterfactuals, reports when debt first reaches zero, and splits
revenue, standing programmes, capacity construction, interest, and the balance as shares of GDP.
It reduces each run to those fiscal readings immediately, so century sweeps do not retain a
thousand copies of the treasury's full statistical archive.

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

Layout itself is verified by `tests/visual/ui.spec.ts`, a Playwright suite whose default viewport
is **1280×720**. It asserts that the dense wall has no page or horizontal scroll, no clipped rack
labels, no below-fold rack, no tile shear, and no console errors; it also snapshots the main
cabinet and overlay states and checks the tablet and smaller-laptop layouts. Run it with
`pnpm test:visual`.

### 7.5 Coverage

`pnpm coverage` enforces an **80% floor** over the pure core (`engine` + `observation`) —
currently ~99% statements. It is a floor to prevent regression; raise it, never lower it to
green a build. The UI is deliberately excluded: it's verified in the browser, not here.

---

## 8. Persistence (no backend)

- **Saves:** `{version: {engine, schema}, params, seed, rules, appointedAt, actionLog, tick}` in
  IndexedDB. A few KB per save regardless of run length, because state is derived (ADR-0001) —
  a later appointment adds only the caretaker's own orders to the log (about 30 turns by 2005).
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
| `pnpm export-share -- --runs 40 --ticks 160` | paired player-policy effects on export levels and final-expenditure share |
| `pnpm neutral-rate -- --runs 40 --ticks 160` | implied neutral-rate ranges and paired fixed-rate transmission |
| `pnpm architecture` | scan the source and open the engine atlas on localhost:4174 |
| `pnpm architecture:build` | regenerate and production-build the engine atlas |
| `pnpm batch -- --runs 1000 --ticks 120 --policy random` | balance sweep |

---

## 10. Where the design lives

- `game-description.md` — the short current pitch and player fantasy.
- `metrics-changelog.md` — the engine's inputs/outputs contract, updated on every
  `SCHEMA_VERSION` bump.
- `docs/adr/` — architectural decisions with their alternatives and consequences.
- `docs/investigations/` — open questions about the model, with the measurements that raised
  them. Evidence, not decisions.
- GitHub issues — proposed features and prioritizable future work.
- `docs/archive/` — superseded documents, kept for provenance. Do not cite them as current.
- `AGENTS.md` — the operating notes: hard rules, workflows, and hard-won tuning lessons.
- The `terrarium-ui` and `verify-the-wall` skills — the implementation and browser-verification
  procedures for `packages/ui` work.
