# Metrics changelog — the engine's data contract, version by version

The engine is a pure function: `replay(params, seed, mode, actionLog) → TrueState`, and
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

## Current contract (schema 40)

### Inputs

**Country parameters** (`CountryParams`, immutable after init)
| Field | Meaning |
|---|---|
| `development` | 0..1 scalar; scales starting capital, TFP, tech position |
| `openness` | external access; scales trade, tech absorption, FDI attraction, and foreign bond-market absorption |
| `capacities` | starting stocks of `tax`, `statistical`, `administrative`, `education` |
| `cohortSizes` | persons (millions) per social cohort |
| `enfranchisement` | ballot weight per cohort |
| `pyramid` | 1946 age structure, 17 five-year bands *(added v6)* |
| `structure` | optional normalized sector composition, opening debt/credit/reserves, and inherited institutions *(added v13; omitted means the historical Meridia defaults)* |
| `authored` | optional provenance flag: true when a player wrote the vector rather than drawing it from the recipe catalogue *(added v26; read by no pipeline step)* |

**Rules of the run** (`GameRules`, immutable after init — one boolean per `GAME_RULE_IDS`, all
false in ordinary play, each read in exactly one place)
| Rule | What it lifts |
|---|---|
| `protectedTenure` | election defeats, revolts, and coups are recorded but never end the run (the pre-v27 `god` mode) |
| `fullInstrumentation` | the funding gate on every survey — the office reports the whole ladder at any capacity, still lagged, noised, and revised |
| `unlimitedCapital` | the bill, not the price: orders are quoted and objected to as usual, and the cabinet is simply never charged |

Saves from before v27 carry the `mode` scalar instead; `'god'` loads as `protectedTenure`, and a
save from before v21 with neither loads with every rule off.

**The appointment** (`meta.appointedAt: Qtr`, immutable after init — the quarter the player
takes office, ADR-0021). Zero is the ordinary 1946 posting and is what every save before v28
means. A later quarter makes the ones before it an **interregnum**: a caretaker administration
governs them in the ordinary loop, its orders are written into `actionLog` like any others, and
the state the player is handed is whatever that produced. The caretaker votes the opening
appropriations into `gdpShare` rules at their opening share and invests `CARETAKER_CAPACITY_SPEND`
in each capacity every `CARETAKER_CAPACITY_EVERY` quarters; it touches no other lever. During
the interregnum the political clock is stopped — no election, no deposition, no PC accrual, and
orders are quoted and objected to but not charged — and the score, corridor and tenure counters
do not start until `appointedAt`.

**Policy levers** (`DialState` plus `SpendingRules`)
| Lever | Range |
|---|---|
| `taxRates.income / corporate / tariff / fuel` | rates; collection is capacity-gated |
| `spending.transfers / procurement / investment / research` | resolved money/quarter; delivery leaks |
| `spendingRules.<programme>` | `fixed` cash, `indexed` cash following official CPI first releases, or `gdpShare` of latest official nominal GDP |
| `policyRate` | annualized nominal rate |
| `assetPurchaseRate` | annualized central-bank asset purchases, 0..25% of GDP |
| `capitalRequirement` | bank equity required per unit of credit, 3..25% |
| `immigrationLimit` | maximum annual immigration as a share of resident population, 0..2%; does not restrict emigration |
| `subsidies.<sector>` | money/quarter per sector |

**The statute book** (`gov.statutes`, written via the `enact` action — ADR-0027). Rules the
government writes rather than numbers it sets: a fourth register, between the dials and the
constitution. Each statute is an ORDINAL on a short named ladder (`STATUTE_LEVELS`), rung 0 being
"no statute", and each is stored as `{ level, enactedAt }` and nothing else.

What reaches the economy is never the posted level. `statuteForce(state, id)` = posted strength ×
`statuteCompliance` × phase-in, and **every step that reads a statute reads that**. Compliance is
the third instance of the gap this contract already describes twice — after capacity-gated tax
collection and leaky programme delivery — and it is derived, never stored: the civil service and
the courts supply the capability, every bloc that minds the rule supplies evasion in proportion to
its effective power and its anger, and each statute past the first congests the same inspectorate.
A change phases in over `STATUTE_PHASE_IN_QTRS`, and repeal costs more the longer a rule has
stood.

| Statute | Ladder | The one channel it enters through |
|---|---|---|
| `minimum_wage` | none · subsistence floor · living wage | a floor under `market.wages`, at a fraction of the employment-weighted average wage. From there it is an ordinary wage: unit labour cost → the price step's cost anchor → every price. No disemployment term exists; jobs are lost only through the demand that survives. |
| `compulsory_schooling` | none · to 14 · to 16 | one fact, two readers on different clocks — `schoolingWithdrawal` takes the youngest working band out of the labour force now, and the human-capital target rises so the same school system yields more over a seventeen-year half-life. The bite is sized off the pyramid; the return is a multiplier on `capacity.education`, so a state with no schools gets the cost and none of the benefit. |
| `competition` | none · merger review · trust-busting | `eliteCapture`, the extractive ceiling, which `creativeDestruction` already turns into a multiplier on frontier absorption and research yield. `effectiveBlocPower` is deliberately untouched. |
| `emissions_standard` | none · smokestack rules · clean air act | abatement — one fact with two readers. Emissions fall in the `environment` step, and the equipment that catches them raises unit cost through the price step's cost anchor, scaled by each sector's own emission intensity so the dirtiest industries pay most. |

**Layer-3 institutions** (`InstitutionState.stocks`, moved via the `reform` action, 0..1 each)
| Stock | What it does |
|---|---|
| `suffrage` | closes the distance from the 1946 franchise to one-person-one-vote — rewrites the ballot weights the §3.4 score uses |
| `press` | raises societal power |
| `labor_rights` | raises societal power; makes `unions` a real bloc |
| `courts` | raises societal power; the money interest approves |
| `repression` | buys PC and lowers the electoral bar; sinks societal power, raises state power, walks the dot toward despotism |

**Actions**: `setDial` (move a lever; legacy spending paths vote fixed cash) ·
`setSpendingRule` (replace a programme's recurring appropriation) · `investCapacity` (build a
Layer-2 stock over 8 quarters) · `reform` (move a Layer-3 stock by `REFORM_STEP`, ±1) ·
`campaign` (commit an election platform, only inside the 2-quarter campaign window).

**Campaign platforms** (`PlatformId`): `record` · `largesse` (transfers +50 %, permanently) ·
`coalition` (a bloc's machine, and its claim on you for a full term) · `suppression`
(repression +0.15; the mandate is recorded as taken) · `franchise` (suffrage +0.2).

Every `setDial`, `setSpendingRule`, and `reform` is priced by the **veto players**: the PC cost is multiplied by
`1 + VETO_COST_GAIN × Σ (effective bloc power × how much that bloc minds the move)`, doubled for
a bloc you owe a pledge to, and discounted while a reform window is open. It is never infinite —
the game does not say no, it lets you find out.

### Pipeline (16 ordered steps)

`shocks` → `demography` → `technology` → `world` → `finance` → `foreignInvestment` →
`production` → `trade` → `fiscal` → `monetary` → `prices` → `labor` → `cohorts` →
`institutions` → `statistics` → `politics`

The **rest of world** is exogenous input, not a lever: four abstract partners run their own
business cycles (`world` step), setting export demand and semi-endogenous world prices. Their
booms/slumps/crises reach the wire but you cannot set them.

The **migration flow** (`demography` step) compares domestic mean log consumption progress since
1946 with a frontier-linked outside option, then adds the current labor-market signal. The
cabinet's `immigrationLimit` clips positive arrivals only; emigration remains possible when the
country underperforms. Realized migrants enter young-adult age bands and therefore change labor
supply and the future birth base. The `institutions` step prices realized inward migration through
bloc favor and, above ordinary churn, unrest (ADR-0022).

The **financial sector** (`finance` step) has three distinct levers. The policy rate sets the
price of overnight money. `assetPurchaseRate` is QE: it lowers the common private funding rate
without lowering the policy rate or counting as fiscal deficit printing, so it remains available
at the rate floor but still feeds credit and asset-price risk. `capitalRequirement` sets the bank
equity floor that caps credit directly. The crisis remains the one the player's leverage earned.

The **foreign-investment sector** (`foreignInvestment` step) turns small-country scale, external
access and catch-up room into inward productive investment, then moves around that structural
draw with administration, after-tax returns, export intensity, confidence, price stability,
tariffs and the foreign cycle. The flow enters capital formation and reserves; the accumulated foreign-owned
stock earns profit remittances that leave reserves and domestic household income. Imported plant
joins capital formation but the import bill, not domestic final demand (ADR-0018).

### Outputs — the indicator ladder (all fogged)

Ordered by the statistical capacity that unlocks them — the ladder a government climbs.

| Indicator | Unit | Unlocks at | Since | Underlying truth |
|---|---|---:|---|---|
| `gdp_growth` | % / yr | 0.00 | v1 | **real** GDP growth (+ real and nominal level estimates) |
| `gdp_per_capita` | real / head / yr | 0.00 | v15 | annualized real GDP ÷ census population |
| `debt_to_gdp` | % of GDP | 0.00 | v20 | treasury debt ÷ annualized nominal GDP |
| `inflation` | % / yr | 0.08 | v1 | quarterly CPI inflation ×4 |
| `price_food` | 1946=100 | 0.20 | v5 | effective agri price |
| `price_fuel` | 1946=100 | 0.20 | v5 | effective energy price (incl. fuel excise) |
| `approval` | % | 0.25 | v3 | enfranchisement-weighted approval |
| `consumption_per_capita` | real / head / yr | 0.25 | v15 | annualized household spend, own-basket deflated, ÷ population |
| `payrolls` | M jobs | 0.30 | v1.5 | ex-agri employment |
| `capital_stock` | index | 0.30 | v1.5 | total capital stock |
| `life_expectancy` | years at birth | 0.30 | v38 | period life expectancy from today's age-specific mortality schedule |
| `net_migration` | per 1000/yr | 0.30 | v29 | arrivals minus departures, annualized per 1,000 residents |
| `birth_rate` | per 1000/yr | 0.30 | v8 | crude birth rate |
| `death_rate` | per 1000/yr | 0.30 | v8 | crude death rate |
| `unemployment` | % | 0.35 | v1 | unemployment rate |
| `labor_force_participation` | % of population | 0.35 | v22 | labour force ÷ census population |
| `human_capital` | idx | 0.35 | v30 | slow workforce knowledge-and-skills stock ×100 |
| `consumption_share` | % final expenditure | 0.35 | v16 | household demand ÷ total final expenditure |
| `investment_share` | % final expenditure | 0.35 | v16 | private + public capital formation ÷ total final expenditure |
| `export_share` | % final expenditure | 0.35 | v16 | gross exports ÷ total final expenditure |
| `fdi_inflows` | % of GDP | 0.40 | v23 | inward foreign direct investment ÷ nominal GDP |
| `conf_consumer` | idx | 0.45 | v1.5 | consumer confidence |
| `conf_business` | idx | 0.45 | v1.5 | business confidence |
| `income_real` | 1946=100 | 0.45 | v14 | real household income per head (own-basket deflated) |
| `poverty_rate` | % population | 0.55 | v35 | population below one standard 1946 consumption basket per person per quarter |
| `household_saving_rate` | % disposable income | 0.45 | v15 | disposable income not consumed; consumption is the complement |
| `productivity` | 1946=100 | 0.40 | v19 | annualized real GDP ÷ total employment (incl. agriculture), indexed to own 1946 |
| `technology_attainment` | % frontier | 0.45 | v18 | output-weighted domestic technique ÷ sector-adjusted world frontier |
| `gini` | Gini pts | 0.55 | v5 | income Gini across cohorts |
| `terms_of_trade` | 1946=100 | 0.40 | v9 | export basket price ÷ import basket (world) |
| `asset_prices` | 1946=100 | 0.45 | v10 | Tobin's q — asset value per unit of capital |
| `credit_to_gdp` | % of GDP | 0.50 | v31 | credit outstanding ÷ annual GDP — the leverage LEVEL |
| `credit_growth` | % / yr | 0.55 | v10 | growth of credit / annual GDP (leverage) |
| `bank_capital_ratio` | % of credit | 0.55 | v31 | bank equity ÷ credit outstanding — the shock absorber, against the `capitalRequirement` floor |
| `unrest` | idx | 0.40 | v12 | revolutionary pressure ×100 — what collated provincial reports would show |

Each published point carries `{ forQtr, publishedAt, value, revision, errorBand }`; `gdp_growth`
additionally carries level estimates. Lag, noise, and error bands shrink as statistical capacity
rises; below `TERMINAL_AT = 0.5` the UI renders a dossier gauge, above it a terminal ticker.

### Outputs — the industrial census (fogged, and not an indicator)

`PublishedState.industry`, since v31. The one fogged output that is a **vector** rather than an
indicator series: one release carries two tables over `SECTOR_IDS`.

| Table | Unit | Underlying truth |
|---|---|---|
| `valueAdded` | real output at 1946 prices | per-industry value added, `output × (1 − Σᵢ coeff[i][j])` — sums to `flows.realGdp` **exactly** in the truth |
| `employment` | millions of people | `Sector.employment`; sums to the whole employed workforce, of which `payrolls` is the ex-agricultural part |

Unlocks at **0.30** statistical capacity (`INDUSTRY_CENSUS_FUNDED_AT`), on the establishment
survey's rung beside `payrolls` and `capital_stock`, and at or below `technology_attainment`
(0.45), whose own gate already assumes an industrial census beneath it. Each release carries
`{ forQtr, publishedAt, revision, errorBand, valueAdded, employment }` and runs on the office's
ordinary clock — the same lags, the same three revisions, the same `noiseScale(capacity)`.

`errorBand` is a `Record<IndustryTableId, number>`: a **fraction** of each figure rather than an
absolute half-width (the industries differ by an order of magnitude in size), and **one band per
table** rather than one for the release. An enumerator can count heads at a factory gate and has
to estimate what the factory made, so the two tables carry different constants
(`INDUSTRY_EMPLOYMENT_SD` 0.04 against `INDUSTRY_VALUE_ADDED_SD` 0.06); a single band would
overstate the employment survey's uncertainty by half at every capacity. Both are read from the
same table that draws the noise, in the same loop iteration, so quote and wobble cannot drift.
Every industry is drawn independently, so the published parts do **not** sum to the published GDP.

It is not an indicator because it cannot be one honestly: five sectors × two tables is ten
dials against six rack strips of headroom, and a sector share has no fixed dial face (ADR-0006)
when the catalogue's countries open anywhere between 5% and 60% agricultural. Shown in the
**industrial census** overlay — donut for the release, stacked bands for the century, and the
two shares side by side in a table, which is the only place the dual economy reads as one fact.

### Outputs — the household survey (fogged vector)

`PublishedState.households`, since v35. One household-budget-survey release carries the income
distribution over `INCOME_QUINTILE_IDS` (`lowest`, `second`, `middle`, `fourth`, `highest`), plus
the poverty gap and fixed real poverty line. It unlocks at **0.55** statistical capacity beside
the Gini and `poverty_rate`, and uses the office's ordinary lag, noise and revision clock.

| Field | Unit | Underlying truth |
|---|---|---|
| `incomeReal` | national 1946 mean = 100 | mean real disposable income per head in each equal fifth of the population |
| `incomeShare` | share, sums to 1 | each fifth's share of all real disposable household income |
| `povertyGap` | share of the line | population-average normalized shortfall below `POVERTY_LINE_REAL`, non-poor people zero |
| `povertyLine` | national 1946 mean = 100 | the fixed one-basket poverty line on the same indexed scale as `incomeReal` |

The truth sorts the five socioeconomic cohorts by real disposable income and splits population
mass exactly at quintile boundaries. It assumes no dispersion inside a cohort. Each reported
quintile income is drawn independently; the release then orders those five reports and derives
shares from the same reported values, so its own distribution remains coherent without being
reconciled to the separately noised `income_real` headline.

### Outputs — exact (no fog)

| Output | Since | Contents |
|---|---|---|
| `mode` | v21 | exact opening rule, `standard` or `god` |
| `dials` | v1 | your own lever settings, including the v29 immigration ceiling |
| `spendingRules` | v17 | your exact standing appropriations; fixed, CPI-indexed, or official-GDP-share |
| `treasury` + `books[]` | v1 | revenue, outlays, balance, debt, printed, reserves — current + full history |
| ↳ `revenueBySource` | v11 | receipts per tax: `income`, `corporate`, `tariff`, `fuel` — after capacity-gated collection |
| ↳ `outlaysByProgramme` | v11 | outlays per line: `transfers`, `procurement`, `investment`, `research` (v18), `subsidies`, `capacity`, `interest` — **as booked**, before delivery leakage |
| `politics` | v1 | political capital, quarters to election, in-power, elections won (+ `electionsSuppressed`, v12) |
| `institutions` | v12 | the five Layer-3 stocks, as set |
| `reformCost` | v12 | PC each reform costs right now — veto premium and window discount already applied |
| `reformWindowOpen` | v12 | whether pressure has prised the window open |
| `blocs[]` | v12 | per bloc: power, favor, effective power (after society's check) |
| `pledge` | v12 | the bloc courted at the last election, and quarters left on the claim |
| `corridor` | v12 | state power, societal power, offset, half-width, in/out, and the full traced trail |
| `campaign` | v12 | present only inside the campaign window: support, threshold, platform committed |
| `lastElection` | v12 | the count: platform, support, swing, threshold, won, suppressed |
| `population` | v6 | current total, labour force, age pyramid, and from v37 this quarter's `residence` split |
| `census[]` | v8 | per-quarter exact head count + pyramid (the demographic history), and from v37 the `residence` split — heads in the countryside and heads in towns and cities |
| `policy[]` | v25 | per-quarter exact dials — every `DialState` lever (tax rates, policy rate, asset purchases, capital requirement) plus resolved appropriations, every sector subsidy as a total, and the standing rule behind each programme with the quarter it was `votedAt` (the policy history) |
| `news[]` | v1 | the wire, as a newspaper (v39). Each item carries `event` (a stable id from `EVENT_IDS`), `kind` (`NEWS_KINDS`, v31), `desk` (`DESK_IDS`, v39), `tone`, `prominence` (`lead`/`column`/`brief`, v39), `outlet` (the masthead that filed it, v39), `text` (headline) and `body` (standfirst, v39). Filter on `event` or `kind`, never on prose. **No dispatch ever contains a figure** — the wire is written from true state, so a quoted number would be an unfunded, un-lagged, un-revised instrument |
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

### schema 40 — Schools make professionals

- **State +**: `DemographyState.professionalBaseline` and `.schoolingBaseline` — the professional
  share and the workforce skills the country OPENED with, sealed at `init` from the country
  recipe and never written again (#169, ADR-0032). Both are true state and stay behind the fog.
- **Behaviour ±**: the class transition gets a second boundary, urban worker → professional.
  `professionalCeiling` is a ratio to the sealed pair, so a government that never opens a school
  sits on its opening share forever; the crossing rate is gated on `skillTightness`, the jobs
  `LABOR_SOURCE` hands a cohort against the people in it.
- **Constants ±**: `PROFESSIONAL_SCHOOLING_ELASTICITY` (0.6, regressed off the five curated
  recipes), `PROFESSIONALIZATION_GAIN`, `PROFESSIONAL_SHARE_MAX`, `SCHOOLING_BASELINE_FLOOR` are
  new. **`ENGEL_ELASTICITY.services` moves 0.32 → 0.45** — the acceptance criterion issue #169
  wrote for itself, now that the constraint the 0.32 compromised with is gone.
- **Inputs**: unchanged. No new lever, no new parameter, no new rule, and no new replay input —
  saves carry no TrueState, so every existing save reconstructs both baselines at `init`.
- **Outputs**: unchanged. No new indicator; nothing crosses the observation boundary.
- **Baselines**: passive play is **bit-identical** under the demography change alone, verified on
  all five curated countries over 400 quarters and by `pnpm diff-state --moved-only`. The Engel
  move is what shifts the goldens: services output +0.09–0.15%, manufacturing/energy/transport
  down, real GDP −0.03% at 40 quarters — demand into services at a small Baumol cost.
  Developmental deposition **15% → 7%** over 1000 × 400q; passive 7% → 8% and 2.84 → 2.83 %/yr.
- **Test pins moved**: `tests/properties/future-stability.test.ts` developmental survivors 19 →
  23, passive unchanged at 27.

### schema 39 — The wire becomes a newspaper

- **State ±**: `NewsItem` grows from four fields to nine (#160, ADR-0031). `tick`, `kind`,
  `tone` and `text` are unchanged; `event`, `desk`, `prominence`, `outlet` and `body` are new.
  `NEWS_KINDS` gains `reform`, `statute`, `milestone` and `colour`.
- **New id lists**: `EVENT_IDS` (every dispatch the wire can carry, ~136 at v39), `DESK_IDS`
  (the eight sections of the paper), `PROMINENCE_IDS`, `PRESS_ERA_IDS` (the six presses of the
  century). All exported from `@terrarium/engine`; the UI builds its section rail and archive
  filters from them rather than from a second list.
- **Outputs ±**: `news[]` carries the new fields. `formatVersion` on the data export stays at 1
  — the change is additive, which is exactly the case that document tells consumers to validate
  permissively for.
- **Inputs**: unchanged. No new lever, no new parameter, no new rule.
- **New raise sites**: `actions/apply.ts` now files a dispatch for a `reform` and for an
  `enact`, so the government's own record appears in the paper. Dial moves deliberately do not —
  the minute book (`ui/src/policyRecord.ts`) already files those, with the diffing rules that
  make it honest.
- **Economically inert, measured**: `pnpm diff-state --moved-only` reports `meta.schemaVersion`
  and nothing else on all three goldens, and passive / developmental / random / regulated
  batches are bit-identical to v38 — growth, inflation, unemployment and deposition to every
  printed digit. All copy selection draws on `obs:news:*` substreams; `pipeline/technology.ts`
  keeps one deliberately stranded `rng.next()` so removing the old phrasing draw could not
  reshuffle that step.
- **Consumers that must change**: anything matching wire prose. `packages/runner/src/run.ts`
  matched five exact sentences to detect fuel shocks and foreign crises and now matches `kind`;
  two property tests moved to `event`. Prose is not a contract and never was.

### schema 38 — Life expectancy is published

- **State +**: `StatRecord.lifeExpectancy`, the life-table worksheet filed for every measured
  quarter. It is derived from the age-specific mortality schedule the demographic engine already
  applies; no new behavioural stock or causal channel is introduced.
- **Outputs +**: fogged `life_expectancy`, in expected years at birth, unlocks at statistical
  capacity 0.30 beside the civil register. It is period life expectancy: the expected lifetime
  of a synthetic newborn if that quarter's mortality rates continued, not the current average age
  at death. It therefore does not worsen merely because the existing population gets older.
- **Presentation +**: one wall instrument and the latest settled print in the National Census.
  The census continues to count heads and residence exactly; life expectancy follows the
  registrar's ordinary lag, noise, revision and funding rules.
- **Pipeline — / inputs —**: no step added or reordered, no new lever, country parameter or rule.
  This is the health component HDI needs, but it deliberately adds neither an HDI composite nor a
  healthcare policy before those mechanisms have been specified and calibrated.
- **Measured face**: 12 seeds × 6 countries × 400 quarters put funded prints at p01–p99
  47.8–58.2 years (extrema 44.2–59.8), fixing the dial at 45–60 years.

### schema 37 — The census counts where people live

- **State +**: `StatRecord.residence` — `{ rural, urban }` in millions, filed every quarter
  beside the head count and the pyramid it is counted off (#164).
- **Outputs +**: `census[].residence` and `population.residence`, both **exact**. Where somebody
  sleeps is a head you can count without a statistical office, so the rural/urban split sits on
  the same side of the fog as the count itself, and it is drawn in the census overlay as a
  stacked band across the century.
- **What is NOT published**: the occupational structure underneath it. `demography.classShares`
  splits people four ways — rural workers, urban workers, professionals, owners — and how many
  of the townspeople are professionals rather than shopkeepers is an *estimate*, which is what
  a labour-force survey exists to produce. It stays behind the fog with the industrial census,
  and stays on the forbidden list in `tests/contract/published-state.test.ts`.
- **The base is the under-60s, not the head count.** The engine gives everybody below the
  retirement band an occupation and with it somewhere to live, and gives nobody above it either,
  so `rural + urban` is smaller than `population` and every reading says which population it is
  a share of. Splitting the 60+ at the working-age rate would be wrong in one direction for the
  whole century: during exactly the transition the figure exists to show, today's pensioners were
  young when the country was more rural.
- **Inert**: `pnpm diff-state --moved-only` reported `meta.schemaVersion` and nothing else on all
  three goldens (80 new fields hidden — 40 quarters × two numbers). Nothing in the pipeline reads
  the new field; it is a measurement, not a mechanic.
- **Measured** (400 fully-surveyed quarters, 2 seeds per country): agrarian Costona opens at
  35 % urban and finishes near 75 %; industrial Veltravia opens at 78 % and moves about two
  points. The opening split is a fact about the recipe, not a global constant. The share only
  ever rises today — the engine's rural→urban flow stops in a slump but never reverses.

### schema 36 — The basket answers to income

- **State +**: `Cohort.engelReference` (real income per head at init, sealed) and
  `Cohort.engelIncome` (the per-head EMA compared against it) — ADR-0030. The second is a separate
  field rather than `lastRealIncome / size` because that divides a lagging aggregate by a current
  headcount, so a cohort urbanisation is draining reads as richer than it is. Nothing
  else changed shape: `cohort.consumptionWeights` still holds the authored recipe and still sums
  to 1. What changed is that **nothing reads it directly any more.** `production`, `cohorts` and
  `cohortCpi` all go through `effectiveConsumptionWeights(state, cohortId)`, which multiplies the
  recipe by an income term and a relative-price term and renormalises — the same
  posted-rule-vs-effect split as `statuteForce` against `gov.statutes`.
- **Pipeline —**: unchanged. No step added, none reordered, so this is **not** a step-order event
  (ADR-0005) and no RNG substream moved.
- **Inputs —**: no new lever, no new dial, no new statute, no new country parameter. This is a
  behavioural change to a channel that already existed, and the player's desk is identical.
- **Outputs —**: no new indicator. Three dial FACES were retuned against `pnpm ranges` because the
  economy moved under them: `price_food` 50–160 → 40–180, `consumption_share` 70–85 → 65–85,
  `unrest` 0–60 → 0–70. Faces are a UI contract, not an engine one, but they are listed here
  because a face that no longer fits its series is how a schema bump reaches the player.
- **The mechanism shipped INERT and was calibrated separately.** At `ENGEL_ELASTICITY = 0` and
  `HOUSEHOLD_SUBSTITUTION = 1` both exponents are zero, so the derived vector is the authored one
  bit for bit; `pnpm diff-state --moved-only` reported `meta.schemaVersion` and the five new
  `engelReference` fields and nothing else, and the passive century re-measured at the standing
  baseline to every digit.
- **Then it moves the baseline, on purpose.** Every country used to shed 6–10 points of service
  value-added share across a century in which it got five to eight times richer; the fix raises the
  attractor the catalogue converges into from ~25–31% to ~30–36%. Passive is near-unchanged at 7%
  deposed (2.82 → 2.83 %/yr) because a do-nothing country never gets rich enough for the income
  term to bite — **that is the calibration test.** Developmental deposition moves 9% → 15%, and
  what it buys is inequality: services are staffed 60% by professionals and the class transition
  cannot make more of them (investigation 0015).
- **One bookkeeping fix rides along, because this change made it load-bearing.** `init` seeded
  `Cohort.lastRealIncome` from GROSS wage income while `cohorts.run` recomputes it from wages AFTER
  income tax — a 3–9% basis step that the EMA spent its opening years walking down, and that fell
  only on the cohorts which earn wages. `engelReference` is sealed from that field, so the anchor
  inherited the asymmetry. Seeded on the same basis the step uses, both are right.
- **`HOUSEHOLD_SUBSTITUTION` ships at 1**, deliberately. The CES half of issue #139 was
  implemented, swept over σ ∈ {1, 1.5, 2, 3} and rejected on measurement — the basket's price
  response rises exactly as the theory says while the industrial census does not follow it
  (investigation 0016).

### schema 35 — Poverty and the household income distribution

- **Outputs +**: `poverty_rate` / **Poverty** (% of population, unlocks at 0.55), the grouped
  headcount below one standard 1946 consumption basket per person per quarter. The companion
  `PublishedState.households` vector release carries five population quintiles by real income and
  income share, the normalized poverty gap, and the fixed poverty line, all fogged. The fixed
  0–50% face covers the measured funded-century extrema of 5.7–45.8% (p01–p99 6.4–24.1%).
- **Internal state +**: `StatRecord` stores the exact poverty rate, gap and quintile tables;
  `StatsOffice.households` stores their releases. `householdIncomeGroups` is the one worksheet for
  Gini, mean household income, poverty and quintiles: post-effective-income-tax wages plus
  transfers and profits, deflated by each cohort's own basket and divided by population.
- **Outputs ± / behaviour ±**: `gini` and `income_real` now use that disposable-real basis rather
  than gross cohort income. Institutions read Gini, so this is an economic behaviour change even
  though poverty itself has no direct politics or scoring term. Golden and batch evidence is
  required before blessing.
- **Pipeline**: unchanged. New measurement draws use `obs:households:*` substreams, orthogonal to
  both economic randomness and every existing instrument's fog.
- **Economics review**: the new basis lowers the 1946 Meridia income worksheet by 4.08% and raises
  its grouped Gini from 42.08 to 42.92 points. Through the existing institutions seam that lowers
  societal power by about 0.45 points and raises unrest by about 0.6 points; 40-quarter real GDP
  moves only −0.03% to −0.05% across the three golden cases. The 1000×400q passive baseline remains
  2.82% growth, 0.12% inflation, 12.26% unemployment and 6% deposed; developmental is 3.05%,
  −0.19%, 11.63% and 9%. The 1000×120q random sweep has zero NaN/explosions and 30% deposed. The
  120-run all-country/all-policy stability matrix has no reachable non-finite state; passive,
  developmental and regulated have no price explosions, while random finds two reachable
  procedural-country explosions (the adversarial arm the harness permits and reports).

### schema 34 — The environment: what production costs outside the market

- **State +**: `environment: { pollution, baseline, emissionsQ }` (ADR-0028). One slow burden index,
  standard 1946 country = 1, seeded by `init` at exactly its opening equilibrium so no run begins
  on a ramp nobody chose. Countries open apart because their industrial structures differ —
  Costona 0.62 agrarian, Meridia 1.00, Veltravia 1.57 industrial.
- **Pipeline ±**: a new `environment` step directly after `production`, so **step order changed**
  (ADR-0005) and `statistics` moves from 15 to 16. RNG substreams are keyed by step name
  (ADR-0002), so no existing step's draw sequence moved. Emissions are per head, not absolute:
  land is not modelled, and an absolute tonnage would make a big country dirtier purely by being
  big. Better technique emits less, so research buys a cleaner economy without being told to.
- **Outputs +**: `pollution` / **Pollution** (1946 = 100, unlocks at 0.40 behind environmental
  monitoring) — a relative-noise print like every other survey. Face measured with `pnpm ranges`
  at 50–450 against a p01–p99 of 66.8–418.2. A state that has not funded monitors cannot see what
  its own industry is doing, which is the historical fact rather than a flourish.
- **Inputs +**: `emissions_standard` joins `STATUTE_IDS` — the statute the register was built for,
  and it cost an id, a ladder, a stance row and one `statuteForce` read.
- **Damage reaches the economy through two channels that already existed and no others**: the
  mortality schedule in `demography`, and the drought hazard in `shocks` (which reuses the entire
  drought response — severity, duration, the agricultural tfp cut, the wire item, the recovery).
  There is no term anywhere subtracting pollution from output.
  `baseline` is the burden the country inherited, sealed at init: both damage terms read the excess
  over it, so an industrial recipe is not charged for being industrial before its player has done
  anything.
- **This one moves the baseline, and that is the mechanic.** A country at its OWN inherited burden
  pays exactly nothing, so the 1000×400q passive century is unmoved at 2.82 %/yr, 12.26 %
  unemployment, 6 % deposed. The developmental cohort, which industrialises and never
  legislates, loses three of twenty-two survivors and deposes 10 % against 8 %. The golden
  replays moved 3540 values and **every one of them by 0.00 %** — 40 quarters cannot see a
  century-scale stock, so the batches are this feature's evidence, not the goldens.

### schema 33 — The statute book: rules the government writes

- **Inputs +**: the `enact` action and `gov.statutes`, a total record over `STATUTE_IDS`
  (`minimum_wage`, `compulsory_schooling`, `competition`), each `{ level, enactedAt }`. A statute
  is an ordinal on a named ladder rather than a scalar, it phases in over eight quarters, and
  repeal carries an entrenchment premium rising with how long the rule has stood. Priced through
  `politicalCostOfAction` like every other order, with the reform window's discount and veto
  relief — a crisis passes legislation.
- **Outputs +**: `PublishedState.statutes`, one `PublishedStatute` per statute: the posted level,
  its ladder, the quarter it was written (null when nothing was), the compliance, what is actually
  in force, the veto-loaded price of every rung, and which blocs are declining to obey. **Exact,
  not fogged**, and deliberately: every input to compliance is already published unfogged, so the
  figure is derivable from what the desk already shows and publishing it leaks nothing. That
  equivalence is the boundary — a compliance term that reads unpublished state would have to
  become an inspectorate survey with a lag and a band.
- **Outputs ±**: `PolicyRecord.statutes` puts the book in the minute book beside the dials, levels
  and enactment quarters only. Compliance is deliberately excluded: it moves every quarter on its
  own as the civil service grows and the blocs change their minds, so filing it would report a
  policy change every quarter for eighty years.
- **Pipeline ±**: unchanged — no step moved and no step's behaviour changed. **A statute is inert
  until it is enacted**, and that is what makes it safe to add: `pnpm diff-state --moved-only`
  reports nothing on any of the three golden replays with all three statutes wired, and the
  1000×400q passive baseline is unmoved at 2.81 %/yr growth, 0.11 % inflation, 12.23 %
  unemployment, 6 % deposed. A fourth golden case, `competition-act-40q`, exists so that the
  bless workflow reviews a register that actually fires.

### schema 32 — The leverage level, the banks' buffer, and typed wire items

- **Outputs +**: two fogged instruments completing the banking-crisis picture.
  `credit_to_gdp` / **Private credit** (% of GDP, unlocks at 0.50) is the leverage LEVEL, and it
  is not a substitute for the `credit_growth` rate beside it: the crisis hazard reads
  `max(0, credit/GDP − CRISIS_LEVERAGE_SAFE) × max(0, q − CRISIS_ASSET_SAFE)`, a PRODUCT of two
  excesses, and publishing only the rate of change left one of its two terms unobservable.
  `bank_capital_ratio` / **Bank capital** (% of credit, unlocks at 0.55) is bank equity over
  credit outstanding — the only published quantity comparable to the `capitalRequirement` floor,
  so a government that raises the floor can now tell whether it binds. Both are relative-noise
  prints, lagged and revisable like every other survey. Faces measured over the funded century:
  leverage p01–p99 40.3–65.9 (extrema 29.3–82.4), capital ratio 15.7–26.0 (extrema 8.3–30.9).
- **Outputs ±**: `NewsItem` gains a required `kind` from the new `NEWS_KINDS` list, naming what
  an item IS independently of how it is worded. The finance overlay previously found banking
  crises by matching `/banking crisis|sudden stop/i` against the prose, which put every crisis
  marker one copy-edit away from silently disappearing — and a chart with no markers looks
  exactly like a century with no crises. `text` and `tone` are unchanged.
- **State +**: `StatRecord.bankCapitalRatio`, filed as the ratio rather than the level because
  the ratio is what a supervisor publishes and the only form directly comparable to the floor.
- **Pipeline ±**: unchanged — no step moved, and no step's behaviour changed. Each indicator
  draws its noise from its own `obs:{id}` substream (ADR-0002), so two new specs perturb no
  existing draw. `pnpm diff-state --moved-only` over both golden replays reported
  `meta.schemaVersion` and nothing else; the 1000×400q passive baseline is unmoved.
- **Compatibility**: statistical worksheets and indicator ids changed, so schema 32 has new
  golden replays. Saves remain replay logs and need no repair.
### schema 31 — The industrial census

- **Outputs +**: `PublishedState.industry` — value added and employment by sector, fogged,
  unlocking at **0.30** statistical capacity. GDP read down the PRODUCTION side: the wall can
  say output grew, and nothing on it could say whether the country growing was agrarian or
  industrial. A vector release rather than a family of indicators (see the contract section
  above for why), so the wall's rack is unchanged and `INDICATOR_IDS` is unchanged.
- **Internal state +**: `StatRecord.industry` (the worksheet — exact, at measurement time) and
  `StatsOffice.industry` (the releases). `sectorValueAdded(state)` in `pipeline/derive.ts` is the
  shared arithmetic: `output × (1 − Σᵢ coeff[i][j])`, which is what `production` already sums for
  the headline, so the worksheet is an identity rather than a second estimate of GDP.
- **Base prices, deliberately.** A commodity boom raises energy's *nominal* share without anybody
  producing more energy, and the question this figure exists to answer is about volumes. This also
  makes it consistent with the expenditure accounts, which are shares of real final expenditure.
- **Accounting boundary**: value added, not gross output. Gross output double-counts everything
  the I/O table moves between industries, so a country that industrialises would appear to grow
  its economy simply by lengthening its own supply chains.
- **Pipeline**: unchanged. Additive measurement on new `obs:industry:*` substreams orthogonal to
  the economic RNG, plus the schema stamp — `pnpm diff-state --moved-only` reported
  `meta.schemaVersion` and nothing else on both golden replays.
- **Compatibility**: saves are replay logs, so every existing save reopens; the census is
  rebuilt from the replay like every other statistical output.

### schema 30 — Schools build a slow human-capital stock

- **Pipeline ±**: `demography.humanCapital` is initialized from inherited education capacity,
  then closes 1% of the remaining gap to the current school system each quarter. Technology
  absorption, research staffing, fertility and societal power read this stock rather than
  `gov.capacity.education`, separating a two-year institution-building project from the taught
  workforce it produces (ADR-0023). The pipeline order is unchanged.
- **Outputs +**: fogged `human_capital` / **Workforce skills**, a 0–100 index, unlocks at 0.35
  statistical capacity. Its fixed 0–100 dial matches the bounded underlying stock; prints remain
  lagged, noisy and revisable, and the exact `demography.humanCapital` never crosses the worker
  boundary.
- **Compatibility**: true state, statistical worksheets and indicator ids changed, so schema 30
  has new golden replays. Old country recipes deterministically initialize the new stock from
  their education capacity; saves remain replay logs and need no snapshot repair.

### schema 29 — Relative migration and the immigration ceiling

- **Inputs +**: `DialState.immigrationLimit`, an exact annual share of resident population from
  0..2%. It clips desired immigration only. `setDial` moves it through the same action-log,
  veto-player pricing, policy-history, save, and replay path as every other cabinet lever.
- **Pipeline ±**: `demography` replaces the old labor-slack-only migration term with a relative
  outside-option flow: domestic mean log consumption progress from the inherited 1946 baseline
  minus a frontier-linked alternative, plus current labor-market tightness. The 1946 migration
  baseline is stored separately from the appointment-based report-card baseline, so a later
  posting does not alter caretaker-era population history. Migrants remain
  concentrated in young-adult bands. `institutions` reads realized inward migration: employers
  and landowners gain favor, unions lose it, and only inflows above ordinary churn add unrest
  (ADR-0022).
- **Outputs +**: fogged `net_migration`, annualized per 1,000 residents, unlocks at 0.30
  statistical capacity. The fixed −15..15 face covers the measured all-country funded-century
  range (−11.9..12.1; p01 −8.0, p99 9.6).
- **Compatibility**: state shape, policy history, and indicator ids changed, so schema 29 has new
  golden replays. Older replay-log saves still omit only a deterministic opening dial and are
  handled by the engine's existing replay load path rather than repaired as snapshots.

### schema 28 — The year you take office

- **Inputs +**: `meta.appointedAt: Qtr` — a replay input with a save field, like `meta.rules`
  (ADR-0021). `init(params, seed, rules, appointedAt)` and `createSave(…, appointedAt)`; a save
  without the field is a 1946 posting, which is all of them before this version.
- **Inputs +**: `runInterregnum(params, seed, rules, appointedAt)` opens a country and lets a
  caretaker administration govern it up to the appointment, returning the state AND the action
  log that produced it. `caretakerActions(state)` is the policy — pure, RNG-free, two kinds of
  order (`setSpendingRule`, `investCapacity`) and nothing else.
- **Inputs +**: `APPOINTMENTS` — the quarters the posting room offers (1946, 1973, 1995, 2005,
  each a `FRONTIER_ERAS` boundary). Any quarter in `[0, LAST_APPOINTMENT_TICK]` is legal to the
  engine; `appointmentTick` clamps anything else, and unreadable input falls back to 1946. The
  bound stops one quarter short of the end of history on purpose: an appointment ON the closing
  quarter banks no welfare baseline, so `reportCardOf` could never return a verdict and the run
  could never end.
- **Outputs +**: `PublishedState.appointedAt`, published exactly — the baseline every "since you
  arrived" reading is measured from.
- **Outputs ±**: `ReportCard.quartersGoverned` counts from the appointment rather than from
  quarter zero, and `vsBaseline` is now the standard of living inherited on that day.
  `score.baselineWelfare`, `corridorQuarters` and `governedQuarters` all open there too, and the
  welfare discount is `WELFARE_DISCOUNT_Q ^ (tick − appointedAt)`.
- **Fog**: unchanged in kind. A later appointment inherits the statistical office the caretaker
  built — 21–29 of 29 instruments reporting by 1973, all 29 by 1995 — which is the point of
  having a caretaker at all rather than a passive fast-forward.
- **Internal**: `livingStandard` now bootstraps on `meta.tick === 0` rather than on
  `score.baselineWelfare === null`. Bit-identical for every 1946 run (the two agreed exactly
  while scoring began at tick zero), and load-bearing for a later one: the vital rates' income
  LEVEL and the report card's yardstick are the two anchors that must not be conflated.
- Economy bit-identical to v27 at `appointedAt: 0` (`pnpm diff-state --moved-only` reports
  `meta.schemaVersion` and nothing else; passive century re-measured at 2.68 %/yr growth,
  0.11 % inflation, 11.85 % unemployment, 8 % deposed over 200×400q). What each appointment
  hands over is measured by `pnpm inheritance` and tabulated in `docs/country-scenarios.md`.

### schema 27 — The rules of a run

- **Inputs ±**: `meta.mode: GameMode` became `meta.rules: GameRules`, a total record of
  independent booleans over `GAME_RULE_IDS` (ADR-0020). `init(params, seed, rules)` accepts the
  record or a partial of it — or the legacy mode string, which maps `'god'` to
  `{ protectedTenure: true }`. Saves write `rules`; a save with only `mode` still loads.
- **Rules +**: `fullInstrumentation` — the statistical office reports **every** survey whatever
  its capacity, lifting `INDICATOR_FUNDED_AT` and nothing else: prints keep the lag, the noise,
  and the revisions capacity earns them. `unlimitedCapital` — orders are quoted at their real
  veto-loaded price and the blocs still spend favour, but the cabinet is never charged and
  nothing is ever unaffordable. `protectedTenure` is the old `god`, renamed and unchanged.
- **Outputs ±**: `PublishedState.mode` became `PublishedState.rules`, published exactly.
- **Fog**: unchanged in kind. `fullInstrumentation` changes *which* series exist, never how
  honest one is.
- Economy bit-identical to v26 with every rule off (`pnpm diff-state --moved-only` reports
  `meta.schemaVersion` and nothing else; passive century unchanged at 2.70 %/yr growth, 11.90 %
  unemployment, 7 % deposed). One coupling to know about when a rule is ON: an **indexed**
  appropriation follows published CPI, so `fullInstrumentation` gives indexation something to
  read in a country too poor to publish it. The 1946 settlement votes fixed cash, so this
  reaches nobody who does not draft an indexed rule.

### schema 26 — Authored countries

- **Inputs +**: `CountryParams.authored` — optional, defaulting to absent, and read by **no
  pipeline step**. It is provenance, not a rule: an authored country runs through the identical
  `init → applyActions → step` loop and is neither easier nor harder for carrying the flag.
  Everything else about the vector is unchanged, and the economy is bit-identical to v25
  (`pnpm diff-state --moved-only` reports `meta.schemaVersion` and nothing else).
- **Outputs +**: `PublishedState.countryAuthored` — so the wall and the report card can say that
  a tenure was served somewhere nobody has balanced. This is the ADR-0015 argument applied to a
  *fact about* the run rather than a *rule of* it: had it lived in React state or `localStorage`
  it would evaporate on export and reload, and a grade earned on an authored country would be
  filed silently beside grades earned on the curated matrix.
- **File format +**: the **country document** (`CountryDocument`, `packages/engine/src/countryDocument.ts`)
  — a sibling of `SaveFile`, not a new engine input. It stores the vector without `pyramid` plus
  an `ageShape` id that rebuilds an identical pyramid on import, rounds every number to six
  significant digits on write (so the author plays exactly what their readers will), and carries
  a `dossier` of player-written prose with **no difficulty field** — the catalogue's difficulty
  stamps are backed by a thousand-run matrix and a self-declared one would be a claim nobody
  measured. `parseCountryDocument` rebuilds the object field by field rather than casting, so an
  imported file cannot smuggle an unknown key into the engine.
- **Fog**: none. Provenance is exact for the same reason your own dials are.

### schema 25 — The policy record

- **Inputs**: unchanged. No lever, parameter, or pipeline step moved, and the economy is
  bit-identical to v24 (`pnpm diff-state --moved-only` reports `meta.schemaVersion` and nothing
  else). This is additive recording only.
- **Outputs +**: `policy[]` — the dials filed once per quarter by the `statistics` step, beside
  that quarter's treasury books and for the same reason: there is no fog on yourself. It
  **extends `DialState`**, so every Layer-1 lever is recorded from the day it exists — naming
  the fields instead would compile clean while leaving a new dial out of the record, and the
  omission would only surface decades of game-time later as a lever with no history. On top of
  the dials it carries `subsidies` widened to a total over `SECTOR_IDS` (an unpaid subsidy
  recorded as 0 rather than absent, because a `Partial` with holes cannot be stacked) and
  `rules` — the standing appropriation behind each programme as `{ mode, value, votedAt }`.
- **State +**: `SpendingRule.votedAt` — the quarter the cabinet last WROTE the rule. Stamped by
  `createSpendingRule`, by the legacy `setDial` spending path, and by a `largesse` platform's
  permanent transfer rise; carried through resolution untouched. It is the only thing that
  separates a decision from a consequence: an indexed appropriation's `amount` moves on every
  CPI print and a GDP-share rule re-resolves every quarter, so a change log that diffed the
  resolved money would file a decision every quarter for eighty years.
- **Fog**: none. Deliberately carries no denominator — the nominal GDP you would divide an
  appropriation by is fogged and stays in the indicators.

### schema 24 — Foreign direct investment

- **Internal state +**: `external.foreignOwnedCapital`, a sticky real stock that depreciates
  with the national capital stock; `TickFlows.foreignDirectInvestmentReal`,
  `foreignDirectInvestmentValue`, and `foreignProfitRemittances` carry the current investment
  order and its external-account settlement.
- **Pipeline +**: `foreignInvestment` runs after `finance` and before `production`. Inflow/GDP
  is structurally larger for smaller, more open, less-developed countries, then responds to
  the equal-weighted mean of sector catch-up gaps, exports, administration, after-tax returns,
  confidence, price stability, tariffs, foreign activity, crises and foreign-ownership
  saturation. The inflow joins ordinary capital
  formation; imported machinery is booked to imports rather than domestic demand, and remitted
  profits are removed from domestic household income and reserves.
- **Outputs +**: `fdi_inflows` (fogged, unlock 0.40, unit `% of GDP`) — company and
  balance-of-payments returns reconciled against nominal GDP. The foreign-owned stock and exact
  remittance are not published across the fog boundary.
- **Inputs**: no new lever or authored country flag. Existing country terrain and policy levers
  move the flow systemically. See ADR-0018.
- **Calibration**: across 12 seeds × 6 scenarios × 400 quarters, published FDI inflows measure
  p01–p99 0.3–1.6% of GDP (extrema 0.1–2.6). The fixed face is 0–2%; exceptional small-country
  surges peg. The same sweep puts real-growth p99 at 17.0%, GDP/head p99 at 132.0 and
  consumption/head p99 at 98.6, so those faces are now −15–20%/yr, 0–150 and 0–100. The
  dial-fit regression runs a funded 400-quarter century; the former 240-quarter sample missed
  both per-capita overruns after 2006.

### schema 23 — Unconventional monetary and macroprudential policy

- **Inputs +**: exact `assetPurchaseRate` (0..25% of GDP/year) and `capitalRequirement`
  (3..25% of credit) dials. New games inherit zero asset purchases and the old fixed 6% capital
  floor, so passive behavior is unchanged. Both dials use the ordinary `setDial` action and the
  same veto-player quote/charge path as every other Layer-1 order.
- **Mechanism (QE)**: asset purchases subtract a calibrated term-premium effect from the common
  `privateRealRate` read by bank credit, asset valuation, and private investment. They do not
  lower the posted policy rate, lower treasury coupons, or increment fiscal `printed`; the asset
  swap is therefore neither a second deficit-financing identity nor free of consequence. It is
  useful at the zero-rate floor and can still inflate the leverage-and-asset-price pair that
  raises crisis risk.
- **Mechanism (capital floor)**: the finance step's former fixed 6% constant is now the dial in
  `max credit = bank capital / requirement`. Credit still approaches its target gradually, so a
  supervisory tightening leans against the cycle instead of deleting loans in one quarter.
- **Outputs**: no new indicator. The government knows its own two settings exactly through the
  existing published `dials`; outcomes remain visible through the fogged asset-price and
  credit-growth instruments.
- **Pipeline**: unchanged order and RNG substreams. ADR-0017 records why these controls reuse the
  existing rate and bank-capital balance-sheet channels rather than adding a second monetary or
  fiscal machine.

### schema 22 — Labour force participation

- **Outputs +**: `labor_force_participation` (fogged, unlock 0.35, unit `% of population`) —
  the model's total labour force divided by the exact census head count. This is the
  `labour force / population` term in the per-capita growth identity, so it makes the
  demographic dividend and the later ageing squeeze visible to the player instead of leaving
  them in runner-only diagnostics. The labour force survey supplies the numerator; the census
  denominator remains exact.
- **Inputs and pipeline**: unchanged. The economic state and behaviour are bit-identical to v21;
  this is additive measurement only.

### schema 21 — God mode

- **Inputs +**: immutable `GameMode`, selected at game start and stored in the save. `standard`
  preserves ordinary play; `god` makes a run immune to deposition by elections, revolt, or coup.
  Pre-v21 saves default to `standard`.
- **Outputs +**: exact published `mode`, so the UI can identify a protected run and explain a
  recorded election defeat without claiming that the simulation ended.
- **Politics**: God mode leaves the ordinary approval, campaign, election-count, and hazard
  calculations intact. A lost election is still recorded as lost and does not increment
  `electionsWon`; it resets the clock for another term instead of ending the run. Revolt and
  coup deposition are bypassed. Economic pipeline order and mechanics are unchanged.

### schema 20 — Debt in the scale of the economy

- **Outputs +**: `debt_to_gdp` (fogged, unlock 0.00, unit `% of GDP`) — the exact treasury
  debt stock divided by the statistical office's annualized nominal-GDP estimate. The ratio
  makes the existing debt book legible against the country's capacity to carry it without
  exposing hidden live GDP; its lag, revisions, and uncertainty follow the national accounts.
- **Inputs**: unchanged.

### schema 19 — Research as a stock, invention as a bet

- **Outputs +**: `productivity` (fogged, unlock 0.40, unit `1946=100`) — annualized real GDP ÷
  total employment, indexed to this country's own 1946. Economy-wide *including* agriculture,
  which is the opposite of the `payrolls` convention: the subsistence valve keeps the
  impoverished nominally employed, so an ex-agri series would delete the dual-economy drag this
  instrument exists to show. Published as labour productivity rather than TFP because an office
  can count output and count workers, whereas TFP is a residual from an assumed production
  function. It unlocks one rung *below* `technology_attainment`: "we are getting more per
  worker" is a fact about you and reads without knowing what the world is doing.
  Added because attainment is a ratio to a frontier the player can push, so it saturates —
  measured, a maximum research programme moves that dial ten points in its first decade and
  four points in the eighty years after, while output per worker keeps climbing.
- **Inputs**: unchanged. No new lever; `spending.research` behaves as in v18.
- **Mechanism (research is now a stock)**: appropriations accumulate into `tech.researchStock`
  and decay at `RESEARCH_STOCK_DECAY_Q`; every downstream gain reads the stock's flow-equivalent
  rather than the quarter's cheque. A steady programme is arithmetically identical to v18 — only
  the transients changed — but a programme now takes about five years to reach full stride and
  keeps delivering about three after it is cut.
- **Mechanism (invention is a hazard)**: the country's own contribution to the world frontier is
  no longer a deterministic drip. Effort sets a per-quarter hazard and a breakthrough is a fixed
  `BREAKTHROUGH_SIZE` jump, with `hazard × size` equal to the v18 term, so the expected century
  is unchanged and any single century is not. A breakthrough writes an unconditional news item —
  announced by the laboratory, not measured by the office, the same rule a drought gets.
  The *historical* frontier schedule stays deterministic.
- **Mechanism (research is sector-directed)**: the catch-up/invention split is derived per sector
  from that sector's own position, not from one blended national figure, so the same budget buys
  imitation in the fields and original work in the machine shops. A sector's contribution to the
  *world* frontier is weighted by `TECH_EXPOSURE`, so frontier manufacturing pushes world
  technique and frontier haircuts largely do not.
- **Mechanism (the elite gate)**: `creativeDestruction` now prices original research as well as
  absorption. Before this, a captured economy could not absorb what others had invented but could
  still buy invention with money — backwards on §4.3's own logic.
- **Pipeline**: unchanged order. The `technology` step now draws from its own (previously unused)
  RNG substream; substreams are per-step, so no other step's sequence moved.
- **Economy**: passive and fuel-tax replays are *bit-identical* apart from the schema stamp and
  the added fields — a zero-research government has an empty stock, a zero hazard, and a
  `catchupRate` that reduces to exactly the v18 expression. Verified with
  `pnpm diff-state --moved-only` and by running the 400×400 passive batch against master.

### schema 18 — Technology policy and the gap
- **Inputs +**: `spending.research`, a recurring money-per-quarter Layer-1 programme. Like the
  other standing appropriations it can be fixed cash, CPI-indexed cash, or a share of the latest
  official nominal-GDP release; it is priced by the room and booked as its own exact treasury line.
- **Mechanism +**: research appropriations are normalized by current GDP, delivered through
  administrative capacity, and staffed through education capacity. Behind the frontier they add
  to catch-up; near it an increasing share produces smaller original gains. Original work advances
  both the world frontier and the domestic technique that created it. Research is also delivered
  government final demand (services plus equipment), but it adds no physical capital.
- **Outputs +**: `technology_attainment` (fogged, unlock 0.45, unit `% frontier`) — current-output-
  weighted attained technique relative to each sector's exposure-adjusted frontier. The statistic
  can fall while domestic technique rises, correctly reporting that the world is pulling away.
- **Exact books +**: `outlaysByProgramme.research`. The ledger preserves all seven exact lines in
  data and prints the research amount separately; its six-colour composition chart combines
  research and active ministry construction into one state-building band.
- **Pipeline**: unchanged order. Research is read by the existing `technology`, `production`, and
  `fiscal` steps. With the inherited research rule fixed at zero, the passive economy is
  behaviorally unchanged; golden movement is the schema stamp, worksheet field, and added series.
- **Decision**: ADR-0012 records why this is a moving gap and one position-dependent policy rather
  than a technology tree or separate catch-up/frontier controls.

### schema 17 — Rule-based recurring expenditure
- **Inputs +**: `setSpendingRule` writes one of three standing appropriations per transfer,
  procurement, or public-investment programme: fixed nominal cash, CPI-indexed cash, or a share
  of officially published nominal GDP. Existing `setDial` spending actions retain their old
  fixed-cash meaning, so prior save action logs replay without translation.
- **Outputs +**: exact `PublishedState.spendingRules`; `dials.spending` remains the currently
  resolved money-per-quarter amount, and the treasury continues to book that amount in full.
- **Fog boundary**: CPI indexation advances once for each new revision-0 `inflation` release;
  later revisions do not rewrite past cheques. GDP-share rules use the latest nominal level the
  statistics office attached to a published `gdp_growth` print, never hidden live GDP. Before a
  denominator exists, the last voted amount holds.
- **Pipeline**: the 15-step order is unchanged. After `statistics` has put this quarter's releases
  on the desk and the fold completes, rules resolve the dials for next quarter; production,
  fiscal, cohorts, and institutions still read one common `dials.spending` amount.
- **Economics**: all opening rules are fixed, so passive and legacy-action replays are
  economically unchanged; golden hashes move for the schema stamp and additive rule state only.

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
