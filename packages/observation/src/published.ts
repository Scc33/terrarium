/**
 * PublishedState — the ONLY types the ui package may import (§3.1).
 * Everything here is what a government of the period could actually know:
 * its own dials and books exactly, the economy only through its statistical
 * apparatus, plus rumors. The prints themselves are made in the engine's
 * statistics step (they must be — politics reads them); this package owns
 * their presentation.
 */

import type { CapacityId, DialState, IndicatorId, NewsItem, Qtr, StatPrint } from '@terrarium/engine'

export { INDICATOR_IDS } from '@terrarium/engine'
export type { IndicatorId, NewsItem }

/** A published figure, exactly as the office released it. */
export type IndicatorPoint = StatPrint

export interface IndicatorSeries {
  id: IndicatorId
  label: string
  unit: string
  points: IndicatorPoint[]
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
