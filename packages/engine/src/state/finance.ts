/** Financial stocks and their opening book. */
import { BANK_TARGET_RATIO } from '../constants'
import type { Money, Qtr } from './schema'

// ---------- the financial sector: fragility ----------
export interface FinanceState {
  /** Central-bank purchases held at acquisition cost, not private bank equity.
   * No sale, maturity, coupon or revaluation is modeled (ADR-0038). */
  centralBankAssets: Money
  /** asset valuation per unit of capital — a Tobin's q, 1946 = 1. The bubble
   * variable: departs from its profitability/rate fundamental on credit and
   * animal spirits, and production reads it as the price of investing. */
  assetPrice: number
  /** the banking system's net worth — the buffer against loan losses. Crises
   * write it down; the interest margin rebuilds it. Thin capital → a crunch. */
  bankCapital: Money
  /** total credit outstanding = Σ sector.credit (cached for cheap reads) */
  creditOutstanding: Money
  /** credit / annual nominal GDP — the leverage gauge and the fragility clock */
  creditToGdp: number
  /** last quarter's change in credit/GDP, annualized — the boom signal a
   * bank supervisor would report; also what bids asset prices up */
  creditGrowth: number
  /** quarters of an active banking crisis still to run; 0 = calm */
  crisisQtrsLeft: Qtr
  /** how hard the current crisis hit, 0..1 — sizes the crunch and the drag */
  crisisSeverity: number
}

export function initialFinance(creditOutstanding: number, creditToGdp: number): FinanceState {
  return { centralBankAssets: 0, assetPrice: 1,
    bankCapital: BANK_TARGET_RATIO * creditOutstanding,
    creditOutstanding, creditToGdp, creditGrowth: 0,
    crisisQtrsLeft: 0, crisisSeverity: 0,
  }
}
