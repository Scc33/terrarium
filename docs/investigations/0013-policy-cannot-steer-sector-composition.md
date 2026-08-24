# 0013 — No lever in the game can steer sector composition, and the service share falls as the country gets rich

**Status:** Resolved — see the resolution at the foot of this file. Result 2 was a modelling
error and is FIXED (ADR-0030). Result 1 was right about the symptom and wrong about the cause;
the cause is in [0016](0016-a-price-elasticity-does-not-reach-the-industrial-census.md).

**Raised by:** issue #97 ("if I wanted to become an export driven economy how would I do that?"), while
scoping a steerability statute for the statute book (ADR-0027). The statute was not written: the
measurement below says it would have been a new lever on a blocked channel. Sibling to
[0010](0010-how-to-grow-export-share.md), which reached the missing-lever conclusion from the
export share's side; see "How this sits with investigation 0010" below.

**Measured at:** `d5a5a08` on 2026-08-23. Meridia and Costona, capacity-building government with
protected tenure and unlimited political capital, so that what is measured is the CHANNEL and not
the bill. Shares are of real value added at base prices (`sectorValueAdded`), which is the
composition twin of the published industrial census.

## Method

Six arms over 240 quarters on Meridia, identical except for one sustained policy:

- passive
- a subsidy worth **5% of GDP every quarter for sixty years** to manufacturing, to services, and to
  agriculture (three arms) — far past anything a real budget could carry
- a **60% tariff** from quarter 8
- free trade (tariff to zero) from quarter 8

## Result 1 — the levers do not move composition

Value-added share at 2006:

| arm | agri | manuf | energy | services | transport | real GDP |
|---|---|---|---|---|---|---|
| passive | 24.9% | 20.6% | 16.8% | 30.0% | 7.7% | 767 |
| manufacturing subsidy | 24.2% | **21.4%** | 16.6% | 30.0% | 7.8% | 792 |
| services subsidy | 24.1% | 20.3% | 16.6% | **31.2%** | 7.8% | 797 |
| agriculture subsidy | **26.0%** | 20.0% | 16.5% | 29.7% | 7.8% | 787 |
| tariff 60% | 24.7% | **20.7%** | 16.8% | 30.0% | 7.7% | **722** |
| free trade | 25.0% | 20.6% | 16.8% | 29.9% | 7.7% | 770 |

Sixty years of a subsidy no treasury could afford moves the targeted sector's share by **0.8 to 1.2
percentage points**. Employment moves a little more — manufacturing 29.3% → 31.0% under its own
subsidy — and still not much.

The tariff row is the one to look at twice. A 60% tariff changes the manufacturing share by **0.1
points** and costs **6% of real GDP**. It is a lever that does essentially nothing except make the
country poorer, and free trade is indistinguishable from passive.

## Why: Cobb-Douglas weights pin nominal expenditure shares

`pipeline/production.ts` builds household demand as

```
householdDemand[sid] += budget × consumptionWeights[cohort][sid] / effectivePrice(sid)
```

with `consumptionWeights` a fixed per-cohort table. That is Cobb-Douglas: **unit price elasticity.**
A subsidy that lowers a sector's price raises the real quantity demanded exactly one-for-one with
the price fall, so the sector's share of *nominal* expenditure is unchanged by construction — and
its value-added share barely moves.

So no price-based lever can steer composition. Not the subsidies, not the tariff, not the fuel
excise. The residual movement in the table above is second-order: profits, capital allocation by
utilization pressure, and the trade terms — not demand.

This is the same wall AGENTS.md already records against `ELITE_ABSORB`: *"the engine's consumption
weights are FIXED per cohort (no Engel shift), so the services share of output is pinned by demand
and cannot move in response to productivity whatever the veto does."* That note was written about
the extractive ceiling. It generalizes to every lever on the desk.

## Result 2 — transformation happens, but the service share goes the wrong way

The economy does transform on its own, driven by supply: productivity differences, capital
accumulation, and the subsistence valve emptying as industry can absorb people.

Meridia, capacity-building century — value added above, employment below:

| | 1947 | 1956 | 1976 | 2006 | 2046 |
|---|---|---|---|---|---|
| agri VA | 28.1% | 29.0% | 26.9% | 24.9% | 22.3% |
| manuf VA | 17.5% | 16.9% | 17.4% | 19.9% | 23.4% |
| **services VA** | **34.3%** | 33.4% | 32.3% | 29.7% | **27.6%** |
| agri employment | 46.0% | 47.0% | 40.5% | 35.4% | 30.6% |
| manuf employment | 22.4% | 23.0% | 26.4% | 28.1% | 30.1% |
| services employment | 22.7% | 22.1% | 24.7% | 27.6% | 30.0% |
| consumption per head | 8.52 | 9.86 | 17.69 | 41.45 | **69.89** |

Costona is the same shape from further back: agricultural employment 53.5% → 31.5%, manufacturing
20.1% → 31.1%, services value added 31.7% → **26.0%**.

Agricultural employment falling by fifteen points and manufacturing rising by eight is a plausible
industrialization. **The service share of value added falling while the country gets eight times
richer is not.** The rise of services with income is the most robust regularity in structural
change, and here it runs backwards.

Services *employment* does rise (22.7% → 30.0%) while its value-added share falls, which is
consistent with Baumol — services are furthest from their frontier, so their productivity lags. But
Baumol explains why the service share of *real* output grows slowly. It does not explain a fall,
and it cannot, because the demand side that would pull services up is switched off.

## How this sits with investigation 0010

[0010](0010-how-to-grow-export-share.md) asked why stimulus could not lift the export *share* and
answered it at the level of the ratio: the denominator is all final expenditure, so a policy that
raises exports 80% while raising total expenditure 154% lowers the share. It closed by noting there
is no direct export-promotion dial, and that adding one is the feature work proposed by #53 and #97.

This investigation is the layer underneath that, and it qualifies the conclusion. **An
export-promotion lever would move the export share and still leave the industrial census where it
was.** 0010's own reading of the export order says why: exports are `base share × potential output ×
openness × foreign demand × (relative price)^1.5`, so a promotion lever scales a sector's exports —
but the domestic demand it is competing against is pinned by fixed weights, and value added is
dominated by domestic absorption at these openness levels. The share of expenditure would move; what
kind of country it is would not.

The two findings agree on the diagnosis and differ on the prescription. 0010 points at a missing
lever. This one says the lever would land on a channel that cannot carry it, and that the demand
side has to move first.

## What this means for #97

**A steerability statute would not have worked.** "Become an export economy" and "become a services
economy" are questions about composition, and composition is currently pinned by demand. A statute
scaling the export base would move the export *share of expenditure* while leaving the industrial
census almost where it was — which is worse than no lever, because it would look like steering.

The visibility half of #97 is already built: the industrial census publishes value added and
employment by sector, and the industry overlay draws the composition, its history, and which
sectors are growing (`industryGrowth`). The player can see the transformation. They just cannot
touch it.

## What would settle it

Two separate changes, and they do different jobs — a proposal, not a decision:

1. **An income (Engel) response in the consumption weights.** Food share falls and service share
   rises as a cohort gets richer. This is what makes GROWTH and REDISTRIBUTION transform the
   economy, and it is the fix for the falling service share above. It would not, on its own, make
   subsidies steer anything.
2. **A price elasticity other than one** — CES rather than Cobb-Douglas in the household basket.
   This is what makes PRICE levers (subsidies, tariffs, the fuel excise) move composition at all.

Either is a recalibration of the whole economy: composition feeds prices, prices feed wages, and
the passive century moves. Both therefore want their own ADR and their own review, and neither
should ride along with an unrelated change — a diff that moves every variable is a diff nobody can
read, which is the ADR-0008 argument.

Before doing either, re-measure: these numbers were taken with unlimited political capital and
protected tenure, which is right for isolating a channel and wrong for saying what a player
experiences.

---

## Resolution (2026-08-23, schema 35)

Both halves were re-measured with `pnpm composition`, which is this investigation's method turned
into a tool — the numbers above were taken by hand on a branch and nothing in the repo could
reproduce them. It replicates the table to within a decimal, and it found one methodological
error in doing so: **a subsidy dial set once is not a sustained subsidy.** Nominal GDP rises
fortyfold over the century, so a cash figure posted in 1948 is worth almost nothing by 2006. Set
once, the arms move 0.13–0.33 points rather than 0.8–1.2 — the lever switching itself off, not
failing. The tool re-indexes annually.

### Result 2 — FIXED

The falling service share was a modelling error and it is corrected. Household weights now shift
with a cohort's real income (ADR-0030), which raises the attractor the catalogue converges into
from roughly 25–31% to 30–36%. Meridia holds 33.7 → 33.2 across four hundred quarters against
34.2 → 26.9. Countries that open ABOVE the demand-implied share still relax toward it — that is
convergence, and the defect was that the destination sat below where every country started.

It stops at flat rather than rising, and the reason is measured:
[0015](0015-a-service-economy-cannot-make-professionals.md).

### Result 1 — right symptom, wrong cause

This investigation attributed the missing steering to Cobb-Douglas unit price elasticity. That
diagnosis was implemented as CES, swept over σ ∈ {1, 1.5, 2, 3}, and **rejected on measurement.**
Two corrections:

- **Cobb-Douglas pins the NOMINAL expenditure share, not the REAL value-added share.** Under unit
  elasticity a price fall raises real quantity one-for-one, so a response to a price lever was
  there all along. Raising σ raises the basket's response exactly as the theory says (+6.1% →
  +10.3%) and the industrial census does not follow (+3.02 → +2.82 points): household consumption
  is one part of final demand, and a cheap sector is an input to every other sector.
- **What was actually binding is that a deficit-financed subsidy raises the price it was meant to
  lower** — +3.4% on agriculture, +12.9% on services, because the money lands in profits and the
  demand it creates outweighs the unit-cost relief. Paid for with tax, the same subsidy takes
  21–33% off the sector's price and its composition effect nearly doubles. Nobody had measured
  this, and it is why "the levers do not move composition" looked like an elasticity problem.

The conclusion this investigation reached about #97 — that a steerability statute would have been
a lever on a blocked channel — **still stands**, and so does the advice not to ship one yet. What
changes is where to point the next attempt. Full evidence and three candidate directions:
[0016](0016-a-price-elasticity-does-not-reach-the-industrial-census.md).
