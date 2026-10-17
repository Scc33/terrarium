# ADR-0050 — A persistent imbalance stays priced

**Status:** Accepted · **Date:** 2026-10-17 · Amends the balance norm in
[ADR-0034](0034-the-exchange-rate-clears-a-market.md)

## Context

ADR-0034 reads the balance of payments against `balanceNorm`, an EMA of the balance itself
(`FX_BALANCE_NORM_ADAPT`, half-life about three years). Against zero, a structural surplus was a
permanent appreciation that deflated a century to the price floor. Against an EMA it is not, and
that bug fix stands.

An EMA that only chases, though, makes *every* persistent imbalance normal. Once
[ADR-0049](0049-trade-follows-markets-not-capacity.md) stopped exports from scaling with capacity,
the survey's maximal builder ran a current-account deficit of 4–5% of GDP for sixty years,
with exports at 1% of GDP. Its currency stayed at 0.95 the whole time. The norm had learnt the
deficit within a decade, so the market never priced it.

## Decision

`init` seals `external.inheritedBalance`, the balance the norm opens on (from `production`'s own
opening order, ADR-0049), and never writes it again. Each quarter the norm chases the balance
and also leaks back toward that inheritance:

```
balanceNorm += FX_BALANCE_NORM_ADAPT × (balance − balanceNorm)
             + FX_BALANCE_NORM_REVERT × (inheritedBalance − balanceNorm)      ADAPT = REVERT = 0.055
```

Under a persistent balance *B* the norm settles at the weighted mean of *B* and the inheritance.
A share `REVERT / (ADAPT + REVERT)` (one half) of the gap from what the country was handed stays a
surprise, and the tilt keeps pricing it. A shock is still a shock for a few years, and the 1946
settlement is still never priced. That is the reference-dependence `fxParityAnchor` and
`inheritedRiskPremium` are built on: a country answers for what it does, not for what it was
given.

## Alternatives

- **Leave the norm chasing** (ADR-0034). Rejected: it is why a sixty-year deficit never moved
  the rate.
- **Revert toward zero.** Rejected for ADR-0034's own reason: these economies inherit a
  structural surplus, and pricing it is the century of deflation that bug fix removed.
- **Slow the EMA instead.** Rejected: a slower norm still learns any imbalance eventually. It
  delays the absorption without bounding it, and it makes genuine shocks surprise for longer.
- **Revert faster (0.11, two-thirds priced).** Measured on the maximal arm: the rate depreciates
  1.19 → 1.27, and domestic prices rise with it (services 3.96 → 4.25). The real rate barely
  moves, and the deficit stays at 5.1%. Half is enough to price it; more is inflation.

## Consequences

- **The currency now depreciates under a persistent deficit and appreciates under a persistent
  surplus**, by half the gap from the inheritance times `FX_BALANCE_TILT`. On the maximal arm it
  goes 0.96 → 1.19 by 2045.
- **It does not close a deficit that is real.** The maximal arm's depreciation passes into
  domestic prices through demand (ADR-0034's chosen pass-through), so its real rate and its
  deficit barely move. That arm absorbs more than it makes, and the currency cannot change that.
  Whether a fast grower's manufactures should keep a market share that grows with its own
  capacity is the open question this exposes. ADR-0049 records it.
- **Passive moves back toward where it was before ADR-0049.** Its surplus drifts below the
  inheritance over the century, and pricing that gap offsets part of ADR-0049's extra import
  leakage: mean inflation −0.06 → 0.00 %/yr, unemployment 13.23 → 13.12%, with growth (2.85) and
  deposition (1%) unchanged.
