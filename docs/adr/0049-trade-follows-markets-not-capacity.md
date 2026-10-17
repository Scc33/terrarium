# ADR-0049 — Trade follows markets, not capacity

**Status:** Accepted · **Date:** 2026-10-17

## Context

`production` used to scale both sides of trade by the sector's own potential output
([#290](https://github.com/Scc33/terrarium/issues/290)):

```
exports = EXPORT_BASE_SHARE × qPot × openness × partner activity × (p_world·fx / p) ^ 1.5
imports = IMPORT_BASE_SHARE × qPot × openness × (p / p_world·fx·(1+tariff)) ^ 1.5
```

So a sector that grew sold proportionally more abroad whatever the world wanted, and a sector
that shrank imported less, not more. Investigation
[0023](../investigations/0023-farm-employment-is-the-rural-class-on-a-slow-clock.md) §3 found it
deciding where farm employment comes to rest: under development every country became a larger
food exporter.

Investigation [0027](../investigations/0027-food-exports-follow-prices-once-they-stop-following-capacity.md)
built this change and found that most of that surge was not the trade equations. The runner's
capacity-building arms hoarded their taxes, and the surplus left as exports on a deflating real
rate. [#319](https://github.com/Scc33/terrarium/issues/319) fixed the arms. This ADR is the trade
change, measured on top of them.

## Decision

**Exports sell from a foothold in the partners' markets.** `external.exportMarket[s]` is how much
of good *s* the partners will buy at relative price 1 and normal partner activity, in real units:

```
exportMarket₀[s]   = EXPORT_BASE_SHARE[s] × potential₀[s] × openness      (init: the 1946 order)
exportMarket[s]   ×= 1 + (g_workforce + ε[s] × g_frontier) / 4             (world, each quarter)
ε[s]               = 1 + ENGEL_ELASTICITY[s]  (+ FARM_GATE_ELASTICITY for agri)
exports[s]         = min(exportMarket[s] × activity × ratio ^ 1.5,  EXPORT_CAP_SHARE_OF_POTENTIAL × qPot[s])
```

`g_workforce` is `WORLD_WORKFORCE_ERAS`, roughly the UN's growth of the world's working-age
population. `g_frontier` is the frontier *schedule* (`frontierGrowthAt`), not `tech.frontier`:
research pushes the frontier, and the world's appetite for your goods does not answer to your
laboratories. The elasticities are the domestic basket's, read as world demand. A richer world
spends a falling share on food, and an even smaller share of that at the farm gate (ADR-0030,
ADR-0048), so the farm's world market grows slowest and services' fastest. Own capacity only
caps exports.

**Imports follow absorption.** The import propensity applies to the Leontief requirement of
domestic final demand (household, state and investment), divided by `UTILIZATION_AT_INIT`, so
`IMPORT_BASE_SHARE` keeps the potential basis it was calibrated on. FDI's imported plant is
taken out of that demand, so it is not counted twice.

**`init` seals the opening trade from `production`'s own first order.** `balanceNorm` and the
reserve book both need the opening import order. Absorption depends on household, state and
investment demand, which `init` cannot restate without restating `production`. At the opening,
demand per sector runs from 0.30 to 1.42 of potential, so no hand-computed seed is on the right
basis. `withOpeningTrade` runs the step on the assembled opening state instead.

## Alternatives

- **Keep capacity scaling and cut `EXPORT_BASE_SHARE.agri`** (0023's blunt stand-in, 0.14 →
  0.04). Rejected: it changes the opening, and it is a farm special case for a whole-trade fact.
- **Scale world demand with world income alone (no Engel term).** Rejected: the world's food
  market would grow as fast as its machinery market, and that is the surge again.
- **A globalisation term** (world trade growing faster than income until 2008). Measured in 0027
  §4 on the hoarding arms: it removes their deflation and brings the food exports back (Costona's
  developmental farm net exports 0.50). Not needed once the arms stop hoarding.
- **A world price trend, or higher FX pass-through.** Measured in 0027 §4: too small, and
  ADR-0034's rails respectively. The closure they were aimed at was the arms' surplus (#319).
- **Imports from final demand only, not the Leontief requirement.** Rejected: energy and
  manufactured inputs are mostly intermediate, so their imports would stop following the
  activity that uses them.
- **Seed `init`'s balance by restating demand there.** Rejected for the reason above. That is
  the init-seeding invariant `lastRealIncome` and the tariff base were both caught by.

## Measured

On top of #319, with [ADR-0050](0050-a-persistent-imbalance-stays-priced.md) and every survey arm
handing its surpluses back. 1000 × 400q batches with `--country all`, and random at 1000 × 120q:

| | passive | developmental | regulated | random |
|---|---|---|---|---|
| growth %/yr | 2.86 → **2.85** | 2.97 → **2.98** | 2.97 → **2.98** | 4.13 → 4.11 |
| mean inflation %/yr | 0.11 → 0.00 | 0.33 → 0.20 | 0.32 → 0.20 | 0.50 → 0.35 |
| unemployment % | 12.99 → 13.12 | 11.77 → 11.93 | 11.67 → 11.87 | 13.46 → 13.51 |
| deposed | 1% → **1%** | 3% → **4%** | 3% → **4%** | 21% → 22% |

The extra point of developmental deposition is Kestrel, 13% → 16% (regulated 12% → 14%); every
other country is within a point.

Farm net exports as a share of farm demand in 2046 (`pnpm agriculture`), developmental: Oranga
0.27 → **0.19**, Veltravia 0.14 → 0.10, Kestrel 0.19 → 0.14; Meridia and Costona 0.18 → 0.19 and
0.16 → 0.19. Developmental farm employment is 7.6–9.1%. Passive moves the same way (Oranga 0.30 →
0.21, Kestrel 0.19 → 0.13).

`pnpm export-share` at Q160: public investment at 10% of GDP goes from +10.6% real exports to
**−23.1%**, education from +24.0% to +16.1%, and all capacities from +8.1% to +0.7%. The tax
office (+26.9% → +21.9%) and the zero tariff (+5.1% → +5.3%) barely move. The levers that worked
by building capacity lost most, as #290 predicted. 0010's ranking needs re-reading.

**The survey arms stop hoarding too.** `pnpm ranges` drives five governments through six
countries to set the dial faces. The welfare and extractive arms banked tax takes of 60–68% of
GDP. With exports no longer scaling with capacity, that surplus could only leave through price:
welfare Costona's food ended at 0.07 of its 1946 price. Both arms, and the maximal one, now turn
`surplusPayout` up like the builders (#319). Re-measured faces: `export_share` 0–25 (p01–p99
1.5–16.0, maximum 22.5) and `price_food` 15–225 (p99 173.9, maximum 265.8, in the extractive arm,
which now spends what it used to bank behind a 40% tariff).

## Consequences

- **Selling more abroad takes being cheaper, not being bigger.** A player who builds capacity
  sells it at home or not at all, until prices or the currency make it competitive. The FX dial
  and the tariff are worth what they were; building capacity is worth less for exports.
- **Unemployment runs 0.05–0.2 points higher and inflation 0.1–0.15 points lower on every arm.**
  Imports now rise with what the country absorbs, so they leak more demand than they did when they
  followed capacity. Without ADR-0050 it was twice that. The passive baseline's growth and
  deposition hold, which is the calibration test.
- **Reserve cover runs low in developers.** Under `pnpm currency` §4, developmental Meridia,
  Costona and Oranga end the century on 0.4–0.6 quarters of cover against a target of about 2,
  with current-account deficits of 0.9–1.5% of GDP. The bank's top-up is one-sided and slower than
  an import bill that now grows with absorption. Nothing breaks unless a player orders a defence
  from that position. That is a reachable situation now, and worth watching.
- **The minimum wage reaches more farms.** The farm wage no longer rides on capacity-scaled
  export demand, so the living wage binds on about half of `proc-0 … proc-199`'s farms, against
  one before. No curated country binds on city wages. `statutes.test.ts` now uses `proc-1`,
  `proc-2` and Veltravia.
- **A fast grower's manufactures cannot outgrow the world's appetite except by getting cheaper.**
  The maximal builder's exports fall to 1–4% of GDP, and it runs a deficit of 4–5% of GDP that
  ADR-0050 now prices but cannot close, because the depreciation passes into prices. Under
  Krugman's 45-degree rule, a differentiated good's world market share grows with the varieties
  a country makes. Measured: scaling manufactures and services by own capacity again, which is the
  old rule, lifts the maximal arm's exports from 1% to 4% of GDP and its deficit from −5.1% to −4.0%.
  Whether differentiated goods should keep that while commodities do not is the open question.
- **#203 is closer.** FX parity and the terms of trade still weight prices by the fixed
  `EXPORT_BASE_SHARE` / `IMPORT_BASE_SHARE` basket. Once the composition of trade can move, that
  basket stops describing what the country actually sells.
