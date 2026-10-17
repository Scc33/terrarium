# ADR-0048 — The food bill pays a margin, and the farm's share of it falls with income

**Status:** Accepted · **Date:** 2026-10-17

## Context

Every unit of household food spending was bought from agriculture
([#289](https://github.com/Scc33/terrarium/issues/289), investigation
[0023](../investigations/0023-farm-employment-is-the-rural-class-on-a-slow-clock.md) §3). The
food share of spending falls plausibly with income (Meridia 34% → 14% across the century), but
in real economies the farm's share of the food dollar falls much faster: processing,
distribution and restaurants take a growing part of what a household pays for food. The US
farm share went from about 41% in 1950 to about 15% today, while income per head roughly
quadrupled. Without that, agriculture held 15–22% of value added in 2046, in countries four to
nine times richer than in 1946. With ADR-0045 the countryside drains toward expected income, so
it stops where the farm's market can pay, and this was what set that destination.

## Decision

`householdBasket` is ADR-0030's category basket, unchanged: its `agri` weight is the whole food
bill. `effectiveConsumptionWeights`, which demand, `cohortCpi` and felt shortages read, routes
that bill:

```
gate     = min(1, (y / y_ref) ^ FARM_GATE_ELASTICITY)      FARM_GATE_ELASTICITY = −0.5
w[agri]  = basket[agri] × gate
w[s]    += basket[agri] × (1 − gate) × FOOD_MARGIN_SECTORS[s]   manuf 0.25 · services 0.70 · transport 0.05
```

- **Relative to the cohort's own 1946 income**, for ADR-0030's reason: every country opens with
  all its food bought at the farm gate, which is how its recipe was authored. A cohort that
  gets poorer keeps buying there (retirees, #111).
- **The margin goes to sectors, not to a new food-processing sector.** Processing is
  manufacturing and restaurants are services; a sixth sector would be a schema change across
  every total record in the game for the same demand shift.
- **No energy share.** The margin's fuel reaches energy through the I/O table, and household
  energy demand is the fuel excise's base. The fuel-tax properties are load-bearing.
- **"Food %" still means food.** Option 1 on the issue (steepen `ENGEL_ELASTICITY.agri` and read
  the weight as farm-gate spending) was cheaper but would have stopped the basket meaning
  anything a player can name. `pnpm agriculture` now prints both the food share and `hh direct`,
  the part households buy from the farm themselves. Processors' own farm purchases sit in
  `interm.` (`IO_COEFF` gives manufacturing 5% and services 1% farm inputs), so the farm's whole
  take from the food bill falls somewhat less than the gate.

It shipped inert first: at elasticity 0 the routing returns the basket object itself, and
`pnpm diff-state --moved-only` reported nothing moved on all three goldens.

## Why −0.5 and not the historical slope

The US relative fall implies about −0.7. Swept (`pnpm agriculture -- --seeds 8 --ticks 400`,
developmental, 2046):

| elasticity | ag emp % meridia / costona / veltravia / oranga / kestrel | rel prod meridia / costona |
|---|---|---|
| 0 | 18.8 / 20.1 / 18.5 / 19.0 / 18.8 | 0.90 / 1.07 |
| −0.3 | 13.5 / 15.1 / 13.1 / 13.6 / 13.8 | 1.01 / 1.19 |
| **−0.5** | **11.2 / 12.8 / 10.7 / 11.3 / 11.6** | **1.09 / 1.27** |
| −0.7 | 9.4 / 11.0 / 8.9 / 9.6 / 9.9 | 1.16 / 1.35 |
| −1.0 | 7.6 / 9.0 / 7.0 / 7.8 / 8.1 | 1.25 / 1.46 |

`rel prod` is farm value added per worker over the economy's. Real farms stay below 1. It goes
above 1 here because the farm's household market shrinks while its exports grow: net exports
rise from 0.28 to 0.38 of farm demand on Meridia at −0.5, because exports scale with the
sector's own capacity (#290). Every step past −0.5 sends more of the cut abroad, not out of
farming. −0.5 is where the representative countries cross 1. Revisit it with #290.

## Consequences

1000 × 400q, `--country all`, before → after:

| | passive | developmental | regulated |
|---|---|---|---|
| growth %/yr | 2.93 → 2.86 | 3.11 → 3.07 | 3.11 → 3.06 |
| unemployment % | 12.84 → 12.99 | 12.57 → 12.73 | 12.31 → 12.49 |
| deposed | 1% → 1% | 6% → 6% | 8% → 8% |

**Deposition does not move on any policy or any country.** Growth gives up 0.04–0.07 points a
year. That is Baumol: demand moves from the farm, which rides the frontier, to services, which
lag it. A passive country moves too, as it should here: it also gets four to eight times richer,
and the farm-gate share is a fact about income, not policy.

- **The service share rises** with income for the first time: developmental Meridia 33.6 →
  36.6% of value added across the century, against 33.6 → 34.6% before (`pnpm composition`).
  Costona 30.5 → 35.2% against 32.8%.
- **Inequality pays a little.** Developmental Gini at 2046 is 0.463 against 0.461 on Meridia
  and 0.468 against 0.459 on Costona (`pnpm class-structure`): services are 60% professionals.
- **The minimum wage reaches the farm again** in Meridia from the 1980s, because the farm's
  market now shrinks faster than its workforce. City wages rise instead, so the living wage
  stopped binding on Veltravia's manufacturing and transport. The statute tests moved to Oranga
  (disemployment) and Kestrel (no bite). This partly answers #295.
- `price_food` and `export_share` were re-faced (`pnpm ranges`): food got cheaper and the farm
  surplus goes abroad. `price_food` is the farm price, not what a household pays for food
  (the harvest-glut rule reads it as such); its note now says so.

Evidence for any retune: `pnpm agriculture` (`food %`, `hh direct`, `interm.`, `net exp.`, `rel prod`),
`pnpm composition`, and the batches above.
