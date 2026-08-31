# ADR-0035 — The staffing table is a demand for skills; who fills a post is rationed against who exists

**Status:** Accepted · **Date:** 2026-08-30 · **Schema:** 43

## Context

`LABOR_SOURCE` gives each sector a fixed staffing mix whose columns sum to 1. `pipeline/cohorts.ts`
read it as an allocation — `employedIn[s] = employment[s] × share`, and joblessness as
`1 − employed / laborForce[c]` — and nothing anywhere constrained a cohort's total against its own
labour force.

Measured at schema 41 ([investigation 0020](../investigations/0020-the-headline-hides-three-labour-markets.md),
8 seeds × 400q × 5 countries × 4 arms), the table handed out **119–126 % of the rural labour force**
by q400 on every country and every arm, while urban workers absorbed the residual at 0.58–0.88. So
rural workers read as **0 % jobless for the century** (a negative, clamped) and urban workers read
**29–42 % jobless against a headline near 12 %**. The aggregate the player was shown is a blend of an
impossible number and a catastrophic one.

Investigation [0001](../investigations/0001-subsistence-valve-saturation.md) found this in 2026-08 and
did not rule on it, because it identified a genuine ambiguity: is a cohort's employment *supposed* to
be bounded by its labour force, or is `LABOR_SOURCE` a wage-split recipe under which a tightness of
1.7 means each professional works 1.7 jobs — coherent, and consistent with the money?

## Decision

**`LABOR_SOURCE` is a demand-for-skills schedule.** What a sector gets is `derive.staffing`, an
allocation with two constraints — and they are **not peers**, which is the part to read:

```
Σ_c heads[s][c] === sector.employment    every post is filled — ALWAYS
Σ_s heads[s][c] ≤  laborForce[c]         nobody works two jobs — whenever
                                         Σ_s employment ≤ Σ_c laborForce
```

The first is unconditional. The second is exact whenever the country has as many hands as posts,
and **that precondition is a fact about the caller, not about this function.** In the pipeline it
always holds, because `labor` ends every quarter by holding total employment under
`EMPLOYMENT_CEILING × lf`. At `init` it does not: measured at schema 43, Costona opens at 1.021
jobs per person and Kestrel at 1.034, and 39 % of procedural seeds are overdrawn. It clears on the
first tick.

When the two conflict, **the wage bill wins** — for the same circular-flow reason the whole change
exists — and the excess is spread **pro rata on the labour force**, so every class lands at the
same multiple of itself and the overdraft reads as one fact about the country rather than as an
artefact of whichever cohort was largest in a sector. That opening defect is
[investigation 0021](../investigations/0021-the-opening-vector-asks-for-more-jobs-than-hands.md);
it is older than this ADR and its fix recalibrates the catalogue, so it is not fixed here.

Posts a sector cannot fill from its preferred class are offered to the **nearest rung of the class
ladder** (`SKILL_RANK`, the same ladder ADR-0032's class transition climbs), one step before two.
Whoever takes the post earns that sector's wage, which is the entire cost of working outside your
own class — there is no separate penalty anywhere.

**Measured, this fires in exactly one direction: urban workers → agriculture**, 0.25M to 3.10M
heads depending on the country. Agriculture's recipe names only rural workers, and the countryside
empties until rural tightness reaches 1.18–1.28, so the farms end up staffed from the towns.

**The circular flow is what forces this, and it is why there is no "how much rationing" constant.**
`production` charges each sector `wages[sid] × employment[sid]`. A post the allocation leaves empty
is money that left the firm and reached no household — the same hole as a bond coupon that vanishes.
So every displaced post must go to *somebody*: the free parameter is who, never whether.
**There is therefore no exactly-inert setting for this change**, unlike ADR-0027, -0028 and -0032.
It moves the economy, and the measurement below is the whole review.

Feasibility is inherited **from `labor`, and only there**: it holds total employment under
`EMPLOYMENT_CEILING × lf` every quarter, so from tick one the hands always exist somewhere. That
constant is now named rather than written `0.97` in two places, because the allocation's guarantee
is exactly the ceiling's guarantee and the two must not drift apart.

**`skillTightness` stays the unrationed ratio.** It is a demand signal, not an outcome. Read off the
allocation it could never exceed 1, and ADR-0032 gates the crossing into the professions on exactly
the excess above 1 — re-expressing it would silently kill that leg.

## Alternatives considered

**Fix the statistic only** — leave income alone and compute `jobless` from a rationed shadow split.
Much cheaper: no recalibration, no golden churn. Rejected because it makes the per-cohort labour
force stop constraining anything, and because an educated worker could then never fail to find
professional work — the recipe always finds them 1.7 jobs. Issue #27's scenario stays unrepresentable,
which is the thing this line of work exists to represent.

**Ration without substituting** (the original split between #195 and #196). Not implementable: it
deletes household income that firms paid. The two issues merged for this reason.

**A `SKILL_SUBSTITUTION` weight with a neutral at zero**, so the change could ship inert and be
calibrated later. Rejected twice over: at zero, agriculture cannot staff itself once rural workers
run out (its recipe names no other class), so the neutral setting is infeasible rather than
conservative; and a lerp between the old infeasible allocation and the new feasible one is not a
mechanism at intermediate values, it is a dial between a bug and a fix.

**Make mismatch bite output** — a TFP or `laborForOutput` penalty for staffing a post with the wrong
class. This is the effect arrow ADR-0028 exists to refuse. The honest supply-side version is that a
sector short of a skill should not have hired those heads at all, which is a hard per-skill labour
supply constraint, a much larger recalibration, and not this change.

## Consequences

**The macro barely moves, and that is the point.** `LABOR_SOURCE` has never reached production, so
rationing it changes who holds a job and what they earn and nothing about how much is made.
200 × 400q, per policy:

| | growth %/yr p50 | unemployment p50 | deposed |
|---|---|---|---|
| passive | 2.82 → **2.84** | 12.46 → 12.49 | 3% → **1%** |
| developmental | 3.05 → **3.05** | 12.23 → 12.23 | 3% → **2%** |
| regulated | 3.03 → **3.04** | 11.98 → 11.98 | 3% → **2%** |
| random | 3.30 → **3.40** | 12.44 → 12.37 | 82% → **77%** |

`realGdp` does not appear in the top 400 moved values of `pnpm diff-state --moved-only`, and
`flows.unemployment` moves 0.17 % relative. What moved is the distribution: rural workers' wage
income falls ~4 % (they stop being paid for jobs that did not exist), and **urban workers' approval
rises 7 %** because they are no longer scored against an accounting artifact. Deposition falls on
every policy for that reason.

**`tests/properties/future-stability.test.ts` loses one passive survivor**, 28 → 27: Veltravia seed 3
loses a poll at q399 of 416. A thirty-run cohort resolves a knife-edge election badly; the 200-run
batch moves the other way on every arm.

**What the pro-rata opening is worth, measured `pnpm batch --country all`, 200 x 400q**, against
the same change with the shortfall dumped on the largest cohort. Exactly the two countries that
open overdrawn move; Meridia, Veltravia, Oranga and the procedural pool are unchanged.

| developmental | deposed | growth %/yr | unemployment |
|---|---|---|---|
| costona | 15% → **12%** | 3.66 → 3.65 | 15.26 → 15.23 |
| kestrel | 21% → **18%** | 3.61 → 3.62 | 13.26 → 13.28 |
| meridia / veltravia / oranga | unchanged | unchanged | unchanged |
| *all countries* | 8% → **7%** | 3.13 → 3.13 | 12.46 → 12.46 |

Passive moves by less than the countries' own noise (costona 3.00 → 2.99, kestrel 3.26 → 3.27).
Deposition falling three points on both overdrawn countries is the same argument this ADR already
makes for urban workers, one register down: a class scored against an accounting artefact is
scored too harshly, and here it was one class carrying the whole artefact for a quarter.

The four-policy baseline on the reference country is untouched — passive 2.84 %/yr and 12.49 %,
developmental 3.05 and 12.23, regulated 3.04 and 11.98, random 3.40 and 12.37, deposition 1/2/2/77 %.

**The goldens cannot see this change, and neither can the default batch.** All three cases in
`tools/golden-cases.ts` and `pnpm batch`'s default `--country baseline` run Meridia, which opens at
0.929 jobs per person — the one curated country where the opening overdraft provably cannot appear,
and the reason the first version of the residual block shipped with Costona reading 1.113 ×. Same
shape as ADR-0028's pollution baseline, and for the same reason: the reference country is the one
where the bug cannot show. Anything touching this area wants `--country all` and a per-country read.

**It costs about 5 % of a tick.** Developmental 68.4 → 72.1 ms/run, passive 37.6 → 41.7. The first
implementation cost 53 %; precomputing the ladder and reusing the eligibility sum between the two
sweeps recovered it, bit-identically (the goldens are the proof). Review moved the allocation onto positional
arrays throughout — the ladder, the per-pass eligibility scratch, the working grids — which is the
same bit-identical trick again (proved over 6 countries × 3 seeds × 400 ticks of state hashes) and
also what keeps the caller-supplied `sector.id` out of every write, which is what CodeQL flagged.
The obvious remediation for that, prototype-less objects, measured **18 % slower** on the survey
test: `Object.create(null)` puts V8 into dictionary mode, and this is a hot loop. Build the record
with `Object.fromEntries` at the end instead.

**It does not deliver the underemployment #27 asked for, and this is the finding to carry forward.**
Substitution fills posts a sector *cannot staff*; it cannot create posts. When professionals are in
surplus, every rung below them is in surplus too — urban tightness runs 0.58–0.88 throughout — so
there is no unfilled post for a spare professional to take, and they stay in the unemployment count
rather than taking a lesser job. Measured across five countries × two arms × 400 quarters,
**professionals never work outside services, not once.**

Getting a graduate into a lesser job requires employers to prefer the better-qualified applicant for
a post that is *already being filled* — bumping down. That is a claim about hiring behaviour rather
than an accounting identity, it pushes joblessness down the ladder onto the classes already carrying
the most slack, and it needs its own measurement. It is deliberately not in this change, and
`tests/properties/staffing.test.ts` pins the absence as a negative so the day it lands is visible.

So of the pair this ADR merged: **#195 is delivered in full, #196 in one direction only.** The
by-occupation survey (#197) can proceed on the honest decomposition of *unemployment*; a published
*underemployment* figure has to wait for the hiring change.
