# Terrarium — Technical Architecture v0.1
 
*Companion to the design doc. Covers repo structure, engine state schema, the pipeline interface, RNG discipline, and test layout. TypeScript throughout. Everything here targets M0–M1; fields reserved for later milestones are marked.*
 
---
 
## 1. Repo Structure
 
Monorepo (pnpm workspaces). Dependency direction is law and is lint-enforced:
 
```
ui → observation → engine        (never the reverse)
tests → everything
```
 
```
terrarium/
├── package.json                  # pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── eslint.config.js              # incl. import-boundary rules (see §1.1)
│
├── packages/
│   ├── engine/                   # THE SIM. Pure TS. Zero DOM, zero React, zero I/O.
│   │   ├── src/
│   │   │   ├── index.ts          # public API: init, step, applyActions
│   │   │   ├── state/
│   │   │   │   ├── schema.ts     # all state interfaces (§3)
│   │   │   │   ├── validate.ts   # invariant checks (dev builds only)
│   │   │   │   └── init.ts       # country generation from params
│   │   │   ├── pipeline/
│   │   │   │   ├── pipeline.ts   # ordered step runner (§4)
│   │   │   │   ├── production.ts # I/O table, sector output
│   │   │   │   ├── prices.ts     # tâtonnement
│   │   │   │   ├── labor.ts      # employment, wages
│   │   │   │   ├── fiscal.ts     # tax collection (capacity-gated), spending
│   │   │   │   ├── monetary.ts   # policy rate, money, inflation expectations
│   │   │   │   ├── trade.ts      # one partner in M1
│   │   │   │   ├── cohorts.ts    # income, consumption, savings, approval
│   │   │   │   └── politics.ts   # PC income, elections
│   │   │   ├── actions/
│   │   │   │   ├── types.ts      # Action union (§5)
│   │   │   │   └── apply.ts      # action → state mutation, legality checks
│   │   │   └── rng/
│   │   │       └── rng.ts        # seeded PRNG + substream derivation (§6)
│   │   └── package.json
│   │
│   ├── observation/              # The fog. (trueState, statCapacity, rng) → PublishedState
│   │   ├── src/
│   │   │   ├── observe.ts        # noise, lag, revision schedule
│   │   │   └── published.ts      # PublishedState types — the ONLY types ui may import
│   │   └── package.json
│   │
│   ├── ui/                       # React app. Imports observation types only.
│   │   ├── src/
│   │   │   ├── worker/           # engine host: runs sim in Web Worker
│   │   │   │   ├── sim.worker.ts # owns trueState; emits PublishedState only
│   │   │   │   └── protocol.ts   # worker message types
│   │   │   ├── store/            # client state (zustand or similar), save/load
│   │   │   ├── panels/           # instrument panel, corridor plot, policy drawer
│   │   │   └── App.tsx
│   │   └── package.json
│   │
│   ├── runner/                   # headless batch runner (Node CLI)
│   │   ├── src/
│   │   │   ├── run.ts            # single run: seed + script → trajectory
│   │   │   ├── batch.ts          # N seeds × M scripts, parallel via worker_threads
│   │   │   ├── metrics.ts        # extract series from trajectories
│   │   │   └── report.ts         # distribution summaries for balance targets
│   │   └── package.json
│   │
│   └── fixtures/                 # shared test data
│       ├── countries/            # parameter vectors (procedural presets + real calib later)
│       ├── scripts/              # named action scripts ("passive", "fuel-tax-q4", …)
│       └── golden/               # golden replay snapshots (§7.1)
│
├── tests/
│   ├── unit/                     # pure-function tests on pipeline steps
│   ├── golden/                   # exact replay tests
│   ├── properties/               # statistical claims across seeds (§7.2)
│   └── e2e/                      # Playwright: wiring only (§7.3)
│
└── tools/
    ├── bless.ts                  # re-bless golden snapshots after intentional changes
    └── diff-state.ts             # show which variables moved between two states
```
 
### 1.1 Boundary enforcement
- `engine` package.json has **no dependencies** (a PRNG lib at most). ESLint `no-restricted-imports` bans `react`, `dom`, anything from `ui`/`observation`.
- `ui` is banned from importing `engine/src/state/*`. If the UI can't name the type of a true value, it can't accidentally render it. The only leak path would be the worker protocol — so `protocol.ts` message payloads are typed exclusively with `PublishedState` and action types.
 
---
 
## 2. Core API
 
The whole engine is three functions:
 
```ts
// packages/engine/src/index.ts
export function init(params: CountryParams, seed: Seed): TrueState;
export function applyActions(s: TrueState, actions: Action[]): TrueState;
export function step(s: TrueState): TrueState;          // one quarter
```
 
All pure: no globals, no Date.now(), no Math.random(). A game is:
 
```ts
let s = init(params, seed);
for (const turn of actionLog) {
  s = step(applyActions(s, turn.actions));
}
```
 
The save file is literally `{version, params, seed, actionLog}`.
 
---
 
## 3. State Schema
 
One root object. Plain data — no classes, no methods — so it's structured-clone-able across the worker boundary, hashable, and diffable.
 
```ts
// ---------- identity ----------
type Qtr = number;                      // quarters since 1946Q1
type Money = number;                    // real terms, base-year units
type Ratio = number;                    // 0..1 unless noted
 
interface TrueState {
  meta: {
    schemaVersion: number;              // bump on any shape change
    engineVersion: string;              // stamped into saves (see design doc §11)
    tick: Qtr;
    seed: Seed;
  };
  params: CountryParams;                // immutable after init
  cohorts: Cohort[];                    // 5 in M1
  sectors: Sector[];                    // 5 in M1
  io: IOTable;                          // sectors × sectors, Leontief coefficients
  market: MarketState;
  gov: GovernmentState;
  external: ExternalState;
  politics: PoliticalState;
  ledger: FragilityLedger;
  // M3+: institutions: InstitutionState;
  // M4+: demography: DemographyState; tech: TechState;
}
 
// ---------- population ----------
interface Cohort {
  id: CohortId;                         // 'urban_workers' | 'rural_workers' | ...
  size: number;                         // persons; static in M1, demographic in M4
  employedIn: Partial<Record<SectorId, number>>;
  wageIncome: Money;
  transferIncome: Money;
  savings: Money;
  consumptionWeights: Record<SectorId, Ratio>;  // sums to 1; Engel-ish shifts later
  approval: Ratio;                      // drifts toward experienced conditions
  enfranchisement: Ratio;               // weight in PC formula; Layer 3 edits this
}
 
// ---------- production ----------
interface Sector {
  id: SectorId;                         // 'agri' | 'manuf' | 'energy' | 'services' | 'transport'
  capital: Money;                       // stock; depreciates
  tfp: number;                          // productivity multiplier
  employment: number;
  output: Money;                        // this tick, at current prices
  capacityUtilization: Ratio;
  inventory: Money;
  credit: Money;                        // RESERVED — always 0 until M5
}
 
interface IOTable {
  // coeff[i][j] = units of sector i input per unit of sector j output
  coeff: number[][];
}
 
// ---------- markets ----------
interface MarketState {
  prices: Record<SectorId, number>;     // index, base = 1.0
  wages: Record<SectorId, number>;
  excessDemand: Record<SectorId, number>; // last tick's, kept for damping
  tatonnement: {
    damping: number;                    // λ in Δp = λ·(ED/supply), clamped
    maxMovePerTick: Ratio;              // hard cap, e.g. 0.15
  };
}
 
// ---------- government ----------
interface GovernmentState {
  dials: {                              // Layer 1 — the player's levers
    taxRates: { income: Ratio; corporate: Ratio; tariff: Ratio; fuel: Ratio };
    spending: { transfers: Money; procurement: Money; investment: Money };
    policyRate: number;                 // annualized
    subsidies: Partial<Record<SectorId, Money>>;
  };
  capacity: {                           // Layer 2 — slow stocks, 0..1 quality
    tax: Ratio;                         // gates collection: revenue = base × f(taxCapacity)
    statistical: Ratio;                 // consumed by observation layer
    administrative: Ratio;             // gates program delivery (leakage)
    // M2+: infrastructure, education, courts as separate stocks
  };
  budget: { revenue: Money; outlays: Money; balance: Money };
  debt: Money;
}
 
// ---------- external ----------
interface ExternalState {
  partners: TradingPartner[];           // 1 in M1
  worldPrices: Record<SectorId, number>; // exogenous feed in M1; semi-endogenous M4
  reserves: Money;
  exchangeRate: number;
}
 
// ---------- politics ----------
interface PoliticalState {
  politicalCapital: number;
  quartersToElection: number;           // 16-turn cycle
  inPower: boolean;
  // M3+: revolutionaryPressure, elitePower, reformWindows
}
 
// ---------- fragility ----------
interface FragilityLedger {
  inflationExpectations: number;        // adaptive in M1
  debtToGdp: Ratio;                     // derived but cached for cheap reads
  // M5+: creditGrowth, assetPriceIndex, bankLeverage
}
```
 
**Schema rules:**
1. Reserved fields ship at zero from day one (`Sector.credit`) — adding M5 must not reshape M1 saves.
2. Everything derivable is either not stored or explicitly marked cached; `validate.ts` recomputes and asserts in dev builds.
3. Any shape change bumps `schemaVersion` and gets a migration or an explicit "old saves die" decision.
 
### 3.1 PublishedState (what the UI sees)
 
```ts
// packages/observation/src/published.ts
interface PublishedState {
  tick: Qtr;
  indicators: Record<IndicatorId, IndicatorSeries>;  // only funded indicators present
  dials: GovernmentState['dials'];      // you always know your own settings
  politicalCapital: number;
  news: NewsItem[];                     // qualitative signals; how fog stays playable
}
 
interface IndicatorSeries {
  points: Array<{
    forQtr: Qtr;                        // period measured
    publishedAt: Qtr;                   // period released (lag = publishedAt − forQtr)
    value: number;
    revision: number;                   // 0 = first print
    errorBand: number;                  // shown if statCapacity high enough
  }>;
}
```
 
The observation layer is `observe(trueState, history, rng): PublishedState` — pure, seeded by a **substream the game rng never touches**, so fog noise doesn't perturb the economy.
 
---
 
## 4. Pipeline Interface
 
Each subsystem is a step. The tick is an ordered fold:
 
```ts
interface PipelineStep {
  name: string;                          // doubles as the RNG substream label
  run(s: TrueState, rng: Rng): TrueState; // pure; returns next state
}
 
const TICK_ORDER: PipelineStep[] = [
  production,   // output given prices, capital, labor, I/O table
  trade,        // imports/exports at world vs domestic prices
  fiscal,       // capacity-gated tax collection; spending execution w/ leakage
  monetary,     // rate transmission, money, inflation expectations
  prices,       // tâtonnement adjustment from excess demand
  labor,        // (re)allocation, wage adjustment
  cohorts,      // incomes, consumption, savings, approval drift toward experienced truth
  politics,     // PC accrual, election check every 16 ticks
];
```
 
**Rules:**
- Order is explicit and versioned — reordering steps changes results, so it's a schema-version event.
- Steps communicate only through state. No side channels, no step-to-step calls.
- **Adding a feature = adding a step (or a field a step reads).** M5's credit system is a new `credit` step inserted before `prices`, not edits scattered across five files.
- Immutability: use structural sharing (spread or Immer inside the step) — return a new state, never mutate the input. Cheap at this scale (~few KB of state).
 
---
 
## 5. Actions
 
```ts
type Action =
  | { kind: 'setDial'; path: DialPath; value: number }       // Layer 1
  | { kind: 'investCapacity'; target: CapacityId; amount: Money } // Layer 2
  // M3+: | { kind: 'reform'; institution: InstitutionId; direction: 1 | -1 }
  ;
 
interface TurnActions { tick: Qtr; actions: Action[] }
type ActionLog = TurnActions[];
```
 
`applyActions` validates legality (PC affordability, dial bounds) and **rejects loudly** — an illegal action in a replay means a bug or a version mismatch, never a silent skip.
 
---
 
## 6. RNG Discipline
 
Single biggest determinism footgun. Rules:
 
- One root seed. Every consumer derives a **named substream**: `rngFor(seed, stepName, tick)` (e.g. splitmix64 over a hash of the triple).
- A step's draws are therefore isolated: adding a new step, or a draw inside one step, never shifts another step's sequence — golden tests for untouched systems keep passing.
- The observation layer gets its own substream family (`obs:*`) so fog is reproducible but orthogonal to economic outcomes.
- `Math.random` is lint-banned repo-wide.
 
---
 
## 7. Test Layout
 
Four layers, mapped to the strategy already agreed:
 
### 7.1 Golden replays (`tests/golden/`)
Fixture = `{name, countryFixture, seed, scriptFixture, expected: {stateHash, keySeries}}`. Runs in Node in milliseconds. `tools/bless.ts` regenerates after intentional changes; `tools/diff-state.ts` shows exactly which variables moved and by how much before you bless — the diff review *is* the economics review.
 
### 7.2 Property suites (`tests/properties/`)
Statistical claims over N seeds (N=200 default, 10k nightly via `runner`):
 
```ts
propertyTest('fuel tax raises bread prices', {
  script: scripts.fuelTaxAtQ8,
  baseline: scripts.passive,
  seeds: 200,
  claim: (run, base) =>
    quantile(0.95, seedsWhere(run.price('agri').after(8).gt(base.price('agri')))),
});
```
 
Standing invariants run inside every property suite: no NaN/Infinity, prices within per-tick caps, budget identity holds (revenue − outlays = Δdebt), replay determinism (run twice, hash-compare).
 
### 7.3 E2E (`tests/e2e/`)
Playwright, ~a dozen tests, wiring only: lever click appends correct action to log; save → reload → identical PublishedState; unfunded indicator renders no chart.
 
### 7.4 Unit (`tests/unit/`)
For genuinely tricky pure functions (tâtonnement clamping, tax-capacity curve). Thin layer — the economics claims live in 7.2.
 
---
 
## 8. Persistence (no backend)
 
- **Saves:** `{engineVersion, schemaVersion, params, seed, actionLog}` in IndexedDB (localStorage's 5MB limit is fine today but IndexedDB is async, structured-clone native, and won't need a migration later). A few KB per save.
- **Autosave** = append the turn's actions to the open save every tick. Crash recovery is free replay.
- **Export/import** as a JSON blob — doubles as the bug-report format: a report is a save file plus "look at Q83."
- Replay cost is negligible (5×5 sim, ~400 ticks max), so no state snapshots needed in v0.1; revisit if load ever exceeds ~1s.
 
---
 
## 9. Build & Tooling
 
- **pnpm + Vite** (ui), **tsup** or plain tsc for packages, **Vitest** everywhere (shares Vite config, runs engine tests in Node), **Playwright** for e2e.
- **CI order:** typecheck → lint (incl. boundary rules) → unit → golden → property (N=200) → e2e. Nightly job: property at N=10k via `runner`, publishing distribution reports — this is the balance dashboard.
- Worker built as a module worker via Vite's `?worker` import; `protocol.ts` is the single shared contract.
 
---
 
## 10. M0 Definition of Done
 
1. `init/applyActions/step` exist with the §3 schema (fields may be inert).
2. Worker host round-trips: UI sends actions, receives PublishedState (fog can be identity for now).
3. Save = seed+log; load replays to identical stateHash.
4. `runner` executes 1,000 random-policy runs, reports wall-time and NaN count.
5. One golden test, one property test (determinism), one e2e test (click → action in log) — all green in CI.
 
Everything after this is economics, not infrastructure.
