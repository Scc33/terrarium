/** Shared scalar pricing. The desk can use these on public figures without a second model. */
import {
  ASSET_PURCHASE_RATE_MAX,
  QE_ANNOUNCEMENT_SHARE,
  QE_HOLDING_QTRS,
  YIELD_POLICY_REVERSION_QTRS,
  YIELD_TERM_PREMIUM_MAX,
  YIELD_TERM_PREMIUM_QTRS,
} from '../constants'

export function termPremiumAt(quarters: number): number {
  return YIELD_TERM_PREMIUM_MAX * (1 - Math.exp(-quarters / YIELD_TERM_PREMIUM_QTRS))
}

export function expectedPolicyRateAt(policyRate: number, anchor: number, quarters: number): number {
  if (quarters <= 0) return policyRate
  const weight = YIELD_POLICY_REVERSION_QTRS / quarters *
    (1 - Math.exp(-quarters / YIELD_POLICY_REVERSION_QTRS))
  return anchor + (policyRate - anchor) * weight
}

export function benchmarkYieldAt(policyRate: number, anchor: number, purchaseEquivalent: number, quarters: number): number {
  const durationWeight = 1 - Math.exp(-quarters / YIELD_TERM_PREMIUM_QTRS)
  return Math.max(0, expectedPolicyRateAt(policyRate, anchor, quarters) +
    termPremiumAt(quarters) - purchaseEquivalent * durationWeight)
}

/** Normalize the duration still held to a sustainable annual purchase pace.
 * With a stable official GDP and pace, a ladder's weights sum to (N+1)/2.
 * A quarter's duration stock uses only purchased money and official GDP. */
export function effectivePurchaseRateOf(pace: number, durationHoldings: number, officialQuarterlyGdp: number | null): number {
  const held = officialQuarterlyGdp !== null && officialQuarterlyGdp > 0 ?
    durationHoldings / officialQuarterlyGdp * 2 / (QE_HOLDING_QTRS + 1) : 0
  return Math.min(ASSET_PURCHASE_RATE_MAX,
    QE_ANNOUNCEMENT_SHARE * pace + (1 - QE_ANNOUNCEMENT_SHARE) * held)
}
