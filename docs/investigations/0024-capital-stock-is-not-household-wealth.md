# 0024 — Capital stock is not household wealth

**Status:** Resolved as an answered spike; a complete ownership/wealth model remains
future work under [#85](https://github.com/Scc33/terrarium/issues/85).

**Raised by:** [#86](https://github.com/Scc33/terrarium/issues/86): is capital per person
the same as assets owned per person, and does asset ownership match capital formation?

**Measured at:** engine `df4413f676e3724d1c63e67245c8cdf01e8d6da0`, schema 47,
12 seeds × five curated countries × 400 quarters, on 2026-10-01. Reproduce with
`pnpm capital-ownership -- --runs 12 --ticks 400`. The tool emits JSON with its commit,
schema, seed pattern, units, medians, isolated probes and accumulation residuals.

## The answer

**No: productive capital per resident is not household assets per resident.** Capital
formation does reconcile to the productive stock, including depreciation. What does
not exist is a complete set of household, firm, bank, government and foreign balance
sheets tying every asset to an owner and every financial claim to a liability.

This is two distinct questions. Equality between capital and household savings would
be wrong even in complete national accounts. The missing ownership/financing accounts
are a real model limitation, rather than evidence of broken capital accumulation.

## The stocks that actually exist

All code descriptions below refer to the measured commit above.

| State | Meaning | What it does not establish |
|---|---|---|
| `sectors[].capital` | Real productive stock used in production; the fogged `capital_stock` surveys its sum | A household portfolio, market value, or public/private split |
| `cohorts[].savings` | Nominal liquid spending buffer | Deposits with matching bank liabilities, equity ownership, or household net worth |
| `finance.assetPrice` | Tobin's q: valuation per unit of replacement-cost capital; the wall reports q × 100 | Total asset value or a household holding of those assets |
| `external.foreignOwnedCapital` | Foreign-owned real capital, a subset of sector capital, depreciated and increased by FDI | Sector-level ownership or a complete international investment position |
| `sectors[].credit`, `finance.creditOutstanding` | Bank lending allocated across sectors; bank equity constrains its target | Loan advances/payments tied to each investment project or household deposits |
| `gov.debt`, `gov.fund` | Sovereign debt and treasury savings, with an explicit fiscal financing identity | Household bond portfolios or a public-infrastructure stock |
| `finance.centralBankAssets`, `external.reserves` | Separate public acquisition-cost/FX books | A complete central-bank balance sheet, household counterparties, or additional factories |

Source anchors: [production](../../packages/engine/src/pipeline/production.ts),
[labor](../../packages/engine/src/pipeline/labor.ts),
[cohorts](../../packages/engine/src/pipeline/cohorts.ts),
[finance](../../packages/engine/src/pipeline/finance.ts),
[initialization](../../packages/engine/src/state/init.ts), and
[indicator definitions](../../packages/engine/src/pipeline/indicatorSpecs.ts).
[ADR-0018](../adr/0018-fdi-is-owned-capital.md) governs foreign ownership;
[ADR-0038](../adr/0038-central-bank-holdings-are-an-exact-book.md) describes the limits
of the central-bank book.

## What does reconcile

Production adds domestic private investment, public works after administrative delivery
and capital-goods prices, and inward FDI to `flows.investmentReal`. Labor allocates the
flow by utilization pressure and updates the sector stocks:

```text
K[next] = (1 − 0.015) × K + investmentReal + sector-floor correction
foreignK[next] = min(K[next], max(0, 0.985 × foreignK + real FDI))
```

Each sector has a stock floor of 1. In this passive sample the floor never bound;
across **24,000 quarters**, the maximum absolute aggregate capital residual was
**9.10 × 10⁻¹³** engine units, and the foreign-stock residual was **zero**. Gross
investment can leave capital roughly flat when it merely replaces depreciation.

This reconciles the **booked real investment flow**, not a financing account or proof
that every investment good was delivered. Production records shortages through
`flows.satisfied`, but labor adds the booked investment without applying that rationing
factor. That is a separate supply/delivery question from this spike.

Households have their own accumulation equation, independent of capital:

```text
savings[next, cohort] = max(0,
  savings + disposable income − cohortSpend + bond redemption share)
```

`cohortSpend` is the demand budget constructed in production, including a drawdown of
**3% of savings per quarter**; it is not expenditure scaled by goods shortages. The
aggregate savings identity had a maximum absolute residual of **2.73 × 10⁻¹²** nominal
units, with no savings floor binding. These successful local identities do **not**
close the economy's financial accounts.

## Where ownership and financing stop

Private investment starts from depreciation replacement and responds to the private real
rate, utilization, confidence, unemployment, q, banking crises and industrialist favor.
It is not capped by household savings, firm cash or a contemporaneous loan advance.
Public borrowing can crowd it out through the common funding rate
([ADR-0014](../adr/0014-sovereign-funding-pressure.md)), but there is no corresponding
household portfolio debit at the bond auction.

Domestic after-corporate-tax operating profits, less foreign remittances, are distributed
by fixed `PROFIT_SHARE`: 75% to business owners, 15% to professionals, 5% each to urban
and rural workers, and none to retirees. These are income allocation weights, not
measured shares of owned capital. The allocation does not read savings or change when
households buy equity; there is no equity-purchase transaction. Operating profits do
not deduct replacement investment before this distribution.

Government interest and principal use a separate fixed `BOND_HOLDING` table. Coupons
are income and redemptions add savings, but issuance does not subtract household savings
and redemption does not reduce a household bond stock: no such stock is stored. The
treasury settlement and funding-rate effects are real; the holder register is approximate.

Public works join the same sector capital that private investment and FDI build. There
is no retained public owner tag, so `K − foreignK` means only **capital not tagged foreign**;
it cannot be reported as household-owned private capital. The missing public stock is
already tracked by [#76](https://github.com/Scc33/terrarium/issues/76) and
[#143](https://github.com/Scc33/terrarium/issues/143).

## Measured separation

Within-country medians at Q400 on the same 60 passive paths:

| Country | Real capital / resident | Nominal savings / resident | Foreign-owned share of capital | q |
|---|---:|---:|---:|---:|
| Meridia | 24.43 | 65.01 | 11.07% | 1.018 |
| Costona | 11.75 | 30.88 | 7.64% | 1.032 |
| Veltravia | 46.37 | 102.37 | 9.56% | 0.973 |
| Oranga | 55.11 | 110.25 | 15.70% | 0.986 |
| Kestrel | 26.50 | 55.36 | 12.09% | 1.033 |

Capital is in **real engine stock units** and savings in **nominal money units**.
Displaying them together identifies the different variables; subtracting them, dividing
one by the other, or treating the difference as missing money would be invalid.

The stronger evidence is an isolated intervention on each snapshot. At Q0, Q40, Q160
and Q400, the harness holds every other input fixed, uses the same RNG substreams,
and separately runs production, finance and cohorts. These are direct-channel probes,
not legal player orders or long-run counterfactuals. Each row is the median over 60
snapshots at that horizon; all numbers come from the stamped commit above.

| Horizon | Remove savings: consumption budget change | Remove savings: private investment change | Halve q: private investment change |
|---|---:|---:|---:|
| Q0 | −3.71% | 0.00% | −17.07% |
| Q40 | −10.68% | 0.00% | −18.30% |
| Q160 | −13.52% | 0.00% | −15.16% |
| Q400 | −13.35% | 0.00% | −17.13% |

Across every probe, removing savings also changed bank credit and allocated profit
income by **exactly zero**. Halving q changed household savings in the isolated cohorts
step by **exactly zero**: there is no direct mark-to-market household loss. In a full
run lower investment and altered credit/confidence can still affect income, employment
and future savings. This isolates the missing portfolio channel, without denying the
indirect recession channels.

Meridia's capital per resident grows from **6.73 at Q0 to 24.43 at Q400**, while q ends
near **1.02**. Quantity can grow while the replacement-cost valuation ratio stays flat.
[#127](https://github.com/Scc33/terrarium/issues/127) already resolved the misleading
asset-index label; this confirms why the ratio cannot stand in for wealth.

## What real accounts would require

Net capital stock accumulates investment after depreciation on an explicit valuation
basis. Household net worth includes owned non-financial assets plus financial assets
less liabilities. National net worth consolidates domestic claims and includes net
claims on the rest of the world; adding factories, shares, loans and bank assets would
count underlying assets several times. The
[BEA fixed-assets definitions](https://www.bea.gov/resources/learning-center/definitions-and-introduction-fixed-assets)
and [ONS national-balance-sheet definitions](https://www.ons.gov.uk/economy/nationalaccounts/uksectoraccounts/bulletins/thenationalbalancesheetandcapitalstockspreliminaryestimatesuk/2026#glossary)
explain the distinct scopes and valuation bases.

Household saving also differs from domestic investment. Business and government saving,
depreciation and external financing matter; the
[BEA saving definitions](https://www.bea.gov/help/faq/68) distinguish those accounts.
Terrarium models useful behavioral channels from them, rather than the full accounts.

## Implications for #85

Capital per resident can honestly describe productive capacity, and a separately
surveyed savings-per-resident metric could describe liquid buffers. Neither implements
household or national **wealth**. Multiplying q by K would need a compatible replacement-cost
valuation and ownership shares; it would remain a productive-asset valuation, not net worth.

Before implementing wealth, decide the smallest ownership model worth playing: separate
public capital, domestic equity claims, foreign ownership, bonds, deposits and loans;
book purchases, issuance, redemption and revaluation against their counterparties; and
consolidate claims before constructing national net worth. Land/housing, pensions and
other omitted assets need explicit scope decisions. Distributional saving and asset
losses could then become channels beyond the fixed income-share tables.

This research does not select that design or retune the economy. #86 is answered;
#85 remains open with a concrete accounting prerequisite. A future wealth survey must
be made by the statistics office and published through the fog, rather than exporting
exact live household savings or ownership to the UI.
