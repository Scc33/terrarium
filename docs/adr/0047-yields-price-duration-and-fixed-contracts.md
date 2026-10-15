# ADR-0047: Yields price duration; coupons are fixed contracts

Status: Accepted. Supersedes the single-rate transmission of ADR-0014 and
ADR-0017, the perpetual holdings of ADR-0038, and the single neutral stance of
ADR-0043. Their funding, bank-capital, exact-book and fog boundaries remain.

Date: 2026-10-12. Issue: [#31](https://github.com/Scc33/terrarium/issues/31).

## Decision

The finance step quotes three-month, one-year, five-year and ten-year nominal
government yields. A quote combines the average expected policy path, a bounded
positive duration premium, QE duration relief, and sovereign risk. Dealers learn
from observed posted rates through a slow history anchor. They do not inspect
future player orders or assume an automatic central-bank reaction function.

Exact coupons and public quotes must use known government debt and the latest
official nominal GDP. Before its first release, the inherited declared debt
ratio is the prior. The political whip count supplies lender relations. Neither
hidden live GDP nor hidden inflation expectations may price a public contract.
Private economic transmission still uses its existing true funding spread and
nominal-price expectations. Shared scalar functions let the desk estimate it
from the published record without opening a second economic model.

Bank credit reads short real funding. Investment and asset valuation read
five-year real funding, against an anchor including the normal term premium.
The same sovereign/new-money funding spread enters both. A curve inversion is
an outcome of prices, never a scripted recession or an event trigger.

Government borrowing is a collection of principal, fixed annual coupon, issue
quarter and maturity quarter. The inherited book is laddered and retains its
calibrated opening coupon. The short, balanced and long order changes only new
borrowing and refinancing. Surplus cash first meets maturities, then buys back
remaining contracts at discounted cash-flow prices, then follows the existing
rebate/fund rule. It cannot redeem expensive old coupons at par for free.

Gross refinancing exchanges a maturing claim for a new claim. It neither
consumes the new-money auction depth nor creates a household savings windfall.
The existing debt ceiling can close refinancing; unmet principal uses the
existing printing fallback. Books distinguish new borrowing, refinancing,
maturing principal, cash retirement, and cash-minus-face buyback adjustment.
`gov.debt` is a validated cache of outstanding face principal.

QE purchases retain their acquisition-cost book and official-GDP sizing. Each
purchase matures after five years; remaining duration declines each quarter.
Relief blends the current announcement with the duration still held, normalized
to a sustainable purchase pace. Stopping orders removes the announcement but
leaves holdings working until they mature. Principal runoff is a distinct book
flow. This remains a reduced-form purchased-asset portfolio: no treasury bond
ownership, coupon remittances, liability-side balance sheet, sales or revaluation
are implied. Rollover between private holders is likewise a settlement proxy,
not a full financial-sector ownership model.

## Alternatives

- A decorative curve over the old common rate would leave maturity without a
  playable consequence and contradict a fixed coupon bill.
- Repricing all government debt every quarter would preserve the old arithmetic
  but turn the whole stock into floating-rate debt without saying so.
- Automatic inflation-target expectations would smuggle future policy into a
  game where the player chooses it. Hidden-price expectations in dealer quotes
  would also publish engine truth through exact coupons.
- Free par redemption would reward issuing expensive long bonds and buying them
  back after a rate cut without paying their higher market value.
- QE pace alone loses all relief immediately after stopping; perpetual holdings
  accumulate relief without a credible exit. Full reserve/remittance accounting
  would require counterparty balance sheets beyond this issue's scope.

## Consequences and evidence

Rate changes reach the interest bill gradually, so this deliberately moves fiscal
baselines. The first shadow-quote stage was verified inert before contracts were
connected. Ordinary passive/developmental century medians are compared with the
unmodified `ab9d9e0` engine in [tuning lessons](../tuning-lessons.md), rather than silently blessed.

`pnpm yield-curve` runs legal, paired maturity strategies under hikes and cuts
across the country catalogue. It must show cheaper refinancing after cuts and
slower exposure after hikes, while the short book carries more rollover.
`tests/unit/yield-curve.test.ts` pins coupon locking, market-price buybacks,
official-information pricing, matched rollover and complete QE runoff.
`tests/properties/public-assets.test.ts` and `treasury-conservation.test.ts`
close both cash and face books through centuries of all runner policies.

The UI publishes the latest/prior curve, the policy-history belief, sovereign
premium, average outstanding coupon and principal due in successive windows.
The briefing names short and long funding separately. The curve supplies market
prices; estimates of real funding remain behind the statistical fog.
