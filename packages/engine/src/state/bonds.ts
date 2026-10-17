/** Public market prices and the government's own contracts. None are surveys. */
import type { Money, Qtr } from './schema'

export const YIELD_IDS = ['three_month', 'one_year', 'five_year', 'ten_year'] as const
export type YieldId = (typeof YIELD_IDS)[number]

export interface YieldCurve {
  tick: Qtr
  policyRate: number
  /** Dealers extrapolate the observed rate record, not future player orders. */
  policyAnchor: number
  /** Annual rate-equivalent of announced purchases and duration still held. */
  purchaseEquivalent: number
  /** A dealer assessment from official output and the treasury's own debt. */
  sovereignPremium: number
  benchmark: Record<YieldId, number>
  yields: Record<YieldId, number>
}

export interface BondLot {
  principal: Money
  coupon: number
  issuedAt: Qtr
  maturesAt: Qtr
}

export interface AssetLot {
  amount: Money
  maturesAt: Qtr
}
