import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { IndicatorSeries, PublishedState } from '@terrarium/observation'
import { CensusOverlay } from './CensusOverlay'

const series = (id: IndicatorSeries['id'], values: number[]): IndicatorSeries => ({
  id,
  label: id,
  unit: 'per 1000/yr',
  points: values.map((value, forQtr) => ({
    forQtr,
    publishedAt: forQtr + 1,
    value,
    revision: 0,
    errorBand: 1,
  })),
})

describe('CensusOverlay', () => {
  it('files published net migration beside births and deaths', () => {
    const migration = series('net_migration', [1, 2])
    migration.points.push({
      forQtr: 1,
      publishedAt: 4,
      value: -2,
      revision: 1,
      errorBand: 0.5,
    })
    const pub = {
      tick: 1,
      population: { total: 30.2, laborForce: 16.4, pyramid: Array(17).fill(30.2 / 17) },
      census: [
        { tick: 0, population: 30, pyramid: Array(17).fill(30 / 17) },
        { tick: 1, population: 30.2, pyramid: Array(17).fill(30.2 / 17) },
      ],
      indicators: {
        birth_rate: series('birth_rate', [30, 29]),
        death_rate: series('death_rate', [18, 17]),
        net_migration: migration,
      },
    } as unknown as PublishedState

    const html = renderToStaticMarkup(<CensusOverlay pub={pub} onClose={() => {}} />)

    expect(html).toContain('THE POPULATION FLOWS')
    expect(html).toContain('NET MIGRATION')
    expect(html).toContain('net migration -2.0 per thousand per year')
    expect(html).toContain('stroke-dasharray="3 2"')
  })
})
