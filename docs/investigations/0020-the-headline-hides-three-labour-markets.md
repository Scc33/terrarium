# 0020 — The headline hides three labour markets, and the reachable one is skill mismatch

**Status:** Open — the spike for [#27](https://github.com/Scc33/terrarium/issues/27) ("multiple
unemployment types"), and the answer to the question
[0001](0001-subsistence-valve-saturation.md) left behind

**Raised by:** #27 asking whether the game should model underemployment — specifically "if the
population is highly educated but the economy isn't making those types of jobs."

**Measured at:** `d915715` (schema 41), `pnpm labour-market -- --seeds 8 --ticks 400`. Five
curated countries × four arms, all with protected tenure and unlimited capital on
`measure-class-structure.ts`'s four-quarter cadence, so what is measured is the labour market
and not whether a cabinet lived to see it. Re-measure before acting on any number here.

## What 0001 left open

Investigation 0001 tried to ship an `underemployment` indicator off the subsistence valve. It
measured three candidate definitions and killed all three: a century of funding everything moved
the Lewis surplus by **0.2 points** against a secular decline of 17, so the needle would have
reported the decade rather than the player. It abandoned the indicator and left one sentence
behind:

> The original question that started this work was whether the game should model more than one
> *type* of unemployment. It already does — the rural/urban split above is enormous and
> completely invisible to the player. That split, not agricultural underemployment, is where the
> reachable version of the idea lives. It cannot be published as-is, because one side of it is an
> accounting artifact rather than an economic fact.

This investigation measures that artifact and finds that its **size** is the reachable quantity.
Both of 0001's findings still stand at schema 41, unchanged in kind and worse in degree.

## The identity

`LABOR_SOURCE` columns sum to 1 per sector, so the jobs it hands each cohort sum to total
employment by construction. With `lf[c]` the cohort's own labour force and `tightness[c]` the
engine's `skillTightness` — jobs ÷ people — the whole decomposition is two lines:

```
M = Σ lf[c] · max(0, 1 − tightness[c])    people whose skill nobody is asking for
S = Σ lf[c] · max(0, tightness[c] − 1)    posts asking for people who do not exist
M − S = U                                 open unemployment, the headline
```

The tool asserts the identity rather than trusting it (max residual `4.6e-16`). It also reports
a drift of up to **0.30pp** between `U` recomputed here and `flows.unemployment`: the tool reads
after the whole tick, `schoolingWithdrawal` reads `statuteForce`, and compliance reads bloc
favour — which `institutions` writes *after* `labor` has cleared the market. Every table below
uses the consistent basis.

## Result 1 — the mismatch is bigger than the headline, and it is policy-separated

`S` at q400, the test every candidate in 0001 failed:

| country | passive | education only | developmental | random | spread |
|---|---|---|---|---|---|
| meridia | **14.1%** | 5.0% | 5.1% | 6.8% | 9.1pt |
| costona | **15.3%** | 4.7% | 4.6% | 8.5% | 10.7pt |
| kestrel | **12.7%** | 5.6% | 5.7% | 7.5% | 7.1pt |
| veltravia | 8.7% | 4.9% | 5.2% | 5.5% | 3.8pt |
| oranga | 8.0% | 4.2% | 4.4% | 4.9% | 3.7pt |

Passive Meridia ends the century with `S = 14.1%` against a headline of `8.5%` — **more posts
asking for absent workers than there are open jobs.** Building the education ministry alone takes
that to 5.0%; the other three ministries add nothing (5.1%), which is worth noting on its own.

The arm spread is 3.7–10.7 points where 0001's best candidate managed 0.2. Whatever else is true
of this quantity, it is not a decade counter.

The full decomposition on Meridia, to show where the two terms separate:

| Meridia | q4 | q40 | q120 | q240 | q400 |
|---|---|---|---|---|---|
| passive — U / M / S | 10.8 / 10.8 / 0.0 | 12.2 / 13.9 / 1.7 | 16.2 / 18.7 / 2.5 | 13.5 / 21.2 / 7.7 | 8.5 / 22.4 / **14.1** |
| education — U / M / S | 10.8 / 10.8 / 0.0 | 12.4 / 14.0 / 1.6 | 16.2 / 18.6 / 2.4 | 12.0 / 15.8 / 3.8 | 3.4 / 8.5 / **5.0** |

## Result 2 — #27's own scenario is reachable, and schools are what reach it

`professionalSurplus` — professionals with no professional post, as a share of the labour force:

| professional tightness (surplus) | q4 | q120 | q240 | q400 |
|---|---|---|---|---|
| costona, passive | 1.23 (0.0%) | 1.19 (0.0%) | 1.65 (0.0%) | 2.36 (0.0%) |
| costona, education only | 1.23 (0.0%) | **0.86 (1.6%)** | **0.85 (2.4%)** | 0.94 (1.3%) |
| veltravia, passive | **0.59 (9.2%)** | 0.85 (3.4%) | 0.99 (0.3%) | 1.16 (0.0%) |
| meridia, developmental | 0.85 (2.1%) | 0.84 (2.5%) | 0.89 (2.3%) | 0.95 (1.4%) |

Two readings, and they point opposite ways:

**Costona is the cleanest demonstration in the whole study.** An agrarian country left alone
keeps professionals in *shortage* for a century (1.23 → 2.36). Build the education ministry and
nothing else, and the same country flips to professional *surplus* within twenty years
(0.86 by q120) and stays there. That is #27's sentence, reproduced: a schooled workforce the
economy is not hiring as professionals. **The model calls it unemployment.**

**Veltravia opens with it already.** 9.2% of its 1946 labour force is professionals the economy
does not hire (tightness 0.59) — an industrial recipe whose inherited school system outruns its
own job structure. Growth closes it by q240 and overshoots into shortage by q400.

The surplus tops out around 2.5–3.4% of the labour force under sustained schooling, and does not
run away. ADR-0032's crossing gate is why — but see "the gate is relative" below.

## Result 3 — 0001's two findings both still stand

**The valve is still jammed.** Share of quarters from 1956 in which
`agri.employment = SUBSISTENCE_CAP × ruralLF` binds:

| | passive | education | developmental | random |
|---|---|---|---|---|
| meridia | 100.0% | 97.2% | 99.2% | 97.4% |
| kestrel | 100.0% | 99.0% | 100.0% | 98.3% |
| oranga | 97.2% | 89.9% | 95.6% | 88.5% |

**The over-allocation is worse, not better.** 0001 measured 113% of the rural labour force in
jobs by 2036. At schema 41 rural tightness reaches **1.19–1.26** at q400 on every country and
arm, and urban workers absorb the whole residual at 0.58–0.88. Rural workers therefore read as
**0% jobless for the century** — `cohorts.run` clamps a negative — while urban workers read
29–42% against a headline near 12%.

## What this means, and the part not to skip

**`S` is currently a measure of the model, not of the economy.** It is the gap between a fixed
wage-split recipe and the class structure the country actually has. Publishing it today would put
a needle on the wall reporting how far `LABOR_SOURCE` has drifted from the demography — which is
0001's mistake with a different denominator, and worse, because this one *looks* like an economic
fact.

It becomes an economic quantity exactly when the allocation is rationed against who exists. So
the order is forced, and it is the opposite of the cheap-first instinct:

1. **Ration the staffing table** against each cohort's labour force. Until heads are allocated to
   people who exist, no labour statistic beyond the headline is publishable. 0001 already called
   this "the one to look at first"; 0018 called it "a live defect in what cohorts *experience*."
   It moves the passive baseline — a century mean unemployment is a pinned claim — so it is not
   the small change it looks.
2. **Let vacancies substitute along the class ladder**, adjacent rungs only, at a
   `SKILL_SUBSTITUTION` that is exactly inert at zero. This is what creates genuine
   *underemployment* — a professional in an urban job, employed and earning the urban wage —
   as distinct from unemployment. `LABOR_SOURCE` never reaches output (production reads
   `sector.employment`, the total), so this is purely distributional and lands through channels
   that already exist: income per head → Gini → approval → unrest → the Engel basket. **There is
   no term subtracting mismatch from output and adding one would be the effect arrow ADR-0028
   exists to refuse.**
3. **Then publish.** By-occupation joblessness is a vector on the office's own clock, like the
   industrial census — the `residence` note in `observation/src/published.ts` already predicted
   this shape. A single headline scalar can sit on the wall beside it; the wall has room for
   seven more instruments at 1280×720.

### Three traps, all measured or read off the code

**Reclassification silently improves the politics.** `institutions.ts` prices union favour off
`flows.unemployment` directly, and so do `production.ts` (Lewis investment), `demography.ts`
(`jobsPull`) and `cohorts.ts` (consumer confidence). Step 2 turns open unemployment into
employment, so the headline falls and all four readings improve while people are measurably worse
off. This is the `livingStandard` sentinel lesson in a new costume: each call site has to say
whether it wanted "not working" or "not working well".

**ADR-0032's crossing gate is relative.** It reads `tightness.professionals /
tightness.urban_workers − 1`, so it keeps professionalising a country already in *absolute*
professional surplus — visible above as developmental Meridia holding 1.4–2.5% surplus while the
share climbs. That is defensible as written (the gate was chosen because there is no wage premium
to read) and it becomes a live question the moment an absolute surplus is a published number.

**The subsistence sink is not a candidate and re-deriving that is wasted work.** 0001 measured
three definitions of agricultural underemployment and all three are demographic trend lines.
Nothing here disturbs that. What changed is that a *different* quantity turns out to be reachable.

## What would settle it

`pnpm labour-market` before and after each step, plus the standard gates for a change that moves
the economy: `pnpm diff-state --moved-only`, all four `pnpm batch` policies with passive read as
the calibration test, and `pnpm bless` with the diff review. Step 1 is the one that needs a
recalibration budget; steps 2 and 3 should each move `meta.schemaVersion` and little else.
