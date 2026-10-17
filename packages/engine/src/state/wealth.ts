/** Balance sheets cover the assets and liabilities modeled by this engine.
 * Households include their directly owned businesses; banks and the monetary
 * authority remain separate counterparties. See ADR-0051. */
import type { CohortId, Qtr } from './schema'

export type BondHolderId = CohortId | 'foreign'
export type BondHoldings = Record<BondHolderId, number>
export const HOUSEHOLD_WEALTH_COMPONENT_IDS = [
  'deposits', 'bonds', 'productiveAssets', 'bankEquity', 'businessLoans', 'overdrafts',
] as const
export type HouseholdWealthComponentId = (typeof HOUSEHOLD_WEALTH_COMPONENT_IDS)[number]
export type HouseholdWealth = Record<HouseholdWealthComponentId, number> & { netWorth: number }

export interface WealthRecord {
  households: Record<CohortId, HouseholdWealth>
  household: HouseholdWealth
  publicNetWorth: number
  nationalNetWorth: number
  productiveCapital: number
  publicCapital: number
  foreignCapital: number
  bankSettlement: number
  centralBankNetWorth: number
  foreignBonds: number
  netForeignAssets: number
}

/** An asset-and-liability survey. Net positions are constructed from these
 * same estimates, so neither assets nor loans vanish in a convenient residual. */
export interface WealthPrint {
  forQtr: Qtr
  publishedAt: Qtr
  revision: number
  /** Household component relative half-width; zero means unknown. */
  errorBand: number
  /** Absolute half-widths from the same estimated public components. */
  publicErrorBand: number
  nationalErrorBand: number
  household: HouseholdWealth
  publicNetWorth: number
  nationalNetWorth: number
}
