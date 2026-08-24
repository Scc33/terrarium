# 0016 — A household price elasticity does not reach the industrial census, and a deficit-financed subsidy raises the price it was meant to lower

**Status:** Resolved (CES rejected; the constraint is elsewhere)

**Raised by:** issue #139, whose second proposal was "a price elasticity other than one — CES
rather than Cobb-Douglas in the household basket. **This is what makes PRICE levers (subsidies,
the tariff, the fuel excise) move composition at all, and therefore what actually answers #97.**"

That proposal was implemented, swept, and **rejected on the measurement below.**
`HOUSEHOLD_SUBSTITUTION` ships at 1 — Cobb-Douglas — and the mechanism stays wired so the next
person can re-run this in one line rather than rebuilding it.

**Measured at:** `96480e8` on 2026-08-23. Meridia, capacity-building government, protected tenure
and unlimited capital so what is measured is the channel and not the bill. 8 paired seeds × 400
quarters. The subsidy is 5% of GDP **re-indexed annually** (a dial set once is worth almost
nothing by 2006 — see `tools/measure-composition.ts`).

## Result 1 — the elasticity does what it promises, and the economy does not follow

Agriculture, subsidised, with the price channel working (see Result 2 for why it is tax-funded):

| σ | own effective price | urban_workers' basket weight | own value-added share |
|---|---|---|---|
| 1 (Cobb-Douglas) | −25.3% | **+6.1%** | **+3.02pt** |
| 2 | −25.4% | **+8.3%** | +2.84pt |
| 3 | −24.9% | **+10.3%** | +2.82pt |

**The basket response rises monotonically with σ, exactly as the theory says. The industrial
census does not move with it — it falls slightly.** Manufacturing is the same shape (+2.08 →
+1.82 → +1.73pt while its weight response goes flat), and services never becomes steerable at any
σ.

The transmission from household expenditure share to value-added composition is therefore **about
zero at the margin**, and two structural facts say why:

1. **Household consumption is one part of final demand.** Investment, government procurement,
   research, exports and — above all — intermediate demand through the I/O table are not
   re-weighted by anything in the household basket. Re-weighting consumption moves a fraction of
   the total and gets diluted.
2. **A cheap sector is an input to every other sector.** Making agriculture cheap lowers unit cost
   in the columns that buy from it, so everyone's output rises. The numerator moves and so does
   the denominator.

So issue #139's diagnosis was half right. Cobb-Douglas does pin the **nominal expenditure share**.
It does not pin the **real value-added share**, which is what the industrial census publishes and
what "what kind of country is this" means — under unit elasticity a price fall raises real
quantity one-for-one, and that response was there all along. The 0.8–1.2 points investigation 0013
measured was not the elasticity binding. It was Result 2.

## Result 2 — a deficit-financed subsidy RAISES the price it was meant to lower

The finding that makes the rest make sense. Same subsidy, same size, financed two ways:

| arm | own effective price | own value-added share | real GDP |
|---|---|---|---|
| agri subsidy, deficit | **+3.4%** | +1.83pt | +2.7% |
| agri subsidy, tax-funded | **−25.3%** | +3.02pt | +15.2% |
| manuf subsidy, deficit | **+4.8%** | +1.19pt | +1.2% |
| manuf subsidy, tax-funded | **−20.9%** | +2.08pt | +12.7% |
| services subsidy, deficit | **+12.9%** | +1.44pt | +1.9% |
| services subsidy, tax-funded | **−32.8%** | −1.26pt | +13.9% |

A subsidy worth **22–24% of the sector's own value added** makes that sector's output *dearer*
when it is borrowed for. Nothing is wrong: `prices.ts` subtracts `unitSubsidy` from unit cost
exactly as intended, and the cost anchor pulls the price down. It is simply outweighed. The
subsidy lands in `profits[sid]`, profits are 75% business-owner income, and the resulting demand —
across every sector, the subsidised one included — pushes the excess-demand term harder than the
cost term pulls.

**This is why CES cannot rescue a subsidy.** With σ > 1 households substitute away from what got
dearer, so a higher σ makes a deficit-financed subsidy *worse* at steering, which is what the
first sweep showed before the financing was isolated (services steering went +1.43 → +1.30pt as σ
went 1 → 3).

The tax-funded column is crude — a flat 45% income rate rather than a matched offset, hence the
implausible +13% real GDP — so read its magnitudes as an existence proof, not a calibration. The
sign reversal is the finding, and it is not marginal.

## Result 3 — the tariff can never be steered by a household elasticity

Structural, and worth writing down so nobody tries. A tariff raises the price of **imports**.
`effectivePrice` carries the fuel excise and nothing else, and imports are netted off supply in
`production.ts` rather than offered to households as a distinct good. The household basket
therefore cannot see a tariff at all; what it sees is the domestic price the tariff indirectly
raises, and with σ > 1 it substitutes *away* from the protected sector.

Measured across σ ∈ {1, 1.5, 2, 3}, a 60% tariff moves manufacturing's share by 0.1–0.2 points at
every value while costing 6% of real GDP. Making the tariff a real lever needs an
imports-as-a-substitute-good change in the basket, which is a different and much larger change.

## What this means for #97

The visibility half is built and the demand side is no longer backwards (ADR-0029). What is left
is that **a subsidy is a weak steering instrument here for a reason that has nothing to do with
elasticities**: it is mostly a transfer to business owners, and only marginally a cost reduction.
Three directions, in the order the evidence supports them:

1. **A demand-neutral industrial-policy instrument.** Result 2 says the cost channel works and is
   large — 20–30% off a sector's price — the moment the fiscal impulse is offset. A statute or a
   spending rule that pairs support with its own financing would steer where the dial does not.
   This is the cheapest path and it needs no new economics.
2. **Capital allocation, not household demand.** Composition is dominated by the supply side here.
   A lever on where investment goes would reach the industrial census directly, and the +1.2 to
   +1.8 points a deficit subsidy already achieves arrives through exactly that channel (profits →
   capital), not through the basket.
3. **Imports as a substitute good**, which would make the tariff real. Largest change, and it
   should not be attempted before 1 and 2 are ruled out.

## What would settle it

Re-run `pnpm composition` and the tax-funded arms after any of the three. The number to beat is
**+3.02 points**, which is what the best available price lever achieves on agriculture today with
its financing fixed and the household basket left at unit elasticity.
