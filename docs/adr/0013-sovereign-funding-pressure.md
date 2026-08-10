# ADR-0013 — Sovereign funding pressure enters one common private rate

**Status:** Accepted · **Date:** 2026-08-10

## Context

The treasury pays interest, distributes coupons to domestic bondholders, and monetizes deficits
that exceed bond-market depth. None of those operations made government paper compete with
private finance. Bank credit, asset valuation, and private investment all read the policy rate
minus expected inflation but never read public borrowing or the sovereign premium. Persistent
deficits could therefore lower the private real rate through inflation expectations and raise
investment even while debt service became a third of public outlays. Investigation 0003 measured
the missing transmission rather than merely a weak coefficient.

A full stock-flow bond market was a live response. It would identify which household or bank
balance sheet buys each bond and later receives its coupon and principal, but it requires a new
asset stock, allocation rules, and a schema change. The smallest model that teaches the same
macroeconomic constraint is a price: public borrowing makes marginal private finance dearer.

## Decision

The engine derives one annualized `privateRealRate` and both the finance and production steps use
it. It is the policy rate minus expected inflation, plus a sovereign funding spread with two
parts:

1. Last quarter's bond issuance as a share of quarterly GDP, multiplied by the share the domestic
   financial system must absorb. That domestic share falls continuously with country openness.
2. A calibrated share of the sovereign risk premium already used to price government interest.
   This carries high debt and a powerful, hostile financier bloc into private funding costs
   without inventing a second risk model.

Bond issuance is derived from the existing fiscal identity: the deficit minus money creation,
floored at zero. A money-financed deficit therefore does not also count as demand for private
funds; it continues to fail through inflation expectations and prices. A surplus has no negative
crowding-out bonus.

The auction term is deliberately lagged one quarter. `fiscal` closes the books after `finance`
and `production` have run, and changing that order is a schema-version event. The lag makes the
booked financing mix the single source of truth while preserving the pipeline order and RNG
substreams.

## Alternatives considered

- **A stock-flow bond market with explicit holders.** Deferred: it would give the strongest
  balance-sheet account of scarcity and distribution, but its new stocks, purchase rules, and
  migrations are disproportionate to the missing first-order transmission.
- **An appropriation ceiling that makes interest cut programmes.** Rejected: it would make fiscal
  space visible, but would conflict with Terrarium's standing appropriations and its rule that an
  ambitious programme fails through the economy rather than becoming an invalid order.
- **A debt-level penalty only.** Rejected: two governments with the same debt stock can make very
  different demands on this quarter's market. It would also leave moderate persistent deficits
  inert until an arbitrary threshold.
- **Charge the gross deficit regardless of printing.** Rejected: the same currency unit would
  tighten loanable funds and raise inflation expectations, double-counting two different funding
  failures.
- **Keep private finance independent of the sovereign.** Rejected: that is the measured omission
  that made sustained deficits feel nearly free and could reverse the expected sign of the
  investment response.

## Consequences

**Good:** deficits now have a conventional scarcity channel before debt becomes catastrophic;
high sovereign risk reaches both credit supply and investment through the same quoted rate;
openness matters to domestic absorption; printing, coupon income, financier power, and elite
capture remain distinct systemic consequences rather than scripted penalties. No pipeline step,
state field, observation field, or save schema is added.

**Bad:** the model prices balance-sheet scarcity without recording who bought the bonds; openness
is a coarse proxy for foreign absorption; the one-quarter lag can make the first deficit quarter
look unchanged; the spread is not yet a player-facing instrument. Because finance and investment
share the rate, calibration errors can move the passive credit cycle, crisis incidence, capital
formation, and long-run development together.
