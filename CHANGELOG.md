# Changelog

All notable changes to Terrarium. Format follows [Keep a Changelog](https://keepachangelog.com/);
the engine's data contract (levers in, metrics out) is tracked in more detail in
[docs/metrics-changelog.md](docs/metrics-changelog.md).

The **schema version** (`packages/engine/src/state/schema.ts` → `SCHEMA_VERSION`) bumps whenever
the shape of `TrueState` or the pipeline order changes; each bump is a golden-replay event
(`pnpm test` → `pnpm diff-state` review → `pnpm bless`).

## [schema 10] — 2026-07-19 — The financial sector

### Added
- **`finance` pipeline step** (after `world`, before `production`): the credit cycle, the
  amplifier and the crisis clock in one. Banks set a credit target from the real rate,
  collateral (asset prices), and animal spirits, capped by their capital; an **asset price**
  (a Tobin's q) chases a profitability/rate fundamental but is bid away by credit acceleration
  and spirits — a bubble. The boom levers the banks up, and **leverage above prudence with
  assets overvalued** is the fuel a **Minsky moment** burns. Crises also import from the
  financial partner's sudden stop (§10). A crisis crashes asset prices, writes down bank
  capital, crunches credit, and panics confidence — the recession then runs through the
  ordinary investment/employment channels. Onset always makes the wire (a bank run isn't fog).
- **`Sector.credit` activated** (reserved at zero since v1): credit outstanding per sector,
  allocated by capital share; `FinanceState` carries the asset price, bank capital, aggregate
  credit, leverage, and crisis state.
- **Tobin's-q investment channel**: production reads asset prices (dear assets pull investment)
  and the crunch (a crisis freezes it) — so cheap money genuinely inflates a boom, and the
  bust genuinely bites.
- **Two indicators**: **`asset_prices`** (1946=100, fundable at an exchange board, 0.45) and
  **`credit_growth`** (%/yr of credit/GDP, fundable at bank supervision, 0.55) — the fragility
  clock is legible only to a government that paid for the instruments.

### Changed
- The century baseline shifts slightly with a functioning financial system: passive ≈ 2.5 %/yr,
  u ≈ 12.4 %, ~7 % deposed (a hair more stable — mild financial-deepening tailwind). Reckless
  policy now accumulates fragility: random-policy deposition ticks 22 % → 24 % as self-inflicted
  banking crises claim more governments. 1,000 random runs: no NaN, no price explosion.

## [schema 9] — 2026-07-19 — The rest of the world

### Added
- **`world` pipeline step**: four abstract trading partners (commodity exporter, manufacturing
  giant, financial center, regional peer), each running an AR(1) business cycle. Their strength
  drives **export demand** (a partner in recession buys less of your goods) and **world prices**
  (a supplier's boom is cheap imports, its collapse a shortage) — so world prices are now
  semi-endogenous rather than an exogenous walk. Partner booms, slumps, and sudden stops make
  the wire with certainty (foreign conditions aren't fogged like domestic surveys).
- **Terms-of-trade indicator** (`terms_of_trade`, 1946=100), fundable at trade statistics
  (0.40): the world price of your export basket ÷ your import basket.

### Changed
- The world-price walk moved from `trade` into the new `world` step (upstream of production);
  `trade` now only settles the balance of payments. The century baseline is unchanged (passive
  ≈ 2.5 %/yr, 10 % deposed); partner cycles add terms-of-trade texture without destabilizing it.

## [schema 8] — 2026-07-19 — Vital registration

### Added
- **Birth-rate and death-rate indicators** (`birth_rate`, `death_rate`), fogged and fundable at
  civil registration (statistical capacity ≥ 0.30). Crude rates per 1000/yr, computed in the
  demography step and published "the way it publishes prices" — lagged, noisy, revised. They
  lapse if capacity decays back below the threshold.
- **Exact census history** (`PublishedState.census`): per-quarter head count and age pyramid,
  no fog — analogous to the treasury's exact books.
- **Demographic transition chart** in the census overlay: births/deaths curves with the
  natural-increase wedge (fog-gated), an exact population strip, and a year-scrubber that
  morphs the pyramid 1946→now against a 1946 ghost.

### Notes
- Purely additive measurement — the economy is bit-identical to schema 7 (realGdp unchanged).

## [schema 7] — 2026-07-19 — Technology: two trees and the gap

### Added
- **Two-tree technology** (`technology` pipeline step): a global frontier advancing on a roughly
  historical schedule (golden age → 1973 slowdown → ICT bump → secular stagnation) and a
  per-sector *attained* level that chases its exposure-weighted slice. Catch-up speed is set by
  absorptive capacity; Baumol exposure means services ride the frontier at 0.45, manufacturing
  at 1.0.
- **Education capacity** (`education`), the fourth Layer-2 stock ("Schools"): sets absorption,
  suppresses fertility beyond the income channel, and decays at ¼ the institutional rate.

### Changed
- Replaced M1's flat exogenous TFP drip; wage bargaining now passes through *realized* TFP growth.
- Grade cuts recalibrated under the new world (passive band 0.91–1.41 %/yr = C).

## [schema 6] — 2026-07-19 — Demography

### Added
- **`demography` pipeline step**: a 17-band age pyramid ages quarterly under endogenous
  fertility (income level, urbanization, child survival, schooling, norms drift), income-driven
  mortality, and labour-market-driven migration. Cohort sizes are now *derived* from the pyramid.
- **Live census** in the header and a pyramid drill-down overlay (§3.2).
- `CountryParams.pyramid` (the 1946 age structure; synthesized for pre-M4 saves).

### Changed
- Two load-bearing valves added to keep the century stable under a growing labour force: Lewis
  capital-widening (`INVESTMENT_SLACK_GAIN`) and a capped subsistence valve
  (`SUBSISTENCE_ABSORPTION_Q`).
- Passive baseline re-based: growth ≈ 2.5 %/yr, u ≈ 12.5 % (the designed youth-bulge bomb),
  ~10 % deposed over a century (clustering at the aging endgame).

## [schema 5] — 2026-07-19 — The price bureau and the household survey

### Added
- **Food and fuel price boards** (`price_food`, `price_fuel`), fundable at a price bureau
  (0.20), always published at lag 1 (clerks read the market same-quarter). The fuel board
  carries the excise, so a player's own fuel tax prints in their own data.
- **Income-inequality indicator** (`gini`), the luxury instrument (household survey, 0.55).
- **Report-card letter grades** (post-release, no schema bump): prosperity graded A–F on
  tenure-normalized welfare growth; legitimacy graded on consent. The welfare accumulator now
  freezes at deposition so the verdict can't drift.

## [schema 4] — 2026-07-18 — The crisis clock and the historians' verdict

### Added
- **`shocks` pipeline step**: rare oil-price ruptures (~3/century) that a mean-reverting price
  walk unwinds over years, and droughts (~5/century) that transiently cut farm productivity.
  Transmission is unscripted (I/O table + tâtonnement); onset always makes the wire.
- **§3.3 report card**: discounted, population-weighted *log*-consumption Prosperity plus
  Legitimacy-as-survival, exposed only once the run ends (no mid-run truth leak).

## [schema 3] — 2026-07-18 — Measurement moves into the engine

### Added
- **`statistics` pipeline step**: the statistical office (prints, lags, +2/+5 revisions, funding
  gates, rumor news) now lives *inside* `TrueState`, because politics reads the published
  headline, not the truth (§3.4 salience).
- **Approval polling** as a fundable instrument (`approval`, 0.25).

### Changed
- Political capital now accrues from the *published* headline GDP print, not true growth.
- `packages/observation` slimmed to pure presentation; the worker lost its history plumbing.

## [schema 1–2] — 2026-07-17/18 — M0 · M1 · M1.5

### Added
- Deterministic seeded engine: 5 cohorts × 5 sectors, quarterly tâtonnement clearing over an
  I/O table, one lever per policy category, elections every 16 quarters, minimal §3.4 PC formula.
- Fog on the first indicators (GDP, inflation, unemployment) with revisions.
- **M1.5 playtest round**: confidence (consumer/business), payrolls and capital-stock
  instruments, and the ledger / news-wire / study views; the diegetic instrument-wall redesign
  (brass plate → dossier gauge → terminal ticker).
- Headless batch runner, golden-replay harness, property tests (incl. the M1 exit criteria:
  a fuel tax raises bread prices; a subsidy in a low-capacity state backfires; 1,000 random
  runs without NaN or price explosion).
