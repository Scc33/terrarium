# ADR-0017 — Finance levers reuse the existing rate and bank-capital channels

**Status:** Accepted · **Date:** 2026-08-15

## Context

The player could steer the financial cycle only through the policy rate. The finance step already
held two other pieces of machinery: a fixed 6% bank-capital floor that capped credit after losses,
and the common private real rate used by credit, asset valuation, and investment. Neither was a
player input. At the zero-rate floor there was no monetary easing instrument left, and before a
crash there was no direct way to make banks carry a larger shock absorber.

Adding quantitative easing raised a boundary question. It could be modeled as fiscal money
printing, as an explicit central-bank balance sheet with a stock of bonds and reserves, or as a
term-premium intervention in the financing price the engine already derives. A reserve
requirement raised a parallel question: the current bank model has equity and loans but no deposit
or reserve-money stock, so a literal cash-reserve ratio would require a second banking balance
sheet merely to constrain the first.

## Decision

Unconventional monetary and macroprudential policy reuse the balance-sheet channels the financial
sector already owns.

`assetPurchaseRate` is a standing annualized purchase pace, expressed as a share of GDP. It
subtracts a calibrated term-premium effect from `privateRealRate`, the single rate already read by
bank credit, asset valuation, and private investment. It does not change the posted policy rate,
the coupon the treasury pays, the fiscal deficit identity, or `printed`. This makes QE useful at
the zero-rate floor without presenting an asset swap as tax-free deficit finance. The same credit
and asset-price response that makes it useful also raises endogenous crisis risk.

`capitalRequirement` is bank equity required per unit of credit. It replaces the fixed constant
in the existing ceiling:

```text
maximum credit / annual GDP = bank capital / (requirement × annual GDP)
```

The range is 3–25%, with the inherited 6% as the default. Credit continues to adjust gradually
toward the constrained target; changing the dial does not erase or create a stock immediately.
The player can therefore release credit in a crunch or force banks to lean against a boom, and
must live with the fragility of the former choice.

Both settings are ordinary exact `DialState` inputs, moved through `setDial`, priced by
`politicalCostOfAction`, and published exactly because a central bank knows its own orders. The
pipeline order and RNG substreams do not change. Schema 23 adds only the two dial fields.

## Alternatives considered

- **Explicit central-bank assets, liabilities, purchases, and runoff.** Deferred: it would model
  the stock/flow distinction and remittances more fully, but requires a new balance sheet,
  maturity and runoff rules, and ownership accounting before those stocks have another gameplay
  use. The existing common financing rate captures the first-order intervention.
- **Count QE as fiscal deficit printing.** Rejected: purchasing an asset is not the treasury
  spending the same currency unit. Reusing `printedThisQtr` would make QE finance the deficit and
  raise inflation expectations through the fiscal channel, double-counting what is meant to be a
  portfolio-price intervention.
- **Add a literal cash-reserve requirement.** Rejected for now: deposits and central-bank reserves
  do not exist in state. A ratio over invented liabilities would be decorative. The live bank
  equity and credit stocks already support the solvency-oriented macroprudential choice the issue
  calls for.
- **Make the requirement reduce crisis probability directly.** Rejected: a scripted shield would
  bypass the model. The requirement lowers leverage; the existing leverage-times-overvaluation
  hazard then prices the safety benefit.
- **Leave unconventional policy implicit in the policy-rate dial.** Rejected: the zero lower
  bound would remain a dead end, and the player would still have no direct counter-cyclical bank
  constraint.

## Consequences

**Good:** the player now has distinct price, quantity, and prudential controls; QE and regulation
transmit through the same rates, stocks, and endogenous crisis clock as the rest of finance; the
defaults preserve passive calibration; no parallel monetary pipeline or hidden crisis modifier is
introduced.

**Bad:** QE is a flow-equivalent term-premium intervention rather than an explicit central-bank
balance sheet, so it cannot yet express runoff, remittances, duration, or losses; the capital rule
is a solvency floor rather than a literal reserve ratio; strong settings can push the common
private rate and credit ceiling far from their calibrated region, so random-policy and deliberate
bad-play sweeps remain mandatory.
