# 0018 — Composition cannot hear the class structure, because cohort income does not know how many people are in the cohort

**Status:** Open — and it is the live constraint on issue #97 (steerability).
**Amended 2026-08-30 (schema 43, ADR-0035):** the second finding at the foot of this document
("a live defect in what cohorts experience") has been fixed — staffing is now rationed against
each cohort's labour force. That also qualifies the *mechanism* below: cohort size now reaches
wage income wherever a class is short or spare, so "moving a head transfers no money" holds only
in the unconstrained region. **Result 2 and the conclusion are unaffected** — sector employment
is still set by demanded output, so composition still cannot hear the class structure, and
capital allocation is still the only direction left standing.

**Raised by:** wiring the second leg of the class transition (ADR-0032, #169). The mechanism
works and it moves the Gini six points; it moves the industrial census by **−0.22 points**. That
gap is the finding, and it is the third measured wall between the player and "what kind of
country is this."

**Measured at:** `c269f17` on 2026-08-28. Meridia unless stated, capacity-building government
with protected tenure and unlimited political capital, so what is measured is the channel and
not the bill.

## Result 1 — the staffing table asks for people who do not exist

`LABOR_SOURCE` splits every sector's payroll across cohorts in fixed proportions. `skillTightness`
in `pipeline/derive.ts` is the headcount that implies, divided by the people actually in the
cohort. Above 1 the table is asking for workers who are not there:

| developmental, jobs ÷ own labour force | q4 | q120 | q240 | q400 |
|---|---|---|---|---|
| Meridia — professionals | 0.86 | 0.93 | 1.26 | **1.72** |
| Meridia — urban workers | 0.87 | 0.63 | 0.65 | **0.71** |
| Meridia — rural workers | 0.92 | 1.07 | 1.13 | 1.24 |
| Costona — professionals | 1.23 | 1.11 | 1.63 | **2.50** |
| Costona — urban workers | 1.03 | 0.57 | 0.57 | **0.61** |
| Veltravia — professionals | 0.60 | 0.82 | 0.94 | 1.07 |

Passive play is the same shape (Meridia professionals 0.86 → 1.62). Nothing anywhere constrains
this ratio, because sector employment is set by demanded output in `pipeline/labor.ts` and the
only labour-supply limits in the model are the aggregate `0.97 × lf` ceiling and agriculture's
subsistence cap against the rural labour force.

This is the reason a wage premium is useless as a signal about professional scarcity, and it is
why ADR-0032 gates the class transition on this ratio instead: professionals and urban workers
both earn `wages.services`, so the shortage is visible in the headcounts and invisible in the
wage table.

## Result 2 — six points of professionals moves the Gini and not the census

The clean counterfactual: take 6 points of the non-retired population from `urban_workers` and
give them to `professionals` **at init**, hold every other input, run 6 seeds × 400 quarters.

| | professionals q400 | services VA | agri VA | manuf VA | Gini | living std | real GDP |
|---|---|---|---|---|---|---|---|
| unchanged | 12.2% | 33.55% | 18.65% | 22.10% | 0.5094 | 2.958 | 1341 |
| +6 points | 18.2% | **33.33%** | 18.73% | 22.18% | **0.4727** | 3.075 | 1367 |

**−0.22 points of service value added, and −3.7 points of Gini.** The class structure is a
powerful distributional instrument and not a compositional one at all — and the sign on services
is the wrong way round.

## Why: a cohort's income does not depend on how many people are in it

`pipeline/cohorts.ts` builds every income line from tables that ignore cohort size:

```ts
const share = LABOR_SOURCE[s.id][c.id] ?? 0
grossWage += s.employment * share * market.wages[s.id]
```

and `profitIncome` is `PROFIT_SHARE[c.id]`, and `transferIncome` is `TRANSFER_SHARE[c.id]`. So
moving a head from `urban_workers` to `professionals` transfers **no money at all**: it divides
the same professional wage bill among more people and the same urban wage bill among fewer.

Everything demography can reach follows from that. Cohort size changes **income per head**, and
therefore the Gini, approval, the vital rates, the migration comparison, and the Engel weights
(ADR-0030). It changes the **labour force**, because participation differs by cohort (0.60 for
professionals against 0.55). It changes **politics**, through enfranchisement and bloc power. It
cannot change **aggregate demand composition**, because no cohort's budget moved — and the Engel
term nearly cancels, since the professionals who got poorer per head shift back toward food by
as much as the urban workers who got richer shift toward services.

## Where this leaves #97

Three walls have now been measured between a player and the composition of their economy, and
each ruled out the previous prescription:

1. **[0013](0013-policy-cannot-steer-sector-composition.md)** — no price lever moves composition.
   Diagnosed as Cobb-Douglas unit elasticity.
2. **[0016](0016-a-price-elasticity-does-not-reach-the-industrial-census.md)** — that diagnosis
   was implemented as CES and **rejected on measurement**: the basket response rises with σ and
   the value-added share does not follow, because household consumption is one part of final
   demand and a cheap sector is an input to every other sector. What actually bound was that a
   deficit-financed subsidy *raises* the price it was meant to lower.
3. **This one** — the labour force is not a channel either, for a reason that has nothing to do
   with elasticities or financing: composition cannot hear it.

The three agree on where to look next, and it is not the demand side. **Composition in this
engine is decided on the supply side**, and there is exactly one place where the supply side is
allocated between sectors with no policy input whatsoever — `pipeline/labor.ts`:

```ts
const pressures = state.sectors.map((s) => Math.max(0.05, s.capacityUtilization - 0.5))
// …
capital: s.capital * (1 - DEPRECIATION_Q) + flows.investmentReal * (pressures[i] / pressureSum)
```

Every unit of investment in the economy is allocated by utilization pressure alone. There is no
dial, statute, or appropriation that touches it. This is 0016's second recommendation ("capital
allocation, not household demand") and it is now the only one of the three still standing:
0016 measured that the +1.2 to +1.8 points a deficit subsidy *does* achieve arrives through
exactly this channel — profits → capital — rather than through the basket.

For reference, the current state of the levers (measured at `c269f17`, schema 40, `pnpm
composition`, value-added share at q400, subsidy re-indexed annually at 5% of GDP):

| arm | agri | manuf | energy | services | transport | real GDP | Δ own share |
|---|---|---|---|---|---|---|---|
| passive | 18.0% | 21.5% | 18.7% | 34.1% | 7.6% | 1392 | — |
| agri subsidy | 19.8% | 20.6% | 18.0% | 33.9% | 7.7% | 1422 | +1.84pt |
| manuf subsidy | 17.0% | 22.8% | 18.2% | 34.3% | 7.7% | 1411 | +1.30pt |
| services subsidy | 17.1% | 21.2% | 18.4% | 35.6% | 7.7% | 1429 | +1.44pt |
| tariff 60% | 17.9% | 21.6% | 18.6% | 34.2% | 7.6% | **1273** | — |

The tariff row is unchanged from 0013 and still the one to look at twice: sixty years of 60%
protection moves manufacturing by 0.1 points and costs 8% of real GDP.

## A second, smaller thing worth fixing on its own

Result 1 is also a live defect in what cohorts *experience*, independent of steering.
`pipeline/cohorts.ts` computes `jobless = 1 − employed / laborForce[c]` from the same
oversubscribed table, so on a developmental Meridia the professionals cohort reads as **fully
employed for the last third of the century** (the ratio is clamped at zero) while urban workers
read as **29–37% jobless** against a headline unemployment rate near 12%. Approval is scored
against that number. ADR-0032 improves it — it is why urban workers' income per head rises from
5.1x to 5.7x — and does not remove it.

The fix is to let `LABOR_SOURCE` respond to who is available: a sector short of professionals
staffs itself from urban workers instead, at some cost. That change has an obvious neutral
setting (a substitution exponent of zero reproduces today exactly), which makes it shippable
under the usual discipline. It was deliberately kept out of ADR-0032, whose diff is a demography
change and already moves the political baselines.

## What would settle it

A directed-investment instrument, and then `pnpm composition` against the table above. The
number to beat is still 0016's **+3.02 points**, which is what the best available price lever
achieves on agriculture with its financing fixed.
