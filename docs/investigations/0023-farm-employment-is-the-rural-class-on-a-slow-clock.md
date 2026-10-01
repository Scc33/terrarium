# 0023 — Farm employment is the rural class on a slow clock, and the clock stops at a food exporter

**Status:** Open — the spike for [#151](https://github.com/Scc33/terrarium/issues/151). The three
changes it points at are split out as [#288](https://github.com/Scc33/terrarium/issues/288),
[#289](https://github.com/Scc33/terrarium/issues/289) and
[#290](https://github.com/Scc33/terrarium/issues/290), in that order.

**Raised by:** #151, "even in a very wealthy, highly educated, and industrial society the
employment rate of agriculture is very high." The comment on that issue measured the basket fix
(ADR-0030) taking Meridia from 30.6% to 21.5% by 2046, and named the supply side as unmeasured.

**Measured at:** `92f9d13` (schema 46). Composition tables are `pnpm agriculture -- --seeds 8
--ticks 400` (protected tenure, unlimited capital; `developmental` funds all four capacities every
four quarters). Macro tables are `pnpm batch -- --runs 200 --ticks 400 --country all`, ordinary
tenure. Counterfactuals are one-line edits to `constants.ts` or `demography.ts`, listed with each
table and reverted after the run. Re-measure before acting on any number here.

## Where it stands

Agricultural share of employment, developmental arm:

| | 1947 | 1976 | 2006 | 2046 |
|---|---|---|---|---|
| meridia | 46.2 | 41.1 | 29.9 | **20.5** |
| costona | 53.8 | 53.0 | 41.2 | **25.4** |
| kestrel | 45.3 | 38.9 | 29.2 | **20.3** |
| veltravia | 27.6 | 24.4 | 21.8 | **18.6** |
| oranga | 29.3 | 27.6 | 23.8 | **19.5** |

For scale, and only to the nearest few points: Japan went from about 48% in 1950 to about 10% by
1980, Italy from about 42% in 1951 to about 17% by 1971, South Korea from about 63% in 1963 to
about 18% by 1990, and high-income economies sit at 1–5% today. The fast transitions shed roughly
**4–5% of the farm workforce's share a year**. Every country here gets four to nine times richer
over the century and ends between 18% and 25%. Veltravia, the industrial recipe, loses only nine
points in a hundred years.

The passive arm ends **within 0–3 points of developmental** in every country (Meridia 22.4 against
20.5), even though the developmental arm consumes a third more per head. So by 0001's test, the
share is a decade counter and not a policy outcome.

The issue comment named two constraints. The first, `ENGEL_ELASTICITY.services` held at 0.32, is
gone: ADR-0032 refunded its political cost and it ships at 0.45. The second, the supply side, is
what this measures. The supply side turns out not to be where the problem is.

## 1 — The farm's headcount is the rural class times 0.92

`labor` caps agricultural employment at `SUBSISTENCE_CAP × laborForce.rural_workers`. From q20 on
the cap binds in **90–100% of quarters on every country and both arms**, at `emp/cap = 1.000`, and
it still binds under every counterfactual below (93–100% of quarters even in the one that takes
the share to 7%). `labor`'s own hiring target sits at 0.98–1.09× the headcount, so the farm always
wants slightly more hands than the countryside has. The price of food clears the gap, not the payroll.

So **farm labour demand never decides farm employment.** The agricultural row of the industrial
census is `0.92 × rural labour force`, and the only thing that moves it is the class transition in
`demography`. Two things follow, both measured:

**The subsistence valve is dead weight.** Setting `SUBSISTENCE_ABSORPTION_Q = 0` moves the 2046
farm share by at most a point anywhere. Passive growth goes 2.94 → 2.95%/yr and unemployment
12.83 → 12.85%. The valve tops the farm up to a cap it is already pinned to. Developmental
deposition reads 12% → 17%, about two standard errors at 200 runs, and is not explained here.
0001 found the valve saturated. This is the stronger claim that it no longer does anything to
growth, and `docs/tuning-lessons.md`'s "growth needs both valves" is amended to say so.

**Faster farm productivity does nothing either.** `TECH_EXPOSURE.agri` 0.85 → 1.1 (farms riding
the frontier faster than factories, which is closer to the post-war record) moves the 2046 share
by under half a point. That is the textbook result. With a unit price elasticity in the basket
(`HOUSEHOLD_SUBSTITUTION = 1`), a cheaper farm sector gets the same share of spending, so
productivity growth cannot release labour. The cheaper food goes abroad instead: farm net exports
rise from 0.29 to 0.36 of farm output on Meridia. **Do not tune agricultural technology for this.**

## 2 — The clock has a speed limit

`demography` drains the rural class at

```
move = URBANIZATION_GAIN × rural × clamp(wageGap, 0, 1) × jobsPull
```

so it can never shed more than `4 × 0.004 = 1.6%` of itself a year, however wide the gap. A century
at full speed every quarter leaves `(1 − 0.004)^400 ≈ 0.20` of the 1946 rural class: Meridia's
51% rural labour force bottoms out near 10% and Costona's 66% near 13%. **Even with no food
demand at all, the speed limit alone holds Meridia and Costona above 10% in 2046.** The fast real
transitions ran at three times this rate.

The limit binds where it matters. Costona's urban wage is **3.8–4.2× its farm wage** from 1956 to
1976 (`wage gap` 2.8–3.2), and the countryside drains no faster than it would at 2×.
`jobsPull` then halves the rate through the mid-century unemployment hump (0.50–0.55 around 1976
on Meridia, Costona and Kestrel).

| developmental, ag employment 2006 / 2046 | meridia | costona | veltravia | oranga | kestrel | gap 2046 |
|---|---|---|---|---|---|---|
| baseline | 29.9 / 20.5 | 41.2 / 25.4 | 21.8 / 18.6 | 23.8 / 19.5 | 29.2 / 20.3 | 0.32 |
| clamp on the gap 1 → 4 | 29.2 / 20.3 | 31.2 / 21.2 | 21.8 / 18.6 | 23.8 / 19.5 | 29.1 / 20.3 | 0.31 |
| no `jobsPull` on the move | 25.6 / 19.3 | 28.9 / 19.5 | 21.5 / 18.4 | 23.4 / 19.3 | 25.3 / 19.0 | 0.23 |
| `URBANIZATION_GAIN` × 3 | 22.1 / 16.9 | 24.4 / 16.9 | 20.1 / 17.2 | 21.3 / 17.4 | 22.0 / 16.7 | 0.05 |
| `URBANIZATION_GAIN` × 10 | 19.7 / 15.9 | 20.2 / 16.0 | 18.8 / 16.5 | 19.6 / 16.8 | 19.3 / 16.0 | 0.00 |

Lifting the clamp helps only Costona, the one country whose gap exceeds it. The gain is the
binding piece. And at ten times the gain the wage gap closes to zero and **every country stops at
16–17%**. That is the destination, which speed cannot reach past.

## 3 — The destination is set by what the farm sells, and it sells too much

Migration stops when the farm wage catches the city's, and that happens at whatever headcount
agriculture's share of demand can pay for. Two things hold that share at 15–25% of value added in
2046, where the real figure for a rich country is 1–3%.

**Food trade scales with the farm's own capacity.** `production` sets exports at
`EXPORT_BASE_SHARE × qPot × openness × partner demand × (p_world/p)^1.5`, and imports at
`IMPORT_BASE_SHARE × qPot × …` of the same *domestic* potential. A farm sector that grows sells
proportionally more abroad whatever the world wants. A farm sector that shrinks imports less food,
not more. Under development the farm's net exports rise from 0.08–0.15 of its gross output in
1947 to **0.29–0.35 by 2046** on Meridia, Costona, Oranga and Kestrel. Under passive they end at
0.11–0.19. **This is most of why developing barely helps.** Meridia's developmental household food
share is 13.6% against passive's 16.8%, and the export share more than doubles to cover it.

**Households buy all their food at the farm gate.** The food share of household spending falls
from 34% in 1947 to 13.6% in 2046 on Meridia, which is a plausible figure for *food*. But every
unit of it is agricultural output, with `IO_COEFF`'s 0.67 value-added ratio. In real economies the
farm's share of the food budget falls steeply with income, because processing, distribution and
restaurants take a growing share of what a household pays for food. `ENGEL_ELASTICITY.agri = −0.35`
models the household's total food bill and nothing about where that money lands.

| developmental, ag employment 2006 / 2046 | meridia | costona | veltravia | oranga | kestrel | gap 2046 |
|---|---|---|---|---|---|---|
| `EXPORT_BASE_SHARE.agri` 0.14 → 0.04 | 30.0 / 16.7 | 42.4 / 25.8 | 19.6 / 15.4 | 19.7 / 14.8 | 27.6 / 16.4 | 0.48 |
| `ENGEL_ELASTICITY.agri` −0.35 → −0.8 | 29.1 / 15.9 | 40.8 / 24.7 | 18.4 / 13.3 | 20.2 / 14.1 | 27.5 / 15.9 | 0.57 |
| both | 29.6 / 15.3 | 42.0 / 25.5 | 15.3 / 9.8 | 15.4 / 9.2 | 27.3 / 14.4 | **1.53** |

Each alone takes 3–5 points off the countries the speed limit does not hold back. Costona moves by
under a point, because it is pinned by the clock and not the destination.

## 4 — They only work together, and the order is forced

Note the wage gap in the last row. Cut the farm's market without speeding the clock, and the farm
still holds 92% of the rural workforce while what it sells shrinks. Prices and wages absorb the
whole adjustment. Costona's urban wage ends at **7× its farm wage**. That is a rural poverty
trap, and it is priced: the export cut alone takes **Costona's developmental deposition from 26%
to 62%** and Kestrel's from 33% to 42%.

Both together, `URBANIZATION_GAIN × 3` plus the export and Engel edits:

| ag employment 2006 / 2046 | meridia | costona | veltravia | oranga | kestrel | gap 2046 |
|---|---|---|---|---|---|---|
| developmental | 12.8 / **7.6** | 20.7 / **7.7** | 11.7 / **8.1** | 10.9 / **7.3** | 13.8 / **8.0** | 0.14 |
| passive | 16.4 / 10.5 | 20.8 / 13.1 | 13.2 / 9.1 | 12.4 / 7.9 | 18.3 / 12.0 | 0.16 |

That is inside the historical range for the income growth these countries achieve. It also makes
development matter on the three countries that open agrarian. The developmental–passive spread
goes from 1.9 to 2.9 points on Meridia, **1.5 to 5.4 on Costona** and 3.1 to 4.0 on Kestrel, which
is #97's question answered for this one statistic. The two industrial recipes stay under a point.

The macro cost, `pnpm batch --country all`, 200 × 400q:

| | passive growth / u / deposed | developmental growth / u / deposed |
|---|---|---|
| baseline | 2.94 / 12.83 / 1% | 3.14 / 12.52 / 12% |
| `URBANIZATION_GAIN` × 3 | 2.88 / 12.78 / 1% | 3.08 / 12.53 / **5%** |
| export base 0.04 | 2.98 / 13.23 / 2% | 3.22 / 13.02 / **23%** |
| Engel −0.8 | 2.92 / 12.93 / 1% | 3.11 / 12.59 / 14% |
| all three | 2.85 / 13.11 / 4% | 3.10 / 13.04 / 9% |

**The speed change pays for itself.** By country, developmental deposition goes from 26% to 3% on
Costona and from 33% to 18% on Kestrel, while passive deposition does not move on any country. The
agrarian country's baseline deposition was the rural poverty trap all along, at a milder setting.
The two demand-side changes cost passive a few points, about one run in thirty-three per country,
so they still need the economics review.

One caution for whoever builds this: under all three, farm value added per worker overtakes the
economy's (relative productivity 1.25 on Meridia and 1.55 on Costona by 2046, against 0.88 and
1.00 at baseline). Real farms stay *less* productive per head than the rest of the economy, so a
reading above 1 means the countryside emptied faster than the farm's market shrank. That is
`pnpm agriculture`'s `rel prod` column, and it belongs in the acceptance check.

## What this implies

1. **Speed first ([#288](https://github.com/Scc33/terrarium/issues/288)).** Raise
   `URBANIZATION_GAIN`, or replace the clamped wage gap with an expected-income comparison (urban
   wage times the chance of an urban job, against the farm wage) so a fourfold gap moves people
   faster than a twofold one. It is worth shipping alone: on its own it cuts developmental
   deposition and leaves passive deposition where it is.
2. **Then the farm's share of the food bill ([#289](https://github.com/Scc33/terrarium/issues/289)).**
   Either read `CONSUMPTION_WEIGHTS.agri` as the farm-gate share and steepen its Engel term, or
   route a share of the food basket that rises with income through manufacturing and services.
   Never before step 1.
3. **And food trade ([#290](https://github.com/Scc33/terrarium/issues/290)).** Exports and
   imports scaled by the sector's own potential is a whole-trade-model fact, so the fix belongs
   with #203 and #155 rather than as an agricultural special case. Never before step 1.

**If those three leave the share stuck,** the structural alternative is to stop pinning farm
employment to the rural class: let `labor` set it from demand like every other sector, and let
the rural class follow the farm's payroll. That reopens the valve, the cap and ADR-0035's staffing
assumptions together, and nothing here shows it is needed yet.

**Not candidates, and re-deriving that is wasted work:** the subsistence valve, agricultural TFP,
and the wage-gap clamp on its own.

## What would settle it

`pnpm agriculture` before and after each step. Read table 1's `cap binds` to see whether the pin
still holds, table 2's `urb %/yr` against `urb max` for the speed, and table 3's `net exp.` and
`rel prod` for the destination. Then the standard gates for a change that moves the economy:
`pnpm batch --country all` on every policy, with passive read per country, and `pnpm diff-state
--moved-only` → `pnpm bless`.
