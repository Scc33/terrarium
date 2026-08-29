# 0015 — A service economy raises the return to being a professional, and can never make more of them

**Status:** Resolved — see the resolution at the foot of this file. The SUPPLY half was right
and is fixed (ADR-0032, schema 40). The DISTRIBUTIONAL half — that the return to being a
professional rises — was **falsified on measurement**: there is no premium, and the Gini rise
this document attributes to professionals comes from retirees and urban workers. Fixing the
supply half lowered the Gini six points anyway, for a reason this document did not anticipate.

**Raised by:** calibrating the Engel response in ADR-0030. This is the constraint that decided
where `ENGEL_ELASTICITY` stops, so it is evidence for a shipped number rather than an idle
observation.

**Measured at:** `d08d0ad`+ on 2026-08-23, Meridia, capacity-building government, 60 seeds ×
400 quarters for the political columns and 1000 × 400 for the deposition rates. The shipped row
was re-measured after the `lastRealIncome` basis fix; the sweep rows were not, so compare them with
each other rather than with the endpoints.

## The finding

Household demand can now move between sectors (ADR-0030). The labour force cannot follow it.

`LABOR_SOURCE` staffs agriculture entirely from `rural_workers` and services 60% from
`professionals`, 40% from `urban_workers`. The class transition in `pipeline/demography.ts` moves
people **rural → urban and nowhere else**:

```ts
rural_workers: d.classShares.rural_workers - move,
urban_workers: d.classShares.urban_workers + move,
```

So `professionals` is a fixed share of the non-retired population for the whole century, whatever
the economy asks for. When demand shifts toward services, the wage and profit of a professional
rise and the *number* of professionals does not. Every point of service share the demand side
buys is therefore also a transfer from the poorest cohort to the richest working one.

## The cost curve

Four settings of `ENGEL_ELASTICITY`, everything else identical. Service value-added share is
Meridia, settled opening → q400; Gini and living standard are medians at q400; deposition is the
1000 × 400q batch.

| services η | agri η | service share | Gini q400 | living std q400 | passive deposed | developmental deposed |
|---|---|---|---|---|---|---|
| 0 (v34) | 0 | 34.2 → 26.9 | 0.456 | 3.47 | 6% | 9% |
| +0.25 | −0.30 | 33.7 → 31.8 | 0.503 | 3.10 | — | — |
| **+0.32** | **−0.35** | **33.7 → 33.2** | **0.514** | **3.00** | **7%** | **15%** |
| +0.45 | −0.35 | 33.5 → 34.6 | 0.527 | 2.88 | — | — |
| +0.45 | −0.60 | 33.4 → 34.9 | 0.530 | 2.88 | 8% | 21% |

It is a smooth trade, and it does not depend on agriculture's elasticity: moving the give from
food onto manufacturing and energy (`agri −0.35` against `−0.60`, same services) changed the Gini
by 0.3 points and deposition by two runs in sixty. **The services elasticity is the whole of it.**

The passive column is the tell. A do-nothing country never gets rich enough for the income term to
bite, so passive deposition barely moves at the shipped setting — 6% to 7%, against a
developmental 9% to 15% — the same passive/developmental split ADR-0028 has, and for a related
reason. Only a country that develops pays. (The shipped row also carries the `lastRealIncome`
basis fix landed alongside it; the intermediate rows were measured before it, so read the middle
of this table for its SHAPE and the endpoints for their levels.)

## What was ruled out

**Substitution registering as inflation.** Cohort approval reads own-basket inflation, and
`cohortCpi` now changes for two reasons — prices moved, and weights moved. A household
substituting toward dearer services would experience "inflation" it never faced and be punished
for it. Measured directly, annualized inflation attributable to basket movement alone is **0.08 to
0.12% mean, p95 0.34 to 0.46%**, against an approval penalty that only bites above 4%. Not the
channel. (Worth keeping in mind if the elasticities are ever raised much further.)

## Why this was not fixed here

Making the class transition supply professionals is a **demography** change: a second destination
for `move`, gated on something — service employment, human capital, the education capacity — and
every one of those choices is a design decision with its own baseline consequences. Landing it
inside a demand-side change would produce a diff moving every variable for two unrelated reasons,
which is the ADR-0008 argument.

It is also not obviously the only fix. Three candidates, none measured:

1. **A third leg on the class transition** — rural/urban → professionals, pulled by the same
   wage-gap-and-jobs mechanism that already moves people to the cities. Cheapest, and the most
   likely to be right: it is the same fact ("people go where the work is") applied to a second
   boundary.
2. **Human capital as the gate.** `demography.humanCapital` is already the stock schools
   replenish, and "how many people can do professional work" is closer to what that stock means
   than anything currently reading it. This would make the education capacity the answer to the
   inequality the service transition creates, which is a good shape for a policy game.
3. **Nothing** — accept that a rising professional premium is what a service transition does, and
   let the player answer it with transfers and the statute book. This is defensible and it is what
   ships today; the objection is that it is currently unanswerable rather than expensive to
   answer.

## What would settle it

Pick one, wire it, and re-run the cost curve above. The question the table has to answer is
whether the Gini still rises with the services elasticity once the labour force can follow demand.
If it does not, `ENGEL_ELASTICITY.services` should be revisited immediately — the shipped 0.32 is
a compromise with a constraint, not a measurement of Engel's Law, and the service share stopping
flat rather than rising is the visible cost of it.


---

## Resolution (2026-08-28, schema 40)

Both halves were re-measured with `pnpm class-structure`, which is this investigation's method
turned into a tool — the numbers above were taken by hand and nothing in the repo could
reproduce them. Half of them did not survive.

### The supply fact — CONFIRMED, and fixed

`professionals` was indeed pinned at 12.2% of the non-retired population for four hundred
quarters while rural workers fell 48.4% → 21.3%. That is now a second boundary on the class
transition: schools set a ceiling on how many people could do professional work, and the
shortage of professional work decides how many cross (**ADR-0032**). Meridia under a
capacity-building government reaches 22.0% by 2046.

The mechanism is gated on the **shortage** (`skillTightness`) rather than on a wage premium,
because the first implementation used a premium and could not be reached: professionals and
urban workers share `wages.services`, and services is the LOW-wage sector until roughly 2005 in
every century the catalogue runs.

### The distributional story — NOT CONFIRMED

The claim was that when demand moves toward services the *return* to being a professional rises
because the *number* cannot. Measured, the service wage does not pull away at all:

| | q4 | q40 | q240 | q400 |
|---|---|---|---|---|
| service wage / agri wage | 2.418 | 2.840 | 2.259 | **1.914** |

It rises for a decade and converges for ninety years. Real income per head, indexed to q4, at
q400 — before the fix:

| rural | urban | professionals | business owners | retirees |
|---|---|---|---|---|
| **12.87** | 5.51 | **13.01** | 7.99 | **0.38** |

Professionals and rural workers track each other almost exactly. The Gini rise came from neither
cohort named above:

- **Retirees end at just over a third of their own 1947 income per head** — absolutely poorer
  across a century in which everyone else multiplies, because transfers are a fixed cash dial
  eroding against growth while the retired share of the population rises. That is #111's
  territory and ADR-0032 does not touch it.
- **Urban workers lag badly**, 5.5x against rural's 12.9x, as the transition pours people into
  the cities faster than urban wages rise.

### The cost curve — answered, and the elasticity revisited

The question this document set for itself was *"whether the Gini still rises with the services
elasticity once the labour force can follow demand."* Measured with the second leg in place,
at services η ∈ {0.32, 0.45, 0.60}:

| services η (with the leg) | service VA, open → q400 | Gini q400 | living std q400 | developmental deposed |
|---|---|---|---|---|
| 0.32 | 33.5 → 32.9 | 0.451 | 3.15 | **7%** |
| **0.45 (now shipped)** | **33.4 → 34.2** | **0.455** | **3.07** | **7%** |
| 0.60 | 33.3 → 35.5 | 0.459 | 2.99 | **7%** |

**Deposition has decoupled from the elasticity entirely** — flat at 7% across a range where
schema 39 ran 9% → 15% → 21%. What the elasticity still trades is the service share against the
Gini and the living standard, which is Baumol and is honest. So `ENGEL_ELASTICITY.services`
ships at **0.45**, the lowest setting at which the service share rises with income rather than
merely stopping its fall — which is the regularity
[0013](0013-policy-cannot-steer-sector-composition.md) flagged as running backwards.

The reason the whole cost curve moved is that the second leg by itself takes Meridia's Gini from
0.512 to 0.451 and its living standard from 2.94 to 3.15: professionals' income per head falls
13.0x → 7.5x as the class grows, and urban workers' — the cohort that was actually lagging —
rises 5.5x → 6.5x.

### What it did NOT do

It did not make the economy steerable. Six points of professionals moves the service value-added
share by **−0.22 points**, because cohort income in this engine does not depend on cohort size.
That is [0017](0017-composition-cannot-hear-the-class-structure.md), and it is where #97 goes
next.
