# 0019 — What a well-played century hits its head on

**Status:** Open. Five separate ceilings, measured; none of them is a bug, and at least two of
them are visible to the player as a flat line with no explanation. The sixth finding — that the
dials the player read all this on do not fit the game — is spun off as
[issue #190](https://github.com/Scc33/terrarium/issues/190).

**Raised by:** [issue #180](https://github.com/Scc33/terrarium/issues/180) — a real game of
Oranga played end to end in god mode, exported as a save and a published-history file, with five
things the player noticed.

**Measured at:** engine `6430071`, **schema 40** (re-measured after ADR-0032). The run is
Oranga, seed `game-3616f7eb`, 328 quarters (1946–2028Q1), 105 turns / 231 orders, all three
sandbox rules on. The harness added with this investigation is
`pnpm replay <save-or-export.json>`.

The save was written at schema 39 and replays cleanly at 40 — a save carries no TrueState — but
five of the player's 231 orders are now refused by the current engine, and their turns are
discarded exactly as the game's own loader discards them. The tool says so in its own output.
Every conclusion below survived the re-measurement; no headline moved by more than 5%.

## The run

A strong game. Every ministry built to ~0.85–0.99, all four institutions reformed repeatedly,
all four statutes enacted at their **top** rung in 1949, research held near 3% of quarterly GDP,
19 elections won, debt retired. Against the same country and seed:

| arm | gdp/head | living | life exp | pollution | tech att | human cap | poverty |
|---|---|---|---|---|---|---|---|
| **as played** | 53.3 | 15.1 | 65.4 | 2.58 | 94.8 | 97.0 | 0.0 |
| passive | 19.4 | 3.7 | 57.3 | 2.59 | 83.9 | 31.8 | 19.2 |
| developmental | 24.4 | 4.2 | 57.5 | 3.01 | 93.2 | 90.8 | 21.9 |
| maximal (ceiling probe) | 92.6 | 4.2 | 56.8 | 3.50 | 95.2 | 97.1 | 23.6 |

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
  floor in 2028 this country needed a living standard of **36.7×** the 1946 standard; it
  reached 15.1×. With pollution back at its inherited baseline the requirement is still 24.2×.
- **The mortality index is a single scalar over all seventeen age bands.** This is the biggest
  leak. At the run's final index of 0.483 the 0–4 band carries 0.0217 annual mortality, i.e.
  **10.3% of children die before five in a 2028 economy fifteen times richer than 1946**.
  Historically the under-5 rate falls by more than an order of magnitude while old-age mortality
  roughly halves; here they fall by the same factor by construction. Cutting only the child band
  to a tenth of its scaled rate, changing nothing else, takes life expectancy from 65.4 to
  **71.8** — almost the entire gap to the ceiling.

Pollution is the third of the three: at the end of the run the burden costs **3.1 years**
(68.5 → 65.4), and in mortality-index terms it is worth a 52% cut in the living standard.

## 2. Pollution never stops rising — but it is controllable, and the statute book ate the lever

Two findings, and the second is the interesting one.

**Technology alone cannot do it.** Emissions per head are
`Σ intensity × output ÷ technique^EMISSION_TECH_GAIN`, and `EMISSION_TECH_GAIN = 0.7 < 1`.
Over this run output per head rose ×19 while technique^0.7 rose ×2.0–3.3, so the ratio grows.
There is no research programme that reverses this; the exponent decides it.

**The emissions standard can do it — and the player already had it at the top rung.** Replaying
the identical log with only the other three statutes removed:

| log variant | emissions compliance | force | emissions/head | pollution | life exp | living |
|---|---|---|---|---|---|---|
| as played (4 statutes) | 0.595 | 0.505 | 3.69 | **2.58** | 65.4 | 15.07 |
| only the emissions standard | 0.799 | 0.679 | 2.28 | **1.60** | 67.0 | 14.48 |
| no emissions standard | 0.531 | 0.000 | 6.99 | **4.79** | 61.4 | 14.86 |

The country's inherited baseline is 1.094. **Enacting one law instead of four leaves the burden
essentially flat for a century**, for 3.9% of the living standard.

The whole difference is `STATUTE_CONGESTION = 0.12`: capability is 0.949 (admin effectiveness
0.922, courts 1.000) and four statutes divide it by 1.36. So a state with a near-complete civil
service and perfect courts obeys its own clean air act 59% of the time, and the 26% haircut is
paid for having *unrelated* laws.

That is ADR-0027 working as designed — "regulate everything" is not free. What is missing is the
attribution, not the number: `ControlRail` does show a per-statute compliance meter reading "The
country obeys 59% of what you posted", but at 0.594 `complianceNote` returns **"Largely
enforced"** in brass rather than danger, and nothing anywhere says a quarter of the shortfall is
the price of the other three laws. The desk reports ordinary friction where the player has in
fact hollowed out their own clean air act.

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
| transport | 0.75 | 94.6 | 94.7 |
| agri | 0.85 | 93.6 | 93.8 |
| energy | 0.90 | 93.1 | 93.3 |
| manuf | 1.00 | 92.1 | 92.5 |

The aggregate lands at 94.6 predicted, 94.8 measured — every sector within 0.4 points of where
the arithmetic says it must come to rest.

`rate` is state-dependent and the fixed point has to be solved rather than evaluated: the engine
scales its research catch-up term by `catchupBySector`, which fades only at the frontier itself,
so a resting position above `RESEARCH_FRONTIER_START` still has research working on it. The first
version of this document dropped that term and printed 94.0 — a zero-research bound, and biased
in the direction that makes a run look like it still has headroom. The run is *at* its ceiling, and the
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

## 6. And the dials the player read all this on do not fit this game

Not one of the five, and the reason it is last is that it changes how to read the other four.

`tests/ui/gauge-domains.test.ts` holds the coverage half of the fixed-face bargain: **no
instrument may spend more than 2% of its published life pegged**, swept over the whole country
catalogue x `SURVEY_SEEDS` x `SURVEY_TICKS`. It passes, and it is a good test. But its harness
(`tests/ui/harness.ts`) plays exactly ONE policy — `investCapacity` x 4, amount 2, every eight
quarters. No dials, no statutes, no reforms, no spending rules. That is the `developmental`
baseline, and the table at the top of this document is what it produces: a living standard of
4.2 against this player's 15.1.

So the faces are cut against a government that only builds ministries, and a person who plays
well produces a country outside the entire calibration sample. Measured on the run's own
published releases, latest revision per quarter — the numbers the wall actually settled on:

| instrument | % of quarters pegged | pegged from | face | this run |
|---|---|---|---|---|
| `investment_share` | **98.2%** | 1947 | 0–10 | 6.5 – 17.8 |
| `consumption_share` | **79.6%** | 1959 | 65–85 | 53.1 – 77.2 |
| `life_expectancy` | **57.9%** | 1980 | 45–60 | 48.9 – 65.8 |
| `price_fuel` | 40.2% | 1960 | 40–130 | 87.5 – 394.5 |
| `price_food` | 33.8% | 2000 | 40–180 | 111.5 – 445.2 |
| `asset_prices` | 23.5% | 1949 | 50–140 | 49.6 – 222.7 |
| `bank_capital_ratio` | 23.2% | 2002 | 0–35 | 12.5 – 105.7 |
| `gdp_per_capita` | 19.2% | 2012 | 0–150 | 9.9 – 206.5 |
| `consumption_per_capita` | 11.9% | 2013 | 0–100 | 8.5 – 113.3 |
| `credit_growth` | 7.9% | 2009 | -30–30 | -33.1 – 102.5 |

**15 of the 33 fixed-face instruments ran off their dial in one game**, against a 2% threshold.
`investment_share` was welded to its right rail for the whole century; `life_expectancy` stopped
moving in 1980, forty-eight years before the run ended.

This is the bug `domains.ts` exists to prevent, arrived at from the other side. A face redrawn
under its own needle "makes needle position meaningless across time and quietly destroys the
only skill the game asks for"; a face too narrow for the play does the same thing by welding the
needle instead of moving the paper. And it bears directly on finding 1 — the player reported that
life expectancy "peaked at just 65", and while the printed figure was right, the needle behind it
had been dead for half the game.

It is also self-concealing: the coverage test and the faces it checks draw from the same sample,
so no amount of running the suite can surface it. It took a real save. AGENTS.md already carries
"a dial-fit survey must cover the whole funded century" — the missing half is that it must cover
the whole POLICY SPACE, and the `credit_to_gdp` face is the one place somebody already did that
by hand, for one dial, and wrote down why.

The obvious fix touches no engine code: give `eachQuarter` arms besides its capacity policy (a
maximal builder, a money-dial government, an extractive one), re-run `pnpm ranges`, re-cut the
faces. One game, one country, one seed is not a population — but 98.2% against a 2% bar does not
leave the direction in doubt, and re-running the widened sweep is what measures the rest.

Carried as [issue #190](https://github.com/Scc33/terrarium/issues/190).

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
- **The dial-fit survey needs to sample policy, not just time and country**
  ([#190](https://github.com/Scc33/terrarium/issues/190)). This is the one item here that is
  cheap, engine-free, and blocks reading any of the others off the wall.

## Re-running this

```bash
pnpm replay path/to/save.json --arms log,passive,developmental,maximal --csv run.csv
```

Takes either artifact the game writes — the records office's save or the data export, which
embeds the same save under `run`. Counterfactual arms replay the interregnum from the save's own
log (ADR-0021), so a later posting is compared against the country it actually inherited.
