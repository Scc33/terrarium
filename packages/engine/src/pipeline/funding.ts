/**
 * The state's claim on private funding, across short and longer rates.
 *
 * Credit reads short funding; investment and valuation read five-year
 * funding. Both subtract nominal-price expectations and add the treasury's
 * new-money crowding and private share of sovereign risk. Government quotes
 * use the same risk formula on official GDP (ADR-0047); private transmission
 * still reads economic truth, never publishing it as an exact coupon.
 *
 * Every formula here exists twice — once on `TrueState`, once on scalars —
 * and the state version calls the scalar one. That is not ceremony: the
 * central-bank desk estimates the neutral rate from published figures by
 * calling the scalar versions (ADR-0043), so a gain retuned here moves the
 * briefing with the economy, and a second copy of the arithmetic that could
 * drift from the first does not exist. Operand order in the scalar versions
 * is the truth's, bit for bit; `tests/unit/neutral-rate.test.ts` pins it.
 */

import {
  ASSET_PURCHASE_PRIVATE_RATE_GAIN,
  BOND_CROWDING_RATE_GAIN,
  DEBT_RISK_PREMIUM_AT,
  FIN_FAVOR_PREMIUM,
  NATURAL_REAL_RATE,
  RISK_PREMIUM_SLOPE,
  SOVEREIGN_PRIVATE_PREMIUM_SHARE,
  SHORT_QE_TRANSMISSION_SHARE,
  YIELD_MATURITY_QTRS,
  domesticBondFundingShare,
} from '../constants'
import { treasuryFinancing } from '../state/accounts'
import type { TrueState } from '../state/schema'
import { financierAnger } from './derive'
import { officialNominalGdp } from '../state/spending'
import { benchmarkYieldAt, effectivePurchaseRateOf, termPremiumAt } from './termStructure'

/** The share of an auction domestic balance sheets carry, by openness — the
 * debt office's one structural fact, published exactly as such. */
export { domesticBondFundingShare }

/** The premium on scalars: `debtToGdp` is annualized, `anger` is
 * `financierAnger`. The desk runs it on the PUBLISHED debt ratio. */
export function sovereignRiskPremiumOf(debtToGdp: number, anger: number): number {
  return Math.max(0, debtToGdp - DEBT_RISK_PREMIUM_AT) * RISK_PREMIUM_SLOPE + FIN_FAVOR_PREMIUM * anger
}

/** Economic risk premium for private transmission. Exact dealer quotes use
 * this formula with official output instead of exposing the true ratio. */
export function sovereignRiskPremium(state: TrueState): number {
  const debtToGdp = state.gov.debt / Math.max(4 * state.flows.nominalGdp, 1e-9)
  return sovereignRiskPremiumOf(debtToGdp, financierAnger(state))
}

/** Bonds sold in the most recently booked quarter, as a share of that
 * quarter's GDP — the treasury's own `bondsIssued`, so the auction that
 * crowds private funding is the auction the books record. The financing
 * identity is deficit = fund draw + bonds + printing (ADR-0037), and a deficit
 * met from the sovereign fund sells no bonds. Until this read the books, it
 * took the whole deficit less printing and priced a fund draw as a phantom
 * auction: unreachable under passive or developmental play, which never run
 * a deficit while holding a fund, but 3.8 % of random-policy quarters, at a
 * median 1.7 % of quarterly GDP. */
export function bondIssuanceShare(state: TrueState): number {
  return treasuryFinancing(state).bondsIssued / Math.max(state.flows.nominalGdp, 1e-9)
}

/** The spread on scalars: the auction as a share of quarterly GDP, the share
 * of it domestic balance sheets carry, and the sovereign premium. */
export function privateFundingSpreadOf(
  auctionShare: number,
  domesticShare: number,
  riskPremium: number,
): number {
  return (
    BOND_CROWDING_RATE_GAIN * (auctionShare * domesticShare) +
    SOVEREIGN_PRIVATE_PREMIUM_SHARE * riskPremium
  )
}

/** Extra annual private funding cost created by the state's claim on finance:
 * a flow term for this quarter's domestic bond auction, plus a stock term for
 * sovereign risk. Printing is deliberately excluded from the flow term — it
 * fails through inflation instead of competing for loanable funds. */
export function privateFundingSpread(state: TrueState): number {
  return privateFundingSpreadOf(
    bondIssuanceShare(state),
    domesticBondFundingShare(state.params.openness),
    sovereignRiskPremium(state),
  )
}

/** The rate on scalars, shared by the truth below and the desk's estimate. */
export function privateRealRateOf(
  policyRate: number,
  expectedInflation: number,
  fundingSpread: number,
  assetPurchaseRate: number,
): number {
  return (
    policyRate -
    expectedInflation +
    fundingSpread -
    ASSET_PURCHASE_PRIVATE_RATE_GAIN * assetPurchaseRate * SHORT_QE_TRANSMISSION_SHARE
  )
}

/** The posted rate at which the short credit term reads its natural anchor.
 * Longer funding has its own anchor; this is not a growth target. */
export function neutralPolicyRateOf(
  expectedInflation: number,
  fundingSpread: number,
  assetPurchaseRate: number,
): number {
  return (
    NATURAL_REAL_RATE +
    expectedInflation -
    fundingSpread +
    ASSET_PURCHASE_PRIVATE_RATE_GAIN * assetPurchaseRate * SHORT_QE_TRANSMISSION_SHARE
  )
}

/** Short real funding read by bank credit. */
export function privateRealRate(state: TrueState): number {
  return privateRealRateOf(
    state.gov.dials.policyRate,
    state.ledger.inflationExpectations,
    privateFundingSpread(state),
    effectivePurchaseRate(state),
  )
}


/** The rate-equivalent of a purchase pace: what asset purchases take off the
 * private rate, and therefore add to the posted rate that counts as neutral. */
export function assetPurchaseRateEquivalent(assetPurchaseRate: number): number {
  return ASSET_PURCHASE_PRIVATE_RATE_GAIN * assetPurchaseRate * SHORT_QE_TRANSMISSION_SHARE
}

export function effectivePurchaseRate(state: TrueState): number {
  return effectivePurchaseRateOf(state.gov.dials.assetPurchaseRate, state.finance.durationHoldings,
    officialNominalGdp(state))
}

export function longNaturalRealRate(): number {
  return NATURAL_REAL_RATE + termPremiumAt(YIELD_MATURITY_QTRS.five_year)
}

export function privateLongRealRateOf(policyRate: number, anchor: number, expectedInflation: number, spread: number, purchaseRate: number): number {
  return benchmarkYieldAt(policyRate, anchor, ASSET_PURCHASE_PRIVATE_RATE_GAIN * purchaseRate,
    YIELD_MATURITY_QTRS.five_year) - expectedInflation + spread
}

export function privateLongRealRate(state: TrueState): number {
  return privateLongRealRateOf(state.gov.dials.policyRate, state.finance.yieldCurve.policyAnchor,
    state.ledger.inflationExpectations, privateFundingSpread(state), effectivePurchaseRate(state))
}
