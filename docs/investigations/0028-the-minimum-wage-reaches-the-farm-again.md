# 0028 — The minimum wage reaches the farm again, then the city

**Status:** Resolved — no change. #295 asked whether a living wage that rarely binds is the
right game. The food margin (#289, ADR-0048) and markets-led trade (#290, ADR-0049) already
brought the floor back within reach, so option 1 (leave it) stands. §4 is a separate finding
about what the floor binds on late in the century.

**Raised by:** [#295](https://github.com/Scc33/terrarium/issues/295), from ADR-0045. Measured
at `55fedb5`: once Costona's countryside could empty, its farm wage outran the floor. The living
wage reached a farm through most of 1957–76 in 1 procedural draft in 200, down from 29.

**Measured at:** `6c7bc8b` (schema 51), `pnpm minimum-wage -- --seeds 12 --ticks 400`. The
`isolated` arm is `tests/properties/statutes.test.ts`'s: protected tenure, unlimited capital,
the living wage enacted at quarter 40. The `developmental` arm is the runner's capacity
builder, which also legislates the living wage one rung at a time once it can afford to.
`binds` is the share of an era's quarters in which a sector's wage sits on the floor. Deltas
are the statute arm against the same seed without it, at the era's last quarter. Re-measure
before acting on any number here.

## 1. Where it binds now

Isolated arm, share of quarters on the floor:

| | farm 1976–96 | farm 1996–2021 | manuf / transport 2021–46 |
|---|---|---|---|
| meridia | 75% | 87% | 93% / 93% |
| costona | 37% | 59% | 78% / 59% |
| veltravia | 41% | 10% | 76% / 86% |
| oranga | 91% | 85% | 83% / 85% |
| kestrel | 73% | 71% | 82% / 81% |
| procedural | 56% | 48% | 72% / 73% |

The floor binds on every curated farm for part of the century, and then on manufacturing and
transport everywhere. It never reaches services.

## 2. What it buys there

Both halves of the argument appear, and neither is written into the engine (ADR-0027).

- **On the farm, Harris–Todaro.** At 1996 in the isolated arm, on the four countries whose farm
  it holds, the farm wage is up 12–23%. Unemployment is down 0.2–0.45pt, because a dearer farm
  keeps people out of the city's job queue. The Gini is down 0.009–0.016. Food costs 6–20% more
  against services, and GDP is 1.6–5% lower.
- **On city wages, disemployment.** By 2021–46, unemployment is up 0.7–1.6pt on every country
  and the Gini moves by less than 0.012.

## 3. What a government that wants it gets

The developmental arm. Enforcement arrives with the civil service: force is 0.00–0.21 before
1976 everywhere except Oranga (0.55), and 0.6–0.8 from 1996. At 0.7 force the living wage is a Kaitz
ratio of about 0.53 against the mean wage.

- The farm bite comes later and is shallower. 1976–96: Oranga 95%, Kestrel 23%, Meridia 17%,
  Costona 0%. The farm wage ends no era more than 6.4% above the arm without it.
- The city bite is the statute's main effect. Manufacturing is on the floor in 88–98% of
  2021–46 quarters on every curated country. At 2046 unemployment is +0.7–1.6pt and the Gini
  −0.009 to −0.026.
- Deposition does not move. Kestrel's 17% → 8% is 2 seeds against 1 out of 12.

The `regulated` batch is not the instrument for this. It legislates all three statutes, and
statute congestion holds the minimum wage's force near 0.5. At 1000 × 400 its growth,
unemployment and deposition match `developmental` to within 0.03 pp/yr, 0.3pt and 2 points on
every country.

## 4. Why the late floor binds on manufacturing

Under `developmental`, one seed per country, the manufacturing wage over the
employment-weighted mean wage falls by 2046 to:

| | 1976 | 1996 | 2021 | 2046 | manuf share of jobs |
|---|---|---|---|---|---|
| meridia | 0.69 | 0.55 | 0.43 | 0.36 | 29% |
| costona | 0.71 | 0.60 | 0.46 | 0.36 | 31% |
| veltravia | 0.55 | 0.48 | 0.39 | 0.35 | 30% |
| oranga | 0.67 | 0.55 | 0.47 | 0.41 | 26% |
| kestrel | 0.63 | 0.53 | 0.39 | 0.32 | 31% |

By then the farm pays 0.63–0.70 of the mean, and services pay 1.28–1.51 while employing half the
workforce. A rich economy whose factories are its worst-paid jobs, below its farms, is not a
minimum-wage question, but it decides where the minimum wage lands. If it is fixed, re-run
`pnpm minimum-wage`, because the late city bite will move with it.

## 5. The options #295 listed

1. **Leave it — chosen.** The floor reaches the farm on every curated country in the isolated
   arm, and does so in play on Oranga, Kestrel, Meridia and Costona. Where it binds decides which
   argument the player gets, and both arguments are reachable.
2. **Raise `MINIMUM_WAGE_ANCHOR`** — rejected. The farm no longer needs it. It would deepen the
   late city bite, which already costs up to 1.6pt of unemployment, and it would push the Kaitz
   ratio above the historical range.
3. **A rural rung, or a farm-wage anchor** — rejected for now. It would duplicate a channel that
   already binds. A separately set agricultural minimum stays a reasonable future statute if
   the farm drifts out of reach again.

The statute tests' farm claims move back to a curated country: Meridia at quarter 160, all six
seeds. The disemployment claim moves to Veltravia at quarter 200, six of six. Both had been on
procedural drafts that had to be replaced twice.
