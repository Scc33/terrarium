# 0011 — Is there a neutral rate?

**Status:** Resolved as a state-dependent rate channel, not a fixed growth target; a
player-facing estimate is tracked by [issue #135](https://github.com/Scc33/terrarium/issues/135),
while bond maturities and the yield curve remain [issue #31](https://github.com/Scc33/terrarium/issues/31)

**Raised by:** [issue #126](https://github.com/Scc33/terrarium/issues/126), asking whether a
central-bank setting can be neither accelerating nor slowing growth, and whether the absent yield
curve changes the answer.

**Measured at:** engine `d226cc3`, 40 paired seeds × five authored countries × eight fixed policy
rates × 160 quarters. The harness added with this investigation is
`pnpm neutral-rate -- --runs 40 --ticks 160`.

## The short answer

There is a neutral **rate term** in the model, but there is no single nominal slider setting that
is neutral for growth in every country and quarter.

Credit, asset valuation and domestic private investment all compare one common private real rate
with a fixed 2% annual natural real rate:

```text
private real rate
  = policy rate
  - expected inflation
  + sovereign/private funding spread
  - 0.2 × annual asset-purchase pace

mechanically neutral policy rate
  = 2%
  + expected inflation
  - sovereign/private funding spread
  + 0.2 × annual asset-purchase pace
```

At that setting the **direct rate contribution** to the credit target, asset-price fundamental,
and investment factor is zero. It does not hold GDP growth constant. Investment still reads
utilization, confidence, unemployment, Tobin's q, banking crises and industrialist favour, while
GDP also moves with technology, labor, demand, trade, fiscal policy and shocks. A rate can be
mechanically neutral this quarter while the economy accelerates or slows for any of those reasons.

The nominal setting also moves with the state. Four countries open at 5% because expected
inflation starts at 3% and the rate anchor is 2%. Veltravia opens at 4.52% because its opening
funding spread already adds 0.48 point to the private rate. By the fifth year the passive economy
is in a deflationary transition and still issuing debt; the median mechanically neutral setting
is **−2.60%**, below the player's zero lower bound. By years twenty and forty, calm debt-free
paths settle around **1.9–2.0% nominal**, but surviving paths still span roughly 0.5–3.5%.

So the useful answer is:

- **at the posting:** about 5%, before country-specific funding pressure;
- **during the early deflation/funding squeeze:** often negative and therefore unreachable with
  the policy-rate dial alone;
- **in the calm late game:** about 2% nominal in the median current calibration;
- **in any particular quarter:** use the formula, not one permanent number.

That exact formula is engine truth. The player cannot currently calculate it because neither
adaptive inflation expectations nor the private funding spread is published. Issue #135 tracks a
fog-respecting central-bank estimate rather than exposing those true fields.

## What the engine calls neutral

`privateRealRate` is the common annual price used in three places:

1. `finance` subtracts deviation from 2% from the fundamental asset price;
2. `finance` subtracts the same deviation from the target credit/GDP ratio;
3. `production` subtracts the same deviation from the domestic private-investment factor.

This is internally consistent: there is not one neutral rate for credit and a different hidden
one for investment. Sovereign pressure enters through last quarter's domestic bond issuance and
part of the sovereign risk premium. Asset purchases work on the same price by subtracting two
points at a 10%-of-GDP annual purchase pace.

But 2% is a channel anchor, not an estimated equilibrium output rate. The engine has no central
bank reaction function, no model-derived potential-output gap that solves for `r*`, and no policy
expectations. The cabinet's rate remains wherever the player leaves it. The inherited 4% setting
was calibrated as a passive financial-cycle setting; it was not chosen to make
`privateRealRate === 2%` in every quarter.

## The state-dependent setting

The table summarizes each surviving passive run's last eight quarters. `real gap` is the actual
private real rate minus the 2% anchor: positive is contractionary through the direct rate terms.
Percentiles are across paired country/seed runs, not statistical-office prints.

| horizon | surviving paths | expected inflation p50 | funding spread p50 | neutral nominal p05 | p50 | p95 | actual real gap p50 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Q20 / 5 years | 200 / 200 | −3.30% | 0.94% | −4.27% | **−2.60%** | −0.43% | +6.60% |
| Q80 / 20 years | 200 / 200 | −0.07% | 0.00% | 0.31% | **1.93%** | 3.72% | +2.07% |
| Q160 / 40 years | 199 / 200 | −0.05% | 0.00% | 0.50% | **1.95%** | 3.53% | +2.05% |

The early negative result is not a sign error. Expected deflation raises the private real rate,
and bond funding adds a further spread. Even a zero nominal rate therefore remains above the 2%
real anchor in the median fifth-year path. Asset purchases can ease past the zero lower bound,
but they also carry the same credit, asset-price and banking-fragility consequences as a rate
cut.

Country medians converge without becoming identical:

| country | Q20 | Q80 | Q160 |
|---|---:|---:|---:|
| Meridia | −1.34% | 1.72% | 2.22% |
| Costona | −2.25% | 2.05% | 1.84% |
| Veltravia | −3.78% | 1.52% | 1.66% |
| Oranga | −2.43% | 1.98% | 2.00% |
| Kestrel | −3.13% | 2.18% | 2.04% |

## Fixed-rate response

Each fixed-rate path made one ordinary, player-legal order at Q0 and then left every other lever
alone. The 4% control made no order. Each row is paired with the same country and engine seed;
post-deposition pairs are excluded. `real gap` is the direct rate stance, growth is the annualized
real-GDP growth over the last eight quarters, and level/investment deltas are against the passive
4% pair.

### Five years

| fixed rate | pairs | real gap | growth | GDP level vs 4% | domestic private investment vs 4% | inflation | unemployment |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 0% | 200 / 200 | +2.11% | 12.18% | +1.55% | +22.78% | −0.54% | 18.31% |
| 2% | 200 / 200 | +4.32% | 11.38% | +0.76% | +11.01% | −0.32% | 18.33% |
| 4% | 200 / 200 | +6.60% | 10.69% | — | — | −0.10% | 18.30% |
| 6% | 200 / 200 | +8.25% | 10.07% | −0.75% | −10.51% | +0.25% | 17.92% |
| 10% | 200 / 200 | +11.34% | 9.18% | −1.97% | −29.77% | +1.17% | 16.31% |

Even zero is mechanically contractionary at this horizon. Lower fixed rates still raise the GDP
level and investment relative to 4%, but none reaches the rate anchor because its own inflation
path remains too low.

### Forty years

| fixed rate | pairs | real gap | growth | GDP level vs 4% | domestic private investment vs 4% | inflation | unemployment | ever had a banking crisis |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0% | 199 / 200 | −2.04% | 3.65% | +13.59% | +51.10% | +0.24% | 14.37% | 30.15% |
| 2% | 199 / 200 | **−0.02%** | 3.49% | +6.84% | +23.94% | +0.15% | 14.54% | 22.61% |
| 4% | 199 / 200 | +2.05% | 3.34% | — | — | +0.05% | 14.73% | 22.61% |
| 6% | 199 / 200 | +4.14% | 3.12% | −6.17% | −20.22% | −0.09% | 14.93% | 22.61% |
| 10% | 196 / 200 | +7.88% | 2.66% | −15.12% | −50.25% | +0.82% | 12.64% | 37.76% |

The fixed 2% path is almost exactly neutral in the direct rate term by Q160. It nevertheless has
a 6.84% higher GDP level and 23.94% more domestic private investment than the 4% path because
forty years of earlier rate differences changed the capital stock, demand, finance and later
growth. Current stance does not erase path dependence.

Zero is expansionary through the direct rate terms late in the run and raises crisis incidence,
which is the intended cheap-credit trade-off. Ordinary settings from 0% through 8% produce the
expected monotone response in private investment and the GDP level. No disconnected or
wrong-signed rate channel was found.

## Is the yield curve modeled?

No. The engine has rates, but not a term structure.

- Public debt is one undifferentiated stock with no maturity or duration.
- Every quarter, the entire stock pays the current `policyRate + sovereignRiskPremium` divided by
  four. There are no old fixed-rate bonds alongside new issues.
- New bond issuance changes next quarter's private funding spread, but there is no short/long
  yield distinction and no expectation of future policy rates.
- Asset purchases subtract a calibrated term-premium equivalent from the one private rate; they
  do not buy a dated security from an explicit central-bank balance sheet.

The missing curve does not prevent answering what **today's engine** calls neutral: all three
transmission channels read the same spot-derived private real rate. It does limit realism once a
policy-rate change reaches debt service, long-lived investment, or QE.

The 10% fixed-rate path shows why issue #31 matters. Through Q160 its median government yield is
10.81%, debt remains 57.10% of GDP, and interest consumes 6.20% of quarterly GDP; at 8%, median
debt has retired and the corresponding interest reading is zero. Because all outstanding debt
reprices immediately, the high-rate path has a large fiscal/coupon-income channel alongside its
contractionary investment channel. That makes observed inflation and unemployment non-monotone
at the extreme even while the common private real rate and domestic investment keep the intended
sign. A maturity structure would change the speed and distribution of that pass-through; it is
feature/model work under #31, not a local sign bug.

## Bug audit and implication

No engine bug was found, so this investigation does not change behavior and needs no fix PR.

- `finance` and `production` call the same `privateRealRate` helper and compare it with the same
  `NATURAL_REAL_RATE` constant.
- Sovereign issuance, the risk premium and asset purchases enter that helper once with the
  documented signs.
- The paired sweep moves domestic private investment and the GDP level monotonically across
  ordinary fixed-rate settings.
- The extreme 10% nonlinearity is accompanied by the documented current-yield debt-service and
  coupon channel, not a stuck dial or a second contradictory private rate.

The product gap is legibility. An exact neutral-rate instrument would violate the fog boundary,
because its inputs are engine truth. Issue #135 should instead make the central bank estimate a
range or stance from released inflation and government-known funding evidence, and should say
plainly that “near neutral” describes the direct monetary impulse rather than promising steady
GDP growth. Issue #31 remains the place to decide whether investment and debt service should read
different maturities at all.
