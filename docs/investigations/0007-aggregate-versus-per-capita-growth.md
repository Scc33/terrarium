# 0007 — Population decline lowers late aggregate growth but does not explain the downside

**Status:** Open

**Raised by:** investigation 0006 found that the labor force contracts as the quiet
post-2000 growth tail widens, but measured only aggregate GDP.

**Measured at:** `e6ff368` on 2026-08-15.

## Method

The stability runner now records exact population beside output, employment, and labor force.
Every player-reachable quarter can therefore be decomposed without a fitted coefficient:

`GDP = (GDP / employed) × (employed / labor force) × (labor force / population) × population`

Annualized log changes make both accounting identities additive:

- aggregate growth = per-capita growth + population growth;
- per-capita growth = labor productivity + employment-rate change + labor-force-share change.

The same 120-run all-country sweeps used by investigation 0006 were run separately under passive
and developmental policy through 2050. “Quiet” continues to exclude every shock onset and the
following eight quarters, and every balance sample stops at deposition. Means are used for the
main contribution tables because the observation-level identity then remains exact. The
worst-5% table reports marginal medians; medians of components need not sum exactly even though
every underlying quarter does.

The executable report remains:

```sh
pnpm stability -- --runs 120 --ticks 416 --policy passive --country all
pnpm stability -- --runs 120 --ticks 416 --policy developmental --country all
```

## Roughly half the late trend decline is demographic

Mean annualized log-growth contributions in quiet quarters were:

| policy / era | aggregate GDP | per capita | population | productivity | employment rate | labor force / population | labor force |
|---|---:|---:|---:|---:|---:|---:|---:|
| passive 1973-1999 | 2.72 | 1.63 | 1.10 | 1.38 | 0.06 | 0.19 | 1.28 |
| passive 2026-2050 | 1.52 | 1.00 | 0.52 | 0.92 | 0.06 | 0.02 | 0.54 |
| developmental 1973-1999 | 3.01 | 2.53 | 0.48 | 2.06 | 0.14 | 0.33 | 0.81 |
| developmental 2026-2050 | 0.52 | 1.13 | -0.60 | 1.23 | 0.07 | -0.17 | -0.78 |

Passive aggregate growth loses 1.20 points between the two eras: 0.63 comes from per-capita
growth and 0.58 from population. Developmental aggregate growth loses 2.49 points: 1.40 is
per-capita and 1.08 population. The labor-force contribution falls more sharply because aging
also lowers labor force per resident.

This changes how the known developmental-growth surprise should be read. In the future quiet
sample, developmental aggregate growth is one point below passive (0.52 versus 1.52), but its
per-capita growth is slightly higher (1.13 versus 1.00). The 1.12-point population difference,
not weaker per-person production, creates the aggregate ranking.

The whole-century survivor view points the same way, though it is descriptive rather than a
paired treatment estimate because deposition selects different samples:

| policy | survivors | aggregate CAGR | per-capita CAGR | population CAGR |
|---|---:|---:|---:|---:|
| passive | 95 / 120 | 2.55% | 1.37% | 1.16% |
| developmental | 70 / 120 | 2.28% | 2.07% | 0.30% |

## A contracting labor force is usually not a recession

Conditioning directly on quiet quarters with negative labor-force growth separates demographic
drag from cyclical contraction:

| policy, 2026-2050 | contracting quarters | labor force | aggregate GDP | per capita | population |
|---|---:|---:|---:|---:|---:|
| passive | 2,226 / 6,663 (33%) | -0.44 | 0.54 | 0.90 | -0.36 |
| developmental | 4,639 / 5,264 (88%) | -0.91 | 0.41 | 1.11 | -0.71 |

Even when the labor force shrinks, output per person grows and aggregate output remains positive
on average. Demography lowers the trend cushion, especially on the education-building path, but
does not mechanically create a boom-bust quarter.

## The wider downside is still predominantly per-capita

Within each era's worst 5% of quiet aggregate growth, marginal median log-growth contributions
were:

| policy / era | aggregate GDP | per capita | population | productivity | employment rate | labor force / population |
|---|---:|---:|---:|---:|---:|---:|
| passive 1973-1999 | -1.80 | -2.36 | 0.40 | -1.74 | -0.95 | 0.21 |
| passive 2026-2050 | -4.31 | -4.28 | -0.21 | -3.06 | -1.48 | 0.00 |
| developmental 1973-1999 | -2.58 | -2.54 | -0.19 | -1.98 | -1.08 | 0.15 |
| developmental 2026-2050 | -5.46 | -4.69 | -0.84 | -3.80 | -0.90 | -0.20 |

Population's shift accounts for roughly one quarter of the late-to-future movement in these
marginal downside medians. More than 70% remains a per-capita deterioration, dominated by the
same utilization-driven output-per-worker fall and subsequent employment response identified in
investigation 0006. A demographic retune could raise aggregate trend growth, but it would not
stabilize the cycle the player experiences.

## What this implies

Aggregate GDP is still the right national-accounts headline, but it is the wrong sole criterion
for judging a mature or education-building economy. Future tuning comparisons should preserve
both aggregate and per-capita trend. For the stability problem, the demographic transition is a
real loss of cushion, not the oscillator.

The next controlled experiment should isolate the employment-adjustment lag: whether it damps a
demand fall or stores contraction and rebound in the following quarters. The exact identities
and the measured characterization are retained in `tests/unit/stability.test.ts` and
`tests/unit/per-capita-growth-investigation.test.ts`.
