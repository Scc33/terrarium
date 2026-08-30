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
allocation with two constraints that are exact by construction rather than approximately satisfied:

```
Σ_c heads[s][c] === sector.employment    every post is filled
Σ_s heads[s][c] ≤  laborForce[c]         nobody works two jobs
```

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

Feasibility is inherited: `labor` already holds total employment under `0.97 × lf`, so the hands
always exist somewhere.

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

**It costs about 5 % of a tick.** Developmental 68.4 → 72.1 ms/run, passive 37.6 → 41.7. The first
implementation cost 53 %; precomputing the ladder and reusing the eligibility sum between the two
sweeps recovered it, bit-identically (the goldens are the proof).

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
