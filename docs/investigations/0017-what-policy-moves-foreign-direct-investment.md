# 0017 — Which policies change foreign direct investment?

**Status:** Resolved as reachability and legibility, not a missing lever. The steerability
question it hands on is [issue #97](https://github.com/Scc33/terrarium/issues/97); the
sealed-openness half is [issue #53](https://github.com/Scc33/terrarium/issues/53)

**Raised by:** [issue #146](https://github.com/Scc33/terrarium/issues/146) — "are there any
policies which change foreign direct investment?"

**Measured at:** engine `3b7bb96`, 20 paired seeds × five authored countries × 16 scenarios ×
400 quarters. The harness added with this investigation is `pnpm fdi -- --runs 20 --ticks 400`.

## The short answer

Yes — four of them, and the two that look most like FDI policy are the two that do not work.

[ADR-0018](../adr/0018-fdi-is-owned-capital.md) gave the flow no dial deliberately, so the flow
is a product of eleven multipliers and the real question is which of the eleven an order can
reach, how far, and whether the century leaves it moved. Measured over a century of play:

| what it does to FDI/GDP | order |
|---|---|
| **+16% by Q160, +30% by Q400** | build the administrative ministry (`investCapacity administrative`) |
| **+6%**, flat at every horizon | remove the inherited 10% tariff — and −18% for a 40% tariff |
| **−9% by Q160, −11% by Q400** | fund research at 5% of GDP, by closing the technique gap that attracted the capital |
| **−16% by Q160**, with two-thirds of quarters price-unstable | finance a 15%-of-GDP transfers rule |
| **0%** | cut the corporate tax to zero |
| **0%** | open or close the border; raise the bank-capital floor to 15% |

The tariff is the only order whose instantaneous effect and its century effect are the same
number. Everything else either compounds (administration) or is undone (the corporate tax).

## How the factors are read

Each of the eleven multipliers is measured by re-running the pure `foreignInvestment` step with
that one input neutralized and dividing. Nothing in the harness re-implements the formula — a
factor that moves in `foreignInvestment.ts` moves in these tables too.

The state each ratio is taken on is the step's own **input**, reconstructed by re-running the
prefix of `TICK_ORDER` from the post-order state. That matters: at the end of a tick,
`production` and `prices` have recomputed profits, nominal GDP and inflation, and `labor` has
already added this quarter's inflow to the foreign-owned stock — so a factor read there would
have the saturation term reading its own output. The prefix is taken from `TICK_ORDER` itself,
so a step inserted ahead of foreign investment joins it without an edit to the harness.

(Measured both ways while fixing this: the boundary changes every factor in the third decimal
and no conclusion below. It is corrected because a harness that is right by luck is not
reusable, not because the answer moved.)

## What the flow is made of

Measured on the capacity-building arm, so the administration row rises by construction. "Reach"
is what an order can do about the term: **ordered** — a dial or a capacity order moves this and
nothing else; **indirect** — reachable only as a by-product of some other policy; **sealed** —
no order reaches it at all.

| factor | Q40 (1956) | Q120 (1976) | Q320 (2026) | reach |
|---|---:|---:|---:|---|
| trade access × development | 0.988 | 0.988 | 0.988 | sealed |
| foreign cycle | 0.991 | 0.990 | 1.005 | sealed |
| country size (population) | 0.937 | 0.882 | 0.806 | indirect (the border, measured inert) |
| tariff | 0.940 | 0.940 | 0.940 | **ordered** |
| corporate return | 1.275 | 1.284 | 1.149 | **ordered** |
| administration | 0.864 | 0.906 | 0.965 | **ordered** |
| catch-up room | 0.912 | 0.883 | 0.696 | indirect (research closes it) |
| ownership saturation | 0.806 | 0.752 | 0.729 | indirect (success fills it) |
| business confidence | 1.089 | 1.147 | 1.064 | indirect |
| export intensity | 0.989 | 1.025 | 1.063 | indirect (see 0010) |
| price stability | 1.000 | 1.000 | 1.000 | indirect, and only downward |
| banking crisis | 1.000 | 1.000 | 1.000 | indirect, and too rare to steer |
| **published inflow** | **0.73% of GDP** | **0.71%** | **0.44%** | |

The structural draw is split rather than reported whole, because its three inputs have different
reach. Openness and development are sealed into the country recipe and the sealed half is flat
at 0.988 for the whole century. Population is not sealed — the immigration limit is a dial — but
its whole legal range moves the flow by ±0.1%, so it is `indirect` and measurably inert. Both
halves are read by calling the exported `fdiStructuralAttraction` at two populations and
dividing, so neither re-implements the size elasticity. (Medians across five countries do not
multiply, because a small country is also an open one; read the rows, not their product.)

Two things are visible before any policy is applied. **Every part of the century-long decline is
a term that success moves** — size 0.937 → 0.806, catch-up 0.912 → 0.696, saturation 0.806 →
0.729 — while the genuinely sealed terms do not move at all. Getting rich is what stops FDI, and
the only orders that reach any of the three push them the wrong way. And the two safety terms
read 1.000 at every reference tick, because a government that is behaving never trips either —
which is exactly why measuring them at a snapshot would have reported that they do not matter.

## What one order is worth on the margin

The same counterfactual with player-legal dial values instead of neutral ones, everything else
held still. This is the order's upper bound in the quarter it lands, not a prediction:

| order | Q40 | Q120 | Q320 |
|---|---:|---:|---:|
| tariff → 0 (from the inherited 10%) | +6.38% | +6.38% | +6.38% |
| tariff → 40% | −19.15% | −19.15% | −19.15% |
| tariff → 100% (the dial's maximum) | −57.45% | −57.45% | −57.45% |
| corporate tax → 0 (from 20%) | +12.85% | +15.65% | **+19.11%** |
| corporate tax → 50% | −19.27% | −23.47% | −28.67% |
| corporate tax → 80% (the dial's maximum) | −38.55% | −46.94% | −57.34% |
| administrative capacity → 1.00 * | +15.68% | +10.32% | +3.68% |
| administrative capacity → 0.05 * | −18.49% | −22.27% | −26.95% |
| tax capacity → 1.00 * | −7.23% | −5.01% | −1.89% |
| all three, pointing the same way * | +34.92% | +31.13% | +26.10% |

`*` is not an order: a capacity is bought a fraction of a point per quarter, so these are the
channel's bound rather than something a cabinet can do in one turn.

Read on its own, this table says the corporate tax is the FDI lever and it gets stronger as the
tax office improves — because `returnFactor` reads *collected* after-tax profits, so
`taxEfficiency` multiplies the posted rate. That reading is wrong, and the next table is why.

## What the century is worth

Paired against the same seed and country under passive play, mean of the last eight quarters.
Every arm re-attempts its own order each quarter until the engine accepts it, and the quarter it
landed is recorded — a refused order produces a plausible row of near-zeros rather than an error.

Two filters, and the counts in the first column are after both. A pair is included only if
**both** arms were still governing through the horizon, so every column here — the FDI column
included — is conditioned on survival. And an arm whose order is an event rather than a
programme is included only where that order was **in force for the whole eight-quarter reading
window**: an order refused for a century, or landing at Q155 of a window running Q152–Q160,
otherwise contributes a quarter that measured no intervention to a median beside quarters that
did. That is the `insist` trap one step further along — the order is no longer silently skipped,
it is silently untreated.

Measured, it binds only at the short horizon, and there it bites: at Q20 the transfers arm goes
from −10.5% on 98 diluted pairs to **−12.7% on 61 treated ones**, and the closed-border arm's
confident 98-pair zero turns out to rest on **5** pairs that had actually closed the border for
the whole window. By Q80 every order has long since landed and the filter changes nothing.

| scenario at Q160 | pairs | Δ FDI/GDP | Δ foreign-owned | Δ remitted | Δ capital | Δ GDP/head |
|---|---:|---:|---:|---:|---:|---:|
| **admin capacity** | 98 | **+15.9%** | +0.67 pp | +0.11 pp | +10.09% | +3.75% |
| **open for business** (tariff 0 + corporate 5% + admin) | 97 | **+21.5%** | +1.79 pp | +0.39 pp | +7.88% | +2.92% |
| all four capacities | 98 | +10.2% | +0.79 pp | −0.04 pp | +13.54% | **+16.41%** |
| zero tariff | 98 | +5.8% | +0.51 pp | +0.09 pp | +2.47% | +1.03% |
| tax capacity | 98 | +0.1% | −0.28 pp | −0.19 pp | +0.55% | −0.49% |
| corporate tax → 0 | 98 | **+0.1%** | +0.69 pp | +0.25 pp | −5.53% | −1.92% |
| corporate tax → 50% | 98 | −4.9% | −0.09 pp | −0.27 pp | −8.53% | −3.45% |
| research at 5% GDP | 92 | −8.8% | +0.19 pp | +0.03 pp | −4.76% | +3.58% |
| transfers at 15% GDP | **58** | −15.7% | −3.45 pp | −0.56 pp | +76.24% | +37.03% |
| tariff → 40% | 98 | −17.8% | −1.47 pp | −0.24 pp | −7.00% | −2.80% |
| open border / closed border / bank capital 15% | 98 | ±0.1% | ±0.05 pp | 0.00 pp | ±1% | ±0.2% |

At Q400 the two working arms have compounded — administration alone is **+29.8%** and the
combined programme **+36.3%**, against a passive level that has fallen to 0.37% of GDP — while
the corporate-tax arm is still +0.2%.

**Do not quote the transfers row's capital or GDP columns.** 58 of 100 pairs survive to Q160 and
2 to Q400, and a cabinet that governs for forty years while spending 15% of GDP on transfers is
a selected draw, not a policy result: +76% capital is survivorship. The FDI column is drawn from
the same 58 pairs and inherits the same conditioning, so the honest support for "inflationary
finance is the strongest thing a cabinet can do to the inflow" is not this row — it is Part 5
below, which is measured over every governed quarter of all 100 runs and does not require a run
to reach the horizon at all.

## Why the corporate tax is a trap

The order lands, the term moves, and then the economy takes it back. The realized return factor,
arm by arm:

| corporate return factor | Q20 | Q80 | Q160 | Q400 |
|---|---:|---:|---:|---:|
| passive | 1.423 | 1.341 | 1.372 | 1.335 |
| corporate tax → 0 | 1.539 | 1.441 | 1.451 | **1.383** |
| tax capacity | 1.408 | 1.283 | 1.263 | 1.160 |
| all four capacities | 1.412 | 1.281 | 1.270 | **1.132** |
| admin capacity | 1.423 | 1.343 | 1.374 | 1.336 |

Abolishing the corporate tax buys +8% on the return term at Q20 and **+3.6% by Q400**, against
the +12.9–19.1% the marginal table promised. The term reads after-tax profits as a *share of
GDP*, and a profit share is a price the economy competes back down; meanwhile the revenue is
gone, and the arm ends the century with 5.5% less capital and 3.1% lower GDP per head than its
passive pair. **What the tax cut actually buys is more foreign ownership of a smaller economy**:
foreign-owned capital +0.49 pp and remittances +0.16 pp of GDP at Q400, on an unchanged inflow.

The same table carries the sharpest result in the study. Building all four ministries raises FDI
by a third as much as building only administration (+10.3% against +29.8% at Q400) — and the gap
is *entirely* the tax office. The return factor is 1.132 against 1.336, a ratio of 0.847; the
FDI ratio between the two arms is 0.850. A capable tax office collects the corporate rate that
was posted-but-uncollected, and hands the difference straight to `returnFactor`.

That is not an argument for skipping the tax office. The same all-capacities arm is 60.9% richer
per head at Q400 against administration's 9.3%. It is an argument that FDI/GDP is not a welfare
measure and the policy that maximizes it is not the policy that maximizes the country.

## The accidental levers

Price stability and the crisis multiplier never appear in a well-behaved century, so they are
measured every governed quarter rather than at a reference tick. This is the one table in the
study that does not condition on surviving to a horizon: a run deposed in 1970 contributes the
quarters it governed.

| arm | quarters with prices unstable | of which deflation | factor when they are | crisis quarters | mean drag |
|---|---:|---:|---:|---:|---:|
| passive | 3.4% | **45%** | 0.960 | 0.8% | 0.992 |
| every deliberate arm above | 2.6–5.2% | 8–56% | 0.93–0.97 | 0.8–1.4% | 0.988–0.992 |
| random policy | 17.2% | 31% | 0.933 | 5.3% | 0.947 |
| **transfers at 15% GDP** | **65.6%** | 3% | 0.906 | **22.1%** | **0.782** |

Inflationary finance is the most powerful thing a cabinet can do to the inflow, and it only
points down. `FDI_PRICE_INSTABILITY_AT` is an 8% annualized rate, and a large deficit-financed
transfer programme spends two-thirds of its quarters past it.

But the drag is charged on `Math.abs(inflationQ × 4)`, and the deflation column is why that is
worth stating rather than assuming: **45% of the passive arm's repelled quarters are falling
prices, not rising ones**, and the corporate-tax-50% arm — a demand suppressant — reaches 56%.
Only a deliberately inflationary programme is one-sided (transfers, 3%). A handbook sentence
about "inflation past 8%" would therefore be wrong about nearly half the cases a do-nothing
century produces, which is what the player-facing text now says instead.

The corollary is that the macroprudential floor cannot work as FDI policy even though it reaches
the sharpest term in the flow: the crisis multiplier is 0.30, but it binds in 0.8% of quarters,
so raising the bank-capital requirement to 15% moves FDI by −0.02%. A lever cannot make a rare
event rarer than it already is.

## Three levers that reach a term and move nothing

- **The border.** `fdiStructuralAttraction` has a population elasticity of 0.35, and the
  immigration limit is a dial, so the size term is genuinely reachable rather than terrain — but
  its whole legal range (0 to 0.02) moves the population too little to matter. Measured at ±0.1%
  of the flow at every horizon. It is listed as `indirect` above on the strength of the mechanism
  and inert on the strength of the measurement; those are different claims and the table keeps
  them apart.
- **The bank-capital floor**, above.
- **Research**, in the direction nobody wants. Funding research at 5% of GDP lowers FDI by 8.8%
  at Q160 and 10.6% at Q400 while *raising* GDP per head 3.6–4.4%, because the catch-up term
  reads the technique gap and closing it is what research is for. It is the same shape as the
  terrain decline: the flow is attracted by the country you are trying to stop being.

## What the player can actually see

`fdi_inflows` is funded at statistical capacity 0.40 and its first-print noise is 12% of the
true reading scaled by office quality (`baseSd: 0.12, relativeSd: true`,
`noiseScale = 1 − 0.85 × capacity`). At a true reading of 0.5% of GDP the office's stated 95%
half-width is ±0.073 pp at capacity 0.45 — the first quarter it can state a band at all — and
±0.018 pp at a fully built office.

Against those bands, of everything measured here:

- the administration programme (+0.11 pp by Q400) clears the band at any office quality;
- a punitive tariff (−0.10 pp) and inflationary finance clear it;
- removing the tariff (+0.02 pp) is inside the band of a mediocre office and only at the edge of
  a good one;
- **every corporate-tax result is invisible at every office quality.**

So a player watching the needle sees roughly what this study found, which is a good sign for the
fog, and it means the answer to #146 cannot be delivered by retuning the instrument.

## The terrain falls faster than any lever lifts

Passive FDI/GDP, median, by country:

| country | openness | Q20 | Q80 | Q160 | Q400 |
|---|---:|---:|---:|---:|---:|
| meridia | 1.00 | 0.84% | 0.66% | 0.56% | 0.37% |
| costona | 0.68 | 0.56% | 0.51% | 0.51% | 0.32% |
| veltravia | 0.94 | 0.80% | 0.51% | 0.43% | 0.34% |
| oranga | 1.55 | 1.89% | 1.13% | 0.95% | 0.71% |
| kestrel | 1.25 | 1.23% | 1.03% | 0.88% | 0.57% |

Openness orders the level and nothing a cabinet does reorders it — `openness` is sealed into the
country recipe, exactly as investigation 0010 found for the export order. And every country's
share falls by roughly half over the century. The best available programme (+36%) does not lift a
2046 economy back to its own 1951 dependence. That is ADR-0018 working as designed — FDI/GDP
falls with size, development and foreign ownership, all three of which a successful century
raises — but it means the instrument reads as a *declining* series under good play, and a player
who takes it for a scoreboard will conclude their policy is failing while it works.

## Implication

Nothing here is an engine bug, and no accounting problem was found. Three things follow, and
none of them is a retune of this flow:

1. **There is policy, and the game never said so.** The handbook's one line on foreign
   investment described what FDI *is*. The four channels that work — administration, the tariff,
   price stability, and the research trade-off — were discoverable only by reading
   `foreignInvestment.ts`. This is the cheapest fix and the one #146 is actually asking for; it
   ships with this investigation as a section in the handbook's economy chapter.
2. **The corporate tax is a designed trap and should probably stay one**, but a player who
   spends a century on it currently gets no signal that it was undone. That is a legibility
   question for [#97](https://github.com/Scc33/terrarium/issues/97), not a calibration one.
3. **The only lever that survives a century is the one that moves a stock.** Administrative
   capacity compounds because nothing in the model competes it away; the corporate rate moves a
   price, and prices re-equilibrate. Recorded as a tuning lesson in `AGENTS.md`, because it is
   not specific to FDI — it is how to predict which new lever will still be there in 2046.

Re-measure before acting on any number above: `pnpm fdi -- --runs 20 --ticks 400`, about 80
seconds.
