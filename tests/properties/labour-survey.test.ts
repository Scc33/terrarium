/** The occupational labour survey and its independently fogged headline. */

import { describe, expect, it } from 'vitest'
import {
  LABOUR_CLASS_IDS,
  LABOUR_MARKET_TABLE_IDS,
  LABOUR_SURVEY_FUNDED_AT,
  createCountryParams,
  init,
  laborForce,
  labourMarket,
  step,
  type TrueState,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'

function play(seed: string, ticks: number, statistical: number, fitted = false): TrueState {
  const base = createCountryParams('meridia', seed)
  let state = init(
    { ...base, capacities: { ...base.capacities, statistical } },
    seed,
    { protectedTenure: true, fullInstrumentation: fitted },
  )
  for (let tick = 0; tick < ticks; tick++) state = step(state)
  return state
}

describe('the labour-market worksheet', () => {
  it('counts joblessness and lower-rung work without changing the allocation', () => {
    const state = play('labour-worksheet', 80, 1)
    const reading = labourMarket(state)
    const record = state.stats.record.at(-1)!
    expect(record.labourMarket).toEqual(reading.byClass)
    expect(record.labourUnderuse).toBe(reading.underuse)
    expect(reading.underuse).toBeGreaterThanOrEqual(0)
    expect(reading.underuse).toBeLessThanOrEqual(1)
    for (const id of LABOUR_CLASS_IDS) {
      expect(reading.byClass[id].jobless).toBeGreaterThanOrEqual(0)
      expect(reading.byClass[id].jobless).toBeLessThanOrEqual(1)
      expect(reading.byClass[id].underemployed).toBeGreaterThanOrEqual(0)
      expect(reading.byClass[id].underemployed).toBeLessThanOrEqual(1)
      expect(
        reading.byClass[id].jobless + reading.byClass[id].underemployed,
      ).toBeLessThanOrEqual(1 + 1e-12)
    }
  })

  it('expresses real underemployment after the staffing changes in #195 and #196', () => {
    const reading = labourMarket(play('labour-reachable', 400, 1))
    const underemployed = LABOUR_CLASS_IDS.reduce(
      (sum, id) => sum + reading.byClass[id].underemployed,
      0,
    )
    expect(underemployed).toBeGreaterThan(0.01)
  })
})

describe('the labour return is a survey, not a truth window', () => {
  it('is absent below its funding rung and fitted by the sandbox rule', () => {
    expect(
      observe(play('labour-unfunded', 24, LABOUR_SURVEY_FUNDED_AT - 0.01)).labour,
    ).toEqual([])
    expect(
      observe(play('labour-funded', 24, LABOUR_SURVEY_FUNDED_AT + 0.1)).labour.length,
    ).toBeGreaterThan(0)
    expect(observe(play('labour-fitted', 24, 0, true)).labour.length).toBeGreaterThan(0)
  })

  it('lags, revises and independently noises every class and table', () => {
    const state = play('labour-fog', 32, 1)
    const pub = observe(state)
    expect(pub.labour.length).toBeGreaterThan(0)
    const revisions = new Map<number, Set<number>>()
    for (const print of pub.labour) {
      expect(print.publishedAt).toBeGreaterThan(print.forQtr)
      revisions.set(
        print.forQtr,
        new Set([...(revisions.get(print.forQtr) ?? []), print.revision]),
      )
      const truth = state.stats.record[print.forQtr].labourMarket
      for (const table of LABOUR_MARKET_TABLE_IDS) {
        expect(print.errorBand[table]).toBeGreaterThan(0)
        const differs = LABOUR_CLASS_IDS.some((id) => print[table][id] !== truth[id][table])
        expect(differs, `${table} leaked an exact occupational row`).toBe(true)
        for (const id of LABOUR_CLASS_IDS) {
          expect(print[table][id]).toBeGreaterThanOrEqual(0)
          expect(print[table][id]).toBeLessThanOrEqual(1)
        }
      }
    }
    expect([...revisions.values()].some((values) => values.size === 3)).toBe(true)
  })

  it('keeps the headline independent of the vector release', () => {
    const state = play('labour-independent', 36, 1)
    const pub = observe(state)
    const release = pub.labour.at(-1)!
    const headline = pub.indicators.labour_underuse!.points
      .filter((point) => point.forQtr === release.forQtr)
      .sort((a, b) => b.revision - a.revision)[0]
    expect(headline).toBeDefined()
    const weights = laborForce(state)
    const labourForceTotal = LABOUR_CLASS_IDS.reduce((sum, id) => sum + weights[id], 0)
    const aggregateFromRows = LABOUR_CLASS_IDS.reduce(
      (sum, id) =>
        sum + weights[id] * (release.jobless[id] + release.underemployed[id]),
      0,
    ) / labourForceTotal
    expect(headline.value).not.toBeCloseTo(100 * aggregateFromRows, 8)
  })
})
