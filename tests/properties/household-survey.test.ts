/** The household survey is a fogged vector release, not a truth window. */

import { describe, expect, it } from 'vitest'
import {
  HOUSEHOLD_SURVEY_FUNDED_AT,
  INCOME_QUINTILE_IDS,
  init,
  step,
  type TrueState,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

const withStats = (statistical: number) => ({
  ...standardCountry,
  capacities: { ...standardCountry.capacities, statistical },
})

function play(seed: string, ticks: number, statistical: number): TrueState {
  let state = init(withStats(statistical), seed)
  for (let tick = 0; tick < ticks; tick++) state = step(state)
  return state
}

describe('the household survey is funded, fogged and revisable', () => {
  it('unlocks the vector and poverty headline together', () => {
    const poor = observe(play('households-poor', 24, HOUSEHOLD_SURVEY_FUNDED_AT - 0.01))
    expect(poor.households).toEqual([])
    expect(poor.indicators.poverty_rate).toBeUndefined()

    const funded = observe(play('households-funded', 24, HOUSEHOLD_SURVEY_FUNDED_AT + 0.1))
    expect(funded.households.length).toBeGreaterThan(0)
    expect(funded.indicators.poverty_rate).toBeDefined()
  })

  it('the instrumentation rule lifts only the gate, not lag, noise or revision', () => {
    let state = init(withStats(0.05), 'households-fitted', { fullInstrumentation: true })
    for (let tick = 0; tick < 24; tick++) state = step(state)
    const pub = observe(state)
    expect(pub.households.length).toBeGreaterThan(0)
    expect(new Set(pub.households.map((print) => print.revision))).toEqual(new Set([0, 1, 2]))
    for (const print of pub.households) {
      expect(print.publishedAt).toBeGreaterThan(print.forQtr)
      // A poor fitted office has the survey but cannot state its uncertainty.
      expect(print.incomeErrorBand).toBe(0)
      const truth = state.stats.record[print.forQtr]
      const exact = INCOME_QUINTILE_IDS.every((id) =>
        print.incomeReal[id] === 100 * truth.incomeQuintileReal[id] / state.stats.record[0].incomeMeanReal,
      )
      expect(exact).toBe(false)
    }
  })

  it('publishes a coherent distribution without reconciling it to hidden truth', () => {
    const state = play('households-fog', 40, 1)
    const pub = observe(state)
    expect(pub.households.length).toBeGreaterThan(0)
    for (const print of pub.households) {
      const incomes = INCOME_QUINTILE_IDS.map((id) => print.incomeReal[id])
      const shares = INCOME_QUINTILE_IDS.map((id) => print.incomeShare[id])
      expect(incomes.every((value) => Number.isFinite(value) && value >= 0)).toBe(true)
      expect(shares.every((value) => Number.isFinite(value) && value >= 0)).toBe(true)
      expect(shares.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12)
      for (let i = 1; i < incomes.length; i++) {
        expect(incomes[i]).toBeGreaterThanOrEqual(incomes[i - 1])
      }
      expect(print.povertyGap).toBeGreaterThanOrEqual(0)
      expect(print.povertyGap).toBeLessThanOrEqual(1)
      expect(print.povertyLine).toBeGreaterThan(0)
      expect(print.incomeErrorBand).toBeGreaterThan(0)
      expect(print.povertyGapErrorBand).toBeGreaterThanOrEqual(0)

      const truth = state.stats.record[print.forQtr]
      const exactIncome = INCOME_QUINTILE_IDS.every((id) =>
        print.incomeReal[id] === 100 * truth.incomeQuintileReal[id] / state.stats.record[0].incomeMeanReal,
      )
      expect(exactIncome).toBe(false)
    }
  })

  it('runs on the ordinary office clock with all three revisions', () => {
    const pub = observe(play('households-clock', 30, 1))
    const revisions = new Map<number, number[]>()
    for (const print of pub.households) {
      revisions.set(print.forQtr, [...(revisions.get(print.forQtr) ?? []), print.revision])
    }
    expect([...revisions.values()].some((values) => values.length === 3)).toBe(true)
    expect([...revisions.values()].some((values) => values.includes(0))).toBe(true)
  })
})
