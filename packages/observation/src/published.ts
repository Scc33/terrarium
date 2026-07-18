/**
 * PublishedState — the ONLY types the ui package may import (§3.1).
 * Everything here is what a government of the period could actually know:
 * its own dials and books exactly, the economy only through its statistical
 * apparatus, plus rumors.
 */

import type { CapacityId, DialState, Qtr } from '@terrarium/engine'

export const INDICATOR_IDS = [
  'gdp_growth',
  'inflation',
  'unemployment',
  'payrolls',
  'capital_stock',
  'conf_consumer',
  'conf_business',
] as const
export type IndicatorId = (typeof INDICATOR_IDS)[number]

export interface IndicatorPoint {
  forQtr: Qtr // period measured
  publishedAt: Qtr // period released (lag = publishedAt − forQtr)
  value: number
  revision: number // 0 = first print
  errorBand: number // half-width; 0 = the office can't even estimate it
  /** GDP only: the office's level estimates behind the growth print */
  levels?: { real: number; nominal: number }
}

export interface IndicatorSeries {
  id: IndicatorId
  label: string
  unit: string
  points: IndicatorPoint[]
}

export interface NewsItem {
  tick: Qtr
  text: string
  tone: 'good' | 'bad' | 'neutral'
}

export interface PublishedState {
  tick: Qtr
  country: string
  /** only funded indicators appear at all */
  indicators: Partial<Record<IndicatorId, IndicatorSeries>>
  /** you always know your own settings */
  dials: DialState
  /** the treasury keeps exact books on itself */
  treasury: {
    revenue: number
    outlays: number
    balance: number
    debt: number
    printed: number
  }
  capacity: Record<CapacityId, number>
  capacityBuilding: Array<{ target: CapacityId; remaining: Qtr }>
  /** the treasury's own books, every quarter, exact — no fog on yourself */
  books: Array<{
    tick: Qtr
    revenue: number
    outlays: number
    balance: number
    debt: number
    reserves: number
  }>
  /** census-grade facts (static in M1; demography arrives in M4) */
  population: { total: number; laborForce: number }
  reserves: number
  exchangeRate: number
  politicalCapital: number
  quartersToElection: number
  inPower: boolean
  electionsWon: number
  news: NewsItem[]
}
