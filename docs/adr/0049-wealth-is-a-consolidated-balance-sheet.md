# ADR-0049 — Wealth is a consolidated balance sheet

**Status:** Accepted · **Date:** 2026-10-17 · **Schema:** 52

## Decision

Publish household, public and national net worth, and their per-person histories,
from an asset-and-liability survey. Household accounts consolidate the directly
owned domestic businesses with their owners. They include liquid bank deposits,
government securities, domestic private productive assets and bank equity, less
business loans and household overdrafts. Negative net worth is retained.

Productive stock is not itself household wealth. Foreign capital belongs abroad;
public works belong to the government. Public capital depreciates with the sector
stock and increases with the public investment already booked by production.
Opening public capital is zero: the old country recipe contains no inherited
public ownership claim, so this records public works since 1946 rather than
inventing an inherited public/private split. Opening domestic private capital and
bank equity follow the existing `PROFIT_SHARE` ownership weights. New private
investment and business loans retain that distribution; no secondary equity
market or cross-class ownership trading is implied.

All wealth components are in current domestic money. Productive assets use the
capital-goods price and Tobin's q; loans and deposits use book value; government
paper uses its current quoted bond price. The capital instrument continues to
publish the real physical stock, with its formerly incorrect index label fixed.
Housing, land and pension promises have no assets or liabilities in this model.

## Settlement and counterparties

- Every issued sovereign lot records its holders. The inherited book preserves
  the existing all-domestic `BOND_HOLDING` settlement. New net subscriptions use
  the existing domestic funding-share target, limited by households' uncommitted
  deposits; nonresident investors take the remainder within the existing auction
  capacity. Funding quotes retain the existing openness-based structural
  crowding exposure (`domesticBondShare`), rather than substituting ultimate
  household ownership for underwriting demand. It is a pricing proxy, not the
  realized holder mix. Purchases debit deposits, coupons go to holders, and redemption
  credits the actual cash price. Matched rollover moves claims without cash.
- Foreign net subscriptions, redemptions and coupons settle through commercial
  banks' signed foreign position. This is separate from central-bank FX reserves;
  it does not silently buy reserves or change the currency-intervention order.
- Private investment is paid from business cash. Net bank advances add cash,
  repayments remove it, and write-offs reduce both the bank's loan asset and the
  borrower's liability without a cash payment. Retained bank margin is paid by
  businesses; actual bank dividends reach household owners.
- Cash shortfalls become explicit household overdrafts instead of disappearing
  at a savings floor. Incoming cash first pays down this debt. These are
  non-interest-bearing settlement overdrafts, not a new discretionary consumer
  credit policy; no additional debt-service coefficient is introduced.
- Bank equity remains the existing banking model's capital stock. Deposits have
  matching bank liabilities, loans have matching borrower liabilities, and QE
  holdings have matching intermediary obligations. Banks' signed settlement
  balance with the monetary authority closes their balance sheet. A negative
  balance is authority funding, not a negative deposit. The monetary authority's
  residual equity belongs to the consolidated public sector; it can be negative
  and introduces no new fiscal-solvency gate. This makes the old monetary model's
  accommodation explicit; it is not a calibrated interbank reserve market.

The independently expressible national identity is:

```
national net worth = household net worth + public net worth
                  = productive assets + net foreign assets

net foreign assets = sovereign fund + official FX reserves
                   + commercial-bank foreign settlement position
                   - foreign sovereign bond claims - foreign productive assets
```

Domestic deposits, business loans, overdrafts, sovereign paper and bank equity
cancel with their counterparties. Adding household savings to all productive
capital would count financial claims without subtracting the issuer's liability.

The existing goods-allocation limitations in investigation 0025 remain: this
accounts for booked investment, without claiming every order was delivered.
A full transaction-flow model of scarce goods is a separate structural decision.

## Publication and per-person views

The asset survey unlocks at the household-survey rung, 0.55 statistical capacity.
It uses the ordinary lag, historical funding gate and revision clock, with
independent `obs:wealth:*` substreams. Net positions are computed from the same
surveyed components, never independently noised into a contradictory total.
Uncertainty on household net worth sums the component half-widths; a near-zero
net balance must not imply near-zero uncertainty on large opposing claims.
Public capital, funds, monetary assets, bank settlement and sovereign liabilities
are likewise surveyed separately before netting. Public and national absolute
error bands sum the same estimated component half-widths, rather than scaling
net worth or disclosing the exact gross worksheet through a band.

Per-person arithmetic reads published inputs only. A historical amount divides
by the census of its measured quarter, including each revision and its band,
before smoothing or computing growth. Missing or nonpositive population means
unavailable. Flows retain their period; stocks are not annualized. Rates,
sentiment indices, and existing per-person accounts are not divided again.
View preferences are outside saves. Wealth releases join export format v1 as
an additive table; older replay saves rebuild the new accounts from their log.

## Alternatives and consequences

Publishing liquid savings alone as household wealth, or capital plus savings as
national wealth, was rejected because either omits liabilities and ownership.
A UI-only wealth proxy was rejected in favor of explicit subscriptions, debt
and investment settlement. A separate noisy capital-per-person indicator was
rejected because the existing survey and exact census already determine it.

The benefit is an auditable modeled household net-worth measure and a reusable
population basis. The cost is a deliberate economic change: capital purchases,
credit changes, foreign coupons and bank distributions now affect household
cash. Replays and balance distributions change and require economic review;
schema 52 is not an inert presentation-only addition.

## Evidence

Against schema 51 (including the food margin), the paired passive 40-quarter
replay moves real GDP from 97.58 to 98.66, nominal GDP from 97.03 to 87.33,
and sovereign face debt from 103.87 to 143.29.
Paying for investment and subscriptions reduces liquid demand; changed credit,
bank distributions and actual coupon ownership feed back through prices and
revenues. This is a financing change, not a calibration of long-run growth.

All-country validation of the final accounting rules:

| Policy | Runs × quarters | Median growth/yr | Mean inflation, median | Deposed |
|---|---:|---:|---:|---:|
| Passive | 1000 × 400 | 2.91% | −0.02% | 4% |
| Developmental | 1000 × 400 | 3.12% | −0.46% | 8% |
| Random | 1000 × 120 | 4.37% | −0.06% | 28% |

All three batches have zero non-finite runs and zero price explosions. The
full stability sweep (120 × 416 quarters for each of four policies) also has
zero reachable non-finite states or price explosions. Fuel-tax, subsidy and
statute mechanism tests still pass. `pnpm ranges` measures 12 seeds × six
countries × five governments; faces were recut against the measured readings.

`pnpm wealth -- --cases 30 --ticks 400` checks 108,000 quarters across recipe,
draft and edge profiles under passive, developmental and random policies, with
zero accounting failures. That stress test includes quarters after deposition:
its extreme asset levels are not estimates of player-reachable welfare. It
checks identities and finite values, not guessed bounds on wealth per head.

One historical income test's endpoint no longer describes the same economy.
On seed `redistribution`, adding three to quarterly transfers at appointment
now moves the Gini at Q60 from 0.42637 to 0.42677. The relative grouped median
is still an unreliable inequality signal: at Q12 the same order lowers the
Gini from 0.46595 to 0.44594 while median/mean falls from 0.46553 to 0.45422,
and mean real income rises. The test retains that measured counterexample at
three years rather than requiring the financing model to preserve the old
15-year distribution. It makes no claim that every transfer order improves
inequality at every later date.
