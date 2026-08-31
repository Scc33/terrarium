# 0021 — The opening vector asks for more jobs than the country has hands

**Status:** Open — a pre-existing calibration defect in `init`, surfaced (not caused) by
[ADR-0035](../adr/0035-staffing-is-rationed-against-who-exists.md). It clears on the first
tick, and fixing it moves the whole curated catalogue, so it is deliberately not fixed there.

**Raised by:** review of [#200](https://github.com/Scc33/terrarium/pull/200). The staffing
allocation promises `Σ_s heads[s][c] ≤ laborForce[c]` — nobody works two jobs — and that promise
rests on `labor` holding total employment under `EMPLOYMENT_CEILING × lf`. `init` applies no such
ceiling, and nobody had checked whether it needed one.

**Measured at:** schema 43, `init` only (tick zero), five curated countries and 1000 procedural
seeds.

## The finding

`init` sets sector employment from `BASE_EMPLOYMENT` scaled by **total population**:

```
Σ employment = 11.9 × totalPop / 27.5 = 0.4327 × totalPop
```

while the labour force is scaled by the **working classes only**:

```
Σ laborForce = workerShareMult × [0.55·(rural + urban) + 0.60·professionals]
```

Nothing reconciles the two. `business_owners` and `retirees` have zero participation but full
weight in `totalPop`, so any country with a heavy dependent share opens with more posts than
people — and the split is authored per country, so this is not an exotic corner.

**Jobs per person at q0:**

| country | jobs ÷ people |
|---|---|
| meridia | 0.929 |
| costona | **1.021** |
| veltravia | 0.919 |
| oranga | 0.975 |
| kestrel | **1.034** |

Procedural, 1000 seeds: median 0.968, p95 1.043, max 1.076. **390 of 1000 (39%) open
overdrawn**; 489 (48.9%) open above `EMPLOYMENT_CEILING × lf`, which is the threshold `labor`
itself enforces from tick one onward.

So two of the five shipped countries, and two fifths of the generator's output, spend their
opening quarter employing people who do not exist.

## Why it clears, and why that made it invisible

`labor` runs every quarter and ends with `if (totalEmp > ceiling) scale down`. From q1 the
country is inside its own labour force and stays there — measured across five countries × 240
quarters, the worst cohort sits at exactly 1.000× and never above. The defect is exactly one
tick long.

One tick is not nothing, because it is the tick that seeds everything reference-dependent:
`lastRealIncome`, `engelReference`, `savings`, `score.baselineWelfare`. But the damage is
smaller than it looks, and the reason is worth writing down:

**the wage BILL is unaffected.** `wages[id] = LABOR_SHARE × valueAdded[id] / employment[id]`, so
`Σ wages × employment = LABOR_SHARE × Σ valueAdded` no matter what employment is. Inflating
employment inflates head counts and deflates the wage per head by exactly the same factor. What
is distorted is *per-cohort* income — the split — not the total, and not the price level.

`engelReference` and `engelIncome` are both seeded from the same `incomeAfterTax`, so the opening
Engel ratio is exactly 1 regardless (ADR-0030's seal holds). This is the one reference-dependent
field that is provably untouched.

## What ADR-0035 does about it, and what it deliberately does not

Rationing cannot conjure people. When posts exceed hands the two constraints are genuinely
incompatible, and `allocateStaffing` resolves it in the documented direction — the wage bill
wins, because `production` has already charged the sector and an unfilled post deletes household
income that firms paid.

What the review changed is *who* carries the impossible part. The first implementation handed the
whole shortfall to whichever cohort was already largest in each sector, which on Costona read as
**professionals at 1.113× with their neighbours at 1.000**: one plausible-looking number rather
than a visible defect. It is now spread pro rata on the labour force, so every class lands at the
same multiple of itself and that multiple *is* the country's jobs-per-person. Costona reads 1.021
across the board; the aging-society draft below reads 2.131 across the board.

That makes the defect legible. It does not fix it.

## Why the fix is not in that PR

The fix is to give `init` the same ceiling `labor` applies. It is a three-line change and it is
**money-neutral by the identity above** — `gross`, `valueAdded`, `gdp0`, `wageBill0` and every
fiscal aggregate are unchanged, because `tfp` and `wages` absorb the scaling exactly. Only head
counts and `tfp` move.

But `tfp` moving is not nothing: it is the production function, forever. Solving it against
fewer workers raises measured productivity for Costona and Kestrel and for two fifths of
procedural seeds, which changes the difficulty matrix, the inheritance table in
`docs/country-scenarios.md`, and every batch baseline. That is a recalibration of the catalogue,
and folding it into a staffing-allocation change would put a balance change behind a bug fix —
the thing AGENTS.md keeps saying not to do.

**The goldens cannot see any of this.** All three cases in `tools/golden-cases.ts` run
`standardCountry` — Meridia, at 0.929 jobs per person, the one curated country where the defect
provably cannot appear. Same shape as ADR-0028's pollution baseline, which was invisible for
exactly the same reason: the reference country is the one where the bug cannot show. Use
`pnpm batch` and per-country reads, not `pnpm bless`, for anything in this area.

## The drafting room makes it much worse, legally

`validateCountryParams` requires only `cohortSizes[id] > 0`, and `COUNTRY_DRAFT_DOMAIN.cohortSize`
is `{min: 0.1, max: 45}` per class **independently**. There is no cross-field rail, so a player
can draft a country whose dependants dwarf its workers:

| draft (every slider inside its rail) | jobs ÷ people at q0 |
|---|---|
| aging society — retirees 20M, workers 12M | **2.131** |
| corner of the box — retirees 45M, each working class 0.1M | **115.5** |

These are legal documents that `init` accepts and the study in ADR-0019 samples. They are not
*wrong* in the sense of crashing — the economy collapses to the ceiling at q1 and plays on — but
a country that opens at 115 jobs per person is not a country anybody meant to author.

## What to do next

1. **Give `init` the ceiling**, as its own change, with `pnpm bless` + all four batch policies and
   a re-measured `docs/country-scenarios.md`. This is the actual fix.
2. **Give the drafting room a cross-field rail** on dependants vs workers, mirroring it in
   `ui/src/countryDraft.ts` the way every other rail is mirrored. Today the sliders can author a
   country the engine can only accept by counting people twice.
3. Until (1) lands, the pro-rata block at the foot of `allocateStaffing` is the honest behaviour
   and `tests/properties/staffing.test.ts` pins it.

Not urgent, and not a regression — this has been true since `BASE_EMPLOYMENT` was written. What is
new is that the engine now states an invariant that this violates, which is why it is written down
rather than left for the next person to rediscover.
