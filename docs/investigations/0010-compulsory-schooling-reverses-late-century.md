# 0010 — Compulsory schooling pays for forty years and then stops paying

**Status:** Open

**Raised by:** wiring the compulsory-schooling statute (ADR-0027). The first calibration was
strictly dominated — a permanent loss on every measure at every horizon — and fixing that
exposed a second, more interesting shape that nobody has ruled on.

**Measured at:** the schooling commit on this branch, 2026-08-23. Six seeds per country,
400 quarters, capacity-building government with protected tenure, statute enacted at quarter 40
at its top rung ("schooling to 16"). Every figure is against an identical run without the law.

## What the statute does

One fact — who is in a classroom rather than at work — with two readers on different clocks.
`derive.schoolingWithdrawal` takes the youngest working band out of the labour force the quarter
the law bites, sized off the pyramid; `pipeline/demography` raises what the same school system
yields, and the human-capital stock closes toward it at 1% a quarter (a half-life near seventeen
years). Both read one `statuteForce`.

## The first calibration was dominated, and looked reasonable

`SCHOOLING_LABOR_WITHDRAWAL = 0.6`, `SCHOOLING_ATTAINMENT_GAIN = 0.3`. Real consumption per head,
Costona:

| | 1961 | 1966 | 1976 | 1996 | 2016 | 2046 |
|---|---|---|---|---|---|---|
| consumption/head | −2.94% | −3.43% | −2.96% | −1.70% | −2.05% | −2.05% |

Negative at every horizon, on Meridia too, and on GDP per head and cumulative welfare as well.
No player would ever enact it — a mechanic nobody would rationally use is as dead as one that
cannot be reached.

The error was in the model, not the constant. The 15–19 band is 11–19% of working-age HEADS but
a far smaller share of output: young workers are unskilled and low-wage, and the engine has no
age–productivity gradient to say so. Withdrawing them at *average* productivity overstated the
cost by roughly the ratio of the two. `SCHOOLING_LABOR_WITHDRAWAL` now carries that correction
explicitly (0.6 × ≈0.4 ≈ 0.25) and the attainment gain was raised to 0.65.

## The shape it has now

Real consumption per head against the no-law run:

| | 1961 | 1966 | 1976 | 1996 | 2016 | 2046 |
|---|---|---|---|---|---|---|
| **Costona** (young, agrarian) | −1.21% | −0.96% | **+1.15%** | **+3.03%** | +1.88% | +0.11% |
| **Meridia** (introductory) | −1.24% | −0.74% | +0.64% | +0.50% | −0.28% | −0.63% |

Cumulative discounted welfare (mean log consumption per head) over the whole run:

| | without | with |
|---|---|---|
| Costona | 0.3852 | **0.3915** |
| Meridia | 1.1209 | 1.1180 |

So it is now a genuine investment: a cost for about twenty-five years, a crossover in the
mid-1970s, a peak around 1996, and cumulative welfare clearly positive on the country the law is
*for*. That is the intended shape and it is worth having.

## The open question

**The return does not merely fade — it goes negative late, and on Meridia it never nets
positive over a century.**

Two mechanisms are visible in the same tables and neither has been isolated:

1. **The benefit saturates.** The attainment gain is a multiplier on `capacity.education`, which
   a capacity-building government drives high, and human capital converges regardless by the
   2030s. The statute makes the country arrive sooner, not further. Once every child would attend
   anyway, compelling attendance costs the 15-year-olds' labour and buys nothing.
2. **It brings the ageing squeeze forward.** Population runs 3.7–3.9% below the no-law arm by
   2046, via human capital → fertility (`FERT_EDU_GAIN`). A smaller, older population has a worse
   dependency ratio, and per-head consumption carries it. This is an emergent second-order effect
   of a labour-market statute reaching the vital rates, which is exactly the kind of propagation
   the design wants — but nobody chose its size.

Both readings are defensible as *design*: a law that is right for fifty years and wrong for the
next forty, made expensive to repeal by its own entrenchment premium, is good drama and roughly
what the historical debates about school-leaving ages were about. What has not been decided is
whether the late-century reversal should be that large, and whether an introductory country
should net negative over a full run.

## What would settle it

- Decompose the late-century gap with the population identity already built for investigation
  0007 (`aggregate = per-capita + population`, `per-capita = productivity + employment rate +
  labour-force share`). If the reversal is almost entirely the labour-force-share term, it is the
  ageing channel; if it is the productivity term, the attainment gain is simply too small late.
- Re-measure with the withdrawal shrinking as the pyramid ages — it already does, through
  `youngest / workingAge`, so quantify how much of the late cost that removes.
- Decide whether `SCHOOLING_ATTAINMENT_GAIN` should read the human-capital GAP rather than
  `capacity.education`, which would stop the benefit saturating. That is a channel change, not a
  retune, and would need its own review.

**Do not simply raise the gain until Meridia turns positive.** The first calibration here was
wrong in the model and right-looking in the table, and the same trap is open in the other
direction.
