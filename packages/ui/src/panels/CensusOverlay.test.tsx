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

/** a census one entry per quarter, exact by construction */
const census = (populations: readonly number[]) =>
  populations.map((population, tick) => ({
    tick,
    population,
    pyramid: Array(17).fill(population / 17) as number[],
  }))

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

  it('publishes the growth rate with no civil registration funded', () => {
    // The claim the overlay is built on: a state that cannot afford a
    // registrar can still say how fast its population is growing, because the
    // count is exact and the rate is arithmetic on the count. If this ever
    // starts depending on the indicators, the growth reading has quietly
    // become a surveyed number.
    const pub = {
      tick: 5,
      population: { total: 33, laborForce: 18, pyramid: Array(17).fill(33 / 17) },
      census: census([30, 30.5, 31, 31.5, 32, 33]),
      indicators: {},
    } as unknown as PublishedState

    const html = renderToStaticMarkup(<CensusOverlay pub={pub} onClose={() => {}} />)

    expect(html).toContain('NO REGISTER KEPT')
    // the latest reading is 1947Q2 against 1946Q2: 33 / 30.5 − 1 = +8.20 %/yr
    expect(html).toContain('+8.20')
    expect(html).toContain('Exact year-on-year growth of that count')
  })

  it('says a year is missing rather than drawing a growth rate it cannot measure', () => {
    const pub = {
      tick: 1,
      population: { total: 30.2, laborForce: 16.4, pyramid: Array(17).fill(30.2 / 17) },
      census: census([30, 30.2]),
      indicators: {},
    } as unknown as PublishedState

    const html = renderToStaticMarkup(<CensusOverlay pub={pub} onClose={() => {}} />)

    expect(html).toContain('GROWTH NEEDS A YEAR OF RECORD')
    expect(html).not.toContain('%/YR')
  })

  it('does not tell the reader a year is missing beside a rate it just printed', () => {
    // exactly five quarters: one growth reading exists, but a LINE needs two.
    // The plot cannot draw, and the reason it gives has to be the real one —
    // "needs a year of record" here would contradict the +6.67% in the caption.
    const pub = {
      tick: 4,
      population: { total: 32, laborForce: 17, pyramid: Array(17).fill(32 / 17) },
      census: census([30, 30.5, 31, 31.5, 32]),
      indicators: {},
    } as unknown as PublishedState

    const html = renderToStaticMarkup(<CensusOverlay pub={pub} onClose={() => {}} />)

    expect(html).toContain('+6.67')
    expect(html).toContain('GROWTH: ONE READING SO FAR')
    expect(html).not.toContain('GROWTH NEEDS A YEAR OF RECORD')
  })

  it('marks a shrinking population rather than printing a bare number', () => {
    const pub = {
      tick: 4,
      population: { total: 28, laborForce: 15, pyramid: Array(17).fill(28 / 17) },
      census: census([30, 29.5, 29, 28.5, 28]),
      indicators: {},
    } as unknown as PublishedState

    const html = renderToStaticMarkup(<CensusOverlay pub={pub} onClose={() => {}} />)

    // the typographic minus the rest of the game's signed readouts use
    expect(html).toContain('\u22126.67')
    expect(html).toContain('text-dossier-warn')
  })
})
