/**
 * The industrial census (schema v31) — GDP read down the PRODUCTION side.
 *
 * Two claims are load-bearing and neither is visible in a screenshot:
 *
 *  1. **The worksheet is an identity, not an estimate.** Value added by
 *     industry sums to `flows.realGdp` exactly, because it is the same
 *     arithmetic `production` runs for the headline. If that ever stops
 *     holding, the overlay draws a pie of an economy this engine is not
 *     simulating, and it will look entirely plausible.
 *  2. **The release is fogged.** It is gated on the establishment survey,
 *     lagged, noised per industry, and revised — so no figure the UI can reach
 *     is ever the truth. A census that quietly published exact numbers would
 *     be the truth inspector with extra steps, and the fog is what the whole
 *     capacity mechanic is made of (§3.4, §6.1).
 *
 * The third claim — that the mix actually MOVES over a century — is what makes
 * the view worth building at all. A composition that never changes is a pie
 * chart of a constant.
 */

import { describe, expect, it } from 'vitest'
import {
  INDUSTRY_CENSUS_FUNDED_AT,
  SECTOR_IDS,
  init,
  sectorValueAdded,
  step,
  type SectorId,
  type TrueState,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

const withStats = (statistical: number) => ({
  ...standardCountry,
  capacities: { ...standardCountry.capacities, statistical },
})

function play(seed: string, ticks: number, statistical: number): TrueState {
  let s = init(withStats(statistical), seed)
  for (let t = 0; t < ticks; t++) s = step(s)
  return s
}

const sum = (r: Record<SectorId, number>) => SECTOR_IDS.reduce((a, id) => a + r[id], 0)

describe('the industrial census worksheet', () => {
  it('is the same GDP: value added by industry sums to real GDP, quarter by quarter', () => {
    const s = play('census-identity', 30, 1)
    expect(s.stats.record.length).toBeGreaterThan(20)
    for (const record of s.stats.record) {
      const total = SECTOR_IDS.reduce((a, id) => a + record.industry[id].valueAdded, 0)
      // relative, because a century of growth makes an absolute tolerance
      // meaningless at one end or the other of it
      expect(total / record.realGdp).toBeCloseTo(1, 9)
    }
  })

  it('reads base prices, not current ones — a price move alone cannot shift the mix', () => {
    const s = play('census-volumes', 20, 1)
    const before = sectorValueAdded(s)
    const doubled: TrueState = {
      ...s,
      market: {
        ...s.market,
        prices: SECTOR_IDS.reduce(
          (acc, id) => ({ ...acc, [id]: s.market.prices[id] * (id === 'energy' ? 4 : 1) }),
          {} as Record<SectorId, number>,
        ),
      },
    }
    // quadrupling the price of energy changes what energy is WORTH, not how
    // much of it was made. A nominal split would report an energy boom here.
    expect(sectorValueAdded(doubled)).toEqual(before)
  })

  it('counts every employed person once: the census sums to the workforce, payrolls is it ex-agriculture', () => {
    const s = play('census-heads', 24, 1)
    const record = s.stats.record[s.stats.record.length - 1]
    const employed = s.sectors.reduce((a, sector) => a + sector.employment, 0)
    expect(SECTOR_IDS.reduce((a, id) => a + record.industry[id].employment, 0)).toBeCloseTo(
      employed,
      9,
    )
    expect(record.payrolls).toBeCloseTo(employed - record.industry.agri.employment, 9)
  })
})

describe('the industrial census is a survey, not a window', () => {
  it('does not exist until the establishment survey is funded', () => {
    const poor = observe(play('census-poor', 24, INDUSTRY_CENSUS_FUNDED_AT - 0.05))
    expect(poor.industry).toEqual([])
    const funded = observe(play('census-funded', 24, INDUSTRY_CENSUS_FUNDED_AT + 0.15))
    expect(funded.industry.length).toBeGreaterThan(0)
  })

  it('the sandbox rule hands over the instrument, not the truth', () => {
    // `fullInstrumentation` lifts the funding gate and nothing else: the
    // census still lags, still wobbles, still revises (ADR-0020).
    let s = init(withStats(0.05), 'census-fitted', { fullInstrumentation: true })
    for (let t = 0; t < 24; t++) s = step(s)
    const pub = observe(s)
    expect(pub.industry.length).toBeGreaterThan(0)
    for (const print of pub.industry) {
      expect(print.publishedAt).toBeGreaterThan(print.forQtr)
      const truth = s.stats.record[print.forQtr].industry
      const exact = SECTOR_IDS.every((id) => print.valueAdded[id] === truth[id].valueAdded)
      expect(exact, 'an unfunded office published the truth exactly').toBe(false)
    }
  })

  it('never publishes a figure equal to the truth, and never a negative industry', () => {
    const s = play('census-fog', 40, 1) // the sharpest office the game has
    const pub = observe(s)
    expect(pub.industry.length).toBeGreaterThan(0)
    for (const print of pub.industry) {
      const truth = s.stats.record[print.forQtr].industry
      for (const id of SECTOR_IDS) {
        expect(print.valueAdded[id]).not.toBe(truth[id].valueAdded)
        expect(print.valueAdded[id]).toBeGreaterThanOrEqual(0)
        expect(print.employment[id]).toBeGreaterThanOrEqual(0)
        expect(Number.isFinite(print.valueAdded[id])).toBe(true)
        expect(Number.isFinite(print.employment[id])).toBe(true)
      }
    }
  })

  it('runs on the office’s own clock: the same lags, the same three revisions', () => {
    const s = play('census-clock', 30, 1)
    const pub = observe(s)
    const revisions = new Map<number, number[]>()
    for (const print of pub.industry) {
      expect(print.publishedAt - print.forQtr).toBeGreaterThanOrEqual(1)
      revisions.set(print.forQtr, [...(revisions.get(print.forQtr) ?? []), print.revision])
    }
    // an early quarter has had time for all three releases; each is sharper
    // than the one before it
    const settled = [...revisions.entries()].find(([, rs]) => rs.length === 3)
    expect(settled, 'no quarter reached its final revision').toBeDefined()
    const [forQtr] = settled!
    const truth = s.stats.record[forQtr].industry
    const errorAt = (revision: number) => {
      const print = pub.industry.find((p) => p.forQtr === forQtr && p.revision === revision)!
      return SECTOR_IDS.reduce(
        (a, id) => a + Math.abs(print.valueAdded[id] - truth[id].valueAdded),
        0,
      )
    }
    expect(errorAt(2)).toBeLessThan(errorAt(0))
  })

  it('a better office is a sharper census, and confesses a band once it can estimate one', () => {
    // one seed: the obs:* draws are keyed by (quarter, revision), so the same
    // standard normals are drawn at both capacities and only the scale differs
    const errorOf = (capacity: number) => {
      const s = play('census-sharpness', 30, capacity)
      const pub = observe(s)
      let error = 0
      let n = 0
      for (const print of pub.industry) {
        if (print.revision !== 0) continue
        const truth = s.stats.record[print.forQtr].industry
        for (const id of SECTOR_IDS) {
          error += Math.abs(print.valueAdded[id] / truth[id].valueAdded - 1)
          n++
        }
      }
      return { error: error / n, bands: pub.industry.map((p) => p.errorBand) }
    }
    const poor = errorOf(0.35)
    const rich = errorOf(1)
    expect(rich.error).toBeLessThan(poor.error)
    // below 0.45 the office cannot even estimate its own error, and says so
    // with a zero — which the UI prints as a shrug, never as certainty
    expect(poor.bands.every((b) => b === 0)).toBe(true)
    expect(rich.bands.every((b) => b > 0)).toBe(true)
  })
})

describe('the mix is worth looking at', () => {
  it('a century of ordinary growth visibly moves people out of the fields', () => {
    const s = play('census-transition', 400, 1)
    const first = s.stats.record[0].industry
    const last = s.stats.record[s.stats.record.length - 1].industry
    const share = (r: typeof first, id: SectorId, read: 'valueAdded' | 'employment') =>
      r[id][read] /
      SECTOR_IDS.reduce((a, other) => a + r[other][read], 0)

    // structural transformation: agriculture's claim on both output and
    // people falls, and the employment share falls further than output's —
    // which is the dual economy this engine keeps insisting on
    expect(share(last, 'agri', 'employment')).toBeLessThan(share(first, 'agri', 'employment') - 0.05)
    expect(share(last, 'agri', 'valueAdded')).toBeLessThan(share(first, 'agri', 'valueAdded'))
    expect(share(last, 'manuf', 'employment')).toBeGreaterThan(share(first, 'manuf', 'employment'))
    // and every industry stays a real industry throughout
    for (const record of s.stats.record) {
      for (const id of SECTOR_IDS) expect(record.industry[id].valueAdded).toBeGreaterThan(0)
    }
    expect(sum(sectorValueAdded(s))).toBeCloseTo(s.flows.realGdp, 9)
  })
})
