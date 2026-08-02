# Metrics changelog — the engine's data contract, version by version

The engine is a pure function: `replay(params, seed, actionLog) → TrueState`, and
`observe(TrueState) → PublishedState`. This document tracks, per **schema version**, the two
ends of that function:

- **Inputs** — the levers and parameters the engine *consumes*: policy dials, one-off actions,
  and the country parameter vector.
- **Outputs** — the metrics the engine *produces* and the UI/politics can *see*: the published
  indicator series (fogged), the exact books and census, the report card, and the wire.

Everything between them is the **pipeline** — an ordered fold of steps, versioned because
reordering changes results. A schema bump is a golden-replay event (`pnpm test` →
`pnpm diff-state` → `pnpm bless`). For the human-readable release notes see
[CHANGELOG.md](../CHANGELOG.md).

A note on *fog*: most outputs are **fogged** — published with a lag, noise, and revisions, and
only if the statistical office is funded to the indicator's threshold (§6.1). A few are
**exact** — your own dials, the treasury's books on itself, and the head count — because a
government always knows those without a survey. What is fogged vs. exact is itself part of the
contract, so it's called out below.

---

## Current contract (schema 11)

### Inputs

**Country parameters** (`CountryParams`, immutable after init)
| Field | Meaning |
|---|---|
| `development` | 0..1 scalar; scales starting capital, TFP, tech position |
| `openness` | trade exposure; scales export/import bases and tech absorption |
| `capacities` | starting stocks of `tax`, `statistical`, `administrative`, `education` |
| `cohortSizes` | persons (millions) per social cohort |
| `enfranchisement` | ballot weight per cohort |
| `pyramid` | 1946 age structure, 17 five-year bands *(added v6)* |

**Policy levers** (`DialState`, set via the `setDial` action)
| Lever | Range |
|---|---|
| `taxRates.income / corporate / tariff / fuel` | rates; collection is capacity-gated |
| `spending.transfers / procurement / investment` | money/quarter; delivery leaks |
| `policyRate` | annualized nominal rate |
| `subsidies.<sector>` | money/quarter per sector |

**Actions**: `setDial` (move a lever) · `investCapacity` (build a Layer-2 stock over 8 quarters).

### Pipeline (14 ordered steps)

`shocks` → `demography` → `technology` → `world` → `finance` → `production` → `trade` →
`fiscal` → `monetary` → `prices` → `labor` → `cohorts` → `statistics` → `politics`

The **rest of world** is exogenous input, not a lever: four abstract partners run their own
business cycles (`world` step), setting export demand and semi-endogenous world prices. Their
booms/slumps/crises reach the wire but you cannot set them.

The **financial sector** (`finance` step) is not a lever either — you steer it indirectly. The
policy rate leans against the credit cycle (cheap money inflates a bubble; tight money cools
it), and the crisis is the one your own leverage earned. Its only direct dial is the one you
already have (`policyRate`); a dedicated macroprudential lever is the natural next M5 chunk.

### Outputs — the indicator ladder (all fogged)

Ordered by the statistical capacity that unlocks them — the ladder a government climbs.

| Indicator | Unit | Unlocks at | Since | Underlying truth |
|---|---|---:|---|---|
| `gdp_growth` | % / yr | 0.00 | v1 | real GDP growth (+ level estimates) |
| `inflation` | % / yr | 0.08 | v1 | quarterly CPI inflation ×4 |
| `price_food` | 1946=100 | 0.20 | v5 | effective agri price |
| `price_fuel` | 1946=100 | 0.20 | v5 | effective energy price (incl. fuel excise) |
| `approval` | % | 0.25 | v3 | enfranchisement-weighted approval |
| `payrolls` | M jobs | 0.30 | v1.5 | ex-agri employment |
| `capital_stock` | index | 0.30 | v1.5 | total capital stock |
| `birth_rate` | per 1000/yr | 0.30 | v8 | crude birth rate |
| `death_rate` | per 1000/yr | 0.30 | v8 | crude death rate |
| `unemployment` | % | 0.35 | v1 | unemployment rate |
| `conf_consumer` | idx | 0.45 | v1.5 | consumer confidence |
| `conf_business` | idx | 0.45 | v1.5 | business confidence |
| `gini` | Gini pts | 0.55 | v5 | income Gini across cohorts |
| `terms_of_trade` | 1946=100 | 0.40 | v9 | export basket price ÷ import basket (world) |
| `asset_prices` | 1946=100 | 0.45 | v10 | Tobin's q — asset value per unit of capital |
| `credit_growth` | % / yr | 0.55 | v10 | growth of credit / annual GDP (leverage) |

Each published point carries `{ forQtr, publishedAt, value, revision, errorBand }`; `gdp_growth`
additionally carries level estimates. Lag, noise, and error bands shrink as statistical capacity
rises; below `TERMINAL_AT = 0.5` the UI renders a dossier gauge, above it a terminal ticker.

### Outputs — exact (no fog)

| Output | Since | Contents |
|---|---|---|
| `dials` | v1 | your own lever settings |
| `treasury` + `books[]` | v1 | revenue, outlays, balance, debt, printed, reserves — current + full history |
| ↳ `revenueBySource` | v11 | receipts per tax: `income`, `corporate`, `tariff`, `fuel` — after capacity-gated collection |
| ↳ `outlaysByProgramme` | v11 | outlays per line: `transfers`, `procurement`, `investment`, `subsidies`, `capacity`, `interest` — **as booked**, before delivery leakage |
| `politics` | v1 | political capital, quarters to election, in-power, elections won |
| `population` | v6 | current total, labour force, age pyramid |
| `census[]` | v8 | per-quarter exact head count + pyramid (the demographic history) |
| `news[]` | v1 | rumor wire (rumors fogged ~60%; shock & election dispatches always) |
| `reportCard` | v4 | present **only** once the run ends — see below |

### Outputs — the report card (§3.3, run-end only)

| Field | Since | Meaning |
|---|---|---|
| `endedBy` | v4 | `'deposition'` or `'history'` (survived to 2050) |
| `quartersGoverned`, `electionsWon` | v4 | tenure and mandates |
| `prosperity`, `vsBaseline` | v4 | discounted geometric-mean consumption; vs the 1946 standard |
| `prosperityRate` | v5* | annualized welfare growth over the tenure (%/yr) — what's graded |
| `prosperityGrade`, `legitimacyGrade` | v5* | A–F; axes graded separately, never summed |

\* letter grades shipped after v5 without a schema bump.

---

## Version history — what each release added to the contract

### schema 11 — The budget, itemised
- **Outputs +**: `treasury.revenueBySource` / `.outlaysByProgramme`, and the same two splits on
  every entry of `books[]` — **exact**, no fog, no unlock threshold. A government needs no survey
  to know which tax it collected or what it voted the money to, so this is a book, not an
  indicator, and it exists from quarter one at zero statistical capacity.
- **Internal state +**: `StatRecord.revenueBySource` / `.outlaysByProgramme`;
  `flows.taxRevenue` renamed to `flows.revenueBySource` and joined by `flows.outlaysByProgramme`.
- **Inputs**: unchanged — no new lever. The breakdown is a *view* of levers you already have,
  which is the point: the four tax dials and three spending dials were always there, and only
  the headline total was ever reported back.
- **Pipeline**: unchanged order; `fiscal` names the arithmetic it was already doing.
- Economy **bit-identical to v10** (additive measurement only — same numbers, same order of
  addition). Golden hashes moved for the version stamp and the two new recorded splits alone.

### schema 10 — The financial sector
- **Pipeline +**: `finance` step (after `world`, before `production`). It reads last quarter's
  realized profits/confidence and sets the terrain — asset prices, the credit crunch, the panic
  — that production this tick lives inside.
- **Inputs**: no new lever — the credit cycle is steered through the existing `policyRate`
  (cheap money inflates the boom; tight money cools it). A dedicated macroprudential lever is
  deferred to the next M5 chunk.
- **Outputs +**: `asset_prices` (fogged, unlock 0.45) and `credit_growth` (fogged, unlock 0.55);
  banking-crisis onset and bubble/thaw notes on the wire (exact — a bank run isn't fog).
- **Internal state +**: `finance` (asset price, bank capital, credit outstanding, leverage,
  crisis state) and `Sector.credit` activated (reserved at zero since v1). Investment now reads
  Tobin's q and the crunch, so the boom amplifies and the bust bites.
- Century baseline nudged (passive ≈ 2.5 %/yr, u ≈ 12.4 %, ~7 % deposed); reckless-policy
  deposition 22 % → 24 % as self-inflicted crises land. No NaN over 1,000 random runs.

### schema 9 — The rest of the world
- **Pipeline +**: `world` step (after `technology`, before `production`); the world-price walk
  moved out of `trade` into it.
- **Outputs +**: `terms_of_trade` (fogged, unlock 0.40); partner booms/slumps/crises on the
  wire (exact — foreign news isn't fogged).
- **Internal state +**: `external.world` (four partner activity levels + per-sector export
  demand). World prices are now semi-endogenous (partner supply pressure + reversion).
- Inputs unchanged (partners are exogenous, not levers). Century baseline unchanged.

### schema 8 — Vital registration
- **Outputs +**: `birth_rate`, `death_rate` (fogged, unlock 0.30); `census[]` exact history.
- **Pipeline**: unchanged order; `demography` now also computes crude rates.
- Inputs unchanged. Economy bit-identical to v7 (additive measurement only).

### schema 7 — Technology: two trees and the gap
- **Inputs +**: `education` capacity (levers: `investCapacity(education)`).
- **Pipeline +**: `technology` step (after `demography`).
- **Internal outputs**: a global frontier + per-sector attained tech (drives TFP; not yet a
  published indicator). Replaced the flat exogenous TFP drip.

### schema 6 — Demography
- **Inputs +**: `CountryParams.pyramid` (synthesized for older saves).
- **Pipeline +**: `demography` step (after `shocks`). Cohort sizes become *derived* outputs of
  the pyramid rather than static inputs.
- **Outputs +**: live `population` (total, labour force, pyramid) — exact.

### schema 5 — The price bureau and the household survey
- **Outputs +**: `price_food`, `price_fuel` (unlock 0.20, lag-1); `gini` (unlock 0.55).
- **Report card +** (no schema bump): `prosperityRate`, `prosperityGrade`, `legitimacyGrade`;
  the welfare accumulator freezes at deposition.

### schema 4 — The crisis clock and the historians' verdict
- **Pipeline +**: `shocks` step at the head of the tick (oil ruptures, droughts).
- **Outputs +**: the `reportCard` (Prosperity + Legitimacy), run-end only. Onset news always
  published.
- **Inputs**: unchanged (shocks are exogenous, not levers).

### schema 3 — Measurement moves into the engine
- **Outputs restructured**: the statistical office (prints/lags/revisions/rumors) moved *inside*
  `TrueState`; `observe()` became pure presentation. Politics now reads the **published** GDP
  print, so the fog became causal.
- **Outputs +**: `approval` indicator (unlock 0.25).

### schema 1–2 — M0 · M1 · M1.5
- **Inputs**: `CountryParams` (`development`, `openness`, `capacities{tax,statistical,
  administrative}`, `cohortSizes`, `enfranchisement`); dials (`taxRates`, `spending`,
  `policyRate`, `subsidies`); actions `setDial`, `investCapacity`.
- **Pipeline**: `production → trade → fiscal → monetary → prices → labor → cohorts → politics`
  (fog applied by a separate `observe`/`snapshot` at this stage).
- **Outputs**: `gdp_growth` (0.00), `inflation` (0.08), `unemployment` (0.35); then M1.5 added
  `payrolls`, `capital_stock` (0.30) and `conf_consumer`, `conf_business` (0.45); exact treasury
  books throughout.
