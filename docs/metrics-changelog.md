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
`pnpm diff-state` → `pnpm bless`).

A note on *fog*: most outputs are **fogged** — published with a lag, noise, and revisions, and
only if the statistical office is funded to the indicator's threshold (§6.1). A few are
**exact** — your own dials, the treasury's books on itself, and the head count — because a
government always knows those without a survey. What is fogged vs. exact is itself part of the
contract, so it's called out below.

---

## Current contract (schema 16)

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
| `structure` | optional normalized sector composition, opening debt/credit/reserves, and inherited institutions *(added v13; omitted means the historical Meridia defaults)* |

**Policy levers** (`DialState`, set via the `setDial` action)
| Lever | Range |
|---|---|
| `taxRates.income / corporate / tariff / fuel` | rates; collection is capacity-gated |
| `spending.transfers / procurement / investment` | money/quarter; delivery leaks |
| `policyRate` | annualized nominal rate |
| `subsidies.<sector>` | money/quarter per sector |

**Layer-3 institutions** (`InstitutionState.stocks`, moved via the `reform` action, 0..1 each)
| Stock | What it does |
|---|---|
| `suffrage` | closes the distance from the 1946 franchise to one-person-one-vote — rewrites the ballot weights the §3.4 score uses |
| `press` | raises societal power |
| `labor_rights` | raises societal power; makes `unions` a real bloc |
| `courts` | raises societal power; the money interest approves |
| `repression` | buys PC and lowers the electoral bar; sinks societal power, raises state power, walks the dot toward despotism |

**Actions**: `setDial` (move a lever) · `investCapacity` (build a Layer-2 stock over 8 quarters)
· `reform` (move a Layer-3 stock by `REFORM_STEP`, ±1) · `campaign` (commit an election
platform, only inside the 2-quarter campaign window).

**Campaign platforms** (`PlatformId`): `record` · `largesse` (transfers +50 %, permanently) ·
`coalition` (a bloc's machine, and its claim on you for a full term) · `suppression`
(repression +0.15; the mandate is recorded as taken) · `franchise` (suffrage +0.2).

Every `setDial` and `reform` is priced by the **veto players**: the PC cost is multiplied by
`1 + VETO_COST_GAIN × Σ (effective bloc power × how much that bloc minds the move)`, doubled for
a bloc you owe a pledge to, and discounted while a reform window is open. It is never infinite —
the game does not say no, it lets you find out.

### Pipeline (15 ordered steps)

`shocks` → `demography` → `technology` → `world` → `finance` → `production` → `trade` →
`fiscal` → `monetary` → `prices` → `labor` → `cohorts` → `institutions` → `statistics` →
`politics`

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
| `gdp_growth` | % / yr | 0.00 | v1 | **real** GDP growth (+ real and nominal level estimates) |
| `gdp_per_capita` | real / head / yr | 0.00 | v15 | annualized real GDP ÷ census population |
| `inflation` | % / yr | 0.08 | v1 | quarterly CPI inflation ×4 |
| `price_food` | 1946=100 | 0.20 | v5 | effective agri price |
| `price_fuel` | 1946=100 | 0.20 | v5 | effective energy price (incl. fuel excise) |
| `approval` | % | 0.25 | v3 | enfranchisement-weighted approval |
| `consumption_per_capita` | real / head / yr | 0.25 | v15 | annualized household spend, own-basket deflated, ÷ population |
| `payrolls` | M jobs | 0.30 | v1.5 | ex-agri employment |
| `capital_stock` | index | 0.30 | v1.5 | total capital stock |
| `birth_rate` | per 1000/yr | 0.30 | v8 | crude birth rate |
| `death_rate` | per 1000/yr | 0.30 | v8 | crude death rate |
| `unemployment` | % | 0.35 | v1 | unemployment rate |
| `consumption_share` | % final expenditure | 0.35 | v16 | household demand ÷ total final expenditure |
| `investment_share` | % final expenditure | 0.35 | v16 | private + public capital formation ÷ total final expenditure |
| `export_share` | % final expenditure | 0.35 | v16 | gross exports ÷ total final expenditure |
| `conf_consumer` | idx | 0.45 | v1.5 | consumer confidence |
| `conf_business` | idx | 0.45 | v1.5 | business confidence |
| `income_real` | 1946=100 | 0.45 | v14 | real household income per head (own-basket deflated) |
| `household_saving_rate` | % disposable income | 0.45 | v15 | disposable income not consumed; consumption is the complement |
| `gini` | Gini pts | 0.55 | v5 | income Gini across cohorts |
| `terms_of_trade` | 1946=100 | 0.40 | v9 | export basket price ÷ import basket (world) |
| `asset_prices` | 1946=100 | 0.45 | v10 | Tobin's q — asset value per unit of capital |
| `credit_growth` | % / yr | 0.55 | v10 | growth of credit / annual GDP (leverage) |
| `unrest` | idx | 0.40 | v12 | revolutionary pressure ×100 — what collated provincial reports would show |

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
| `politics` | v1 | political capital, quarters to election, in-power, elections won (+ `electionsSuppressed`, v12) |
| `institutions` | v12 | the five Layer-3 stocks, as set |
| `reformCost` | v12 | PC each reform costs right now — veto premium and window discount already applied |
| `reformWindowOpen` | v12 | whether pressure has prised the window open |
| `blocs[]` | v12 | per bloc: power, favor, effective power (after society's check) |
| `pledge` | v12 | the bloc courted at the last election, and quarters left on the claim |
| `corridor` | v12 | state power, societal power, offset, half-width, in/out, and the full traced trail |
| `campaign` | v12 | present only inside the campaign window: support, threshold, platform committed |
| `lastElection` | v12 | the count: platform, support, swing, threshold, won, suppressed |
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
| `electionsSuppressed` | v12 | mandates taken rather than won — shown beside `electionsWon`, never netted into it, and it caps the Legitimacy grade |
| `corridorShare` | v12 | share of the tenure spent inside the corridor — the §3.3 **Position** axis |
| `finalStatePower`, `finalSocietalPower` | v12 | where the dot finished |
| `positionGrade` | v12 | A–F on Position: the third axis the design named, now real |
| `deposedBy` | v12 | `'poll'` · `'revolt'` · `'coup'` · null |

\* letter grades shipped after v5 without a schema bump.

---

## Version history — what each release added to the contract

### schema 16 — The expenditure accounts
- **Outputs +**: `consumption_share`, `investment_share`, `export_share` — all fogged, all
  unlocking together at **0.35**, because they are one publication. Total final expenditure is
  household consumption + capital formation + government final consumption + gross exports, real
  at base prices. Shown together in the new **expenditure accounts** overlay (donut for the
  quarter, stacked bands for the century).
- **Outputs −**: `government_demand_share` (was 0.20, v15) is **withdrawn**. It measured
  government demand against domestic demand only, a different denominator from the family
  replacing it, and two "government share" dials reading different numbers is worse than one.
- **Accounting boundary**: capital formation is booked as investment whoever paid for it, so
  public works count there and `governmentShare` is the state's final *consumption* alone.
  Transfers and subsidies are not final demand — they finance spending already counted.
  Imports are netted inside the Leontief solve, not booked as a negative claim.
- **Measured but deliberately unpublished**: `StatRecord.governmentShare`. The identity is
  exhaustive in the truth (the four shares sum to 1, pinned by
  `tests/properties/national-accounts.test.ts`), but the state's own purchases run **under 1%**
  of final expenditure in this engine — it buys goods and pays transfers, it does not employ
  anyone — so a dial reading "government: 0.7%" would be true and would badly misinform. The
  treasury's exact books are the government's real footprint. Measured decade by decade in
  `docs/investigations/0002-capital-formation-share-only-falls.md`, which also records why
  `investment_share` cannot be read as "am I building an investment economy".
- **The three prints do not sum to 100.** Each account is a separate survey with its own
  relative error band; the composition views renormalize and the overlay states the shortfall
  rather than hiding it.
- **Internal state +**: `TickFlows.publicInvestmentReal`, so government final consumption is
  recoverable by subtraction.
- **Pipeline**: unchanged. Additive measurement on orthogonal `obs:*` substreams plus the schema
  stamp; the economic path and the passive baseline are unchanged.

### schema 15 — Per-capita and household national accounts
- **Outputs +**: `gdp_per_capita` (fogged, unlock 0.00), `consumption_per_capita` (0.25),
  `household_saving_rate` (0.45), and `government_demand_share` (0.20 — withdrawn in v16). The
  wall derives the complementary consumption and private-demand shares from the same prints, so
  each pair always sums to 100 even while the underlying print is revised.
- **Clarification**: `gdp_growth` is now labelled **real GDP growth** throughout the UI. Its
  arithmetic was already real: annualized quarter-over-quarter growth of `realGdp`; nominal GDP
  is carried only as a level estimate beside the headline.
- **Accounting boundary**: government demand is delivered procurement plus public investment;
  private demand is household consumption plus private investment. Transfers and subsidies are
  not counted twice, and net exports sit outside this complementary domestic-demand split.
- **Internal state +**: the statistics worksheet records the four measured truths; `TickFlows`
  records private and government domestic demand at base prices.
- **Pipeline**: unchanged. The economic path and passive baseline are unchanged; this is additive
  measurement on orthogonal `obs:*` substreams plus the schema stamp.

### schema 14 — Household income gets a level
- **Outputs +**: `income_real` — real household income per head, population-weighted and
  deflated by each cohort's own basket, indexed to the country's own 1946 value (unlock 0.45,
  ratcheting dial face). The Gini beside it is a *shape*: it reports the same 42 points for a
  country three times richer than it was, so on its own it can neither congratulate a good
  century nor condemn a wasted one. This is the level it was missing.
- **Worksheet +**: `StatRecord.incomeMeanReal`.
- **Not added, deliberately**: a median indicator. `realIncomePerHead()` computes the grouped
  median because it is the same traversal, but median-over-mean moves *against* the Gini under
  redistribution (measured: 80.4 → 77.4 while the Gini correctly falls, because the multiplier
  lifts the top in absolute terms faster than the middle household). Distribution belongs in
  the household budget survey as cohort levels. `tests/properties/household-income.test.ts`
  pins the counter-example so the obvious companion gauge is not added without meeting it.
- **Pipeline**: unchanged. No economic value moved — `pnpm diff-state --moved-only` reports
  `meta.schemaVersion` alone; golden hashes move for the version stamp and the new worksheet
  column.

### schema 13 — Country scenarios and structural openings
- **Inputs +**: optional `CountryParams.structure`: normalized `outputMix`, `employmentMix`, and
  `capitalMix` records over all five sectors; opening `debtToGdp`, `creditToGdp`, and
  `reserveCoverage`; inherited institution stocks. Old saves omit the block and retain the exact
  schema-12 opening.
- **Scenario catalogue +**: five curated countries and one bounded procedural recipe. Recipes
  materialize params before `init`; the materialized vector, not the recipe id, remains the save's
  source of truth.
- **Runner +**: `pnpm batch -- --country <id|all>`; `all` reports the balance and stability matrix
  by scenario. Omitting `--country` retains the historical generated-baseline sampling frame.
- **Pipeline**: unchanged. Meridia's economy is bit-identical to schema 12; golden hashes move for
  the schema version stamp alone. Other countries use the same steps and differ only in inputs.

### schema 12 — Politics as a game
- **Pipeline +**: `institutions` step (after `cohorts`, before `statistics`) — societal power,
  the veto players, revolutionary pressure. It runs before `statistics` so unrest can be
  published, and before `politics` so the election reads the franchise it just rewrote.
- **Inputs +**: `reform` and `campaign` actions; five Layer-3 institution stocks. Every existing
  lever is now additionally priced by the veto players (see Inputs above) — the same dial can
  cost 1× or 3× depending on who is in the room and whether society checks them.
- **Outputs +**: `unrest` (fogged, unlock 0.40); `institutions`, `blocs[]`, `corridor`,
  `campaign`, `lastElection`, `reformCost`, `pledge` (all exact — a government knows its own
  constitution and its own whip count); corridor entry/exit, reform-window and
  revolt/coup dispatches on the wire (exact). Report card gains the **Position** axis and
  distinguishes mandates won from mandates taken.
- **Internal state +**: `institutions` (stocks, societalPower, statePower, unrest, blocs,
  pledge); `politics` gains `electionsSuppressed`, `deposedBy`, `campaign`, `lastElection`;
  `score` gains `corridorQuarters` / `governedQuarters`.
- **Societal power is now live**, so the §6.3 corridor dot genuinely moves — before v12 the
  y-axis came from the country's fixed setup and the dot never left its starting point.
- **Two new ways to lose power**: revolt (pressure past `REVOLT_AT`) and coup (elites you defied,
  in a country whose society cannot check them). An organized society protects against the second.
- Passive century baseline **unchanged** (≈2.5 %/yr, inflation ≈0, u ≈12.7 %, ~8 % deposed at
  median q352) — the political layer only bites when the player does something political.
  Random-policy 120q deposition 24 % → ~30 %, the added share almost entirely coups.

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
