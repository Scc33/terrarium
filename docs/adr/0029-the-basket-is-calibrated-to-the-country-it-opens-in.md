# ADR-0029 — The consumption basket is calibrated to the country it opens in, and answers to income from there

**Status:** Accepted · **Date:** 2026-08-23

## Context

`pipeline/production.ts` built household demand as `budget × consumptionWeights[cohort][sid] /
effectivePrice(sid)`, with `consumptionWeights` a fixed per-cohort table set at init and never
touched again. Households in this economy could get eight times richer and buy the same basket.

That produced a defect investigation
[0013](../investigations/0013-policy-cannot-steer-sector-composition.md) measured across the whole
catalogue: **every country lost 6 to 10 points of service value-added share across a century in
which it got five to eight times richer.**

| opening → q400 | meridia | costona | veltravia | oranga | kestrel |
|---|---|---|---|---|---|
| service share | 34.2 → 26.9 | 31.4 → 25.3 | 38.1 → 29.3 | 41.3 → 31.0 | 34.3 → 26.7 |

Services *employment* rose while their value-added share fell, which is Baumol — services are
furthest from their frontier, so their productivity lags. But Baumol explains why the service
share of real output grows *slowly*. It does not explain a fall, and it cannot, because the demand
side that would pull services up was switched off. The rise of services with income is the most
robust regularity in structural change, and it ran backwards.

This is a modelling error rather than a missing feature, and it is separable from the steerability
question #139 raised alongside it — see "What this deliberately does not do".

## Decision

The stored `cohort.consumptionWeights` becomes the **authored recipe**, and what the economy is
subject to becomes a derived vector:

```
raw[i] = base[i] × (y / y_ref) ^ ENGEL_ELASTICITY[i]
                 × effectivePrice(i) ^ (1 − HOUSEHOLD_SUBSTITUTION)
w[i]   = raw[i] / Σ raw
```

`effectiveConsumptionWeights(state, cohortId)` in `pipeline/derive.ts` is the only way to read it,
and `production`, `cohorts` and `cohortCpi` all go through it. **Read the derived vector, never
`cohort.consumptionWeights`** — the same rule as `statuteForce` against `gov.statutes` (ADR-0027),
for the same reason: the stored table is the announcement, the derived one is the effect.

### The basket is calibrated to the country's own opening equilibrium

`y_ref` is `Cohort.engelReference`, sealed at init from **the same expression the running code
reads** — real income per head — so the ratio is exactly 1.0 on the first tick. Prices open at 1
for every sector and the fuel dial opens at 0, so `effectivePrice` is 1 and the price term is
neutral too. **Every country in the catalogue opens on the basket its recipe was written with**,
and the basket answers only to movement away from that opening.

The alternative was a single absolute income anchor, in the shape of `LIVING_STANDARD_1946`. Engel's
Law is genuinely about the absolute level of income, so this is the more faithful reading, and it
was rejected anyway: `CONSUMPTION_WEIGHTS` is a global per-cohort table, so an absolute anchor
would open every non-reference country with a basket its recipe did not author, put demand
immediately at odds with the authored sector structure, and fight `init`'s self-calibration of the
opening budget before the first tick. That is the ADR-0028 mistake — reading a threshold against a
global value rather than against the burden a country *inherited* — which shipped once and cost
Oranga twelve points of deposition for the structure of its own recipe.

The cost of the choice is real and should be stated: **the level of income no longer determines
the basket, only growth from your own start does.** A country that opens rich and stagnates keeps
a rich basket, which is right; a poor country that grows eightfold ends with the same basket shift
as a rich country that grew eightfold, which is not. The cross-sectional half of Engel's Law is
still authored by hand in `CONSUMPTION_WEIGHTS`, where rural workers spend 48% on food and
business owners 20%.

### `cohortCpi` stays arithmetic

It is `Σ wᵢpᵢ` over the *current* basket, not the CES exact cost-of-living index. The exact index
is geometric at σ = 1, so adopting it would move every real income in the game on a change that is
supposed to be inert, and would have destroyed the proof below. What ships is the index a
statistical office reweighting its basket would actually publish, substitution bias and all.

The risk this carries was measured rather than assumed: a moving basket makes `cohortCpi` change
for two reasons — prices moved, and weights moved — so a household substituting toward dearer
services could experience "inflation" it never faced and be punished for it by the approval step.
Annualized inflation attributable to basket movement alone is **0.08–0.12% mean, p95 0.34–0.46%**,
against an approval penalty that only bites above 4%. It is not a live problem at these
elasticities. It would become one at much larger ones.

### It shipped inert, and that is a property of the shape

At `ENGEL_ELASTICITY = 0` and `HOUSEHOLD_SUBSTITUTION = 1` both exponents are zero, so the derived
vector is the authored one bit for bit — and the weight floor is applied after normalising and
only when it binds, so it does not spoil the identity. The mechanism therefore landed on its own
commit with `pnpm diff-state --moved-only` reporting `meta.schemaVersion` and the five new
`engelReference` fields **and nothing else**, on the fuel-tax case too. The passive century
re-measured at 2.82 %/yr, 0.12% inflation, 12.26% unemployment, 6% deposed at median q368 — the
standing baseline to every digit. `tests/properties/household-basket.test.ts` asserts the identity
against the constants so a future retune cannot quietly break it.

That let two recalibrations be reviewed one at a time, which is the ADR-0008 argument applied to a
change that touches every variable in the economy.

## Consequences

**The catalogue's service share stops falling.** What the fix actually does is raise the
*attractor* the catalogue converges into, from roughly 25–31% to 30–36%. Meridia holds 33.6 →
33.0 across four hundred quarters. Veltravia (36.9 → 33.6) and Oranga (40.4 → 36.3) still fall,
because their recipes open above the demand-implied share and relax toward it — the same motion as
before, to a destination that is no longer below where every country started.

**Measured (1000 × 400q):**

| | passive | | developmental | |
|---|---|---|---|---|
| | before | after | before | after |
| real growth %/yr | 2.82 | 2.78 | 3.05 | 2.97 |
| mean inflation %/yr | 0.12 | 0.19 | −0.19 | −0.11 |
| unemployment % | 12.26 | 12.33 | 11.63 | 11.69 |
| deposed | 6% | **6%** | 9% | **15%** |

Random 120q is unmoved (3.91 → 3.90 %/yr, 29% → 30% deposed, no NaN, no price explosions).

**The passive column is the calibration test**, the same way the passive/developmental split is
for pollution (ADR-0028). A do-nothing country never gets rich enough for the income term to bite,
so it should not pay — and does not. If a retune moves passive, the income response has become a
tax on existence rather than a consequence of development.

**What development pays is inequality, and it exposes a gap rather than creating one.** Services
are staffed 60% by professionals and agriculture entirely by rural workers, while the class
transition in `demography.ts` moves people rural → urban and into no other class. So demand moving
toward services raises the **return** to being a professional and never the **number** of them:
Gini +5.8 points by 2046. That cost scales smoothly with `ENGEL_ELASTICITY.services` and is almost
entirely insensitive to agriculture's, which is why the services elasticity stops at 0.32 — 0.45
makes the share genuinely rise and costs 21% developmental deposition against 15%. The cost curve
and three candidate fixes are in
[investigation 0015](../investigations/0015-a-service-economy-cannot-make-professionals.md).

## What this deliberately does not do

Issue #139 proposed a second change beside this one: a price elasticity other than one, "what
makes PRICE levers move composition at all, and therefore what actually answers #97."

`HOUSEHOLD_SUBSTITUTION` is wired, and **it ships at 1.** The proposal was implemented, swept over
σ ∈ {1, 1.5, 2, 3}, and rejected on measurement: the basket's response to price rises monotonically
with σ exactly as the theory says (+6.1% → +10.3% weight response to a 25% price fall) while the
industrial census does not follow it (+3.02 → +2.82 points). Household consumption is one part of
final demand and a cheap sector is an input to every other sector, so the transmission is about
zero at the margin.

The sweep also found the thing that was actually binding, which nobody had measured: **a
deficit-financed subsidy raises the price it was meant to lower** — +3.4% on agriculture, +12.9%
on services — because the money lands in profits and the demand it creates outweighs the unit-cost
relief. Paid for with tax, the same subsidy takes 21–33% off the sector's price. That is where a
steerability lever should be aimed, and it needs no new economics. See
[investigation 0016](../investigations/0016-a-price-elasticity-does-not-reach-the-industrial-census.md).

Leaving the constant wired at its neutral value is deliberate: it costs nothing, it is covered by
the inert-when-off test, and it makes re-running that sweep a one-line change rather than a
rebuild.
