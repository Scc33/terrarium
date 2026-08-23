# 0012 — Why does a larger capital stock not permanently raise growth?

**Status:** Resolved as a level-versus-rate effect in the current model; research into
shortage-based infrastructure services is tracked by [issue #142](https://github.com/Scc33/terrarium/issues/142),
and a maintained public-infrastructure stock by
[issue #143](https://github.com/Scc33/terrarium/issues/143)

**Raised by:** [issue #125](https://github.com/Scc33/terrarium/issues/125), after large public-works
and research programmes made the capital-stock instrument climb without an obvious permanent
change in the GDP-growth instrument. The issue also asked whether depreciation was modeled.

**Measured at:** engine `4e0f471`, 12 paired seeds × five authored countries × nine spending-rule
paths × 400 quarters. The harness added with this investigation is
`pnpm capital-returns -- --runs 12 --ticks 400`.

## The short answer

Capital is connected and consequential. A one-time fixed-cash public-works vote initially worth
5% of official GDP leaves the median authored country with **31.7% more capital, 10.5% more
potential output, 10.4% more realized GDP, and 9.0% more output per worker** at Q400 than its
paired passive path. The late growth rate has nevertheless returned to passive, within
−0.05 percentage point per year.

That is the expected distinction between a **higher level** and a permanently higher **growth
rate**. The engine's sector production function is:

```text
potential output = TFP × capital^0.35 × employment^0.65
```

At unchanged labor and technique, 31.7% more capital implies about 10.1% more potential output:
`1.317^0.35 = 1.101`. The measured 10.5% includes the path's small labor, sector-allocation, and
political differences. A doubling of capital is not a doubling of capacity; at the current
elasticity it is a 27.5% increase before those other changes.

The wall makes the result harder to read than the engine does. `capital_stock` is a total stock,
while `gdp_growth` is a one-year rate. Population can change beneath both, and the capital
instrument does not show capital per worker or capital/output. Issues
[#76](https://github.com/Scc33/terrarium/issues/76),
[#83](https://github.com/Scc33/terrarium/issues/83), and
[#86](https://github.com/Scc33/terrarium/issues/86) already track those interpretation gaps.

## What the engine does

Production computes each sector's potential from TFP, capital, and employment, then realizes the
lesser of potential and gross demand. Public works are converted to real investment after
administrative delivery and investment-goods prices, then added to domestic private investment
and FDI.

The next labor/capital step updates the stock:

```text
K[next] = 0.985 × K + private investment + FDI + public investment
```

Depreciation is therefore present at **1.5% per quarter**: about 5.87% over four quarters and an
11.5-year half-life with no replacement. Domestic private investment is itself anchored to
`depreciation × K`, multiplied by the bounded investment factor. Near the calm late-century
path, private investment replaces almost exactly one depreciation flow.

Research is different. Its cheque is government final demand, but it deliberately creates no
physical capital. Delivered and staffed research enters a decaying research stock; that stock
accelerates sector technique catch-up or buys stochastic frontier breakthroughs. Public works
and R&D can reinforce the same output path, but R&D is not part of the capital number.

## Formal measurement matrix

All paths make ordinary spending-rule orders at Q4, after the first national-accounts release.
They run with protected tenure and unlimited political capital so deposition and the opening
political-capital endowment do not censor the economic comparison. Those rules are identical in
the paired passive arm. Bloc favour still moves, so the normal politics-to-investment and
politics-to-technology channels remain live.

`fixed 5%` and `CPI 5%` mean a Q4 cash amount equal to 5% of that day's official GDP. They do not
remain 5% of GDP. `GDP 2%` and `GDP 5%` remain shares of each subsequent official release. The
R&D arms use the same convention at 2%.

### Century-end levels

Median paired difference from passive at Q400:

| rule at Q4 | capital | capital / worker | capital / annual output | potential output | real GDP | GDP / capita | output / worker |
|---|---:|---:|---:|---:|---:|---:|---:|
| public works, fixed 5% | +31.7% | +28.2% | +17.5% | +10.5% | +10.4% | +9.1% | +9.0% |
| public works, CPI-indexed 5% | +28.1% | +24.6% | +15.4% | +10.0% | +9.9% | +8.4% | +8.0% |
| public works, GDP share 2% | +97.9% | +87.3% | +50.2% | +35.6% | +35.8% | +26.3% | +24.7% |
| public works, GDP share 5% | +558.8% | +337.5% | +147.8% | +128.8% | +154.1% | +98.0% | +76.6% |
| R&D, fixed 2% | −1.3% | −1.2% | −1.2% | −0.2% | −0.2% | −0.1% | 0.0% |
| R&D, GDP share 2% | −2.8% | −2.2% | −3.4% | +0.5% | +0.6% | +0.8% | +1.1% |
| works + R&D, fixed 5% + 2% | +28.0% | +20.6% | +12.8% | +10.5% | +10.3% | +7.7% | +7.4% |
| works + R&D, GDP share 2% + 2% | +98.1% | +85.7% | +46.6% | +36.8% | +36.7% | +28.5% | +26.6% |

`capital / annual output` is useful for comparing paired paths and direction, but its absolute
level is not a national-accounts estimate. The stock is an engine index calibrated for the
production function; investigation 0002 leaves its absolute units as an open question.

### Growth, persistence, and stability

Late growth is annualized real-GDP growth over Q320–Q400. Spending shares and inflation are
medians over that same window. `public / depreciation` and `private / depreciation` compare the
final quarter's real investment with `0.015 × K`. A price-explosion path has any sector price
above 50× or below 1/50× base, the runner's ordinary tripwire.

| rule at Q4 | late growth | vs passive | works / GDP | R&D / GDP | public / depreciation | private / depreciation | inflation | price-explosion paths |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| passive | 1.61% | — | 0.15% | 0.00% | 0.02 | 1.01 | 0.17% | 0.0% |
| public works, fixed 5% | 1.53% | −0.05pp | 0.29% | 0.00% | 0.03 | 1.01 | 0.15% | 0.0% |
| public works, CPI-indexed 5% | 1.53% | −0.04pp | 0.29% | 0.00% | 0.03 | 1.01 | 0.15% | 0.0% |
| public works, GDP share 2% | 1.89% | +0.30pp | 1.99% | 0.00% | 0.19 | 1.00 | 0.26% | 0.0% |
| public works, GDP share 5% | 2.77% | +1.09pp | 4.88% | 0.00% | 0.27 | 1.28 | 6.87% | 13.3% |
| R&D, fixed 2% | 1.59% | −0.01pp | 0.15% | 0.14% | 0.02 | 1.01 | 0.16% | 0.0% |
| R&D, GDP share 2% | 1.58% | −0.03pp | 0.14% | 1.99% | 0.02 | 1.01 | 0.28% | 0.0% |
| works + R&D, fixed 5% + 2% | 1.51% | −0.08pp | 0.27% | 0.11% | 0.03 | 1.01 | 0.15% | 0.0% |
| works + R&D, GDP share 2% + 2% | 1.98% | +0.28pp | 1.99% | 1.99% | 0.19 | 0.99 | 0.36% | 0.0% |

The 5%-GDP path is not a clean demonstration of productive endogenous growth. Median inflation
is high, 13.3% of paths cross the price tripwire, and its late private investment is 1.28 times
depreciation. Demand, prices, finance, and capital accumulation are all reinforcing it. It is a
useful stress case and a bad target.

### The fixed public-works pulse through time

| horizon | capital | capital / worker | real GDP | output / worker | public works / GDP |
|---:|---:|---:|---:|---:|---:|
| Q40 | +13.1% | +11.1% | +6.1% | +4.1% | 4.19% |
| Q160 | +28.7% | +22.4% | +12.3% | +7.4% | 1.54% |
| Q240 | +31.8% | +24.3% | +12.6% | +8.2% | 0.78% |
| Q320 | +32.0% | +26.5% | +11.8% | +8.6% | 0.44% |
| Q400 | +31.7% | +28.2% | +10.4% | +9.0% | 0.29% |

The stock advantage stops widening around Q240 as the appropriation loses economic weight. It
does not disappear because private investment replaces the larger inherited stock. Real GDP
peaks earlier relative to passive and then converges slowly while remaining permanently higher
within the measured century.

### The fixed result is not Meridia-specific

At Q400, medians within each authored country:

| country | capital | capital / worker | real GDP | GDP / capita | output / worker | late-growth delta |
|---|---:|---:|---:|---:|---:|---:|
| Meridia | +38.4% | +34.8% | +13.9% | +11.5% | +11.0% | −0.07pp |
| Costona | +43.7% | +28.2% | +21.8% | +10.1% | +9.0% | −0.04pp |
| Veltravia | +31.7% | +30.7% | +10.3% | +9.2% | +9.6% | −0.06pp |
| Oranga | +20.6% | +19.9% | +7.2% | +6.4% | +6.5% | −0.05pp |
| Kestrel | +23.2% | +20.4% | +9.3% | +7.1% | +6.7% | −0.05pp |

Costona's larger aggregate GDP response than per-capita response is exactly why a total capital
stock should not be read beside aggregate growth without population and labor denominators.

## What this resolves

No disconnected capital channel or missing depreciation was found.

- Public works become real capital and raise potential output with the intended sign.
- Realized output follows the higher capacity; late utilization remains near the normal 85% and
  demand satisfaction near 100%, so the additional stock is not simply idle.
- Diminishing returns explain the gap between the capital and output responses.
- Depreciation is active, grows with the enlarged stock, and is mostly replaced by private
  investment on calm late paths.
- A fixed or CPI-indexed cash programme becomes a small share of a growing economy, so its growth
  impulse ends while its higher capital level remains.
- A maintained GDP-share rule can keep capital deepening active through the game horizon, but a
  sufficiently large share becomes an overheating experiment.
- R&D acts through technique, not physical capital. At the measured 2% share it moves aggregate
  technology attainment by only 1.4% and adds little to the public-works result; that is a separate
  calibration/legibility question, not evidence that capital is disconnected.

Issue #125 can close as an answered spike. That does not mean the capital model is finished.
Investigation 0002 still asks why capital/output trends down under the ordinary baseline, and the
wall still lacks the denominators and ownership distinctions in #76/#83/#86.

## What the measurement suggests next

The current public-works dial builds undifferentiated sector capital. Making it a stronger generic
multiplier would increase every factory, foreign-owned asset, road, and machine's return together
without explaining what the state built.

The cleaner future model is a separate **public-infrastructure stock and service**:

- construction creates public assets after delivery and real input costs;
- maintenance preserves condition while neglect reduces useful service;
- congestion makes service depend on stock relative to population or throughput;
- roads, grids, ports, or other selected networks relieve specific measured bottlenecks;
- useful infrastructure can complement private investment while its financing can still crowd
  private funding out;
- player-facing releases distinguish stock, condition, maintenance, and service without exposing
  true TFP.

Which bottlenecks exist strongly enough in this engine is not yet decided. Issue #142 requires
candidate transport, power, durability, and congestion channels to be measured independently.
Issue #143 tracks the staged implementation only after that research produces an ADR. This keeps
the evidence from prematurely turning one attractive sentence into an uncalibrated GDP bonus.

## External grounding

This interpretation is the familiar neoclassical distinction: with diminishing returns, a higher
investment rate raises the steady-state output level and transitional growth, while sustained
per-capita growth requires technique. See Robert Solow, [“A Contribution to the Theory of Economic
Growth”](https://www.depfe.unam.mx/doctorado/teorias-crecimiento-desarrollo/solow_1956.pdf).

A public-infrastructure service can change that result, but its service and financing both matter.
Robert Barro's [productive-government-services model](https://doi.org/10.1086/261726) finds that
productive expenditure can raise growth at first and lower it when its financing becomes too
large. The World Bank review [“Public infrastructure and growth: new channels and policy
implications”](https://documents.worldbank.org/en/publication/documents-reports/documentdetail/485431468141267544)
identifies productivity, private-capital complementarity, adjustment costs, durability, and
public-service production as distinct channels. Those are alternatives for #142 to test, not
authority for installing all of them.
