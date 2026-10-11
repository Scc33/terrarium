# Investigation 0025 — Investment orders are not goods delivery

**Status:** Open — reachability measured for [#85](https://github.com/Scc33/terrarium/issues/85);
allocation and settlement remain unspecified. Related to
[#142](https://github.com/Scc33/terrarium/issues/142).
**Date:** 2026-10-01
**Measurement:** `12f874e7efe72f501cd341f8f971aee22faff8a0`, clean checkout,
schema 47, Node v24.20.0 on darwin/arm64. This includes the merged urbanization change
([ADR-0045](../adr/0045-the-countryside-empties-toward-expected-income.md)). Every result
below comes from that revision; remeasure before selecting a mechanic.

## Question and answer

[Investigation 0024](0024-capital-stock-is-not-household-wealth.md) found that capital
accumulation reconciles to **ordered** investment, without checking whether capital goods
arrived. Does that gap bind in ordinary play, or warrant a delivery fix before wealth?

The sampled passive and developmental economies encounter manufacturing/service capacity
constraints only during their opening four quarters. Maintained public investment rules of
2% and 5% of official quarterly GDP introduce no later capital-goods capacity constraint.
A deliberately excessive 50% rule does exceed a generous fixed-composition investment
envelope. An isolated production outage exposes both an input-accounting inconsistency and
unchanged capital booking.

There is a missing delivery account, but this evidence does not justify a baseline retune.
It also does not prove that all ordinary orders are fulfilled: a generous envelope ignores
every competing final buyer. Household bond accounting under #85 has its own missing
counterparty entries and does not depend on choosing a production-rationing model first.

## Reproduce and interpret the sample

```sh
pnpm investment-delivery -- --runs 12 --ticks 400 > delivery.json
```

`tools/measure-investment-delivery.ts` records the source commit, dirty marker, schema and
runtime before simulating. It exports raw per-path tallies and pooled country/arm summaries.
`--country meridia` and `--arm works-gdp-50` select narrower runs. This is runner-only
true-state research; no diagnostic is published to the player.

The sample pairs the same engine seed across seven arms on each of five curated countries:
12 seeds per country, 420 paths, 168,000 raw quarters. Passive, developmental and random
use standard game rules. Their reported sample includes the deposition quarter and excludes
all later quarters, leaving 157,303 quarters across all arms. Random is adversarial policy
sampling, not expert play; refused policy actions are counted in the JSON.

The four works arms use protected tenure and unlimited political capital to isolate economic
effects: inherited spending, or a GDP-share investment rule of 2%, 5% or 50%. Each changed
rule is ordered at Q4 after the first GDP publication. The order is strict, so a refusal fails
the experiment. These are economic experiments, not survival statistics or forecasts of a
playable century. The 50% rule is deliberately bad fiscal policy.

Production's quantities and I/O coefficients persist through the end of the quarter; the
worksheet reads those quantities rather than reconstructing orders at later prices.
Drought-conditioned rows use the post-shocks clock: positive `droughtQtrsLeft` means the
TFP cut is active; the relief quarter is excluded. This is a descriptive split, not a
paired drought treatment effect.

## What the worksheet establishes

For each sector, let `x` be recorded gross output, `m` recorded imports, and `A` the
I/O coefficient matrix. Inputs used by recorded output are `A x`. The balance

```text
b = x + m − A x
```

credits **every recorded import** to domestic use. A negative component means recorded
output requires more of that input than domestic output and imports together provide.
There is no inventory stock in the engine to finance the difference. This is a generous
input-feasibility test: households, government consumption and exports receive nothing.

Investment orders ask for 60% manufacturing goods and 40% services. The maximum number
of complete bundles at that authored composition, keeping recorded output fixed, is

```text
B = max(0, min(ordered I, b.manuf / 0.6, b.services / 0.4))
```

Imports include the FDI machinery already recorded in manufacturing. They are credited
once, and a domestic capacity constraint alone does not reduce imported delivery.

`I − B` measures orders outside that **fixed-mix envelope**. Fixed composition is a
measurement assumption, not an existing engine delivery technology. The result is neither
actual unbuilt capital nor a forecast of a rationing fix. A different delivered mix or
reduced downstream output would require a different worksheet. Passing this necessary test
does not establish whole-economy feasibility or decide which buyer receives scarce goods.

The harness separately counts quarters where manufacturing or services produce less than
their domestic gross orders. That capacity signal is not an investment-delivery fraction.
Tests include a case where imports fully supply investment despite domestic capacity binding.

## Results at the stamped revision

Percentages pool retained quarters; each arm has 60 paths. The final column divides the
summed envelope gap by summed ordered investment volume, rather than averaging run percentages.

| Arm | Retained quarters | Capital-goods capacity binds | Binding quarters after Q4 | Orders exceed fixed-mix envelope | Ordered investment volume outside envelope |
|---|---:|---:|---:|---:|---:|
| Passive | 23,625 | 0.258% | 0 | 0.000% | 0.000% |
| Developmental | 22,897 | 0.258% | 0 | 0.000% | 0.000% |
| Random | 14,781 | 0.981% | 84 | 0.000% | 0.000% |
| Protected works control | 24,000 | 0.254% | 0 | 0.000% | 0.000% |
| Works, GDP 2% | 24,000 | 0.254% | 0 | 0.000% | 0.000% |
| Works, GDP 5% | 24,000 | 0.254% | 0 | 0.000% | 0.000% |
| Works, GDP 50% | 24,000 | 12.213% | 2,870 | 4.600% | 1.261% |

No retained quarter in any arm has an intermediate-input deficit after generously crediting
imports. The passive constraints are 36 opening quarters in Costona and 25 in Kestrel;
the other countries have none. Those opening constraints predate the Q4 works orders.
Ordinary borrowing and imports are still approximations; this test does not certify their
financing or delivery accounts.

The passive, developmental and random samples retain 622, 616 and 366 active-drought
quarters respectively. Capital-goods capacity binds in 1, 1 and 4 of them; none exceeds
the fixed-mix envelope. The excessive works arm retains 902 drought quarters, with 89
capacity constraints and 51 envelope violations. These counts do not establish causation.

The excessive works arm triggers the runner's price-explosion diagnostic in **all 60 runs**;
the other arms trigger it in none. Its envelope violations are a stress result in a broken
fiscal trajectory, not a calibrated loss rate to impose on normal investment. Within that
arm, the affected-quarter rate ranges from 0% in Costona to 10.146% in Oranga.

## Isolated outage and booking

On every raw terminal snapshot, a paired probe takes 99% of manufacturing and service
employment offline, holds all other pre-production state and draws fixed, and reruns
production. Potential-dependent trade orders respond normally. This is a diagnostic
intervention, not a legal player action or a complete counterfactual quarter.

In all 360 non-excessive-arm snapshots, the outage creates an intermediate-input deficit
and leaves zero complete investment bundles in the envelope. Ordered investment is
unchanged, and `labor` still adds its full volume to capital after depreciation. The largest
aggregate booking residual in those probes is 3.1e-12. In the 60 excessive-arm terminal
snapshots, imports remain ample even after the outage: neither diagnostic fires. This is
why domestic satisfaction cannot stand in for all capital-goods availability.

The shared sector-level ownership audit checks every raw quarter. Sector capital and foreign
ownership residuals are exactly zero, with no capital floors binding: booking reconciles,
while allocation of delivered goods remains absent. This separates a missing delivery model
from a numerical error in stock accumulation.

## The unresolved design choice

`production` solves desired gross output and caps each sector independently. That operation
can violate intermediate-input feasibility, as the outage and closed-network test show;
the sampled ordinary paths do not hit the generous input-deficit test. Multiplying investment
by a manufacturing/service satisfaction average would leave that upstream question open,
would ration imported machinery by domestic output, and would invent who loses final goods.

There is a wider settlement question too. Household savings debit the full consumption
budget, welfare reads that spend, and expenditure shares use ordered final demand. Shortage
satisfaction affects approval but supplies no buyer-level delivery or refund. A capital-only
haircut therefore cannot establish consistent goods and money accounts for everyone else.

Any delivery design needs explicit input feasibility, buyer allocation, treatment of imports,
and a destination for money attached to unfilled orders: refunds, retained cash or queued
projects imply different demand and financing paths. Its stock ledger must preserve the
domestic/public/foreign ownership distinctions from 0024 and ADR-0018. The scarcity channels
being studied for #142/#143 should be evaluated against these constraints; those issues
already own public-infrastructure calibration and maintained service stocks.

This spike changes no engine behavior, ownership ledger, schema or golden. It narrows #85's
prerequisites and provides a repeatable assay for an eventual delivery decision.
