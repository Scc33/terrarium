# ADR-0032 — Schools set the ceiling on the professional class; the shortage decides who crosses

**Status:** Accepted · **Date:** 2026-08-28 · **Schema:** 40

## Context

The class transition in `pipeline/demography.ts` moved people rural → urban and nowhere else:

```ts
rural_workers: d.classShares.rural_workers - move,
urban_workers: d.classShares.urban_workers + move,
```

`professionals` was therefore a fixed share of the non-retired population for the whole century,
whatever the economy asked for — 12.2% at quarter 4 and 12.2% at quarter 400 on Meridia, while
rural workers fell from 48.4% to 21.3%. Services are staffed 60% from professionals, so a
country could shift its whole demand structure toward services and never make one more of the
people who do that work.

Investigation 0015 raised this as a distributional problem: the return to being a professional
would rise because the number could not. That claim was **measured and did not hold** — the
service wage converges against agriculture's over the century (2.42 → 1.91) and professionals'
real income per head tracks rural workers' almost exactly (13.0x against 12.9x, indexed to q4).
The Gini rise 0015 attributed to professionals comes from retirees, whose fixed cash transfers
erode against a century of growth, and from urban workers, who lag as the transition pours
people into cities faster than urban wages rise.

What survived measurement was the **supply** fact, and a second one nobody had looked at. The
staffing table `LABOR_SOURCE` hands each sector's payroll to cohorts in fixed proportions, and
the headcounts it implies were already impossible: a developmental Meridia ends the century
asking for **1.7 professionals for every professional it has** (Costona 2.5), while leaving a
third of its urban workers unaccounted for. `skillTightness` is that ratio. A service economy
that cannot make professionals is a missing mechanic on its own terms, before any argument
about who it makes richer.

## Decision

The class transition gets a second boundary: **urban worker → professional.** Two separate
facts decide it, and which is which is the whole mechanism.

**Schools set the ceiling.** `professionalCeiling(d)` is

```
professionalBaseline × (humanCapital / schoolingBaseline) ^ PROFESSIONAL_SCHOOLING_ELASTICITY
```

capped at `PROFESSIONAL_SHARE_MAX`. Both baselines are sealed at `init` from the country recipe
and never written again. It reads `demography.humanCapital` and not `gov.capacity.education`,
because it is the taught workforce that can staff a profession and not the building programme
(ADR-0023) — which puts a generation between the policy and the class structure, on top of the
crossing rate itself.

**The shortage decides who crosses.** The rate is the headroom to the ceiling times
`skillTightness.professionals / skillTightness.urban_workers − 1`, clamped to [0,1], times the
same `jobsPull` that stops the buses to the cities in a slump. Professional work going begging
while urban labour sits idle is the same "people go where the work is" fact the rural→urban leg
already runs on.

People only ever cross **into** the professions. Human capital is carried by people already at
work, so a government that lets the schools rot lowers the ceiling below where the country
already is and the leg stops — it does not un-teach anybody.

Two constants are measured rather than chosen:

- **`PROFESSIONAL_SCHOOLING_ELASTICITY = 0.6`** is the slope of ln(opening professional share)
  on ln(opening education capacity) across the five curated recipes, which were authored
  independently of this mechanism and are therefore evidence about it. Regressed: 0.594.
- **`ENGEL_ELASTICITY.services` moves 0.32 → 0.45**, which is the acceptance criterion issue
  #169 wrote for itself. The shipped 0.32 was a compromise with the constraint this ADR removes.

## Alternatives considered

**An absolute law — a global curve from human capital to the professional share.** Rejected on
the same argument as ADR-0028's pollution baseline, one register over. The catalogue authors
opening professional shares from 7.1% (agrarian Costona) to 20.6% (maritime Oranga) beside
opening school systems from 0.09 to 0.48, and no single curve passes through all five. A global
law would move four of the five countries' class structures in 1946Q1 for their authored
structure, and it would be invisible in the passive baseline because that baseline is measured
on Meridia — which sits almost exactly on the fitted line. That is precisely how the pollution
bug shipped.

**Gating the crossing on a wage premium**, mirroring the rural→urban leg's `wageGap`. This was
implemented first and is wrong, because there is no wage a professional earns that an urban
worker does not: they share `wages.services`, and **services is the low-wage sector until
roughly 2005** in every century the catalogue runs — measured, `wages.services` against the
mean of manufacturing, energy and transport runs 0.64–0.83 until quarter 240. A premium gate
clamps to zero for the first sixty years of the playable century. It would have been a mechanic
nobody could reach.

**Rural → professional directly.** Rejected: the model already has a ladder, and letting people
step from the farm to a profession skips the rung the urbanization leg exists to represent.

**Making `LABOR_SOURCE` respond to who is available**, so a sector short of professionals staffs
itself from urban workers instead. This is a real defect — the staffing table is a wage-split
recipe whose implied headcounts are already impossible — but it is a different change with a
much larger blast radius, and it is where the steerability question has to be aimed next. See
[investigation 0018](../investigations/0018-composition-cannot-hear-the-class-structure.md).

**Nothing**, and let the player answer a rising professional premium with transfers and the
statute book. This was 0015's third candidate and it was defensible when the premium was
believed to be rising. It is not, once measured: there is no premium to answer, and the missing
mechanic is the supply of professionals itself.

## Consequences

Measured at `c269f17`, 1000 runs × 400 quarters, and the A/B is exact: at
`PROFESSIONALIZATION_GAIN = 0` the engine is bit-identical to schema 39.

| developmental, 1000 × 400q | v39 | v40 |
|---|---|---|
| deposed | **15%** | **7%** |
| real growth %/yr p50 | 3.02 | 3.05 |
| unemployment p50 | 11.78 | 11.90 |

**The mechanism refunds the entire political cost of ADR-0030.** The basket took developmental
deposition from 9% to 15% when it shipped; this takes it back to 7%. Meridia's Gini at q400
falls from 0.512 to 0.451 and its living standard rises 2.94 → 3.15, because the scarcest and
best-paid class stops being a fixed share: professionals' real income per head goes from 13.0x
to 7.5x while urban workers' — the cohort that was actually lagging — goes 5.5x to 6.5x.

**Passive play is bit-identical, and that is the calibration test.** A government that never
opens a school sits exactly on its opening ceiling, so `rise` is exactly zero and
`x + 0 === x` carries the rest. Verified directly on all five curated countries over 400
quarters, and by `pnpm diff-state --moved-only` reporting `meta.schemaVersion` and the two new
fields before the Engel change was made. If a later retune moves passive here, the ceiling has
become a tax on existence rather than a return to schooling — the ADR-0028 and ADR-0030 rule
again.

**The Engel elasticity is no longer buying deposition.** Measured with the leg in place, at
services η ∈ {0.32, 0.45, 0.60} developmental deposition is 7% at all three, against 9% / 15% /
21% on schema 39. What the elasticity still trades is the service share against the Gini and the
living standard, which is Baumol and is honest:

| services η (with the leg) | service VA, open → q400 | Gini q400 | living std q400 |
|---|---|---|---|
| 0.32 | 33.5 → 32.9 | 0.451 | 3.15 |
| **0.45 (shipped)** | **33.4 → 34.2** | **0.455** | **3.07** |
| 0.60 | 33.3 → 35.5 | 0.459 | 2.99 |

0.45 is shipped because it is the lowest setting at which the service share **rises** with
income rather than merely stopping its fall — the structural-change regularity investigation
0013 flagged as running backwards. Passive deposition costs one run in a hundred (7% → 8%) and
passive growth is unchanged at 2.83 %/yr.

**Composition is untouched, and that is a finding rather than a disappointment.** Six points of
professionals moves the service value-added share by −0.22 points. Cohort income in this engine
is independent of cohort size — `LABOR_SOURCE` splits each sector's payroll by a fixed recipe —
so demography can reach distribution, participation, vital rates and politics, and cannot reach
the industrial census at all. Anyone reading this ADR as an answer to #97 should read
[investigation 0018](../investigations/0018-composition-cannot-hear-the-class-structure.md)
instead.

**Two new sealed fields** (`professionalBaseline`, `schoolingBaseline`) and no new replay input.
Saves carry no TrueState and replay from the country vector, so every existing save reconstructs
both at `init` and there is no migration.
