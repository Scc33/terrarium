/**
 * The size of the state (`ui/src/stateFootprint.ts`).
 *
 * This is the one reading on the desk with an EXACT numerator and a FOGGED
 * denominator, and every way it can go wrong produces a number that looks
 * perfectly ordinary: a quarter carried forward makes the treasury appear to
 * move on a quarter it did not; a missing estimate defaulted to zero makes a
 * state that spends nothing; an early revision preferred to a later one prints
 * a figure the cabinet's own GDP-share rules disagree with. So the joins are
 * pinned here rather than trusted to the panel.
 */

import { describe, expect, it } from 'vitest'
import type { IndicatorSeries, PublishedState } from '@terrarium/observation'
import { footprintSeries, programmeRows, stateFootprint } from '../../packages/ui/src/stateFootprint'
import { OUTLAY_CHART_IDS } from '../../packages/ui/src/budgetChart'
import { latestOfficialNominalGdp } from '../../packages/ui/src/spendingRules'
import { eachQuarter } from './harness'

type Book = {
  tick: number
  revenue: number
  outlays: number
  balance: number
  outlaysByProgramme: Record<string, number>
}

/** the smallest PublishedState this module actually touches */
function pubWith(
  books: Book[],
  levels: Array<{ forQtr: number; nominal: number; revision?: number }>,
  tick = 4,
): PublishedState {
  const gdp: IndicatorSeries = {
    id: 'gdp_growth',
    label: 'gdp',
    unit: '%',
    points: levels.map((l) => ({
      forQtr: l.forQtr,
      publishedAt: l.forQtr + 1,
      value: 2,
      revision: l.revision ?? 0,
      errorBand: 1,
      levels: { real: l.nominal, nominal: l.nominal },
    })),
  } as IndicatorSeries
  return { tick, books, indicators: { gdp_growth: gdp } } as unknown as PublishedState
}

/** every book entry the module reads, with the whole outlay spent on
 * transfers so the programme split is checkable by eye */
const book = (tick: number, revenue: number, outlays: number): Book => ({
  tick,
  revenue,
  outlays,
  balance: revenue - outlays,
  outlaysByProgramme: {
    transfers: outlays,
    procurement: 0,
    investment: 0,
    research: 0,
    subsidies: 0,
    capacity: 0,
    interest: 0,
  },
})

describe('the state’s footprint', () => {
  it('divides the exact books by the office’s estimate for the same quarter', () => {
    const f = stateFootprint(pubWith([book(0, 20, 25)], [{ forQtr: 0, nominal: 200 }]))!
    expect(f.latest).toMatchObject({ tick: 0, revenue: 10, outlays: 12.5, balance: -2.5 })
    // the programmes are the same books through the same denominator, so the
    // stack's height has to be the state's whole footprint and not a second,
    // differently scaled reading of it
    expect(f.latest.byProgramme.transfers).toBeCloseTo(12.5, 10)
    expect(programmeRows(f.points)[0]).toEqual({ tick: 0, values: f.latest.byProgramme })
  })

  it('drops a quarter the office has not priced rather than carrying the last one forward', () => {
    // the level lags the books by a quarter, which is the ordinary case: the
    // reading is stated as of the quarter it can be taken, and `lag` says so
    const f = stateFootprint(
      pubWith([book(0, 20, 20), book(1, 22, 20), book(2, 24, 20)], [{ forQtr: 0, nominal: 200 }, { forQtr: 1, nominal: 220 }], 2),
    )!
    expect(f.points.map((p) => p.tick)).toEqual([0, 1])
    expect(f.latest.tick).toBe(1)
    expect(f.lag).toBe(1)
    expect(f.latest.revenue).toBeCloseTo(10, 10)
  })

  it('is null when no quarter has both a book and an estimate', () => {
    expect(stateFootprint(pubWith([book(0, 20, 20)], []))).toBeNull()
    expect(stateFootprint(pubWith([], [{ forQtr: 0, nominal: 200 }]))).toBeNull()
    // an office that cannot estimate the level is not an economy of size zero
    expect(stateFootprint(pubWith([book(0, 20, 20)], [{ forQtr: 0, nominal: 0 }]))).toBeNull()
  })

  it('reads the latest revision of the estimate, whichever order the prints arrive in', () => {
    const revised = pubWith([book(0, 20, 20)], [
      { forQtr: 0, nominal: 200, revision: 0 },
      { forQtr: 0, nominal: 250, revision: 1 },
    ])
    expect(stateFootprint(revised)!.latest.revenue).toBeCloseTo(8, 10)
    // …and it is the same denominator a GDP-share appropriation resolves
    // against, because both go through `officialNominalGdpByQuarter`
    expect(latestOfficialNominalGdp(revised)).toEqual({ value: 250, forQtr: 0 })
  })

  it('hands the chart one point per priced quarter, in order', () => {
    const f = stateFootprint(
      pubWith([book(1, 11, 10), book(0, 20, 20)], [{ forQtr: 0, nominal: 200 }, { forQtr: 1, nominal: 100 }], 1),
    )!
    expect(footprintSeries(f.points, (p) => p.outlays)).toEqual([
      { tick: 0, value: 10 },
      { tick: 1, value: 10 },
    ])
  })
})

describe('against a surveyed century', () => {
  it('prices the whole century and stays within a quarter or two of today', () => {
    let last: PublishedState | null = null
    eachQuarter('state-footprint', 160, (pub) => {
      last = pub
    })
    const pub = last!
    const f = stateFootprint(pub)
    expect(f, 'a surveyed century could not price its own state').not.toBeNull()

    // the publication lag is the only reason this is not today's figure; a
    // reading that fell further behind would be quoting a different decade
    expect(f!.lag).toBeGreaterThanOrEqual(0)
    expect(f!.lag).toBeLessThanOrEqual(3)
    expect(f!.points.length).toBeGreaterThan(150)

    for (let i = 1; i < f!.points.length; i++) {
      expect(f!.points[i].tick).toBeGreaterThan(f!.points[i - 1].tick)
    }
    for (const p of f!.points) {
      for (const v of [p.revenue, p.outlays, p.balance]) expect(Number.isFinite(v)).toBe(true)
      expect(p.revenue).toBeGreaterThanOrEqual(0)
      expect(p.outlays).toBeGreaterThanOrEqual(0)
      // the identity the treasury's own books satisfy survives the division
      expect(p.balance).toBeCloseTo(p.revenue - p.outlays, 8)
      // a state whose books read as a multiple of the whole economy is a
      // denominator bug, not a government
      expect(p.outlays).toBeLessThan(100)
      // the stack is the same money as the line above it
      const banded = OUTLAY_CHART_IDS.reduce((sum, id) => sum + p.byProgramme[id], 0)
      expect(banded).toBeCloseTo(p.outlays, 8)
    }
  })
})
