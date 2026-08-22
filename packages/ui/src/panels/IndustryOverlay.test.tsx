/**
 * The two branches of the industry office, and the sentence each one has to
 * say. Layout is proved in a real browser (jsdom has no layout engine); what a
 * static render CAN hold is that the page reaches the right state and names
 * the institution the player has to fund to leave it.
 */

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SECTOR_IDS, type PublishedState, type SectorId } from '@terrarium/observation'
import { IndustryOverlay } from './IndustryOverlay'

const vec = (values: readonly number[]): Record<SectorId, number> =>
  SECTOR_IDS.reduce<Record<SectorId, number>>(
    (acc, id, i) => ({ ...acc, [id]: values[i] }),
    {} as Record<SectorId, number>,
  )

const pubWith = (
  industry: PublishedState['industry'],
  statistical: number,
  fullInstrumentation = false,
): PublishedState =>
  ({
    tick: 12,
    industry,
    capacity: { statistical },
    rules: { fullInstrumentation },
    dials: { subsidies: { manuf: 4 } },
  }) as unknown as PublishedState

const release = (forQtr: number, valueAdded: readonly number[], employment: readonly number[]) => ({
  forQtr,
  publishedAt: forQtr + 1,
  revision: 0,
  errorBand: { valueAdded: 0.07, employment: 0.05 },
  valueAdded: vec(valueAdded),
  employment: vec(employment),
})

describe('IndustryOverlay', () => {
  it('names the office to fund, and how far away it is, when nothing has been counted', () => {
    const html = renderToStaticMarkup(<IndustryOverlay pub={pubWith([], 0.14)} onClose={() => {}} />)
    expect(html).toContain('CENSUS OF INDUSTRY')
    // the rack strip's own promise, in the overlay's words: from here, to there
    expect(html).toContain('14')
    expect(html).toContain('30')
    expect(html).not.toContain('THE INDUSTRIES')
  })

  it('does not ask a player to fund a census they already paid for', () => {
    // ADR-0020's miss: the office reports a quarter or two behind, so a funded
    // census is empty for its first quarters, and a page that spends them
    // telling the player to raise capacity is worse than no page
    for (const pub of [pubWith([], 0.4), pubWith([], 0, true)]) {
      const html = renderToStaticMarkup(<IndustryOverlay pub={pub} onClose={() => {}} />)
      expect(html).toContain('THE ENUMERATORS ARE IN THE FIELD')
      expect(html).not.toContain('REQUIRES')
      expect(html).not.toContain('Raise the statistics office')
    }
  })

  it('files both tables of a release, with the cabinet’s exact subsidy beside them', () => {
    const pub = pubWith(
      [
        release(0, [40, 10, 10, 30, 10], [5, 1, 0.5, 3, 0.5]),
        release(10, [20, 20, 10, 40, 10], [3, 3, 0.5, 3, 0.5]),
      ],
      0.6,
    )
    const html = renderToStaticMarkup(<IndustryOverlay pub={pub} onClose={() => {}} />)

    expect(html).toContain('THE INDUSTRIES')
    for (const label of ['Agriculture', 'Manufacturing', 'Energy', 'Services', 'Transport']) {
      expect(html).toContain(label)
    }
    // agriculture: a fifth of the output and nearly a third of the jobs
    expect(html).toContain('20.0%')
    expect(html).toContain('30.0%')
    // it lost twenty points of output share since the first census
    expect(html).toContain('-20.0 pts')
    // the subsidy is the government's own dial, so it prints exactly
    expect(html).toContain('4.0')
    // and the office's band is a number once it can estimate one — the OUTPUT
    // table's band on the output lens, never the jobs survey's
    expect(html).toContain('±7.0%')
    expect(html).not.toContain('±5.0%')
  })

  it('prints a shrug, not a zero, when the office cannot estimate its own error', () => {
    const pub = pubWith(
      [
        {
          ...release(4, [20, 20, 10, 40, 10], [3, 3, 0.5, 3, 0.5]),
          errorBand: { valueAdded: 0, employment: 0 },
        },
      ],
      0.35,
    )
    const html = renderToStaticMarkup(<IndustryOverlay pub={pub} onClose={() => {}} />)
    expect(html).toContain('±?')
    expect(html).not.toContain('±0.0%')
  })

  it('counts the lag in quarters, and says “quarter” when there is one', () => {
    const one = pubWith([release(11, [20, 20, 10, 40, 10], [3, 3, 0.5, 3, 0.5])], 0.6)
    expect(renderToStaticMarkup(<IndustryOverlay pub={one} onClose={() => {}} />)).toContain(
      '1 QUARTER AGO',
    )
    const many = pubWith([release(8, [20, 20, 10, 40, 10], [3, 3, 0.5, 3, 0.5])], 0.6)
    expect(renderToStaticMarkup(<IndustryOverlay pub={many} onClose={() => {}} />)).toContain(
      '4 QUARTERS AGO',
    )
  })
})
