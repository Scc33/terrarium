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

## Current contract (schema 12)

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
