# 0018 — What a well-played century hits its head on

**Status:** Open. Five separate ceilings, measured; none of them is a bug, and at least two of
them are visible to the player as a flat line with no explanation.

**Raised by:** [issue #180](https://github.com/Scc33/terrarium/issues/180) — a real game of
Oranga played end to end in god mode, exported as a save and a published-history file, with five
things the player noticed.

**Measured at:** engine `9137f39`, schema 39. The run is Oranga, seed `game-3616f7eb`, 328
quarters (1946–2028Q1), 105 turns / 231 orders, all three sandbox rules on. The harness added
with this investigation is `pnpm replay <save-or-export.json>`.

## The run

A strong game. Every ministry built to ~0.85–0.99, all four institutions reformed repeatedly,
all four statutes enacted at their **top** rung in 1949, research held near 3% of quarterly GDP,
19 elections won, debt retired. Against the same country and seed:

| arm | gdp/head | living | life exp | pollution | tech att | human cap | poverty |
|---|---|---|---|---|---|---|---|
| **as played** | 51.1 | 14.9 | 65.3 | 2.58 | 94.7 | 97.0 | 0.0 |
| passive | 19.5 | 3.8 | 57.4 | 2.63 | 83.6 | 31.8 | 19.2 |
| developmental | 24.3 | 4.3 | 57.5 | 3.05 | 93.0 | 90.8 | 21.8 |
| maximal (ceiling probe) | 96.5 | 4.3 | 56.6 | 3.71 | 95.2 | 97.1 | 23.8 |

The maximal arm is the first result worth keeping and it is not one of the five: **GDP per head
and the living standard come apart completely.** A government that spends 5% of GDP on capacity
every year, 5% on research and 8% on state investment doubles output per head and leaves
consumption where the do-nothing baseline left it — so mortality, fertility, poverty and the
report card, which all read `livingStandard`, get *worse* while the headline doubles. That is a
real mechanism, not an artifact, but it means a growth-maximising player is optimising the wrong
number and nothing on the wall says so.

## 1. Life expectancy peaks at 65

Three things stack, and only one of them is the player's:

- **The hard ceiling is 72.8 years.** `MORT_FLOOR = 0.35` bounds the mortality index, and
  `lifeExpectancyAtBirth` is `periodLifeExpectancy(MORT_BASE_ANNUAL × index)`. There is no
  reachable state of the model in which anybody lives to 80.
- **The income channel is very flat.** `MORT_INCOME_GAIN = 0.18` per log point. To reach the
  floor in 2028 this country needed a living standard of **36.6×** the 1946 standard; it
  reached 14.9×. With pollution back at its inherited baseline the requirement is still 24.2×.
- **The mortality index is a single scalar over all seventeen age bands.** This is the biggest
  leak. At the run's final index of 0.484 the 0–4 band carries 0.0218 annual mortality, i.e.
  **10.3% of children die before five in a 2028 economy fifteen times richer than 1946**.
  Historically the under-5 rate falls by more than an order of magnitude while old-age mortality
  roughly halves; here they fall by the same factor by construction. Cutting only the child band
  to a tenth of its scaled rate, changing nothing else, takes life expectancy from 65.3 to
  **71.8** — almost the entire gap to the ceiling.

Pollution is the third of the three: at the end of the run the burden costs **3.1 years**
(68.4 → 65.3), and in mortality-index terms it is worth a 51% cut in the living standard.

## 2. Pollution never stops rising — but it is controllable, and the statute book ate the lever

Two findings, and the second is the interesting one.

**Technology alone cannot do it.** Emissions per head are
`Σ intensity × output ÷ technique^EMISSION_TECH_GAIN`, and `EMISSION_TECH_GAIN = 0.7 < 1`.
Over this run output per head rose ×18.4 while technique^0.7 rose ×2.0–3.3, so the ratio grows.
There is no research programme that reverses this; the exponent decides it.

**The emissions standard can do it — and the player already had it at the top rung.** Replaying
the identical log with only the other three statutes removed:

| log variant | emissions compliance | force | emissions/head | pollution | life exp | living |
|---|---|---|---|---|---|---|
| as played (4 statutes) | 0.587 | 0.499 | 3.66 | **2.58** | 65.3 | 14.88 |
| only the emissions standard | 0.794 | 0.675 | 2.27 | **1.59** | 67.1 | 14.50 |
| no emissions standard | 0.528 | 0.000 | 7.09 | **4.89** | 61.4 | 15.27 |

The country's inherited baseline is 1.094. **Enacting one law instead of four leaves the burden
essentially flat for a century**, for 2.6% of the living standard.

The whole difference is `STATUTE_CONGESTION = 0.12`: capability is 0.949 (admin effectiveness
0.922, courts 1.000) and four statutes divide it by 1.36. So a state with a near-complete civil
service and perfect courts obeys its own clean air act 59% of the time, and the 26% haircut is
paid for having *unrelated* laws. That is ADR-0027 working as designed — "regulate everything"
is not free — but nothing the player can see attributes it: the wall shows a rising pollution
dial and a statute book that says "Clean air act", and never says the second is why the first is
not working.

## 3. Technology attainment tops out in the low 90s — it is sitting exactly on its fixed point

`technology_attainment` is attainment ÷ frontier, and attainment chases a target that runs away
at the frontier's own rate. Setting the two growth rates equal gives a resting ratio of

```
a/T = 1 / (1 + (exposure × g_frontier/4 − FRONTIER_OWN_DRIFT_Q) / (CATCHUP_Q × absorption))
```

Predicted against measured per sector at the end of the run, with `absorption = 1`:

| sector | exposure | predicted | measured |
|---|---|---|---|
| services | 0.45 | 97.9 | 97.9 |
| transport | 0.75 | 94.1 | 94.7 |
| agri | 0.85 | 92.9 | 93.8 |
| energy | 0.90 | 92.3 | 93.3 |
| manuf | 1.00 | 91.1 | 92.5 |

The aggregate lands at 94.0 predicted, 94.7 measured. The run is *at* its ceiling, and the
ceiling has nothing in it the player controls, because **`absorptiveCapacity` clamped at 1 in
1991** — uncapped it reaches 1.105 by 2026, so every point of human capital and every unit of
openness bought after 1991 buys exactly zero catch-up speed. What is left is `CATCHUP_Q = 0.02`
against the frontier's 1.1%/yr, and the research channel cannot help: the catch-up research term
is scaled by `catchupBySector`, which goes to zero as a sector approaches the frontier, and the
frontier research term raises the frontier itself. A maximum research programme measured +0.5
points of attainment against this run.

This is a second face of investigation [0004](0004-attainment-index-falls-while-every-sector-rises.md)
(composition moves the index) and the "ratio to a moving target saturates" tuning lesson. What is
new here is that the ceiling is analytic, that it binds from 1991, and that the dial therefore
spends a third of the game reporting a constant.

## 4. The skill index is `capacity.education` with a seventeen-year lag

`human_capital` is a stock closing 1% of the gap to `capacity.education × (1 + 0.65 × schooling
force)` per quarter. In this run education capacity first passed 0.99 in **1963Q1** and human
capital first passed 0.95 in **2015Q1** — fifty-two years of a dial whose entire content is "the
ministry you already built, delayed". It carries no information the education gauge does not.

The player's suggestion (replace the index with years of school, and let it move participation)
maps onto a real gap rather than a preference. The model already has a schooling→labour-supply
channel, but it hangs off the statute and not the school system: `schoolingWithdrawal` takes
`SCHOOLING_LABOR_WITHDRAWAL = 0.25 × force × (youngest working band ÷ working age)`, which in
this run is **1.2–2.1% of the labour force**. Building a complete education ministry costs no
labour at all. A years-of-schooling stock would make the two the same fact and would price
secondary and tertiary expansion in foregone work, which is the actual historical trade.

See also investigation [0012](0012-compulsory-schooling-reverses-late-century.md), which is the
same seam from the other side.

## 5. The poverty rate is a five-step staircase over an absolute line

`POVERTY_LINE_REAL = 1` is a fixed real basket, shared by every country and every year, and the
engine holds **no within-cohort dispersion** — `householdIncomeDistribution` compares five cohort
*means* to it. The rate is therefore not a measure of poverty at all but a sum of the population
shares of whole cohorts that happen to be below the line.

Over this run it took exactly two regimes:

| quarters | what the number was | value |
|---|---|---|
| 1946Q1 – 1954Q2 | the retiree share of the population | 17.05% falling to 13.57% |
| 1954Q3 – 2028Q1 | nobody's cohort mean is under one basket | 0.00%, for 295 quarters |

The retirees' mean crossed the line at 0.96 → 1.00 between two quarters and the indicator fell
off a cliff. The smooth-looking decline before that is not poverty falling; it is the age
pyramid changing the size of the one cohort that was poor.

Both halves matter. The absolute line means growth alone retires the indicator; the missing
dispersion means it could not report a rate between zero and a cohort's whole population share
even if the line moved. The same missing dispersion is already confessed for the Gini ("grouped
lower bound"), and it is why the Gini stays informative here while poverty does not — a ratio of
group means still moves when the groups move apart.

## What this implies (nobody has ruled on any of it)

- The mortality schedule's **shape** is where life expectancy is lost, not its floor. An
  income- or capacity-elastic child-mortality term is worth about six years on its own.
- `STATUTE_CONGESTION` is currently the dominant term in compliance for a full statute book at a
  maxed-out state. If that is intended, the wall has to say so; if not, it wants a capability
  term that congestion cannot outrun.
- `technology_attainment` is a ratio to a moving target sitting on its fixed point for the last
  third of the game. `productivity` is the dial that still moves; the attainment gauge may want
  to be re-scaled against its own resting value, or replaced.
- `human_capital` and the schooling statute are two representations of one fact.
- The poverty rate needs either a relative line, within-cohort dispersion, or both — and the
  poverty *gap* (already computed) is the smoother of the two figures.

## Re-running this

```bash
pnpm replay path/to/save.json --arms log,passive,developmental,maximal --csv run.csv
```

Takes either artifact the game writes — the records office's save or the data export, which
embeds the same save under `run`. Counterfactual arms replay the interregnum from the save's own
log (ADR-0021), so a later posting is compared against the country it actually inherited.
