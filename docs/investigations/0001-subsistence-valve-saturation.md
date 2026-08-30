# 0001 — The subsistence valve is saturated for most of the century

**Status:** Open — the valve finding stands. The question this document left open ("more than
one *type* of unemployment... the reachable version of the idea lives" in the rural/urban split)
was taken up and measured in
[0020](0020-the-headline-hides-three-labour-markets.md).
**Raised by:** an attempt to ship an `underemployment` indicator, which was measured, found
unreachable, and abandoned before it reached a PR.
**Measured at:** `a0cf497`, 6 seeds × 400 quarters, decade means.

## What was being built

The plan was an `underemployment` indicator: publish the agricultural underemployment the
subsistence valve in `pipeline/labor.ts` already creates, so that a quarter printing 6 %
unemployment alongside 14 % underemployment would *explain* an approval collapse the player
currently cannot account for.

The pitch was that this is cheap — measurement of a mechanic that already runs, no economics
change, so the passive baseline cannot move. The measurement says the mechanic does not do what
that pitch assumed.

## What the valve actually does

`labor.ts` moves idle hands onto the family farm at `SUBSISTENCE_ABSORPTION_Q` (6 % of idle
labour per quarter), capped at `SUBSISTENCE_CAP × ruralLabourForce` (92 %).

```
                1946   1956   1966   1976   1986   1996   2006   2016   2026   2036
passive
  cap binds %   52.9  100.0  100.0  100.0  100.0  100.0   99.2   99.6   98.3   97.1
  headroom/LF    2.0    0.0    0.0    0.0    0.0    0.0    0.0    0.0    0.0    0.0
  agri/ruralLF  88.2   92.0   92.0   92.0   92.0   92.0   92.0   92.0   92.0   92.0
developmental
  cap binds %   52.5  100.0  100.0  100.0  100.0  100.0   98.8   97.9   76.3   74.2
  headroom/LF    2.0    0.0    0.0    0.0    0.0    0.0    0.0    0.0    0.1    0.1
  agri/ruralLF  88.1   92.0   92.0   92.0   92.0   92.0   92.0   92.0   91.8   91.7
```

("developmental" = all four capacities funded every 8 quarters, the `tools/indicator-ranges.ts`
policy. `headroom/LF` is the valve's unused absorption as a share of the labour force.)

**The valve is jammed fully open from 1956 to 2050 in essentially every run.** Agricultural
employment is pinned at exactly the cap, with 0.0–0.1 % of the labour force in unused
absorption. Even a developmental century that drives unemployment down to 4.3 % is still
saturated three quarters of the time.

So agricultural employment is not responding to slack. It is `0.92 × ruralLabourForce` — a
demographic quantity set by the pyramid and the class-share drift, not a cyclical one.
`SUBSISTENCE_ABSORPTION_Q` has had no marginal effect since 1955: the cap is reached
immediately and never released.

This does not contradict the design note in `CLAUDE.md` ("the subsistence valve keeps the
impoverished nominally employed") so much as narrow it. That is true **structurally** — a third
of the labour force is on the land at low marginal product throughout. It is not true
**cyclically**: for most of the century the farm cannot take one more person, so idle hands stay
idle and land in `unemployment`, which is where the whole policy signal turns out to live.

## Why the indicator could not be built on it

Three definitions were measured. All are demographic trend lines; none carries policy signal.

| measure | passive 1946 → 2036 | developmental 1946 → 2036 |
|---|---|---|
| employment above agriculture's own demand target | median **0.00** | median **0.00** |
| Lewis surplus (marginal product below the rest of the economy) | 38.5 → **21.6** | 38.6 → **21.8** |
| productivity gap (employment share − output share) | 18.5 → **9.4** | 18.6 → **8.7** |
| *for contrast:* `unemployment` | 9.1 → **10.0** | 9.4 → **4.3** |

A century of funding everything moves the Lewis measure by 0.2 points and the productivity gap
by 0.7, against a secular decline of 9–17 points that happens regardless. The needle would tell
the player which decade it is, not what they did — which is the measurement-register version of
"a mechanic you cannot reach is not a mechanic", and the reason nothing shipped.

The first definition failed for a separate and duller reason worth recording: agriculture's
staffing target carries `NORMAL_UTILIZATION` headroom, so realized employment sits *below*
target in ~75 % of quarters and `max(0, employment − target)` is zero almost always.

The two surviving definitions, for whoever picks this up:

```ts
// Lewis surplus: agri hands whose marginal product sits below the marginal
// product prevailing in the sectors that hire at a wage. Cobb-Douglas, so
// MPL = β·Y/L and L* solves MPL(L*) = mplRef.
const mplA = (LABOR_ELASTICITY * agri.output) / agri.employment
const mplRef = (LABOR_ELASTICITY * restOutput) / restEmployment
const lStar = agri.employment * Math.pow(mplA / mplRef, 1 / (1 - LABOR_ELASTICITY))
const surplus = Math.max(0, agri.employment - lStar)

// productivity gap: the dual-economy statistic, no algebra required
const gap = agri.employment / totalEmployment - agri.output / totalOutput
```

## The second finding: rural labour is over-allocated

Chasing *why* the cap binds turned up something separate, and probably more important.

`LABOR_SOURCE` columns sum to 1 per **sector** — they are each sector's staffing mix. Rural
workers therefore staff agriculture (1.0), manufacturing (0.2) and transport (0.3). Nothing
constrains the sum of those against the rural cohort's own labour force:

```
                1946   1956   1966   1976   1986   1996   2006   2016   2026   2036
passive
  agri/ruralLF  88.2   92.0   92.0   92.0   92.0   92.0   92.0   92.0   92.0   92.0
  rural elsew.  11.3   12.2   13.8   15.5   17.2   18.5   19.3   20.1   20.8   21.0
  → total       99.5  104.2  105.8  107.5  109.2  110.5  111.3  112.1  112.8  113.0
```

By 2036 the model has **113 % of the rural labour force in jobs**. The only global constraint is
`ceiling = 0.97 × lf` on *total* employment across all cohorts (`labor.ts`); there is no
per-cohort labour-supply constraint, so the rural cohort can be over-subscribed while the
aggregate looks fine.

Two consequences, both measured.

**Per-cohort joblessness, exactly as `pipeline/cohorts.ts` computes it** (`1 - employed / lfc`,
shown here *before* its `clamp(…, 0, 1)`):

```
                1946   1956   1966   1976   1986   1996   2006   2016   2026   2036
passive
  rural         0.5   -4.2   -5.8   -7.5   -9.2  -10.5  -11.3  -12.1  -12.8  -13.0
  urban        18.6   32.5   35.8   35.9   34.5   33.4   32.7   31.7   30.6   30.4
  headline u    9.1   14.2   16.0   15.8   14.4   13.2   12.4   11.4   10.3   10.0
developmental
  rural         0.6   -4.2   -5.9   -7.9   -9.8  -11.3  -12.3  -13.2  -13.7  -13.6
  urban        19.0   32.7   35.3   34.1   31.4   28.9   26.9   24.8   22.9   22.8
  headline u    9.4   14.4   15.9   14.6   12.2    9.9    8.1    6.1    4.5    4.3
```

Rural joblessness is **negative from 1956 onward**, so the clamp pins it at zero for the rest of
the century: cohort approval for the largest poor cohort never sees a labour-market term at all.
Urban joblessness meanwhile runs at **30–36 %** under passive play, two to three times the
headline rate. The aggregate is a blend of an impossible number and a catastrophic one.

**The headline rate is biased down by the same arithmetic.** Aggregate unemployment divides
total sector employment by total labour force, and total employment includes the rural
over-allocation. From the measured shares — the excess is ~13 % of a rural labour force that is
itself ~34 % of the total — correcting it would move passive 2036 unemployment from 10.0 % to
roughly **14.4 %**. That figure is arithmetic from the shares above, not a re-run, and should be
re-derived before anyone leans on it.

Whether this is a bug is a genuine question and not one this document rules on. The cohort →
sector mapping is a fixed matrix, not a labour market that clears, so some slack in the
accounting may be deliberate. What is clearly true is that the `SUBSISTENCE_CAP` comment
("family farms can only stretch so far") describes an absorption ceiling, and the constant is
instead behaving as a permanent floor under agricultural employment.

There is also a design observation buried in the table. The original question that started this
work was whether the game should model more than one *type* of unemployment. It already does —
the rural/urban split above is enormous and completely invisible to the player. That split, not
agricultural underemployment, is where the reachable version of the idea lives. It cannot be
published as-is, because one side of it is an accounting artifact rather than an economic fact.

## If someone picks this up

The two findings are separable and should probably be separate changes.

**The over-allocation** is the one to look at first, because it is cheap to check, it biases the
headline unemployment rate, and it reaches cohort approval and therefore unrest. The question to
answer before touching anything: is the rural cohort's employment *supposed* to be bounded by
its own labour force, or is the fixed `LABOR_SOURCE` matrix meant to be read as shares of jobs
rather than claims on people? Note that fixing it moves the passive baseline too — the century
mean unemployment it feeds is a pinned claim — so it is not the small change it first looks.

**The saturation** is an economics change with real blast radius. `CLAUDE.md` flags
`SUBSISTENCE_ABSORPTION_Q` and its cap as load-bearing — uncapped, the valve recreates the
Malthusian trap — and the passive century baseline it feeds (u ≈ 12.4 % century mean, the
designed §8 youth-bulge bomb) is a pinned claim. Any change here needs
`pnpm batch --policy passive --ticks 400` before and after, and a look at whether the M1
exit-criteria tests still hold.

Only if the valve is made genuinely cyclical does an `underemployment` indicator become
reachable. Until then the honest instrument for "the headline rate is hiding hardship" is a
household income series, not a labour one.
