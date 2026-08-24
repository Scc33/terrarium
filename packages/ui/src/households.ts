/**
 * The household-budget survey, arranged for reading.
 *
 * Poverty is one headline on the wall. This module keeps the distribution
 * behind it intact: five equal population bins, their income levels and their
 * shares of the whole. It never renames the engine's five socioeconomic
 * cohorts as quintiles — those groups have unequal populations and can trade
 * places. The survey has already done the population split before it crosses
 * the observation boundary.
 */

import { HOUSEHOLD_SURVEY_FUNDED_AT } from '@terrarium/engine'
import {
  INCOME_QUINTILE_IDS,
  type IncomeQuintileId,
  type PublishedState,
} from '@terrarium/observation'
import type { PlotPoint } from './plot'
import { SHARE_INKS, type Share, type StackRow } from './shares'

export const QUINTILE_FACE: Record<
  IncomeQuintileId,
  { label: string; short: string; ink: string; note: string }
> = {
  lowest: {
    label: 'Lowest fifth',
    short: 'BOTTOM 20%',
    ink: SHARE_INKS[0],
    note: 'The twenty percent of people with the lowest real disposable income.',
  },
  second: {
    label: 'Second fifth',
    short: 'SECOND 20%',
    ink: SHARE_INKS[1],
    note: 'The next twenty percent of people in the household income ranking.',
  },
  middle: {
    label: 'Middle fifth',
    short: 'MIDDLE 20%',
    ink: SHARE_INKS[2],
    note: 'The middle twenty percent of people in the household income ranking.',
  },
  fourth: {
    label: 'Fourth fifth',
    short: 'FOURTH 20%',
    ink: SHARE_INKS[3],
    note: 'The twenty percent of people below the highest-income fifth.',
  },
  highest: {
    label: 'Highest fifth',
    short: 'TOP 20%',
    ink: SHARE_INKS[4],
    note: 'The twenty percent of people with the highest real disposable income.',
  },
}

export type HouseholdAvailability = 'unfunded' | 'awaiting' | 'reporting'

export function householdAvailability(pub: PublishedState): HouseholdAvailability {
  if (pub.households.length > 0) return 'reporting'
  return pub.rules.fullInstrumentation || pub.capacity.statistical >= HOUSEHOLD_SURVEY_FUNDED_AT
    ? 'awaiting'
    : 'unfunded'
}

/** Latest revision per measured quarter, oldest first. */
function settled(points: PublishedState['households']): PublishedState['households'] {
  const best = new Map<number, PublishedState['households'][number]>()
  for (const point of points) {
    const current = best.get(point.forQtr)
    if (!current || point.revision > current.revision) best.set(point.forQtr, point)
  }
  return [...best.values()].sort((a, b) => a.forQtr - b.forQtr)
}

export interface QuintileReading {
  key: IncomeQuintileId
  label: string
  short: string
  ink: string
  note: string
  /** national 1946 mean = 100 */
  incomeReal: number
  /** share of all household income, 0..1 */
  incomeShare: number
  /** percentage-point change in income share since the first release */
  sinceFirst: number
}

export interface HouseholdRelease {
  forQtr: number
  lag: number
  revision: number
  /** relative half-width around each quintile-income estimate */
  incomeErrorBand: number
  /** absolute half-width on povertyGap, in the gap's 0..1 units */
  povertyGapErrorBand: number
  povertyGap: number
  povertyLine: number
  quintiles: QuintileReading[]
}

export function readHouseholds(pub: PublishedState): HouseholdRelease | null {
  const history = settled(pub.households)
  const first = history[0]
  const latest = history[history.length - 1]
  if (!first || !latest) return null

  return {
    forQtr: latest.forQtr,
    lag: pub.tick - latest.forQtr,
    revision: latest.revision,
    incomeErrorBand: latest.incomeErrorBand,
    povertyGapErrorBand: latest.povertyGapErrorBand,
    povertyGap: latest.povertyGap,
    povertyLine: latest.povertyLine,
    quintiles: INCOME_QUINTILE_IDS.map((key) => ({
      key,
      ...QUINTILE_FACE[key],
      incomeReal: latest.incomeReal[key],
      incomeShare: latest.incomeShare[key],
      sinceFirst: 100 * (latest.incomeShare[key] - first.incomeShare[key]),
    })),
  }
}

/** Current income shares for the donut. Values are already shares; the donut
 * still normalizes them defensively, as it does every composition. */
export function householdShares(readings: readonly QuintileReading[]): Share[] {
  return readings.map((reading) => ({
    key: reading.key,
    label: reading.label,
    value: reading.incomeShare,
    ink: reading.ink,
    note: reading.note,
  }))
}

/** The distribution's shape over time, one row per settled survey release. */
export function householdShareRows(pub: PublishedState): StackRow[] {
  return settled(pub.households).map((point) => ({
    tick: point.forQtr,
    values: INCOME_QUINTILE_IDS.reduce<Record<string, number>>((values, id) => {
      values[id] = Math.max(0, point.incomeShare[id])
      return values
    }, {}),
  }))
}

export interface QuintileTrace {
  key: IncomeQuintileId
  label: string
  ink: string
  points: PlotPoint[]
}

/** Five real-income histories, all on the same 1946-national-mean scale. */
export function householdIncomeTraces(pub: PublishedState): QuintileTrace[] {
  const history = settled(pub.households)
  return INCOME_QUINTILE_IDS.map((key) => ({
    key,
    label: QUINTILE_FACE[key].short,
    ink: QUINTILE_FACE[key].ink,
    points: history.map((point) => ({ tick: point.forQtr, value: point.incomeReal[key] })),
  }))
}

/** Latest settled scalar print, or null while its survey is absent. */
export function latestIndicator(pub: PublishedState, id: 'poverty_rate' | 'gini' | 'income_real'): number | null {
  const points = pub.indicators[id]?.points
  if (!points || points.length === 0) return null
  const best = new Map<number, (typeof points)[number]>()
  for (const point of points) {
    const current = best.get(point.forQtr)
    if (!current || point.revision > current.revision) best.set(point.forQtr, point)
  }
  const latest = [...best.values()].sort((a, b) => a.forQtr - b.forQtr).at(-1)
  return latest?.value ?? null
}
