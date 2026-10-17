# 0028 — The minimum wage reaches the farm again, then the city

**Status:** Resolved — no change. #295 asked whether a living wage that rarely binds is the
right game. The food margin (#289, ADR-0048) and markets-led trade (#290, ADR-0049) already
brought the floor back within reach, so option 1 (leave it) stands. §4 is a separate finding
about what the floor binds on late in the century.

**Raised by:** [#295](https://github.com/Scc33/terrarium/issues/295), from ADR-0045. Measured
at `55fedb5`: once Costona's countryside could empty, its farm wage outran the floor. The living
wage reached a farm through most of 1957–76 in 1 procedural draft in 200, down from 29.

**Measured at:** `c5f3390` (after ADR-0051), `pnpm minimum-wage -- --seeds 24 --ticks 400`.
The `isolated` arm is `tests/properties/statutes.test.ts`'s: protected tenure, unlimited
capital, the living wage enacted at quarter 40. The `developmental` arm is the runner's
capacity builder, which also legislates the living wage one rung at a time, whenever the order
leaves a whole capacity batch affordable. `binds` is the share of an era's quarters in which a
sector's wage sits on the floor. Deltas are the statute arm against the same seed without it,
averaged over the era. A single quarter is the wrong reading: Veltravia's unemployment falls
from 14% to 3.5% in the four years from 1975. The statute delays that fall by a quarter or two,
and at its midpoint the delay reads as two points of unemployment. Re-measure before acting on
any number here.

## 1. Where it binds now

Isolated arm, share of quarters on the floor:

| | farm 1976–96 | farm 1996–2021 | manuf / transport 2021–46 |
|---|---|---|---|
| meridia | 70% | 80% | 84% / 87% |
| costona | 34% | 56% | 66% / 53% |
| veltravia | 52% | 12% | 64% / 74% |
| oranga | 77% | 80% | 70% / 75% |
| kestrel | 66% | 68% | 72% / 72% |
| procedural | 57% | 57% | 71% / 73% |

The floor binds on every curated farm for part of the century, and then on manufacturing and
transport everywhere. It never reaches services.

## 2. What it buys there

Both halves of the argument appear, and neither is written into the engine (ADR-0027).

- **On the farm, Harris–Todaro.** Meridia, Oranga and Kestrel, 1976–96, isolated arm: the farm
  wage is up 16–20%. Unemployment is down 0.31–0.39pt, because a dearer farm keeps people out
  of the city's job queue. The Gini is down 0.011–0.016. Food costs 10–13% more against
  services, and GDP is 2.9–3.4% lower. Costona shows the same shape a generation later, at about
  half the size.
- **On city wages, disemployment.** In 2021–46 unemployment is up 0.8–1.4pt on every country,
  and the Gini moves by 0.004 at most.

## 3. What a government that wants it gets

The developmental arm. Force before 1976 runs from 0.05 (Costona) to 0.58 (Oranga), depending
on how soon each civil service can carry the order, and from 1996 it is 0.59–0.74. At 0.7 force
the living wage is a Kaitz ratio of about 0.5 against the mean wage.

- The farm bite comes later and is shallower. 1976–96: Oranga 80%, Kestrel 28%, Meridia 18%,
  Costona and Veltravia about 0%. No era's farm wage averages more than 5.5% above the arm
  without the statute.
- The city bite is the statute's main effect. In 2021–46 manufacturing is on the floor in
  66–93% of quarters on every curated country. Unemployment is +0.9–1.4pt and the Gini −0.004
  to −0.013.
- Deposition moves on one country. Veltravia loses its cabinet in 3 of 24 centuries with the
  statute and in none without it. Elsewhere the arms are within one seed of each other. The
  likeliest channel is the veto players, not the floor: industrialists oppose the statute at
  0.8, and Veltravia is the catalogue's industrial country. Not traced.

The `regulated` batch is not the instrument for this. It legislates all three statutes, and
statute congestion holds the minimum wage's force near 0.5. At `6c7bc8b` and 1000 × 400, its
growth, unemployment and deposition matched `developmental` to within 0.03 pp/yr, 0.3pt and 2
points on every country.

## 4. Why the late floor binds on manufacturing

Under `developmental`, one seed per country, the manufacturing wage over the
employment-weighted mean wage falls by 2046 to:

| | 1976 | 1996 | 2021 | 2046 | manuf share of jobs |
|---|---|---|---|---|---|
| meridia | 0.70 | 0.57 | 0.43 | 0.36 | 29% |
| costona | 0.75 | 0.61 | 0.47 | 0.36 | 31% |
| veltravia | 0.59 | 0.50 | 0.40 | 0.35 | 30% |
| oranga | 0.73 | 0.56 | 0.47 | 0.41 | 27% |
| kestrel | 0.64 | 0.54 | 0.40 | 0.32 | 31% |

By then the farm pays 0.63–0.69 of the mean, and services pay 1.29–1.51 while employing about
half the workforce. A rich economy whose factories are its worst-paid jobs, below its farms, is
not a minimum-wage question, but it decides where the minimum wage lands. If it is fixed,
re-run `pnpm minimum-wage`, because the late city bite will move with it.

## 5. The options #295 listed

1. **Leave it — chosen.** The floor reaches the farm on every curated country in the isolated
   arm, and does so in play on Oranga, Kestrel, Meridia and Costona. Where it binds decides which
   argument the player gets, and both arguments are reachable.
2. **Raise `MINIMUM_WAGE_ANCHOR`** — rejected. The farm no longer needs it. It would deepen the
   late city bite, which already costs up to 1.4pt of unemployment, and it would push the Kaitz
   ratio above the historical range.
3. **A rural rung, or a farm-wage anchor** — rejected for now. It would duplicate a channel that
   already binds. A separately set agricultural minimum stays a reasonable future statute if
   the farm drifts out of reach again.

The statute tests' farm claims move back to a curated country: Meridia at quarter 160, all six
seeds. They had been on procedural drafts that had to be replaced twice. The disemployment
claim stays on the doubled-manufacturing Veltravia that ADR-0051 built for it. Plain Veltravia
at quarter 200 shows the job loss too, but on one seed its manufacturing wage ends 0.2% above
the floor, which fails that test's check that the floor is binding at all.
