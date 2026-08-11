# 0005 — Post-2000 shocks produce wider inflation and growth tails

**Status:** Open

**Raised by:** playtesting reported repeated late-game bouts of very high CPI inflation followed
by deflation alongside very high reported real growth.

**Measured at:** `1e91d44` on 2026-08-10.

## Follow-up: the coverage gap is now harnessed

The long-horizon stability harness proposed below now lives in `packages/runner/src/stability.ts`
and is exposed as `pnpm stability`. It reports fixed-era true and first-release wall tails,
shock-conditioned peaks/reversals, and raw versus player-reachable failures. The ordinary
`future-stability` property suite runs passive and capacity-building governments across every
country recipe through 2050, so later engine changes cannot silently reopen the testing gap.

This does not resolve the modeling choice below. No economic constant or reporting convention
was changed; the harness makes the current behavior measurable and gives a future retune a gate.

## Follow-up: quiet quarters and a rejected recovery experiment

**Baseline engine:** `78063a5`; quiet-tail harness: `88f849d`; four-quarter recovery candidate:
`815a0aa`; explicit revert: `2a08d2f`. Measured 2026-08-10.

“Quiet” excludes a shock onset and the following eight quarters. On a 120-seed all-country
sweep, removing those windows narrows the distributions sharply but does **not** remove the
late deterioration:

| policy | quiet measure | 1973-1999 | 2026-2050 |
|---|---|---:|---:|
| passive | inflation p01 / p99 | -5.94 / 4.51 | -7.06 / 6.22 |
| passive | real growth p01 / p99 | -2.94 / 8.52 | -5.66 / 8.56 |
| developmental | inflation p01 / p99 | -7.48 / 4.90 | -7.46 / 5.79 |
| developmental | real growth p01 / p99 | -4.10 / 9.66 | -6.92 / 8.37 |

The spectacular spike/reversal belongs to shocks, but the late downside-growth tail also exists
in the background economy. Drought recovery therefore cannot be the whole stability fix.

Candidate `815a0aa` tested the obvious local intervention: preserve the drought onset and full
damage duration, then geometrically restore agricultural TFP over four quarters instead of one.
The comparison used the identical fixed 5-seed × 6-country cohort through 2050:

| policy | future measure | abrupt baseline | gradual candidate | result |
|---|---|---:|---:|---|
| passive | drought deflation p05 | -8.78 | -10.49 | worse |
| passive | drought rebound growth p95 | 9.87 | 12.75 | worse |
| passive | quiet inflation p01 | -7.89 | -8.60 | worse |
| passive | quiet growth p01 | -5.50 | -5.91 | worse |
| developmental | drought inflation peak p95 | 15.94 | 13.51 | better |
| developmental | drought deflation p05 | -6.38 | -7.73 | worse |
| developmental | drought rebound growth p95 | 12.55 | 10.78 | better |
| developmental | governments reaching 2050 | 17 / 30 | 14 / 30 | worse |

Century growth among survivors stayed in range, and `pnpm diff-state --moved-only` showed the
opening decade was economically bit-identical aside from the candidate schema stamp and recovery
field. But the acceptance rule was conjunctive: improve the drought response **without** making
quiet dynamics, trend, or survival worse. The candidate failed and was reverted.

The measured comparison remains executable in
`tests/unit/drought-recovery-experiment.test.ts`; the candidate commit remains checkoutable.
The next engine investigation should target the quiet late-economy downside—particularly the
price/wage and secular-productivity path—before attempting another shock-shape retune.

## What was tested

The engine was measured from 1946 through 2046 under three kinds of play:

- passive government, over 1,000 procedurally varied baseline countries;
- passive and capacity-building government, over all six curated/procedural scenario recipes;
- random policy, counting only quarters the player was still in power when deciding whether a
  failure was player-reachable.

The capacity-building policy is the one in `tools/indicator-ranges.ts`: attempt to invest 2
money in every capacity every eight quarters. Published ranges used first prints from a fully
surveyed 30-seed × 6-country sweep. A separate Meridia sweep compared the same policy with
standing research appropriations of 0%, 2%, and 5% of official GDP.

"Growth" and "inflation" below are the engine's player-facing convention: the latest quarterly
change annualized, not a four-quarter change. The spike/reversal pattern was defined before
counting it as annualized inflation above 12%, followed within eight quarters by inflation below
-2% and annualized real growth above 8%.

## The coverage gap

There are tests that **run** the future, but none that asserts general post-2000 macro stability.

| gate | horizon | what it actually protects |
|---|---:|---|
| exact golden replays | 40 quarters (1956) | exact state drift in two opening-decade scripts |
| CI random-policy batch | 120 quarters (1976) | NaN and absolute price explosions |
| all-country property batch | 120 quarters (1976) | NaN and absolute price explosions by recipe |
| century property tests | 320-416 quarters | individual finance, demography, technology, world, and UI-domain claims |
| dev-scenario century test | 416 quarters (2050) | only that sector output remains finite |
| `pnpm ranges` | 400 quarters (2046) | published dial coverage, not macro stability |

The economics-review procedure asks for a manual 400-quarter passive batch. Recent engine
changes did run that check, but active behavior still stops at 120 quarters and the century
mean can conceal a late oscillation.

## The passive century is not running away

The ordinary aggregate health check remains green:

```
300 runs × 400 quarters, passive baseline
NaN runs                 0
price-explosion runs     0
deposed                 28 (9%)
median real growth       2.50 %/yr
median mean inflation    0.14 %/yr
median unemployment     12.75 %
```

But the tails widen late even while the century mean stays calm:

| measured quarters | inflation p01 / p99 | real growth p01 / p99 |
|---|---:|---:|
| 1956-1972 | -6.21 / 8.08 | -3.73 / 11.52 |
| 1973-1999 | -6.02 / 8.40 | -3.49 / 10.49 |
| 2000-2025 | -6.66 / 9.42 | -4.40 / 10.57 |
| 2026-2046 | -7.23 / 9.69 | -5.10 / 10.77 |

The positive growth tail does not trend upward in passive play. The inflation distribution and
the negative growth tail do become wider. That is enough to make the late game feel rougher,
but it is not an endogenous hyperinflation/deflation cycle.

## The reported spike/reversal is a shock signature

Seed `batch-201` reproduces the reported shape under **no player actions**:

```
quarter    event / annualized reading                   inflation   real growth
2016 Q3    drought cuts the harvest                         18.61        -8.55
2017 Q1    rains return; prices start unwinding             -2.42        -4.99
2018 Q3    output recovers while the price level unwinds    -8.45         8.11
```

The mechanism is visible in the state. Agricultural TFP falls immediately for a 1-3 quarter
drought, restores immediately when the rains return, prices chase the temporary shortage, and
wages follow realized inflation with a lag. The resulting output fall and rebound are then
raised to the fourth power to print an annualized quarter-over-quarter growth rate.

Across 1,000 passive centuries, every observed spike/reversal matching the definition above
sat next to a drought or world-fuel rupture. Its incidence per 100 run-years was 0.259 in
1956-1972, 0.181 in 1973-1999, 0.069 in 2000-2025, and 0.044 in 2026-2046. The exact pattern is
therefore **less frequent**, not more frequent, late in passive play. A player simply accumulates
more opportunities to see a rare shock as the game goes on.

The response conditional on a drought does get more inflationary in a developed late economy.
Under the all-country capacity-building policy:

| drought starts in | peak inflation p50 / p95 | later deflation p50 / p05 | rebound growth p50 / p95 |
|---|---:|---:|---:|
| 1956-1972 | 8.78 / 15.10 | -5.00 / -8.96 | 8.35 / 14.42 |
| 1973-1999 | 8.81 / 15.61 | -5.26 / -9.00 | 7.21 / 15.22 |
| 2000-2025 | 9.55 / 17.14 | -4.69 / -9.66 | 5.44 / 18.72 |
| 2026-2046 | 10.00 / 19.00 | -4.68 / -9.48 | 4.38 / 14.87 |

Median unemployment at drought onset falls from 12.4% in 1956-1972 to 4.6% in 2026-2046.
That changes the wage equation from a slack drag to a tight-labor push while productivity
passthrough is also fully active. The late economy is consequently less able to absorb a supply
shock without a larger price response. Food's quantity weight and agriculture's output share
both fall over the same period, so a larger late food sector is not the explanation.

## What the player actually sees is wider still

First prints add measurement noise (base standard deviation 2.5 points for growth and 3 points
for inflation) to the already annualized quarterly rate. In the 30-seed × 6-country surveyed
century, the published tails move as follows:

| measured quarters | published growth p01 / p99 | published inflation p01 / p99 |
|---|---:|---:|
| 1956-1972 | -4.96 / 13.74 | -8.46 / 8.51 |
| 1973-1999 | -6.49 / 13.39 | -8.15 / 9.50 |
| 2000-2025 | -7.84 / 14.13 | -8.89 / 10.29 |
| 2026-2046 | -9.00 / 13.43 | -8.97 / 10.44 |

Across the full survey the GDP-growth maximum was 54.0% and the inflation maximum was 42.0%.
Both instrument faces end at 15%, so these rare quarters peg hard against the rail. The GDP
dossier explains that its number is annualized quarter-over-quarter; the inflation dossier does
not currently explain the same convention.

## Research is not the cause

The latest engine update added standing R&D and therefore needed to be isolated. On Meridia,
with capacity-building held constant, a 0%, 2%, or 5%-of-GDP research rule produced late median
mean growth of 1.05%, 1.10%, and 1.21% respectively. Late growth p99 stayed at 11.45%, 11.60%,
and 11.35%; late inflation p01 stayed at -8.17%, -7.78%, and -7.71%. The spike/reversal appeared
in 4, 2, and 3 of 100 runs. R&D raises the trend modestly and does not explain the oscillation.

## The random century report has a separate false positive

A raw 300 × 400 random-policy batch reports 30 price-explosion runs. Only two cross the absolute
price threshold before or at deposition; none of the 27 governments that survive the century
explode. `runOne` continues stepping and attempting random actions after `inPower` becomes false,
so the remaining 28 explosions happen in a simulation the player can no longer reach. This does
not clear the live late-game volatility, but it means a future active-policy gate must truncate
each trajectory at deposition rather than interpreting the post-game tail as gameplay.

## What this implies

The concern is partly confirmed:

1. Post-2000 downside growth and both inflation tails widen, especially under active play.
2. The characteristic inflation -> deflation/high-growth loop is usually a short supply shock,
   abrupt restoration, and annualized-quarterly reporting—not a spontaneous secular cycle.
3. A mature, low-unemployment economy amplifies the inflation side of the same drought.
4. The R&D update is not the source.
5. Current tests exercise future state, but do not guard future macro balance.

Before tuning a constant, decide which claim should change. The live alternatives are:

- retain quarterly dynamics but publish four-quarter growth and inflation, making the instrument
  describe a year rather than multiplying one shock quarter by four;
- keep the volatile headline but make the inflation dossier state the convention as clearly as
  the GDP dossier;
- spread drought damage and harvest restoration over more quarters, or add inventories, so a
  temporary supply shock does not disappear in one pipeline step;
- recalibrate the wage/slack response specifically at mature low unemployment;
- add a long-horizon stability suite across countries and plausible policies, measuring eras and
  truncating at deposition, before changing any engine constant.

The last item is needed whichever modeling choice wins. A 40-quarter golden, a 120-quarter random
smoke test, and a healthy 100-year mean are all capable of missing this failure shape.
