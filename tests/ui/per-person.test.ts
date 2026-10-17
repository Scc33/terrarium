import { perPersonDiagnostics } from '../../packages/runner/src/perPerson'
import { sampleCountry, runCountryFuzzCase } from '../../packages/runner/src/country-fuzz'
import { describe, expect, it } from 'vitest'
import { createCountryParams, init, step } from '@terrarium/engine'
import { observe, type PublishedState } from '@terrarium/observation'
import { instrumentView, perPerson, populationRows, treasuryBasis } from '../../packages/ui/src/perPerson'
import { shapeSeries, rollingAverage } from '../../packages/ui/src/components/series'
import { householdWealthBand, wealthHistory } from '../../packages/ui/src/wealth'

function published(): PublishedState {
  let state = init(createCountryParams('meridia', 'per-person'), 'per-person', { fullInstrumentation: true })
  for (let q = 0; q < 12; q++) state = step(state)
  return observe(state)
}

describe('per-person views read each measured quarter’s census', () => {
  it('preserves release vintages and scales their uncertainty with their value', () => {
    const pub = published()
    pub.census = pub.census.map(row => ({ ...row, population: row.tick === 0 ? 10 : 20 }))
    pub.indicators.capital_stock!.points = [
      { forQtr: 0, publishedAt: 2, value: 100, errorBand: 10, revision: 0 },
      { forQtr: 0, publishedAt: 4, value: 120, errorBand: 4, revision: 1 },
      { forQtr: 1, publishedAt: 3, value: 200, errorBand: 20, revision: 0 },
    ]
    const original = structuredClone(pub)
    const { series, presentation } = instrumentView(pub, 'capital_stock', 'perPerson')
    expect(series!.points.map(point => point.value)).toEqual([10, 12, 10])
    expect(series!.points.map(point => point.errorBand)).toEqual([1, 0.4, 1])
    expect(series!.points[1]).toMatchObject({ forQtr: 0, publishedAt: 4, revision: 1 })
    const shaped = shapeSeries(series!, 100, pub.tick)
    expect(shaped[0]).toMatchObject({ firstPrint: 10, value: 12, revisionDelta: 2 })
    expect(rollingAverage(shaped, 6)[0].value).toBe(11)
    expect(presentation!.names.short).toBe('CAP/HEAD')
    expect(pub).toEqual(original)
  })

  it('does not normalize rates, indices or existing per-person accounts twice', () => {
    const pub = published()
    for (const id of ['gdp_growth', 'inflation', 'income_real', 'gdp_per_capita', 'consumption_per_capita'] as const) {
      expect(instrumentView(pub, id, 'perPerson').series).toBe(pub.indicators[id])
    }
  })

  it('does not turn missing or invalid census data into a zero', () => {
    for (const heads of [undefined, 0, -1, NaN, Infinity]) expect(perPerson(10, heads)).toBeNull()
    const pub = published()
    pub.census = []
    expect(instrumentView(pub, 'capital_stock', 'perPerson').series!.points).toEqual([])
    expect(treasuryBasis(pub, 'perPerson')).toBeNull()
    expect(populationRows([{ tick: 1, values: { capital: 100 } }], pub)).toEqual([])
  })

  it('normalizes exact money and splits while preserving dates and exchange rates', () => {
    const pub = published()
    const view = treasuryBasis(pub, 'perPerson')!
    for (const row of view.books) {
      const source = pub.books.find(book => book.tick === row.tick)!
      const population = pub.census.find(census => census.tick === row.tick)!.population
      expect(row.debt).toBeCloseTo(source.debt / population, 10)
      expect(row.revenueBySource.income).toBeCloseTo(source.revenueBySource.income / population, 10)
      expect(row.exchangeRate).toBe(source.exchangeRate)
    }
    expect(view.treasury.domesticBondShare).toBe(pub.treasury.domesticBondShare)
  })

  it('keeps wealth consolidation and a nonzero band when assets and debt offset', () => {
    const pub = published()
    const history = wealthHistory(pub, 'perPerson')
    expect(history.length).toBeGreaterThan(0)
    for (const point of history) {
      expect(point.nationalNetWorth).toBeCloseTo(point.household.netWorth + point.publicNetWorth, 8)
      const source = pub.wealth.find(row => row.forQtr === point.forQtr && row.revision === point.revision)!
      const population = pub.census.find(row => row.tick === point.forQtr)!.population
      expect(point.publicErrorBand).toBeCloseTo(source.publicErrorBand / population, 10)
      expect(point.nationalErrorBand).toBeCloseTo(point.publicErrorBand + householdWealthBand(point), 10)
    }
    const point = structuredClone(pub.wealth[0])
    point.household = { deposits: 100, bonds: 0, productiveAssets: 0, bankEquity: 0, businessLoans: 100, overdrafts: 0, netWorth: 0 }
    point.errorBand = 0.1
    expect(householdWealthBand(point)).toBe(20)
  })
})


describe('country fuzzing independently checks the measured denominator', () => {
  it('retains a replayable failure when a worksheet uses the wrong census', () => {
    const outcome = runCountryFuzzCase(sampleCountry('recipe', 1, 'per-person-oracle'), {
      ticks: 8, policy: 'passive', checkState(state) {
        state.stats.record[state.stats.record.length - 1].population *= 2
        perPersonDiagnostics(state)
      },
    })
    expect(outcome.failure?.failure.message).toContain('worksheet census')
    expect(outcome.failure?.save.tick).toBeGreaterThan(0)
  })
})
