/** Pure reading arithmetic for the Household Office. */

import { describe, expect, it } from 'vitest'
import { HOUSEHOLD_SURVEY_FUNDED_AT } from '@terrarium/engine'
import {
  INCOME_QUINTILE_IDS,
  type IncomeQuintileId,
  type PublishedState,
} from '@terrarium/observation'
import {
  QUINTILE_FACE,
  householdAvailability,
  householdIncomeTraces,
  householdShareRows,
  householdShares,
  latestIndicator,
  readHouseholds,
} from '../../packages/ui/src/households'

type Print = PublishedState['households'][number]

const vec = (values: readonly number[]): Record<IncomeQuintileId, number> =>
  INCOME_QUINTILE_IDS.reduce<Record<IncomeQuintileId, number>>((record, id, index) => {
    record[id] = values[index]
    return record
  }, {} as Record<IncomeQuintileId, number>)

function print(
  forQtr: number,
  income: readonly number[],
  shares: readonly number[],
  revision = 0,
): Print {
  return {
    forQtr,
    publishedAt: forQtr + revision + 1,
    revision,
    incomeErrorBand: 0.08,
    povertyGapErrorBand: 0.02,
    incomeReal: vec(income),
    incomeShare: vec(shares),
    povertyGap: 0.1,
    povertyLine: 70,
  }
}

function pubWith(
  households: Print[],
  desk: { statistical?: number; fullInstrumentation?: boolean } = {},
): PublishedState {
  return {
    tick: 40,
    households,
    indicators: {},
    capacity: { statistical: desk.statistical ?? 0.6 },
    rules: { fullInstrumentation: desk.fullInstrumentation ?? false },
  } as unknown as PublishedState
}

describe('reading the household survey', () => {
  it('names all five population fifths exactly once, in rank and draw order', () => {
    expect(Object.keys(QUINTILE_FACE).sort()).toEqual([...INCOME_QUINTILE_IDS].sort())
    expect(new Set(Object.values(QUINTILE_FACE).map((face) => face.ink)).size).toBe(5)
    const release = readHouseholds(pubWith([print(0, [40, 65, 90, 120, 220], [0.08, 0.13, 0.18, 0.24, 0.37])]))!
    expect(release.quintiles.map((reading) => reading.key)).toEqual([...INCOME_QUINTILE_IDS])
  })

  it('settles each quarter to the office’s latest revision everywhere', () => {
    const pub = pubWith([
      print(0, [40, 65, 90, 120, 220], [0.08, 0.13, 0.18, 0.24, 0.37]),
      print(8, [45, 70, 95, 125, 225], [0.09, 0.14, 0.18, 0.24, 0.35]),
      print(8, [50, 75, 100, 130, 230], [0.1, 0.15, 0.18, 0.23, 0.34], 2),
    ])
    const release = readHouseholds(pub)!
    expect(release.revision).toBe(2)
    expect(release.quintiles[0].incomeReal).toBe(50)
    expect(householdShareRows(pub).map((row) => row.tick)).toEqual([0, 8])
    expect(householdShareRows(pub)[1].values.lowest).toBe(0.1)
    expect(householdIncomeTraces(pub)[0].points.at(-1)?.value).toBe(50)
  })

  it('keeps the shares at a whole and carries their drift since the first survey', () => {
    const pub = pubWith([
      print(0, [40, 65, 90, 120, 220], [0.08, 0.13, 0.18, 0.24, 0.37]),
      print(8, [50, 75, 100, 130, 230], [0.1, 0.15, 0.18, 0.23, 0.34]),
    ])
    const release = readHouseholds(pub)!
    expect(release.quintiles.reduce((sum, reading) => sum + reading.incomeShare, 0)).toBeCloseTo(1, 12)
    expect(release.quintiles[0].sinceFirst).toBeCloseTo(2, 12)
    expect(householdShares(release.quintiles).reduce((sum, share) => sum + share.value, 0)).toBeCloseTo(1, 12)
  })

  it('distinguishes an unfunded, awaiting and reporting office', () => {
    expect(householdAvailability(pubWith([], { statistical: HOUSEHOLD_SURVEY_FUNDED_AT - 0.01 }))).toBe('unfunded')
    expect(householdAvailability(pubWith([], { statistical: HOUSEHOLD_SURVEY_FUNDED_AT }))).toBe('awaiting')
    expect(householdAvailability(pubWith([], { statistical: 0, fullInstrumentation: true }))).toBe('awaiting')
    expect(householdAvailability(pubWith([print(0, [40, 65, 90, 120, 220], [0.08, 0.13, 0.18, 0.24, 0.37])], { statistical: 0 }))).toBe('reporting')
  })

  it('reads the latest scalar headline by measured quarter and revision', () => {
    const pub = pubWith([])
    pub.indicators.poverty_rate = {
      id: 'poverty_rate',
      label: 'Poverty rate',
      unit: '%',
      points: [
        { forQtr: 4, publishedAt: 5, revision: 0, value: 22, errorBand: 2 },
        { forQtr: 4, publishedAt: 8, revision: 2, value: 20, errorBand: 0.5 },
        { forQtr: 5, publishedAt: 6, revision: 0, value: 19, errorBand: 2 },
      ],
    }
    expect(latestIndicator(pub, 'poverty_rate')).toBe(19)
  })
})
