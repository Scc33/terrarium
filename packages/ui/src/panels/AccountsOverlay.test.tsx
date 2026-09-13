/**
 * Which lens the accounts room can open, and on what.
 *
 * Layout is proved in a real browser (jsdom has no layout engine); what a
 * static render CAN hold is that each lens is gated on ITS OWN data. The first
 * version of the state lens was not: the whole room returned early when
 * `readAccounts` was null, so the one reading that needs no expenditure survey
 * was hidden behind the funding of the two that do. Measured, a passive
 * Meridia never compiles those accounts in sixty years while its footprint is
 * on the desk from 1946 Q2 — which made the new lens unreachable for exactly
 * the government most in need of it.
 */

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { IndicatorSeries, PublishedState } from '@terrarium/observation'
import { AccountsOverlay } from './AccountsOverlay'

const shareSeries = (id: string, value: number): IndicatorSeries =>
  ({
    id,
    label: id,
    unit: '%',
    points: [0, 1, 2].map((forQtr) => ({ forQtr, publishedAt: forQtr + 1, value, revision: 0, errorBand: 1 })),
  }) as IndicatorSeries

/** the headline output estimate, which is published at zero capacity */
const gdpSeries = (): IndicatorSeries =>
  ({
    id: 'gdp_growth',
    label: 'gdp',
    unit: '%',
    points: [0, 1, 2].map((forQtr) => ({
      forQtr,
      publishedAt: forQtr + 1,
      value: 2,
      revision: 0,
      errorBand: 1,
      levels: { real: 100, nominal: 100 },
    })),
  })

const book = (tick: number) => ({
  tick,
  revenue: 12,
  outlays: 10,
  balance: 2,
  outlaysByProgramme: {
    transfers: 4,
    procurement: 3,
    investment: 1,
    research: 0.5,
    subsidies: 1,
    capacity: 0.5,
    interest: 0,
  },
})

const pubWith = (opts: { accounts: boolean; books: boolean; gdp?: boolean }): PublishedState =>
  ({
    tick: 3,
    books: opts.books ? [0, 1, 2].map(book) : [],
    indicators: {
      ...(opts.gdp === false ? {} : { gdp_growth: gdpSeries() }),
      ...(opts.accounts
        ? {
            consumption_share: shareSeries('consumption_share', 78),
            investment_share: shareSeries('investment_share', 4),
            export_share: shareSeries('export_share', 18),
          }
        : {}),
    },
  }) as unknown as PublishedState

const render = (pub: PublishedState) =>
  renderToStaticMarkup(<AccountsOverlay pub={pub} onClose={() => {}} />)

describe('AccountsOverlay', () => {
  it('opens the state lens on a country whose expenditure survey is unfunded', () => {
    const html = render(pubWith({ accounts: false, books: true }))
    // the reading is THERE, not behind a survey it never needed
    expect(html).toContain('THE STATE')
    expect(html).toContain('THE STATE’S FOOTPRINT, QUARTER BY QUARTER')
    // …and the unfunded survey is still named, so the player knows what to build
    expect(html).toContain('EXPENDITURE ACCOUNTS')
  })

  it('opens on the mix once the survey is funded, with the state beside it', () => {
    const html = render(pubWith({ accounts: true, books: true }))
    expect(html).toContain('THE MIX, QUARTER BY QUARTER')
    expect(html).toContain('THE STATE')
    // the state's own charts belong to its lens, not to the opening one
    expect(html).not.toContain('THE STATE’S FOOTPRINT, QUARTER BY QUARTER')
  })

  it('asks for the survey, and nothing else, when neither reading exists', () => {
    const html = render(pubWith({ accounts: false, books: false, gdp: false }))
    expect(html).toContain('THE OFFICE CANNOT YET COMPILE THE EXPENDITURE SIDE')
    expect(html).toContain('EXPENDITURE ACCOUNTS')
    // no lens to choose between, so no chooser and no half-built summary
    expect(html).not.toContain('THE STATE · % OF GDP')
  })

  it('does not offer the state lens before the office has priced a quarter', () => {
    // exact books, no published denominator: the ratio has no honest value, and
    // carrying one forward from a quarter that was never estimated is the thing
    // `stateFootprint` exists to refuse
    const html = render(pubWith({ accounts: true, books: true, gdp: false }))
    expect(html).toContain('THE MIX, QUARTER BY QUARTER')
    expect(html).not.toContain('THE STATE · % OF GDP')
  })
})
