import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  INCOME_QUINTILE_IDS,
  type IncomeQuintileId,
  type PublishedState,
} from '@terrarium/observation'
import { HouseholdOverlay } from './HouseholdOverlay'

const vec = (values: readonly number[]): Record<IncomeQuintileId, number> =>
  INCOME_QUINTILE_IDS.reduce<Record<IncomeQuintileId, number>>((record, id, index) => {
    record[id] = values[index]
    return record
  }, {} as Record<IncomeQuintileId, number>)

const release = (forQtr: number): PublishedState['households'][number] => ({
  forQtr,
  publishedAt: forQtr + 1,
  revision: 0,
  incomeErrorBand: 0.06,
  povertyGapErrorBand: 0.012,
  incomeReal: vec([45 + forQtr, 70 + forQtr, 95 + forQtr, 130 + forQtr, 230 + forQtr]),
  incomeShare: vec([0.08, 0.13, 0.18, 0.24, 0.37]),
  povertyGap: 0.084,
  povertyLine: 72,
})

const indicator = (id: 'poverty_rate' | 'gini' | 'income_real', value: number) => ({
  id,
  label: id,
  unit: id === 'poverty_rate' ? '%' : 'idx',
  points: [{ forQtr: 8, publishedAt: 9, revision: 0, value, errorBand: 1 }],
})

function pubWith(households: PublishedState['households'], statistical: number, fitted = false): PublishedState {
  return {
    tick: 12,
    households,
    capacity: { statistical },
    rules: { fullInstrumentation: fitted },
    indicators: {
      poverty_rate: indicator('poverty_rate', 18.4),
      gini: indicator('gini', 41.2),
      income_real: indicator('income_real', 112),
    },
  } as unknown as PublishedState
}

describe('HouseholdOverlay', () => {
  it('names the office and funding distance when the survey does not exist', () => {
    const html = renderToStaticMarkup(<HouseholdOverlay pub={pubWith([], 0.14)} onClose={() => {}} />)
    expect(html).toContain('HOUSEHOLD SURVEY')
    expect(html).toContain('14')
    expect(html).toContain('55')
    expect(html).not.toContain('THE FIVE FIFTHS')
  })

  it('does not ask for more funding while a commissioned survey is in the field', () => {
    for (const pub of [pubWith([], 0.6), pubWith([], 0, true)]) {
      const html = renderToStaticMarkup(<HouseholdOverlay pub={pub} onClose={() => {}} />)
      expect(html).toContain('THE HOUSEHOLD BOOKS ARE BEING COLLECTED')
      expect(html).not.toContain('REQUIRES')
      expect(html).not.toContain('Raise the statistics office')
    }
  })

  it('shows the quick poverty reading, five income paths and the continuous gap', () => {
    const html = renderToStaticMarkup(
      <HouseholdOverlay pub={pubWith([release(0), release(8)], 0.7)} onClose={() => {}} />,
    )
    expect(html).toContain('18.4%')
    expect(html).toContain('8.4%')
    expect(html).toContain('POVERTY LINE')
    expect(html).toContain('THE FIVE FIFTHS')
    for (const label of ['Lowest fifth', 'Second fifth', 'Middle fifth', 'Fourth fifth', 'Highest fifth']) {
      expect(html).toContain(label)
    }
    expect(html).toContain('±6.0%')
    expect(html).toContain('4 QUARTERS AGO')
  })
})
