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

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

/** §3.3: the historians' verdict. Axes are graded separately, never summed.
 * Only exists once the run is over — no mid-run truth leak. */
export interface ReportCard {
  endedBy: 'deposition' | 'history' // history = the book closes at 2050
  quartersGoverned: Qtr
  electionsWon: number
  /** discounted geometric-mean real consumption per person per quarter */
  prosperity: number
  /** prosperity relative to the 1946 standard of living */
  vsBaseline: number
  /** annualized welfare growth over the tenure, %/yr — what gets graded */
  prosperityRate: number
  prosperityGrade: Grade
  /** consent: survival to 2050 or mandates won before the fall */
  legitimacyGrade: Grade
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
  /** census-grade facts — live from M4 on: the transition is the century */
  population: { total: number; laborForce: number; pyramid: number[] }
  reserves: number
  exchangeRate: number
  politicalCapital: number
  quartersToElection: number
  inPower: boolean
  electionsWon: number
  news: NewsItem[]
  /** present only when the run has ended (deposition or 2050) */
  reportCard?: ReportCard
}
