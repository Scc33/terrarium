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
 *    scrubber whose whole job is to show the transition;
 *  - a rural/urban share struck against the head count instead of against the
 *    population the register actually houses, which prints low by exactly the
 *    pensioner share and drifts further wrong the older the country gets.
 *
 * The cross-check in the last block is the load-bearing one: the engine's
 * cohort arithmetic makes the head count move by exactly births − deaths +
 * net migration, so the EXACT growth rate and the FOGGED vital rates have to
 * agree. Any error in the span shows up there as a systematic gap.
 */

import { describe, expect, it } from 'vitest'
import { AGE_BANDS, RETIREMENT_BAND } from '@terrarium/engine'
import {
  GROWTH_LOOKBACK_QTRS,
  RESIDENCE_IDS,
  ageStructure,
  medianAge,
  populationGrowth,
  residenceRows,
  residenceShares,
  residenceSplit,
  type CensusEntry,
} from '../../packages/ui/src/census'
import { SURVEY_SEEDS, SURVEY_TICKS, eachQuarter } from './harness'

const flat = (total: number) => Array<number>(AGE_BANDS).fill(total / AGE_BANDS)
/** The register houses the under-60s, so a fixture's split is struck on a
 * base SMALLER than its head count — the same relation the engine files, and
 * the one a reading that divides by the wrong denominator gets wrong. */
const entry = (tick: number, population: number, urban = 0.3): CensusEntry => {
  const classified = (population * RETIREMENT_BAND) / AGE_BANDS
  return {
    tick,
    population,
    pyramid: flat(population),
    residence: { rural: classified * (1 - urban), urban: classified * urban },
  }
}
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

describe('residenceSplit', () => {
  it('strikes the share against the population the register houses', () => {
    // 34M in a flat pyramid: 12 of 17 bands are under 60, so the register
    // places 24M of them. A share taken against the head count instead would
    // print 21% here rather than 30% — low, plausible, and wrong by the
    // pensioner share every quarter.
    const split = residenceSplit(entry(0, 34, 0.3))
    expect(split.classified).toBeCloseTo((34 * RETIREMENT_BAND) / AGE_BANDS, 10)
    expect(split.classified).toBeLessThan(34)
    expect(split.urbanShare).toBeCloseTo(0.3, 10)
    expect(split.rural + split.urban).toBeCloseTo(split.classified, 10)
  })

  it('has no share to report rather than reporting a country entirely on the land', () => {
    // zero and null are different claims: one says everybody farms, the other
    // says nobody has been placed yet. Rendered as "0%" the first is a
    // confident, wrong, entirely plausible reading of an empty register.
    const empty = residenceSplit({ residence: { rural: 0, urban: 0 } })
    expect(empty.urbanShare).toBeNull()
    expect(empty.classified).toBe(0)
  })

  it('refuses a negative side rather than passing it to a chart that drops it', () => {
    // `stackPlot` floors a band at zero and draws nothing, which in review is
    // indistinguishable from a country with nobody in the countryside
    const broken = residenceSplit({ residence: { rural: -1, urban: 6 } })
    expect(broken.rural).toBe(0)
    expect(broken.urbanShare).toBe(1)
  })
})

describe('residenceRows', () => {
  it('gives every quarter both bands so the inks stay pinned to their categories', () => {
    const rows = residenceRows(record([30, 31, 32]))
    expect(rows).toHaveLength(3)
    for (const row of rows) {
      for (const id of RESIDENCE_IDS) expect(Number.isFinite(row.values[id])).toBe(true)
    }
  })

  it('draws left to right whatever order the record arrives in', () => {
    const scrambled = [entry(6, 33), entry(0, 30), entry(4, 32), entry(2, 31)]
    expect(residenceRows(scrambled).map((r) => r.tick)).toEqual([0, 2, 4, 6])
  })

  it('names and inks both bands, in stack order with the land underneath', () => {
    const keys = residenceShares(residenceSplit(entry(0, 30, 0.4)))
    expect(keys.map((k) => k.key)).toEqual([...RESIDENCE_IDS])
    expect(new Set(keys.map((k) => k.ink)).size).toBe(2)
    for (const key of keys) expect(key.label.length).toBeGreaterThan(0)
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

  it('splits exactly the population the register houses, and nobody else', () => {
    // The one arithmetic claim the page makes about the split: the two bands
    // sum to the under-60s. If the engine ever houses the retired too, this
    // fails here rather than on a chart whose bands would still sum to 100%.
    let worst = 0
    for (const seed of SURVEY_SEEDS.slice(0, 2)) {
      eachQuarter(seed, SURVEY_TICKS, (pub, tick) => {
        if (tick !== SURVEY_TICKS - 1) return
        for (const c of pub.census) {
          const under60 = c.pyramid.slice(0, RETIREMENT_BAND).reduce((a, b) => a + b, 0)
          const split = residenceSplit(c)
          worst = Math.max(worst, Math.abs(split.classified - under60))
          expect(split.classified).toBeLessThan(c.population)
          expect(split.urbanShare).not.toBeNull()
          expect(split.urbanShare!).toBeGreaterThanOrEqual(0)
          expect(split.urbanShare!).toBeLessThanOrEqual(1)
        }
      })
    }
    expect(worst).toBeLessThan(1e-9)
  })

  it('draws a transition, and one the country rather than the seed decides', () => {
    // Measured over 400 fully-surveyed quarters, 2 seeds each: agrarian
    // Costona opens at 35 % urban and finishes near 75 %, while industrial
    // Veltravia opens at 78 % and has almost nowhere left to go. Both facts
    // matter — the first is the chart having something to show, the second is
    // the split being a fact about the recipe rather than a global constant,
    // the same shape as the inherited pollution baseline. (Today the share
    // only ever rises: the engine's rural→urban flow stops in a slump but
    // never reverses. The band chart does not depend on that, so it is not
    // pinned here.)
    const span = (country: 'costona' | 'veltravia') => {
      let opening = 0
      let closing = 0
      eachQuarter('ui-a', SURVEY_TICKS, (pub, tick) => {
        if (tick !== SURVEY_TICKS - 1) return
        opening = residenceSplit(pub.census[0]).urbanShare!
        closing = residenceSplit(pub.census[pub.census.length - 1]).urbanShare!
      }, country)
      return { opening, closing }
    }
    const agrarian = span('costona')
    const industrial = span('veltravia')
    expect(agrarian.opening).toBeLessThan(0.45)
    expect(agrarian.closing - agrarian.opening).toBeGreaterThan(0.25)
    expect(industrial.opening).toBeGreaterThan(0.7)
    expect(industrial.opening - agrarian.opening).toBeGreaterThan(0.25)
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
