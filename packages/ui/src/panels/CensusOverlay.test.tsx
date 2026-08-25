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

/** The register houses the under-60s — 12 of the 17 bands — so a fixture's
 * split is struck on a base smaller than its head count, the same relation
 * the engine files. */
const residence = (population: number, urban = 0.4) => {
  const classified = (population * 12) / 17
  return { rural: classified * (1 - urban), urban: classified * urban }
}

/** a census one entry per quarter, exact by construction */
const census = (populations: readonly number[], urban = 0.4) =>
  populations.map((population, tick) => ({
    tick,
    population,
    pyramid: Array(17).fill(population / 17) as number[],
    residence: residence(population, urban),
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
      population: { total: 30.2, laborForce: 16.4, pyramid: Array(17).fill(30.2 / 17), residence: residence(30.2) },
      census: census([30, 30.2]),
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
      population: { total: 33, laborForce: 18, pyramid: Array(17).fill(33 / 17), residence: residence(33) },
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
      population: { total: 30.2, laborForce: 16.4, pyramid: Array(17).fill(30.2 / 17), residence: residence(30.2) },
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
      population: { total: 32, laborForce: 17, pyramid: Array(17).fill(32 / 17), residence: residence(32) },
      census: census([30, 30.5, 31, 31.5, 32]),
      indicators: {},
    } as unknown as PublishedState

    const html = renderToStaticMarkup(<CensusOverlay pub={pub} onClose={() => {}} />)

    expect(html).toContain('+6.67')
    expect(html).toContain('GROWTH: ONE READING SO FAR')
    expect(html).not.toContain('GROWTH NEEDS A YEAR OF RECORD')
  })

  it('reads the rural/urban split against the population the register houses', () => {
    // The fixture is 40 % urban among the under-60s, who are 12 of the 17
    // bands. A share taken against the head count instead would print 28 %
    // here — lower, entirely plausible, and wrong by the pensioner share in
    // every country and every quarter.
    const pub = {
      tick: 4,
      population: { total: 32, laborForce: 17, pyramid: Array(17).fill(32 / 17), residence: residence(32, 0.4) },
      census: census([30, 30.5, 31, 31.5, 32], 0.4),
      indicators: {},
    } as unknown as PublishedState

    const html = renderToStaticMarkup(<CensusOverlay pub={pub} onClose={() => {}} />)

    expect(html).toContain('WHERE THEY LIVE')
    expect(html).toContain('40% URBAN')
    expect(html).not.toContain('28% URBAN')
    // and the reading says which population it is a share OF, so the number
    // cannot be read against the head count printed beside it
    expect(html).toContain('as shares of the population under 60')
  })

  it('reads the split off the live desk before the register has a single row', () => {
    // At tick zero `pub.census` is empty — the office files its first row at
    // the end of the quarter — so every reading falls back to the live desk.
    // `pub.population` carries the split on the same base for exactly this,
    // and without it the page throws on its own opening frame.
    const pub = {
      tick: 0,
      population: { total: 27.5, laborForce: 12.8, pyramid: Array(17).fill(27.5 / 17), residence: residence(27.5, 0.51) },
      census: [],
      indicators: {},
    } as unknown as PublishedState

    const html = renderToStaticMarkup(<CensusOverlay pub={pub} onClose={() => {}} />)

    expect(html).toContain('51% URBAN')
    // one quarter is not a century: the band is absent rather than drawn flat
    expect(html).not.toContain('WHERE THEY LIVE')
    expect(html).toContain('THE RECORD IS ONE QUARTER OLD')
  })

  it('marks a shrinking population rather than printing a bare number', () => {
    const pub = {
      tick: 4,
      population: { total: 28, laborForce: 15, pyramid: Array(17).fill(28 / 17), residence: residence(28) },
      census: census([30, 29.5, 29, 28.5, 28]),
      indicators: {},
    } as unknown as PublishedState

    const html = renderToStaticMarkup(<CensusOverlay pub={pub} onClose={() => {}} />)

    // the typographic minus the rest of the game's signed readouts use
    expect(html).toContain('\u22126.67')
    expect(html).toContain('text-dossier-warn')
  })
})
