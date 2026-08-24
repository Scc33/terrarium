---
name: economics-review
description: Review and bless a Terrarium engine change — run when golden replays break, when tuning a constant in engine/src/constants.ts, or before running `pnpm bless`. Covers reading a state diff economically, the passive and random-policy baselines the economy must still hit, and the economy/politics seam check. Use whenever engine behaviour moves, including as the last step of adding an indicator, bloc, or institution.
---

# Reviewing an engine change

`pnpm bless` overwrites the golden snapshots with whatever the engine currently produces. It
cannot tell an intended improvement from a broken economy. **The diff review IS the economics
review** (ADR-0008) — there is no other gate, and CI will happily go green on a blessed
disaster.

Never run `pnpm bless` in the same breath as the change that made it necessary.

## The loop

```bash
pnpm test
```

Golden replays break — two cases, `passive-40q` and `fuel-tax-40q`, both on seed `golden-1`.

```bash
pnpm diff-state --moved-only
```

**Always `--moved-only` on any change that adds a schema field.** New fields sort as infinite
relative change and bury the economics under noise. Add `--top N` to see past the default cut,
or a case name to focus one replay.

Read the diff. Then, and only then:

```bash
pnpm bless
```

## Reading the diff economically

You are answering one question: **does every number that moved have a reason I can name?**

Work outward from the change:

1. **Name the intended channel first.** Write down which variables *should* move and roughly
   how much, before you look. A diff you rationalize after the fact will always look fine.
2. **Then hunt for movement outside that channel.** A tax change that moves `priceFuel` is
   expected; one that moves `birthRate` at q8 is a leak worth explaining.
3. **Check the sign, then the magnitude, then the shape.** Wrong sign is a bug. Right sign and
   an implausible magnitude is usually a constant off by a factor. Right magnitude with the
   wrong *timing* is usually a pipeline-order problem — and step order is versioned
   (ADR-0005), so reordering is a schema event, not a refactor.
4. **Money must not vanish.** Bond coupons are household income and redemptions go to
   household savings. If a change makes payments to bondholders disappear, every tax rise
   becomes an austerity bomb and the diff will show it as a demand collapse you didn't order.

If you cannot explain a movement, it is a finding, not a rounding error.

## The baselines

A passing golden diff is necessary, not sufficient — 40 quarters hides century behaviour.

```bash
pnpm batch -- --runs 1000 --ticks 120 --policy random
pnpm batch -- --runs 1000 --ticks 400 --policy passive
pnpm batch -- --runs 1000 --ticks 400 --policy developmental
pnpm stability -- --runs 120 --policy all --country all
```

Medians from 1000 runs on `country=baseline`, re-measured for schema 24 on 2026-08-15. The
ordinary batch CLI streams each trajectory into one aggregate row, so even the developmental
century no longer needs a larger heap. The stability CLI still retains detailed trajectories
because its event windows and driver decompositions consume them. Re-measure rather than trusting
these — they drift, and a stale baseline is worse than none because it invites you to "fix" an
engine that was fine.

**Healthy passive century:** growth ≈ 2.81%/yr · inflation ≈ 0.11% · unemployment ≈ 12.23% ·
**6% deposed** by 400q (median quarter 368). *Re-measured 2026-08-22 at schema 31; the previous
row here (2.70 / 11.90 / 7% / q352) was the schema 24 measurement and had drifted across v25–v30.
Confirmed by running the same 1000×400q batch on the unmodified tree and getting these figures
to every digit — which is also the cheapest way to prove a schema bump is inert.*

That elevated unemployment is **designed**, not a bug: it is the youth-bulge bomb an
unschooled do-nothing government earns. Do not "fix" it.

Building the four state capacities (`--policy developmental`) does absorb it — **11.90% → 9.30%**
— and that is the mechanism working. But note what the same run does to the headline:

| 1000 × 400q | passive | developmental |
|---|---|---|
| real growth %/yr | 2.70 | **2.53** |
| mean inflation %/yr | 0.11 | **−0.16** |
| unemployment % | 11.90 | **9.30** |
| deposed | 7% (median q352) | 12% (median q336) |

**Real growth is LOWER on the developmental path, not higher.** That is a live surprise, not a
documented design claim, and it is recorded here only so the next reader does not mistake it
for a regression they caused. Nobody has ruled on whether it is correct (capacity costs and the
schooling→fertility→labour-force channel both plausibly explain it, and per-head growth is not
what this table measures) — so measure it, do not reason from it.

**Healthy random policy, 120q:** growth ≈ 3.91%/yr · inflation ≈ 0.46% ·
unemployment ≈ 12.12% · **29% deposed** (median quarter 77) · no NaN · no price explosions.

> Re-baselined when the statute book landed (schema 33). `randomPolicy` now spends about a tenth
> of its orders enacting and repealing statutes, which it must — a mechanic the adversarial sweep
> never reaches is a mechanic nothing stress-tests. The previous figures were 4.04%/yr, 11.92%
> unemployment, 26% deposed. This is a deliberate change to the SAMPLER, not a change in the
> economy: passive and developmental are untouched.

CI runs a 200×120 random batch as a smoke test, so NaN and explosions get caught. The
*levels* do not — those are yours to check.

### The environment (schema 34, ADR-0028)

Pollution is the first mechanic here that **moves the baseline on purpose**, so it does not get
the inert treatment the statute book and the rules of a run got. What to check instead:

| 1000 × 400q | before v34 | after |
|---|---|---|
| passive growth %/yr | 2.81 | **2.82** |
| passive unemployment % | 12.23 | **12.26** |
| passive deposed | 6% | **6%** |
| developmental deposed (400×400q) | 8% | **10%** |
| developmental survivors (`future-stability`) | 22 | **19** |

**The passive/developmental split IS the calibration test.** A country at its OWN inherited burden
pays exactly nothing — the damage terms read the excess over `environment.baseline`, not over the
standard country's 1.0 — so passive must stay put while the industrialising cohort pays. Reading it
against the global value shipped once and cost Oranga twelve points of deposition for its recipe's
structure; it was invisible because the passive baseline is measured on the reference country. If a retune moves the passive figures, the burden has stopped being
a cost of development and become a tax on existence, which is a different mechanic and a worse one.

The golden replays are NOT evidence here: they moved 3540 values and every one by 0.00 %, because
40 quarters cannot see a stock with a seventeen-year half-life. Use the 400-quarter batches.

Measured cost of doing nothing, capacity-building century on Meridia: real GDP −6.8 %, consumption
per head −5.7 %, death rate +4.8 % by 2046 against the same run with a clean air act.

### The household basket (schema 35, ADR-0029)

Like pollution, this **moves the baseline on purpose**, and like pollution the split is the test.

| 1000 × 400q | passive before | passive after | developmental before | developmental after |
|---|---|---|---|---|
| real growth %/yr | 2.82 | **2.83** | 3.05 | **3.01** |
| mean inflation %/yr | 0.12 | **0.19** | −0.19 | **−0.11** |
| unemployment % | 12.26 | **12.46** | 11.63 | **11.83** |
| deposed | 6% | **7%** | 9% | **16%** |

Random 120q is near-unmoved: 3.91 → 4.01 %/yr, 12.12 → 12.07 % unemployment, 29% → 29% deposed,
no NaN, no price explosions.

These "after" figures include a bookkeeping fix v35 forced into the open: `init` seeded
`lastRealIncome` GROSS while `cohorts.run` recomputes it after income tax, a 3–9% basis step that
fell only on wage-earning cohorts. `engelReference` is sealed from that field, so the anchor would
have inherited the asymmetry. If you touch `init`'s cohort seeding, this is the invariant: the seed
and `cohorts.run` must compute the same quantity the same way.

**Passive holding still IS the calibration test.** The income term reads each cohort's own sealed
1946 standard, so a do-nothing country never gets rich enough for it to bite. If a retune of
`ENGEL_ELASTICITY` moves the passive column, the basket has stopped being a consequence of
development and become a tax on existence — the same failure mode as reading the pollution burden
against a global threshold.

What the developmental column is paying for is inequality, not inflation: services are staffed 60%
by professionals and the class transition cannot make more of them, so the Gini rises ~5.8 points
by 2046. That cost scales with `ENGEL_ELASTICITY.services` and is nearly insensitive to
agriculture's. Do not try to buy it back by softening the food elasticity — measured, that moves
the Gini 0.3 points. `docs/investigations/0015`.

Use **`pnpm composition`** as the evidence here, not the goldens: it runs investigation 0013's
six arms in three tables (the isolated channel, the century transformation, and what a player
with ordinary tenure actually gets). The number the fix exists to hold is Meridia's service
value-added share at **33.7 → 33.1** across 400 quarters, against 34.2 → 26.9 before.

`HOUSEHOLD_SUBSTITUTION` is wired and ships at **1**. Raising it is a measured dead end
(`docs/investigations/0016`), not an untried idea — re-read that before spending a day on it.

### The statute book (`--policy regulated`)

Builds the four capacities like `developmental`, then climbs every statute ladder a rung at a
time as capital allows. It is the only policy that exercises the statute book comparably, so it
is the arm to run **against `developmental`** — the two differ by nothing except the statutes.

| 200 × 400q, `--country all` | developmental | regulated | | |
|---|---|---|---|---|
| | growth %/yr | growth %/yr | unemployment % | deposed |
| meridia | 3.11 | 3.07 | 11.70 → 11.38 | 9% → 12% |
| costona | 3.67 | 3.68 | 14.64 → 14.43 | **62% → 41%** |
| veltravia | 2.50 | 2.49 | 9.02 → 8.91 | 18% → 24% |
| oranga | 2.86 | 2.83 | 9.00 → 8.83 | 27% → 30% |
| kestrel | 3.53 | 3.50 | 12.30 → 11.96 | 61% → 58% |
| procedural | 3.29 | 3.24 | 11.59 → 11.25 | 27% → 27% |

**Do not read this table as growth.** Growth is flat to slightly negative, because two of the
three statutes cost output on purpose: compulsory schooling withdraws the youngest workers, and
the minimum wage raises unit labour cost. Unemployment falls everywhere partly for a mechanical
reason — a school-leaving age shrinks the labour force, and the rate is measured against it.

The result worth knowing is the last column. **Costona's deposition rate falls from 62% to 41%.**
Nothing in the statute book touches politics directly; the minimum wage binds on Costona's
agricultural wage, the Gini falls about five points, and lower inequality feeds unrest and
approval through the channels that were already there. On the hardest country in the catalogue
the statute book's payoff is survival, not output — which is the correct shape for a political
economy game and was not designed in.

The competition act alone, against `developmental`, was +0.01–0.05 pp/yr per country with the
right ordering (most captured gains most). That is **much smaller than the mechanism test
suggests** — `tests/properties/statutes.test.ts` measures +16% of real GDP on Costona over 160
quarters. Both are correct and the gap is methodological; see the tuning lesson in AGENTS.md
before concluding that either is wrong.

The stability harness is the future-facing balance check. It compares fixed eras through
2050, reports the inflation and real-growth tails that century means conceal, and conditions
the reversal on drought, fuel, banking-crisis, and foreign-partner-crisis onsets. Its balance sample stops on the
quarter a government is deposed: `runOne` deliberately keeps simulating afterward to expose
raw engine failures, but those quarters are not player-reachable. Read both the reachable/raw
failure count and the era tails. `tests/properties/future-stability.test.ts` runs a calibrated
all-country passive/developmental subset in every ordinary test and CI run; use the full CLI
sweep whenever engine behavior moves.

When quiet growth moves, read the driver rows before tuning. They split GDP into additive
output-per-worker and employment contributions and show TFP, labor force, utilization, real
wages, demand satisfaction, and demand components. Investigation 0006 found the post-2000
downside to be demand-led while TFP stayed positive; openness amplified it in a paired country
sensitivity. A frontier or wage-productivity retune aimed at that symptom would hit the wrong
channel.

For a shock change, read three views together: the event-conditioned response, the “quiet”
tails that exclude onset plus eight quarters, and century trend/survival. Improvement in only
one is not a win. The four-quarter drought-recovery experiment at `815a0aa` lowered some
developmental inflation peaks while worsening passive deflation/rebound, quiet tails, and
developmental survival; it was reverted. Its frozen A/B is intentionally retained in
`tests/unit/drought-recovery-experiment.test.ts` and investigation 0005.

## The seam check

The economy and the politics are separate machines. They meet in exactly two places:
`pipeline/institutions.ts` reads the economy to decide who has power, and the veto players
price actions in `actions/apply.ts`.

**If a politics-only change moved the passive baseline, the seam has leaked.** Passive means
no actions, so no veto pricing ever ran — a politics change cannot legitimately reach it.
`pnpm batch --policy passive` is the check. The politics implementation deliberately left the passive baseline
untouched; keep it that way.

## Tuning a constant

Every behavioral constant lives in `engine/src/constants.ts` (ADR-0007). Tune there, nowhere
else. Before picking a number:

- **Measure the resting value.** Political responses are reference-dependent on purpose —
  cohort approval judges income against an EMA of itself, bloc favour against the 1946
  settlement (`BLOC_FAVOR_BASE`), unrest against experienced conditions. Each was a *bug fix*
  for an absolute threshold. Centre anything new the same way, and measure where it rests
  before choosing the constant.
- **A mechanic you cannot reach is not a mechanic.** Measure the distribution of whatever a
  threshold gates under passive, random, *and* deliberately bad play. Two early mechanics were
  dead on arrival at numbers that looked entirely plausible on the page.
- **Player-facing constants get calibrated, not guessed** — pinned as a rate against a
  measured century (`pnpm ranges`, the sweep in `tests/ui/revision-stamp.test.ts`). Those
  tests re-measure rather than snapshot, so a retune that pushes an instrument off its dial
  fails by name.

The load-bearing traps are catalogued in `AGENTS.md` under "Hard-won tuning lessons" — read
that section beside the constant you are about to touch. Highlights: unit costs computed at
`NORMAL_UTILIZATION` (not realized output, or you get a stagflation spiral); wages need all
three legs; `ASSET_REVERT` must out-muscle the collateral feedback or a passive economy
spontaneously bubbles.

## What must not break

`tests/properties/fuel-tax.test.ts` and `subsidy.test.ts` are the
design's load-bearing claims. **If a change breaks them, the change is wrong, not the test.**

`pnpm coverage` enforces an 80% floor over the pure core (currently ~99% stmts / ~90% branch).
It is a floor to prevent regression. Raise it; never lower it to green a build.

## If the result surprised you

A measurement that contradicts what the model was believed to do is worth recording even when
nothing ships — see the **`document-a-decision` skill** for whether it is an ADR, an
investigation, or a tuning lesson.
