# 0006 — Quiet late growth is demand-led and openness-amplified

**Status:** Open

**Raised by:** the onset-plus-eight-quarter exclusion in investigation 0005 still showed a
wider post-2000 downside-growth tail after the spectacular drought reversals were removed.

**Measured at:** driver and paired sensitivities at `ec63e9c`; foreign-crisis classification
A/B at `ef83ea5`, both on 2026-08-10.

## A quiet-quarter classification gap was real but not decisive

The first quiet filter tagged droughts, fuel ruptures, and banking crises. The world step has
four additional rare partner crises, announced as commodity crash, manufacturing seizure,
financial sudden stop, or regional collapse. They were not runner events, so their onset and
aftermath remained in the supposedly quiet sample.

The runner now tags `world_crisis`, excludes its onset and following eight quarters, and reports
its conditioned response. On the same 120-run all-country sweeps, the correction removed 18-20%
of the previously quiet late sample but changed the future growth p01 only modestly:

| policy | old quiet quarters / p01 | corrected quiet quarters / p01 |
|---|---:|---:|
| passive | 8,007 / -5.66% | 6,566 / -5.46% |
| developmental | 6,720 / -6.92% | 5,352 / -6.80% |

Foreign crises had contaminated the name, but they did not explain the deterioration.

## The downside is demand-led, not a negative productivity shock

The stability trajectory now retains runner-only true-state drivers. GDP is decomposed by the
identity `GDP = output per worker × employment`; the two contributions are additive annualized
log changes. The report also records TFP, labor force, real wage, utilization, demand
satisfaction, and final-demand components. Nothing crosses the player-facing fog boundary.

Across 120 runs per policy and every country recipe, the median quarter within each era's worst
5% of quiet growth moved as follows:

| policy / era | GDP | productivity contribution | employment contribution | TFP | labor force | utilization change | demand met |
|---|---:|---:|---:|---:|---:|---:|---:|
| passive 1973-1999 | -1.78% | -1.74 | -0.24 | 1.12% | 0.60% | -0.69 pt | 100% |
| passive 2026-2050 | -4.22% | -3.06 | -1.44 | 0.86% | -0.21% | -0.93 pt | 100% |
| developmental 1973-1999 | -2.54% | -1.98 | -0.94 | 1.24% | -0.03% | -0.84 pt | 100% |
| developmental 2026-2050 | -5.32% | -3.80 | -1.80 | 0.88% | -1.07% | -1.12 pt | 100% |

TFP remains positive and tightly distributed in the bad quarters. Its historical slowdown
lowers the late trend, but the negative tail itself is realized demand falling below available
capacity: firms meet all demand, utilization falls immediately, output per retained worker
falls, and employment then follows with its ordinary adjustment lag. Tuning productivity
passthrough or the frontier as though TFP were oscillating would address the wrong channel.

The demand components in those same worst quarters show a broad contraction:

| policy / era | final demand | household demand | investment | government demand | exports | export share |
|---|---:|---:|---:|---:|---:|---:|
| passive 1973-1999 | -1.78% | -0.34% | 0.89% | -1.74% | -6.38% | 15.92% |
| passive 2026-2050 | -4.22% | -2.48% | 0.28% | -2.13% | -8.35% | 16.15% |
| developmental 1973-1999 | -2.54% | -1.03% | 0.57% | -0.91% | -6.89% | 19.28% |
| developmental 2026-2050 | -5.32% | -2.91% | -0.64% | -2.03% | -10.79% | 23.44% |

Real wages in the bad quarter move from roughly flat in 1973-1999 to -0.96% passive and -0.92%
developmental in 2026-2050. That can reinforce household demand, but this measurement does not
establish whether wages lead the contraction or follow the loss of utilization.

## Openness causally amplifies the tail

Country recipes suggested a split: low-openness Costona's passive quiet future p01 was -0.21%,
while high-openness Oranga's was -8.02%. Their initial age structures differ, so a paired
sensitivity changed only Meridia's openness from 0.68 to 1.55, using the same ten seeds in each
column:

| policy | openness | 1973-1999 quiet p01 | 2026-2050 quiet p01 | future downside p50 | export share in downside | survivors |
|---|---:|---:|---:|---:|---:|---:|
| passive | 0.68 | -0.02% | -3.01% | -2.16% | 8.71% | 10/10 |
| passive | 1.55 | -2.08% | -5.16% | -4.29% | 18.02% | 9/10 |
| developmental | 0.68 | -0.87% | -4.45% | -3.56% | 17.19% | 7/10 |
| developmental | 1.55 | -3.45% | -7.71% | -6.06% | 26.04% | 6/10 |

Openness is therefore an amplifier, not merely a label attached to different country recipes.
It is not the whole cause: even low-openness Meridia deteriorates late.

## The opening pyramid is not the missing control

A second paired sensitivity replaced only Meridia's within-band 1946 age distribution with
Costona's younger shape, rescaled separately below and above retirement so opening population
and cohort totals stayed identical. Future quiet-growth p01 moved by only 0.05 point under
passive play and 0.02 point under developmental play. The century largely forgets that opening
shape through endogenous births, deaths, migration, and education-driven fertility.

The late labor-force contraction is still economically relevant, especially under the
developmental policy, but it is generated along the played path rather than inherited from the
initial pyramid. The frozen paired results live in
`tests/unit/late-growth-driver-experiments.test.ts` so a future agent can see which intuitively
plausible explanations were already separated.

## What this implies

The next tuning candidate should not begin with drought restoration, the frontier schedule, or
wage-productivity passthrough. It should first decide how much ordinary foreign-cycle exposure
and endogenous population contraction should widen aggregate quarterly GDP in a mature economy.
Both are real economic risks; erasing them would make openness and the demographic transition
cosmetic. But their interaction with habitual household income and lagged employment currently
turns a smaller trend cushion into wider output tails.

The next controlled comparisons should separate:

1. the direct export-demand contribution from the household-income feedback it induces;
2. level growth from per-capita growth when the labor force is shrinking;
3. whether the employment-adjustment lag damps a demand fall or stores up the following rebound;
4. whether any candidate narrows quiet and shock tails while preserving survivor CAGR and the
   exact 1946 opening.

Until those are measured, this investigation does not recommend an engine constant.
