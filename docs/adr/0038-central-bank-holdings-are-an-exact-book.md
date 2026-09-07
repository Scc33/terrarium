# ADR-0038: Central-bank holdings are an exact book

Status: Accepted

## Decision

`finance.centralBankAssets` records assets acquired under the existing purchase
order at acquisition cost. Quarterly purchases equal `assetPurchaseRate` times
the latest officially published quarterly nominal GDP. Annualization cancels;
there is no further division by four. Purchases await the first official release.
The existing rate channel still prices the announced monetary stance immediately.

Foreign reserves retain their separate domestic-money book in `external.reserves`.
The bank buys foreign exchange to build it and sells it to defend the currency.
The reported flow is what actually transacted, including the reserve-cover top-up
and fill limits. Neither holding is the sovereign fund introduced by ADR-0037:
that fund finances treasury deficits, not currency defence.

The Finance office shows holdings, reserves and completed-quarter transactions.
The ledger adds a Savings & Financing view over the existing sovereign fund,
debt, fund contributions/draws, rebates, redemptions, bond issues and deficit
printing. It projects ADR-0037's accounting without changing fiscal settlement.
These exact, ungated government self-accounts also enter published-data exports.
The two offices reuse one painter and the shared time-series chart.

## Alternatives

- A fogged instrument would charge the government to discover its own transactions
  and consume wall space without adding a survey.
- Exact purchases scaled by true GDP would reveal that GDP by division. Use the
  same official reference as GDP-share appropriations instead.
- Reconstructing holdings from orders would lose the GDP vintage or clipped FX
  fill behind each transaction.
- Combining the holdings, reserves and sovereign fund would imply that the
  treasury can spend the currency-defence stock. They have separate jobs.
- A treasury cash account was considered before #219 merged. The merged sovereign
  fund already supplies the surplus destination and is retained intact.

## Consequences

This is an acquisition-cost asset book, not a complete central-bank balance sheet.
Private counterparties, settlement liabilities, coupons, maturities, sales,
revaluation and gains/losses are not modeled. Stopping purchases leaves the stock
held; the rate channel still reads the pace, not accumulated holdings. The UI
states these limits. FX reserves retain their existing domestic-money convention.
No second household-income or investment impulse is added for the booked purchase.

Schema 45 adds derived records, no replay inputs, no pipeline reordering and no
economic RNG draws. Valid older saves rebuild the book from their decisions.
New fields are additive within published-data export format v1.

## Verification

On 2026-09-07, against merged master `295791a`, all 72 complete century states
matched after stripping only new record fields and the schema stamp: four runner
policies × six country generators × three identical seeds, 400 quarters each.
This includes the sovereign fund, rebates, household incomes, full statistical
history and political outcomes. The three golden diffs likewise move only the
schema stamp plus new fields.

`tests/properties/public-assets.test.ts` reconciles every quarter of all four
policies in every country, checks a defence cannot sell unavailable reserves,
and tests purchase cessation, official-GDP sizing, replay and export.
`treasury-conservation.test.ts` continues to own the underlying fiscal identity.
