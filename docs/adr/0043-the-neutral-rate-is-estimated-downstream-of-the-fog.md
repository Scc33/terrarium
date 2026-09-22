# ADR-0043: The neutral rate is estimated downstream of the fog, by the desk

Status: Accepted

## Context

Investigation 0011 found that the engine has an exact, state-dependent neutral policy rate —
the posted rate at which credit, asset valuation and private investment read the 2% anchor —
and that no player could compute it, because two of its inputs (`ledger.inflationExpectations`
and `privateFundingSpread`) are engine truth. Issue #135 asked for a central-bank briefing on
the monetary stance that respects that boundary.

## Decision

The central-bank drawer carries a stance briefing — **below / near / above neutral**, a range,
and the drivers — produced by `ui/src/monetaryStance.ts` from `PublishedState` alone.

- **The estimate runs the engine's own arithmetic on published figures.** `pipeline/funding.ts`
  exposes `neutralPolicyRateOf`, `privateFundingSpreadOf` and `sovereignRiskPremiumOf` on
  scalars, and the truth (`privateRealRate`) calls the same functions; `monetary.ts` exposes
  `adaptExpectations`, the public's one-quarter rule, and the step runs it on the truth while the
  desk runs it on the prints. The desk's inputs are: the office's inflation prints filtered
  through that rule from the 1946 prior, the published debt ratio, the treasury's exact bond
  issue, printing and `domesticBondShare`, the latest official output level, the whip count's
  exact reading of the money interest, and the dials.
- **The range is the office's confessed error band, propagated, and nothing else.** Every print
  still carrying weight in the filter — its last sixteen quarters — has to carry a band before
  the desk stands behind a range. Below the band gate the office confesses nothing; for sixteen
  quarters after it crosses, the unbanded prints it made before still steer the estimate at zero
  declared width. In both cases the desk reports low confidence with a point, never a width
  reconstructed from the noise model or narrower than anything the office said.
- **Nothing new is published from true state.** `PublishedState` gains only
  `treasury.domesticBondShare`, a fact the debt office has about its own auctions.
  `inflationExpectations`, the funding spread and the true neutral rate stay behind the fog;
  `tests/contract/published-state.test.ts` continues to forbid the first.
- **It advises; it never orders.** No reaction function, no Taylor rule, no default rate. The
  briefing says which side of neutral the posted rate sits on and leaves the dial alone.

## Alternatives

- **Publish `inflationExpectations` and the spread exactly.** Simplest, and exactly the leak the
  fog exists to prevent: politics reads the published headline, and a desk that knows the
  public's expectations to the digit knows more than the office that measures prices.
- **A fogged `neutral_rate` indicator from the statistics step.** Honest, but wrong in kind: a
  survey measures something the country does, and neutral is an inference from things already
  measured. It would also cost a dial face, wall headroom and a funding gate for a figure that
  the existing prints already determine.
- **Compute the estimate in `observation`.** It has `params.openness` to hand and no new
  published field would be needed. But observation holds `TrueState`, so the one thing keeping a
  true field out of the estimate would be review; in `ui` the compiler refuses the type.
- **Handbook copy instead of a figure.** The investigation measured the setting from about 5%
  at the posting to −2.6% in the fifth-year squeeze to 0.5–3.5% late; no sentence covers that.

## Consequences

- The briefing is only as good as the office. Measured at this commit over a built statistical
  office it tracks the truth to about 0.2 pt at the median, its "fair" range covers the truth in
  about 95% of quarters, and it names the same side as the truth in over 90%; under a passive
  government whose office decays, late-century error reaches 2 pt and the range is withdrawn.
  That gradient is the intended reward for funding statistics.
- The desk lags the truth by the publication lag, and a fast swing in expectations shows up in
  the briefing a quarter or two late. `tests/ui/monetary-stance.test.ts` pins the tracking, the
  coverage of the range, and that the filter fed exact figures reproduces the engine's
  expectations to the digit — so the only gap between estimate and truth is the fog.
- Anyone retuning the rate channel changes the briefing automatically, and cannot change it
  separately: there is one formula.
- The one-rate model is assumed. If issue #31 gives investment and debt service different
  maturities, the transmission target this briefing reads must be revisited with it.
- `NEAR_NEUTRAL_TOLERANCE` (half a point) and `EXPECTATIONS_MEMORY_QTRS` (sixteen quarters,
  where the filter's weight on a print has fallen to about an eighth) are presentation
  constants in the UI module, not engine behaviour; they decide a word, not a number.
