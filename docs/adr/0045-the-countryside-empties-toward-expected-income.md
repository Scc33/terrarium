# ADR-0045 — The countryside empties toward expected city income, not wage parity

**Status:** Accepted · **Date:** 2026-10-01

## Context

Farm employment is `SUBSISTENCE_CAP × rural labour force` in 90–100% of quarters, so the only
thing that moves the agricultural share of employment is `demography`'s class transition
([investigation 0023](../investigations/0023-farm-employment-is-the-rural-class-on-a-slow-clock.md),
issue [#288](https://github.com/Scc33/terrarium/issues/288)). That transition was

```
move = URBANIZATION_GAIN × rural × clamp(urban wage / farm wage − 1, 0, 1) × jobsPull
```

at `URBANIZATION_GAIN = 0.004`, so the countryside could never shed more than 1.6% of itself a
year. The fastest post-war transitions shed 4.5–5% a year (Japan 1950–80, Italy 1951–71, Korea
1963–90). Costona's city wage was four times its farm wage through 1956–76 and its countryside
drained no faster than at twice. That was a rural poverty trap, and it was priced: 27% of
developmental Costona governments were deposed.

Tripling the gain fixed the speed and exposed the stopping rule. The move only stopped at wage
parity, so at ×3 every country's 2046 wage gap closed to 0.03–0.08. Costona's farm value added
per worker went past the economy's (1.13). Open unemployment over the first thirty years rose
by more than two points, because migrants kept leaving full farms for cities where a quarter
to a third of urban workers had no job.

## Decision

A migrant compares the city wage times the chance of getting a city job with the farm wage
(Harris–Todaro):

```
expectedGap = (mean of manufacturing and services wages) × urbanJobOdds / farm wage − 1
move        = URBANIZATION_GAIN × rural × clamp(expectedGap, 0, 1) × jobsPull
```

- `urbanJobOdds` is urban workers in work over the urban labour force, read from
  `derive.staffing`. That is the same allocation cohort approval takes joblessness from: the
  economy's own count. The occupational survey worksheet (`labourMarket`) computes the same
  number, but its job is to be fogged and published, and nothing in the economy reads it.
- `URBANIZATION_GAIN` is 0.012. At full pull the rural class sheds 4.7% of itself a year, the
  pace of the fastest post-war transitions. The clamp still saturates at an expected gap of 1,
  when the city pays double after its job risk. Below that, a wider gap now moves people
  faster.
- `jobsPull` stays on the move. The expected gap decides where the drain stops; `jobsPull` is
  the existing claim that a slump stops the buses. The professional leg shares it, and
  `tests/properties/demography.test.ts` asserts it.

The countryside therefore stops emptying while the farm still pays less than the city. The
difference is what urban joblessness costs a migrant.

## Alternatives considered

Each was built and measured against the same baseline. "Random u" is the median of mean
unemployment over 1000 random-policy runs × 120 quarters (12.09% on master).

- **Raise the gain alone (×3).** It fixes the speed and keeps parity as the stopping rule.
  Costona's farm value added per worker reaches 1.13× the economy's by 2046, and random u rises
  to 14.33%. Rejected because the stopping rule is the wrong one.
- **Lift the clamp on the raw gap (1 → 4).** Measured in 0023, it moved only Costona. Combined
  with a gain calibrated to historical speed, it would let a fourfold gap drain four times
  faster than any real exodus did.
- **Take the job odds from headline unemployment.** That headline counts the farm's capped
  headcount as employed, which is the quantity in question. It drains harder (random u 13.82%,
  Costona `rel prod` 1.09).
- **Take the job odds from urban skill tightness** (posts per urban hand under `LABOR_SOURCE`).
  Posts overstate urban jobs once staffing hands them to other rungs. It was the slowest variant:
  Meridia's developmental 2046 farm share moved 0.2 points.
- **Drop `jobsPull` from the move and let the job odds carry slumps.** It drains harder in the
  1950s (random u 13.63%) and splits the slump gate the professional leg reads.
- **Stop pinning farm employment to the rural class.** This is 0023's structural alternative.
  It reopens the subsistence valve, the cap and ADR-0035's staffing together, and nothing here
  shows it is needed yet.

## Consequences

Measured at `9c71caf` against this change. The tables come from
`pnpm agriculture -- --seeds 8 --ticks 400` (protected tenure, unlimited capital) and
`pnpm batch -- --runs 1000 --ticks 400 --country all`, once per `--policy`.

Agricultural share of employment, developmental, 1976 / 2006 / 2046:

| | meridia | costona | veltravia | oranga | kestrel |
|---|---|---|---|---|---|
| before | 41.2 / 29.9 / 20.4 | 53.2 / 41.4 / 25.4 | 24.3 / 21.8 / 18.6 | 27.6 / 23.8 / 19.5 | 38.9 / 29.1 / 20.4 |
| after | 37.9 / 28.0 / **18.8** | 40.1 / 29.9 / **20.1** | 24.2 / 22.2 / 18.5 | 27.7 / 24.4 / 19.0 | 37.7 / 27.9 / **18.8** |

Development now matters more on the agrarian countries. By 2046 the developmental–passive
spread widens from 1.9 to 2.6 points on Meridia, **1.5 to 3.2 on Costona** and 2.9 to 4.2 on
Kestrel. Urban jobs are what raise a migrant's odds, so a government that creates them empties
the countryside faster. Veltravia and Oranga barely move: their limit is what the farm sells,
not how fast people leave, and that is [#289](https://github.com/Scc33/terrarium/issues/289) and
[#290](https://github.com/Scc33/terrarium/issues/290).

| 1000 × 400q, `--country all` | passive growth / u / deposed | developmental growth / u / deposed |
|---|---|---|
| before | 2.94 / 12.87 / 1% | 3.14 / 12.56 / 11% |
| after | 2.93 / 12.84 / 1% | 3.11 / 12.57 / **6%** |

Developmental deposition falls from 27% to **3% on Costona**, from 29% to 25% on Kestrel and
from 12% to 6% on procedural drafts. Regulated falls from 14% to 8%. Passive deposition does not
move on any country. On the stability harness, developmental survivors go from 105 to 109 of
120 and regulated from 109 to 112, with no failures.

**The first thirty years carry more open unemployment.** Passive 1946–76 goes from 12.77% to
13.65% and random play from 12.09% to 13.24%. Growth over the same years rises from 3.61 to
3.71%/yr passive. People who were nominally employed on a capped farm become openly jobless in
a city whose urban workers are 25–39% without work in that era. That is Harris–Todaro's own
prediction, not a side effect. The century means do not move. ADR-0022's emigration term reads
the higher headline, so net emigration rises in the 1950s. Costona over 1946–96 grows 3.44%/yr
instead of 2.92% and runs 16.7% unemployment instead of 14.1%.

**Costona's farm out-earns the economy per worker, and its workers still earn less than the
city's.** By 2046 its developmental `rel prod` is 1.07, against 0.90 or below elsewhere, while
its farm wage stays 24% below the city wage. The farm's wage bill is 0.20 of its value added,
against 0.29 for the whole economy. The rest goes to the estates, and the farm sells 29% of its
output abroad. Issue #288's acceptance check asked for `rel prod` below 1. That holds on the
other four countries. On Costona the check was standing in for "migration stopped short of
parity", which now holds; the excess is land rent and export volume, which belongs to #290.

**The minimum wage no longer reaches a curated farm.** While Costona's countryside could not
empty, the living wage held its farm wage up for decades: +38% by 1976 and Gini −0.040. That was
the only place in the catalogue it moved the distribution. Now the farm wage outruns the floor,
and the statute binds only on manufacturing and transport, where it never moved the Gini. It binds
on a farm through most of 1957–76 in 1 procedural draft in 200, down from 29 in 200. There it now *lowers*
unemployment, because a dearer farm keeps people out of the city's queue for jobs.
`tests/properties/statutes.test.ts` carries both halves of that argument and records the
Costona numbers it used to carry. On Costona, migration alone now does the floor's old work:
with no statute at all, its 1976 Gini falls from 0.484 to 0.445.

No schema bump: no state field, input, output or pipeline position changes. The goldens move.

## Validation

`pnpm agriculture`. Table 2 now prints `job odds` and `exp. gap` beside the raw wage gap, then
`urb %/yr` against `urb max`. Table 3's `rel prod` is the check that the countryside did not
empty past the farm's market. Then the standard gates for a change that moves the economy:
`pnpm batch -- --ticks 400 --country all` once per policy, with passive read per country, and
`pnpm stability -- --policy all --country all`.
