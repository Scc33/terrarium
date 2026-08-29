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
import {
  INDICATOR_SPECS,
  isDirectIndicatorSpec,
} from '../../packages/engine/src/pipeline/statistics'

const DIRECT_INDICATOR_SPECS = INDICATOR_SPECS.filter(isDirectIndicatorSpec)

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
    const growth = DIRECT_INDICATOR_SPECS.find((spec) => spec.id === 'gdp_growth')!
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

  it('puts the treasury debt stock over annualized nominal GDP', () => {
    const state = play('accounts-debt', 16)
    const q = state.stats.record.length - 1
    const record = state.stats.record
    const debtRatio = DIRECT_INDICATOR_SPECS.find((spec) => spec.id === 'debt_to_gdp')!

    expect(debtRatio.trueValue(record, q)).toBeCloseTo(
      (100 * record[q].debt) / (4 * record[q].nominalGdp),
      10,
    )
    expect(
      debtRatio.trueValue(
        record.map((row, i) => (i === q ? { ...row, debt: row.debt * 2 } : row)),
        q,
      ),
    ).toBeCloseTo(2 * debtRatio.trueValue(record, q), 10)
    expect(
      debtRatio.trueValue(
        record.map((row, i) => (i === q ? { ...row, nominalGdp: row.nominalGdp * 2 } : row)),
        q,
      ),
    ).toBeCloseTo(0.5 * debtRatio.trueValue(record, q), 10)
    expect(observe(state).indicators.debt_to_gdp!.unit).toBe('% of GDP')
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

  it('splits final expenditure into four exhaustive, non-negative claims', () => {
    const state = play('accounts-expenditure', 24)

    for (const row of state.stats.record) {
      const parts = [row.consumptionShare, row.investmentShare, row.governmentShare, row.exportShare]
      for (const part of parts) expect(part).toBeGreaterThanOrEqual(0)
      // exhaustive by construction: a residual would mean output was bought by
      // nobody, and the composition views would be renormalizing a lie
      expect(parts.reduce((sum, part) => sum + part, 0)).toBeCloseTo(1, 10)
    }
  })

  it('books public works as capital formation, not as government consumption', () => {
    const base = init(withStats(1), 'accounts-ownership')
    const dialUp = (of: 'procurement' | 'investment'): TrueState => ({
      ...base,
      gov: {
        ...base.gov,
        dials: {
          ...base.gov.dials,
          spending: { ...base.gov.dials.spending, [of]: base.gov.dials.spending[of] * 5 },
        },
      },
    })
    const ordinary = step(base).stats.record[0]
    const buying = step(dialUp('procurement')).stats.record[0]
    const building = step(dialUp('investment')).stats.record[0]

    // procurement is the state's own final consumption…
    expect(buying.governmentShare).toBeGreaterThan(ordinary.governmentShare + 0.05)
    // …while public works land beside private capital formation. This is the
    // distinction the old single government/private share could not draw, and
    // it is the whole point of the split: a ministry pouring concrete is an
    // investment economy, a ministry buying uniforms is not.
    expect(building.investmentShare).toBeGreaterThan(ordinary.investmentShare + 0.02)
    expect(building.governmentShare).toBeLessThanOrEqual(ordinary.governmentShare + 1e-9)
  })

  it('unlocks each account only when the office can compile it', () => {
    expect(observe(play('accounts-gate', 12, 0.1)).indicators.gdp_per_capita).toBeDefined()
    expect(observe(play('accounts-gate', 12, 0.1)).indicators.debt_to_gdp).toBeDefined()
    expect(observe(play('accounts-gate', 12, 0.22)).indicators.consumption_per_capita).toBeUndefined()
    expect(observe(play('accounts-gate', 12, 0.3)).indicators.consumption_per_capita).toBeDefined()
    // the expenditure accounts arrive as one event, all three together
    const thin = observe(play('accounts-gate', 12, 0.28)).indicators
    const built = observe(play('accounts-gate', 12, 0.4)).indicators
    for (const id of ['consumption_share', 'investment_share', 'export_share'] as const) {
      expect(thin[id]).toBeUndefined()
      expect(built[id]).toBeDefined()
    }
    expect(observe(play('accounts-gate', 12, 0.4)).indicators.household_saving_rate).toBeUndefined()
    expect(observe(play('accounts-gate', 12, 0.5)).indicators.household_saving_rate).toBeDefined()
  })
})
