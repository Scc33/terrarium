import { describe, expect, it } from 'vitest'
import {
  householdSavingRate,
  init,
  realConsumptionPerCapita,
  step,
  type TrueState,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'
import { taxEfficiency } from '../../packages/engine/src/constants'
import { INDICATOR_SPECS } from '../../packages/engine/src/pipeline/statistics'

const withStats = (statistical: number) => ({
  ...standardCountry,
  capacities: { ...standardCountry.capacities, statistical },
})

function play(seed: string, ticks: number, statistical = 1): TrueState {
  let state = init(withStats(statistical), seed)
  for (let t = 0; t < ticks; t++) state = step(state)
  return state
}

describe('the national accounts instruments', () => {
  it('GDP growth is real, while the per-head level removes population growth', () => {
    const state = play('accounts-real', 16)
    const q = state.stats.record.length - 1
    const record = state.stats.record
    const growth = INDICATOR_SPECS.find((spec) => spec.id === 'gdp_growth')!
    const truth = growth.trueValue(record, q)
    const nominalPriceShock = record.map((row, i) =>
      i === q ? { ...row, nominalGdp: row.nominalGdp * 10 } : row,
    )

    expect(growth.trueValue(nominalPriceShock, q)).toBe(truth)
    for (const row of record) {
      expect(row.realGdpPerCapita).toBeCloseTo((4 * row.realGdp) / row.population, 10)
    }
    expect(observe(state).indicators.gdp_growth!.label).toBe('Real GDP growth')
  })

  it('records lived consumption per head and the household saving identity', () => {
    const state = play('accounts-households', 20)
    const latest = state.stats.record[state.stats.record.length - 1]

    expect(latest.realConsumptionPerCapita).toBeCloseTo(realConsumptionPerCapita(state), 10)
    expect(latest.householdSavingRate).toBeCloseTo(householdSavingRate(state), 10)
    const incomeTaxEff =
      state.gov.dials.taxRates.income * taxEfficiency(state.gov.capacity.tax)
    const disposableIncome = state.cohorts.reduce(
      (sum, cohort) =>
        sum +
        cohort.wageIncome * (1 - incomeTaxEff) +
        cohort.profitIncome +
        cohort.transferIncome,
      0,
    )
    const consumption = Object.values(state.flows.cohortSpend).reduce((sum, spend) => sum + spend, 0)
    expect(latest.householdSavingRate + consumption / disposableIncome).toBeCloseTo(1, 10)
  })

  it('splits domestic demand into complementary government and private shares', () => {
    const base = init(withStats(1), 'accounts-ownership')
    const highGovernment: TrueState = {
      ...base,
      gov: {
        ...base.gov,
        dials: {
          ...base.gov.dials,
          spending: {
            ...base.gov.dials.spending,
            procurement: base.gov.dials.spending.procurement * 4,
            investment: base.gov.dials.spending.investment * 4,
          },
        },
      },
    }
    const ordinary = step(base)
    const expanded = step(highGovernment)
    const shareOf = (state: TrueState) => {
      const flows = state.flows
      return (
        flows.governmentDomesticDemandReal /
        (flows.governmentDomesticDemandReal + flows.privateDomesticDemandReal)
      )
    }

    expect(ordinary.stats.record[0].governmentDemandShare).toBeCloseTo(shareOf(ordinary), 10)
    expect(expanded.stats.record[0].governmentDemandShare).toBeCloseTo(shareOf(expanded), 10)
    expect(expanded.stats.record[0].governmentDemandShare).toBeGreaterThan(
      ordinary.stats.record[0].governmentDemandShare + 0.05,
    )
  })

  it('unlocks each account only when the office can compile it', () => {
    expect(observe(play('accounts-gate', 12, 0.1)).indicators.gdp_per_capita).toBeDefined()
    expect(observe(play('accounts-gate', 12, 0.1)).indicators.government_demand_share).toBeUndefined()
    expect(observe(play('accounts-gate', 12, 0.22)).indicators.government_demand_share).toBeDefined()
    expect(observe(play('accounts-gate', 12, 0.22)).indicators.consumption_per_capita).toBeUndefined()
    expect(observe(play('accounts-gate', 12, 0.3)).indicators.consumption_per_capita).toBeDefined()
    expect(observe(play('accounts-gate', 12, 0.4)).indicators.household_saving_rate).toBeUndefined()
    expect(observe(play('accounts-gate', 12, 0.5)).indicators.household_saving_rate).toBeDefined()
  })
})
