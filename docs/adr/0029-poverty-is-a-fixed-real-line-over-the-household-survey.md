# ADR-0029 — Poverty is a fixed real line over the household survey

**Status:** Accepted · **Date:** 2026-08-23

## Context

The engine already publishes mean real household income and a grouped Gini, but the two answers
do not say how many people cannot meet a basic material standard. A country can grow while its
lowest-income households fall behind, and the Gini can fall while those households remain below
any useful floor. Issues #123 and #161 ask for poverty as the missing level statistic and for the
income distribution behind it to be visible rather than compressed into one gauge.

The state does not contain individual households. It contains five socioeconomic cohorts, their
population, and three income sources: wages, transfers and profits. Any poverty statistic must
therefore either stay honest about that grouped resolution or invent an unmodelled distribution
inside each cohort.

## Decision

There is one household-income basis, returned by `householdIncomeGroups(state)`:

```
real disposable income per head =
  (wages × (1 − effective personal income tax) + transfers + profits)
  ÷ the cohort's own cost-of-living index
  ÷ the cohort's population
```

Gini, mean income, poverty and the distributional tables all read this result. This deliberately
changes the old Gini and mean-income worksheets, which counted gross wages while cohort approval
already judged the income actually left after effective personal income tax. A tax-and-transfer
programme now lands in the household survey the same way it lands in a household budget.

**The poverty line is a fixed real standard:** `POVERTY_LINE_REAL = 1`, one standard 1946
consumption basket per person per quarter. It does not move with current mean or median income.
The line is therefore an absolute material floor, not a measure of relative inequality, and a
growing country can reduce poverty rather than merely move the threshold ahead of itself.

Two poverty statistics come from it:

- `poverty_rate`: the population share in cohorts below the line. This is the one quick wall
  instrument, printed as percent of population.
- `povertyGap`: the population-average normalized shortfall from the line, with non-poor people
  contributing zero. It distinguishes a transfer that makes poor households less poor from no
  change at all when the grouped headcount has not yet crossed a cohort boundary.

The distribution is published as one fogged household-budget-survey release, not five more wall
instruments. Cohorts are sorted by real disposable income and split across equal fifths of the
population. A cohort that crosses a quintile boundary is divided at its one observed income; no
within-cohort spread is fabricated. The release carries mean real income and total income share
for each fifth, plus the poverty gap and line, all on the ordinary lag/noise/revision clock behind
the household-survey funding gate. The Household Office shows the five income paths and the
income-share composition; the wall retains the poverty-rate headline.

Poverty does not directly enter approval, unrest, bloc favour or the report card. Those machines
already respond to cohort income, consumption and inequality. Feeding the derived headline back
into them would count the same hardship twice and make measurement capacity change the economy.

## Alternatives considered

- **A relative line, such as 60% of median income.** Useful for exclusion in rich countries, but
  it cannot fall simply because the whole country becomes able to buy more. Rejected as the main
  headline because inequality already supplies the relative statistic and the game needs a
  material floor. A future office can add a relative lens without redefining this series.
- **Fit a lognormal or interpolate income inside each cohort.** This produces a smoother and more
  realistic-looking headcount. Rejected because the smoothness is entirely assumed: the engine
  has no variance with which to identify it, and policies would appear to move households that
  the model does not contain.
- **Use the five socioeconomic cohorts as the five quintiles.** Rejected because cohort sizes are
  unequal and change with development. “Lowest quintile” must continue to mean twenty percent of
  people, not whichever named class happens to be poorest.
- **Put all five quintiles on the instrument wall.** Rejected because they are one composition,
  not five independent signals, and would consume five rack strips. The household survey is the
  same vector-publication pattern as the industrial census.
- **Drive politics directly from the poverty rate.** Rejected as double counting. Politics reads
  the underlying household experience; it must not become causal merely because an office
  managed to publish a statistic about it.

## Consequences

- Schema 35 adds `poverty_rate`, the exact household worksheet fields, and
  `PublishedState.households`. Existing saves remain replayable because the save stores inputs,
  not `TrueState`; their replays simply produce the new schema.
- The grouped poverty rate can move in steps when an entire model cohort crosses the line. That is
  a limitation of the economy's resolution, made visible rather than disguised. The poverty gap
  is the continuous companion and must always be shown in the Household Office.
- Quintile shares sum to one and quintile mean incomes are ordered in truth. Independent survey
  noise can disturb the latter, so the household release sorts the five reported means before it
  derives the reported shares. The distribution on the page remains coherent without leaking the
  true ordering or reconciling it to a separate income headline.
- Refactoring Gini to real disposable income changes an input to institutions. This is an engine
  behaviour change, not additive presentation: golden differences and passive, random-policy,
  developmental and all-country stability baselines require an economics review before blessing.
