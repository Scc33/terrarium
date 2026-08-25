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

| what it does to FDI/GDP by Q400 | order |
|---|---|
| **+30%** | build the administrative ministry (`investCapacity administrative`) |
| **+6%** | remove the inherited 10% tariff — and −18% for a 40% tariff |
| **−11%** | fund research at 5% of GDP, by closing the technique gap that attracted the capital |
| **−50%** at Q160, and 66% of quarters price-unstable | finance a 15%-of-GDP transfers rule |
| **0%** | cut the corporate tax to zero |
| **0%** | open or close the border; raise the bank-capital floor to 15% |

The tariff is the only order whose instantaneous effect and its century effect are the same
number. Everything else either compounds (administration) or is undone (the corporate tax).

## What the flow is made of

The eleven multipliers, each read by re-running the pure `foreignInvestment` step with that one
input neutralized and dividing. Nothing in the harness re-implements the formula — a factor that
moves in `foreignInvestment.ts` moves in this table too. Measured on the capacity-building arm,
so the administration row rises by construction:

| factor | Q40 (1956) | Q120 (1976) | Q320 (2026) | reachable by an order? |
|---|---:|---:|---:|---|
| country terrain (size × access × development) | 0.925 | 0.833 | 0.728 | no |
| catch-up room | 0.912 | 0.883 | 0.696 | only by closing it |
| ownership saturation | 0.805 | 0.751 | 0.729 | only by filling it |
| administration | 0.865 | 0.907 | 0.965 | **yes** |
| tariff | 0.940 | 0.940 | 0.940 | **yes** |
| corporate return | 1.273 | 1.282 | 1.150 | **yes, and it is undone** |
| business confidence | 1.091 | 1.146 | 1.061 | only through the economy |
| export intensity | 0.991 | 1.026 | 1.063 | only through the economy (see 0010) |
| foreign cycle | 0.991 | 0.990 | 1.005 | no |
| price stability | 1.000 | 1.000 | 1.000 | by accident (see below) |
| banking crisis | 1.000 | 1.000 | 1.000 | by accident (see below) |
| **realized inflow** | **0.74% of GDP** | **0.72%** | **0.43%** | |

Two things are visible before any policy is applied. The three terrain terms multiply out from
0.679 to 0.369 across the century, and no order touches any of them: **getting rich is what
stops FDI**. And the two safety terms read 1.000 at every reference tick, because a government
that is behaving never trips either — which is exactly why measuring them at a snapshot would
have reported that they do not matter.

## What one order is worth on the margin

The same counterfactual with player-legal dial values instead of neutral ones, everything else
held still. This is the order's upper bound in the quarter it lands, not a prediction:

| order | Q40 | Q120 | Q320 |
|---|---:|---:|---:|
| tariff → 0 (from the inherited 10%) | +6.38% | +6.38% | +6.38% |
| tariff → 40% | −19.15% | −19.15% | −19.15% |
| tariff → 100% (the dial's maximum) | −57.45% | −57.45% | −57.45% |
| corporate tax → 0 (from 20%) | +12.89% | +15.67% | **+19.14%** |
| corporate tax → 50% | −19.34% | −23.50% | −28.71% |
| corporate tax → 80% (the dial's maximum) | −38.68% | −47.00% | −57.42% |
| administrative capacity → 1.00 * | +15.60% | +10.27% | +3.66% |
| administrative capacity → 0.05 * | −18.55% | −22.31% | −26.97% |
| tax capacity → 1.00 * | −7.20% | −4.98% | −1.88% |
| all three, pointing the same way * | +34.86% | +31.09% | +26.10% |

`*` is not an order: a capacity is bought a fraction of a point per quarter, so these are the
channel's bound rather than something a cabinet can do in one turn.

Read on its own, this table says the corporate tax is the FDI lever and it gets stronger as the
tax office improves — because `returnFactor` reads *collected* after-tax profits, so
`taxEfficiency` multiplies the posted rate. That reading is wrong, and the next table is why.

## What the century is worth

Paired against the same seed and country under passive play, truncated at deposition, mean of
the last eight quarters. Every arm re-attempts its own order each quarter until the engine
accepts it, and the quarter it landed is recorded — a refused order produces a plausible row of
near-zeros rather than an error.

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
| transfers at 15% GDP | 58 | −15.7% | −3.45 pp | −0.56 pp | +76.24% | +37.03% |
| tariff → 40% | 98 | −17.8% | −1.47 pp | −0.24 pp | −7.00% | −2.80% |
| open border / closed border / bank capital 15% | 98 | ±0.1% | ±0.05 pp | 0.00 pp | ±1% | ±0.2% |

At Q400 the two working arms have compounded — administration alone is **+29.8%** and the
combined programme **+36.3%**, against a passive level that has fallen to 0.37% of GDP — while
the corporate-tax arm is still +0.2%.

The transfers row is the one to read carefully: only 58 of 100 pairs are still governing at
Q160 and 2 at Q400, so its capital and GDP columns are survivorship, not a result. Its FDI
column is not, because the mechanism is visible in every quarter rather than only in the
survivors (see "the accidental levers" below).

## Why the corporate tax is a trap

The order lands, the term moves, and then the economy takes it back. The realized return factor,
arm by arm:

| corporate return factor | Q20 | Q80 | Q160 | Q400 |
|---|---:|---:|---:|---:|
| passive | 1.433 | 1.343 | 1.372 | 1.336 |
| corporate tax → 0 | 1.554 | 1.442 | 1.453 | **1.378** |
| tax capacity | 1.418 | 1.284 | 1.264 | 1.160 |
| all four capacities | 1.422 | 1.283 | 1.270 | **1.131** |
| admin capacity | 1.433 | 1.346 | 1.373 | 1.337 |

Abolishing the corporate tax buys +9% on the return term at Q20 and **+3.1% by Q400**, against
the +12.9–19.1% the marginal table promised. The term reads after-tax profits as a *share of
GDP*, and a profit share is a price the economy competes back down; meanwhile the revenue is
gone, and the arm ends the century with 5.5% less capital and 3.1% lower GDP per head than its
passive pair. **What the tax cut actually buys is more foreign ownership of a smaller economy**:
foreign-owned capital +0.49 pp and remittances +0.16 pp of GDP at Q400, on an unchanged inflow.

The same table carries the sharpest result in the study. Building all four ministries raises FDI
by a third as much as building only administration (+10.3% against +29.8% at Q400) — and the gap
is *entirely* the tax office. The return factor is 1.131 against 1.337, a ratio of 0.846; the
FDI ratio between the two arms is 0.850. A capable tax office collects the corporate rate that
was posted-but-uncollected, and hands the difference straight to `returnFactor`.

That is not an argument for skipping the tax office. The same all-capacities arm is 60.9% richer
per head at Q400 against administration's 9.3%. It is an argument that FDI/GDP is not a welfare
measure and the policy that maximizes it is not the policy that maximizes the country.

## The accidental levers

Price stability and the crisis multiplier never appear in a well-behaved century, so they have
to be measured every governed quarter rather than at a reference tick:

| arm | quarters with prices unstable | factor when they are | crisis quarters | mean drag |
|---|---:|---:|---:|---:|
| passive | 3.4% | 0.960 | 0.8% | 0.992 |
| every deliberate arm above | 2.6–5.3% | 0.93–0.97 | 0.8–1.4% | 0.988–0.992 |
| random policy | 17.4% | 0.933 | 5.3% | 0.947 |
| **transfers at 15% GDP** | **66.0%** | 0.906 | **22.1%** | **0.780** |

Inflationary finance is the most powerful thing a cabinet can do to the inflow, and it only
points down. `FDI_PRICE_INSTABILITY_AT` is an 8% annualized rate, and a large deficit-financed
transfer programme spends two-thirds of its quarters past it.

The corollary is that the macroprudential floor cannot work as FDI policy even though it reaches
the sharpest term in the flow: the crisis multiplier is 0.30, but it binds in 0.8% of quarters,
so raising the bank-capital requirement to 15% moves FDI by −0.02%. A lever cannot make a rare
event rarer than it already is.

## Three levers that reach a term and move nothing

- **The border.** `fdiStructuralAttraction` has a population elasticity of 0.35, and the
  immigration limit is a dial — but its whole legal range (0 to 0.02) moves the population too
  little to matter. Measured at ±0.1% of the flow at every horizon.
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

1. **There is policy, and the game never says so.** The handbook's one line on foreign
   investment describes what FDI *is*. The four channels that work — administration, the tariff,
   price stability, and the research trade-off — are discoverable only by reading
   `foreignInvestment.ts`. This is the cheapest fix and the one #146 is actually asking for.
2. **The corporate tax is a designed trap and should probably stay one**, but a player who
   spends a century on it currently gets no signal that it was undone. That is a legibility
   question for [#97](https://github.com/Scc33/terrarium/issues/97), not a calibration one.
3. **The only lever that survives a century is the one that moves a stock.** Administrative
   capacity compounds because nothing in the model competes it away; the corporate rate moves a
   price, and prices re-equilibrate. Recorded as a tuning lesson in `AGENTS.md`, because it is
   not specific to FDI — it is how to predict which new lever will still be there in 2046.

Re-measure before acting on any number above: `pnpm fdi -- --runs 20 --ticks 400`, about 70
seconds.
