/**
 * The industrial census's reading arithmetic (`ui/src/industry.ts`).
 *
 * Same reasoning as `accounts.test.ts`: what this module returns decides what
 * the pie claims the country IS, and every way it can be wrong draws a
 * perfectly convincing chart of a different economy. The failures worth
 * pinning are the ones that look right:
 *
 *  - reading a stale revision as the latest word (the office's correction
 *    silently never arrives on the page);
 *  - taking shares against the GDP headline rather than the census's own
 *    total, which imports one release's survey error into another's;
 *  - annualizing growth over two adjacent quarters of a noisy survey, which
 *    produces a table of numbers in the hundreds and looks like a boom.
 */

import { describe, expect, it } from 'vitest'
import { SECTOR_IDS, type PublishedState, type SectorId } from '@terrarium/observation'
import {
  GROWTH_MIN_QTRS,
  SECTOR_FACE,
  censusAvailability,
  industryGrowth,
  industryRows,
  readIndustry,
  toShares,
} from '../../packages/ui/src/industry'
import { INDUSTRY_CENSUS_FUNDED_AT } from '@terrarium/engine'
import { eachQuarter } from './harness'

type Print = PublishedState['industry'][number]

const vec = (values: readonly number[]): Record<SectorId, number> =>
  SECTOR_IDS.reduce<Record<SectorId, number>>(
    (acc, id, i) => ({ ...acc, [id]: values[i] }),
    {} as Record<SectorId, number>,
  )

function print(
  forQtr: number,
  valueAdded: readonly number[],
  employment: readonly number[],
  revision = 0,
  errorBand: Print['errorBand'] = { valueAdded: 0.06, employment: 0.04 },
): Print {
  return {
    forQtr,
    publishedAt: forQtr + 1,
    revision,
    errorBand,
    valueAdded: vec(valueAdded),
    employment: vec(employment),
  }
}

/** the smallest PublishedState this module actually touches */
function pubWith(
  industry: Print[],
  tick = 40,
  subsidies: Partial<Record<SectorId, number>> = {},
  desk: { statistical?: number; fullInstrumentation?: boolean } = {},
): PublishedState {
  return {
    tick,
    industry,
    dials: { subsidies },
    capacity: { statistical: desk.statistical ?? 0.6 },
    rules: { fullInstrumentation: desk.fullInstrumentation ?? false },
  } as unknown as PublishedState
}

const JOBS = [4, 2, 0.5, 3, 0.5]

describe('reading the industrial census', () => {
  it('names every industry exactly once, in draw order, each with its own ink', () => {
    expect(Object.keys(SECTOR_FACE).sort()).toEqual([...SECTOR_IDS].sort())
    const release = readIndustry(pubWith([print(0, [20, 15, 10, 30, 5], JOBS)]))!
    expect(release.valueAdded.map((r) => r.key)).toEqual([...SECTOR_IDS])
    // inks pinned to categories, or the century chart recolours itself
    expect(new Set(release.valueAdded.map((r) => r.ink)).size).toBe(SECTOR_IDS.length)
    expect(release.employment.map((r) => r.key)).toEqual([...SECTOR_IDS])
  })

  it('is nothing at all until the establishment survey has reported', () => {
    expect(readIndustry(pubWith([]))).toBeNull()
    expect(industryRows(pubWith([]), 'valueAdded')).toEqual([])
    expect(industryGrowth(pubWith([]), 'valueAdded')).toBeNull()
  })

  it('takes shares against the census’s own total, not a headline from another release', () => {
    // the five figures sum to 80, and a fifth of the economy is missing from
    // them because each was surveyed separately — the shares must still be a
    // hundred, or the pie under-reports every industry by the same amount
    const release = readIndustry(pubWith([print(0, [20, 16, 8, 32, 4], JOBS)]))!
    expect(release.totals.valueAdded).toBe(80)
    expect(release.valueAdded.map((r) => r.share)).toEqual([0.25, 0.2, 0.1, 0.4, 0.05])
    expect(release.valueAdded.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1, 12)
  })

  it('reads the office’s latest word on each quarter, not its first', () => {
    const revised = pubWith([
      print(0, [20, 15, 10, 30, 5], JOBS, 0),
      print(1, [10, 10, 10, 10, 10], JOBS, 0),
      // the correction to q1 lands after the q1 first print
      print(1, [40, 10, 10, 10, 10], JOBS, 2),
    ])
    const release = readIndustry(revised)!
    expect(release.forQtr).toBe(1)
    expect(release.revision).toBe(2)
    expect(release.valueAdded[0].value).toBe(40)
    // and the century chart uses the same settled figure
    const rows = industryRows(revised, 'valueAdded')
    expect(rows.map((r) => r.tick)).toEqual([0, 1])
    expect(rows[1].values.agri).toBe(40)
  })

  it('reports the drift in composition since the first census, in points', () => {
    const drifting = pubWith([
      print(0, [40, 10, 10, 30, 10], [5, 1, 0.5, 3, 0.5]),
      print(8, [20, 20, 10, 40, 10], [3, 3, 0.5, 3, 0.5]),
    ])
    const release = readIndustry(drifting)!
    // agriculture 40% → 20% of output, and 50% → 30% of the jobs
    expect(release.valueAdded[0].sinceFirst).toBeCloseTo(-20, 9)
    expect(release.employment[0].sinceFirst).toBeCloseTo(-20, 9)
    expect(release.valueAdded[1].sinceFirst).toBeCloseTo(10, 9)
  })

  it('keeps each table’s own band, because heads are counted better than output is estimated', () => {
    const release = readIndustry(
      pubWith([print(0, [20, 15, 10, 30, 5], JOBS, 0, { valueAdded: 0.09, employment: 0.05 })]),
    )!
    // one band for both would confess an error the jobs survey did not make
    expect(release.errorBand.valueAdded).toBe(0.09)
    expect(release.errorBand.employment).toBe(0.05)
  })

  it('carries the cabinet’s own subsidy dial beside the fogged figure', () => {
    const release = readIndustry(pubWith([print(0, [20, 15, 10, 30, 5], JOBS)], 40, { manuf: 3.5 }))!
    expect(release.valueAdded.find((r) => r.key === 'manuf')!.subsidy).toBe(3.5)
    // an unset subsidy is zero, not absent — `DialState.subsidies` is Partial
    expect(release.valueAdded.find((r) => r.key === 'agri')!.subsidy).toBe(0)
  })

  it('says how stale the release is, because the office always answers late', () => {
    const release = readIndustry(pubWith([print(30, [20, 15, 10, 30, 5], JOBS)], 36))!
    expect(release.lag).toBe(6)
  })
})

describe('whether the census exists at all', () => {
  const empty = (desk: { statistical?: number; fullInstrumentation?: boolean }) =>
    censusAvailability(pubWith([], 40, {}, desk))

  it('is unfunded only when the office genuinely cannot run it', () => {
    expect(empty({ statistical: INDUSTRY_CENSUS_FUNDED_AT - 0.01 })).toBe('unfunded')
  })

  it('is AWAITING once it is paid for, before the first return lands', () => {
    // the office reports a quarter or two behind, so a funded census is empty
    // for its first quarters — and telling the player to fund it again there
    // is the ADR-0020 miss this function exists to prevent
    expect(empty({ statistical: INDUSTRY_CENSUS_FUNDED_AT })).toBe('awaiting')
    expect(empty({ statistical: 0.9 })).toBe('awaiting')
  })

  it('is AWAITING under the fitted-instrument rule at any capacity', () => {
    expect(empty({ statistical: 0, fullInstrumentation: true })).toBe('awaiting')
  })

  it('is reporting the moment a release exists, however poor the office became', () => {
    const decayed = pubWith([print(0, [20, 15, 10, 30, 5], JOBS)], 40, {}, { statistical: 0.05 })
    expect(censusAvailability(decayed)).toBe('reporting')
  })
})

describe('growth by industry', () => {
  it('refuses to annualize a span too short to mean anything', () => {
    const short = pubWith([
      print(0, [20, 15, 10, 30, 5], JOBS),
      print(GROWTH_MIN_QTRS - 1, [21, 15, 10, 30, 5], JOBS),
    ])
    expect(industryGrowth(short, 'valueAdded')).toBeNull()
  })

  it('is a compound annual rate over the whole surveyed span', () => {
    // four years, agriculture flat, manufacturing doubled
    const grown = pubWith([
      print(0, [20, 10, 10, 30, 5], JOBS),
      print(16, [20, 20, 10, 30, 5], JOBS),
    ])
    const growth = industryGrowth(grown, 'valueAdded')!
    expect(growth.agri).toBeCloseTo(0, 9)
    expect(growth.manuf).toBeCloseTo(100 * (Math.pow(2, 1 / 4) - 1), 9)
  })

  it('an industry can grow while its share falls — which is the whole point', () => {
    const grown = pubWith([
      print(0, [20, 10, 10, 30, 5], JOBS),
      print(16, [22, 40, 10, 30, 5], JOBS),
    ])
    const release = readIndustry(grown)!
    const growth = industryGrowth(grown, 'valueAdded')!
    expect(growth.agri).toBeGreaterThan(0)
    expect(release.valueAdded[0].sinceFirst).toBeLessThan(0)
  })

  it('does not divide by an industry that was never there', () => {
    const fromNothing = pubWith([
      print(0, [20, 0, 10, 30, 5], JOBS),
      print(16, [20, 5, 10, 30, 5], JOBS),
    ])
    const growth = industryGrowth(fromNothing, 'valueAdded')!
    expect(Number.isFinite(growth.manuf)).toBe(true)
  })
})

describe('what the donut is handed', () => {
  it('passes value, label, ink and note straight through', () => {
    const release = readIndustry(pubWith([print(0, [20, 15, 10, 30, 5], JOBS)]))!
    const shares = toShares(release.valueAdded)
    expect(shares.map((s) => s.value)).toEqual([20, 15, 10, 30, 5])
    expect(shares.every((s) => (s.note?.length ?? 0) > 0)).toBe(true)
    expect(shares.map((s) => s.key)).toEqual([...SECTOR_IDS])
  })
})

describe('against a surveyed century', () => {
  it('compiles a complete, ordered mix once the establishment survey is built', () => {
    let last: PublishedState | null = null
    eachQuarter('industry-overlay', 160, (pub) => {
      last = pub
    })
    const pub = last!
    const release = readIndustry(pub)
    expect(release, 'a fully surveyed century published no industrial census').not.toBeNull()

    const rows = industryRows(pub, 'valueAdded')
    expect(rows.length).toBeGreaterThan(50)
    for (let i = 1; i < rows.length; i++) expect(rows[i].tick).toBeGreaterThan(rows[i - 1].tick)
    for (const row of rows) {
      for (const id of SECTOR_IDS) {
        expect(Number.isFinite(row.values[id])).toBe(true)
        // a negative band punches a hole through every band above it, and a
        // negative wedge is dropped from the pie entirely
        expect(row.values[id]).toBeGreaterThanOrEqual(0)
      }
    }
    // the shares are a composition: they add to one, in both tables
    for (const lens of ['valueAdded', 'employment'] as const) {
      expect(release![lens].reduce((s, r) => s + r.share, 0)).toBeCloseTo(1, 9)
    }
    // and the dual economy is on the page: agriculture holds a bigger share
    // of the people than of the output for the whole of this century
    const agriOutput = release!.valueAdded.find((r) => r.key === 'agri')!.share
    const agriJobs = release!.employment.find((r) => r.key === 'agri')!.share
    expect(agriJobs).toBeGreaterThan(agriOutput)

    const growth = industryGrowth(pub, 'valueAdded')
    expect(growth, 'a 160-quarter census produced no growth column').not.toBeNull()
    for (const id of SECTOR_IDS) expect(Number.isFinite(growth![id])).toBe(true)
  })
})
