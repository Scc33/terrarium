/** Dealers price from released information. Exact coupons must not invert hidden GDP.
 * Expectations are an extrapolation of observed policy, not a reaction rule or prophecy. */
import {
  ASSET_PURCHASE_PRIVATE_RATE_GAIN,
  DEBT_TO_GDP_1946,
  POLICY_RATE_1946,
  YIELD_MATURITY_QTRS,
  YIELD_POLICY_MEMORY_QTRS,
} from '../constants'
import { YIELD_IDS, type YieldCurve } from '../state/bonds'
import type { TrueState } from '../state/schema'
import { officialNominalGdp } from '../state/spending'
import { financierAnger } from './derive'
import { effectivePurchaseRate, sovereignRiskPremiumOf } from './funding'
import { benchmarkYieldAt } from './termStructure'
export { benchmarkYieldAt, expectedPolicyRateAt, termPremiumAt } from './termStructure'

export function yieldCurveOf(tick: number, policyRate: number, anchor: number, purchaseEquivalent: number, riskPremium: number): YieldCurve {
  const benchmark = {} as YieldCurve['benchmark']
  const yields = {} as YieldCurve['yields']
  for (const id of YIELD_IDS) {
    benchmark[id] = benchmarkYieldAt(policyRate, anchor, purchaseEquivalent, YIELD_MATURITY_QTRS[id])
    yields[id] = benchmark[id] + riskPremium
  }
  return { tick, policyRate, policyAnchor: anchor, purchaseEquivalent, sovereignPremium: riskPremium, benchmark, yields }
}

export function initialYieldCurve(debtRatio = DEBT_TO_GDP_1946): YieldCurve {
  return yieldCurveOf(0, POLICY_RATE_1946, POLICY_RATE_1946, 0, sovereignRiskPremiumOf(debtRatio, 0))
}

export function quoteYieldCurve(state: TrueState): YieldCurve {
  const anchor = state.finance.yieldCurve.policyAnchor +
    (state.gov.dials.policyRate - state.finance.yieldCurve.policyAnchor) / YIELD_POLICY_MEMORY_QTRS
  const official = officialNominalGdp(state)
  const ratio = official === null ? (state.params.structure?.debtToGdp ?? DEBT_TO_GDP_1946) :
    state.gov.debt / Math.max(4 * official, 1e-9)
  return yieldCurveOf(state.meta.tick, state.gov.dials.policyRate, anchor,
    ASSET_PURCHASE_PRIVATE_RATE_GAIN * effectivePurchaseRate(state),
    sovereignRiskPremiumOf(ratio, financierAnger(state)))
}
