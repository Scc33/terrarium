/**
 * The census overlay's exact arithmetic (`ui/src/census.ts`).
 *
 * These figures carry no error band, which is exactly why they need pinning:
 * a fogged series that comes out wrong is at least drawn with the office's
 * confessed uncertainty around it, but a growth rate measured over the wrong
 * span prints as a clean, confident, plausible number and nothing on the page
 * contradicts it.
 *
 * The failures worth catching are the ones that still look right:
 *
 *  - measuring growth over a quarter and calling it a year, or annualizing it
 *    twice — both produce a curve of the same shape in the same units;
 *  - indexing the record positionally, so the span silently changes the first
 *    time anything filters the census on the way to the page;
 *  - a median age that never moves, which would put a dead number beside a
 *    scrubber whose whole job is to show the transition.
 *
 * The cross-check in the last block is the load-bearing one: the engine's
 * cohort arithmetic makes the head count move by exactly births − deaths +
 * net migration, so the EXACT growth rate and the FOGGED vital rates have to
 * agree. Any error in the span shows up there as a systematic gap.
 */

import { describe, expect, it } from 'vitest'
import { AGE_BANDS } from '@terrarium/engine'
import {
  GROWTH_LOOKBACK_QTRS,
  ageStructure,
  medianAge,
  populationGrowth,
  type CensusEntry,
} from '../../packages/ui/src/census'
import { SURVEY_SEEDS, SURVEY_TICKS, eachQuarter } from './harness'

const flat = (total: number) => Array<number>(AGE_BANDS).fill(total / AGE_BANDS)
const entry = (tick: number, population: number): CensusEntry => ({
  tick,
  population,
  pyramid: flat(population),
})
/** a census with one entry per quarter, populations given in order from 1946Q1 */
const record = (populations: readonly number[]): CensusEntry[] =>
  populations.map((population, tick) => entry(tick, population))

describe('populationGrowth', () => {
  it('says nothing until a year of record has accumulated', () => {
    for (let quarters = 1; quarters <= GROWTH_LOOKBACK_QTRS; quarters++) {
      expect(populationGrowth(record(Array<number>(quarters).fill(30)))).toEqual([])
    }
    expect(populationGrowth(record(Array<number>(5).fill(30)))).toHaveLength(1)
  })

  it('measures a year, not a quarter', () => {
    // one 10% step between 1946Q1 and 1947Q1, flat on either side
    const grown = populationGrowth(record([30, 30, 30, 30, 33, 33, 33, 33, 33]))
    expect(grown.map((g) => g.tick)).toEqual([4, 5, 6, 7, 8])
    expect(grown[0].value).toBeCloseTo(10, 10)
    // by 1948Q1 the step is a year behind, so the year-on-year reading is flat
    expect(grown[4].value).toBeCloseTo(0, 10)
  })

  it('reports the sign of a shrinking country', () => {
    const shrunk = populationGrowth(record([40, 40, 40, 40, 38]))
    expect(shrunk[0].value).toBeCloseTo(-5, 10)
  })

  it('measures against the quarter four ticks back, not four rows back', () => {
    // the record thinned to every other quarter — a positional `k - 4` would
    // read an eight-quarter span here and report roughly double the growth
    const thinned = [entry(0, 30), entry(2, 31), entry(4, 32), entry(6, 33), entry(8, 34)]
    const grown = populationGrowth(thinned)
    expect(grown.map((g) => g.tick)).toEqual([4, 6, 8])
    expect(grown[0].value).toBeCloseTo(100 * (32 / 30 - 1), 10)
    expect(grown[2].value).toBeCloseTo(100 * (34 / 32 - 1), 10)
  })

  it('skips a quarter with no partner rather than inventing one', () => {
    // 1946Q2 is missing, so 1947Q2 has nothing to be measured against
    const gapped = [entry(0, 30), entry(2, 30), entry(3, 30), entry(4, 31), entry(6, 32), entry(7, 33)]
    expect(populationGrowth(gapped).map((g) => g.tick)).toEqual([4, 6, 7])
  })

  it('returns readings in tick order whatever order the record arrives in', () => {
    const scrambled = [entry(6, 33), entry(0, 30), entry(4, 32), entry(2, 31), entry(5, 32.5), entry(1, 30.5), entry(3, 31.5)]
    const ticks = populationGrowth(scrambled).map((g) => g.tick)
    expect(ticks).toEqual([...ticks].sort((a, b) => a - b))
  })

  it('emits no reading rather than a division by an empty country', () => {
    const emptied = populationGrowth(record([0, 0, 0, 0, 12]))
    expect(emptied).toEqual([])
    for (const point of populationGrowth(record([30, 30, 30, 30, 0]))) {
      expect(Number.isFinite(point.value)).toBe(true)
    }
  })
})

describe('medianAge', () => {
  it('splits a flat pyramid down the middle', () => {
    // 17 equal bands of five years: half the country is under 42.5
    expect(medianAge(flat(34))).toBeCloseTo(2.5 * AGE_BANDS, 10)
  })

  it('interpolates inside the band the halfway mark lands in', () => {
    // one band of 10 either side of a band of 20: the middle 10 people are a
    // quarter of the way through the 5–9s
    const pyramid = Array<number>(AGE_BANDS).fill(0)
    pyramid[0] = 10
    pyramid[1] = 20
    pyramid[2] = 10
    expect(medianAge(pyramid)).toBeCloseTo(5 + 5 * (20 - 10) / 20, 10)
  })

  it('reports the floor of the open-ended top band rather than inventing a ceiling', () => {
    const ancient = Array<number>(AGE_BANDS).fill(0)
    ancient[AGE_BANDS - 1] = 5
    expect(medianAge(ancient)).toBe(5 * (AGE_BANDS - 1))
  })

  it('has no median for a country with nobody in it', () => {
    expect(medianAge(Array<number>(AGE_BANDS).fill(0))).toBeNull()
  })
})

describe('ageStructure', () => {
  it('tiles the pyramid exactly — every head is in one of the three groups', () => {
    const pyramid = Array.from({ length: AGE_BANDS }, (_, i) => 1 + i * 0.3)
    const total = pyramid.reduce((a, b) => a + b, 0)
    const { children, working, retired } = ageStructure(pyramid)
    expect(children + working + retired).toBeCloseTo(total, 10)
  })

  it('has no support ratio before anyone has retired', () => {
    const young = Array<number>(AGE_BANDS).fill(0)
    young[4] = 20
    expect(ageStructure(young).support).toBe(Infinity)
  })
})

// ---- against the century the engine actually produces ----

describe('the exact register over a played century', () => {
  it('keeps growth inside a range a population can reach, and reaches both signs', () => {
    let lowest = Infinity
    let highest = -Infinity
    let readings = 0
    for (const seed of SURVEY_SEEDS) {
      eachQuarter(seed, SURVEY_TICKS, (pub, tick) => {
        if (tick !== SURVEY_TICKS - 1) return
        for (const point of populationGrowth(pub.census)) {
          expect(Number.isFinite(point.value)).toBe(true)
          lowest = Math.min(lowest, point.value)
          highest = Math.max(highest, point.value)
          readings++
        }
      })
    }
    expect(readings).toBeGreaterThan(1000)
    // a wrong span is the failure this bounds: reading a quarter as a year
    // would put the whole series near zero, and annualizing twice would put it
    // past anything a cohort model can produce
    expect(highest).toBeGreaterThan(0.5)
    expect(highest).toBeLessThan(5)
    expect(lowest).toBeGreaterThan(-5)
    // and the reason `include={[0]}` is on the chart: the series really does
    // cross into decline, so zero is inside the range rather than under it
    expect(lowest).toBeLessThan(0)
  })

  it('agrees with the vital rates it is made of', () => {
    // The engine moves the head count by births − deaths + net migration, so
    // the exact growth rate and the published rates measure the same thing by
    // two different routes — one counted, one surveyed. A growth rate measured
    // over the wrong span cannot agree with them.
    const residuals: number[] = []
    for (const seed of SURVEY_SEEDS) {
      eachQuarter(seed, SURVEY_TICKS, (pub, tick) => {
        if (tick !== SURVEY_TICKS - 1) return
        const settled = (id: 'birth_rate' | 'death_rate' | 'net_migration') => {
          const best = new Map<number, { value: number; revision: number }>()
          for (const p of pub.indicators[id]?.points ?? []) {
            const cur = best.get(p.forQtr)
            if (!cur || p.revision > cur.revision) best.set(p.forQtr, { value: p.value, revision: p.revision })
          }
          return best
        }
        const birth = settled('birth_rate')
        const death = settled('death_rate')
        const migration = settled('net_migration')
        for (const point of populationGrowth(pub.census)) {
          const quarters = [point.tick - 3, point.tick - 2, point.tick - 1, point.tick]
          if (!quarters.every((q) => birth.has(q) && death.has(q) && migration.has(q))) continue
          // per 1,000/yr ÷ 10 is %/yr; the mean of the four quarters in the span
          const implied =
            quarters.reduce(
              (a, q) => a + (birth.get(q)!.value - death.get(q)!.value + migration.get(q)!.value) / 10,
              0,
            ) / 4
          residuals.push(Math.abs(point.value - implied))
        }
      })
    }
    expect(residuals.length).toBeGreaterThan(500)
    const sorted = [...residuals].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    // the two routes differ only by the office's residual survey error and the
    // start-of-quarter vs end-of-quarter denominators the rates are struck on
    expect(median).toBeLessThan(0.1)
    expect(sorted[sorted.length - 1]).toBeLessThan(1)
  })

  it('gives the scrubber a median age that actually moves', () => {
    for (const seed of SURVEY_SEEDS.slice(0, 2)) {
      const ages: number[] = []
      eachQuarter(seed, SURVEY_TICKS, (pub, tick) => {
        if (tick !== SURVEY_TICKS - 1) return
        for (const c of pub.census) {
          const age = medianAge(c.pyramid)
          expect(age).not.toBeNull()
          ages.push(age!)
        }
      })
      expect(Math.min(...ages)).toBeGreaterThan(12)
      expect(Math.max(...ages)).toBeLessThan(60)
      // a dead number beside the scrubber would be worse than no number
      expect(Math.max(...ages) - Math.min(...ages)).toBeGreaterThan(8)
    }
  })
})
