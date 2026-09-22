/**
 * The central-bank desk's stance briefing (`ui/src/monetaryStance.ts`,
 * ADR-0043).
 *
 * Three claims, and each is the kind a screenshot cannot check.
 *
 * 1. **It is an estimate, not the truth.** The desk's neutral rate is built
 *    from the office's prints and the treasury's books, so it must track the
 *    engine's neutral rate closely enough to be worth reading and differ from
 *    it in almost every quarter. A briefing that matched the truth exactly
 *    would mean a true field had found its way onto the desk.
 * 2. **The range is the office's, and it is honest.** When the desk claims
 *    fair confidence, the truth lies inside the range about as often as the
 *    confessed bands promise; when the office confesses nothing, the range
 *    collapses rather than pretending.
 * 3. **The recurrence is the public's.** Fed exact figures with no lag, the
 *    desk's filter reproduces the engine's adaptive expectations to the last
 *    digit — so the only thing between the estimate and the truth is the fog.
 *    Off-by-one quarter in the printing term or the posting convention would
 *    pass every statistical test above and still be a subtly wrong desk.
 */

import { describe, expect, it } from 'vitest'
import {
  applyActions,
  clampExpectations,
  createCountryParams,
  init,
  NATURAL_REAL_RATE,
  privateFundingSpread,
  privateRealRate,
  step,
  type CapacityId,
  type StatPrint,
  type TrueState,
} from '@terrarium/engine'
import { INFLATION_EXPECTATIONS_MIN } from '../../packages/engine/src/constants'
import { observe, type IndicatorSeries, type PublishedState } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'
import {
  EXPECTATIONS_MEMORY_QTRS,
  NEAR_NEUTRAL_TOLERANCE,
  expectationsFromPrints,
  monetaryStance,
  type MonetaryStance,
} from '../../packages/ui/src/monetaryStance'
import { latestOfficialNominalGdp, officialNominalGdpByQuarter } from '../../packages/ui/src/spendingRules'

const trueNeutral = (s: TrueState) => s.gov.dials.policyRate - (privateRealRate(s) - NATURAL_REAL_RATE)
const sideOf = (gap: number) =>
  gap > NEAR_NEUTRAL_TOLERANCE ? 'above' : gap < -NEAR_NEUTRAL_TOLERANCE ? 'below' : 'near'
const quantile = (xs: number[], p: number) => {
  const sorted = [...xs].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
}

interface Sample {
  tick: number
  stance: MonetaryStance
  truth: number
  trueExpectations: number
  trueSpread: number
}

/** A century with the office funded every other year, sampling the desk's
 * briefing against the truth it cannot see. */
function survey(seed: string, ticks: number, build: readonly CapacityId[]): Sample[] {
  let s = init(standardCountry, seed)
  const out: Sample[] = []
  for (let t = 0; t < ticks; t++) {
    if (t % 8 === 0) {
      for (const target of build) {
        try {
          s = applyActions(s, [{ kind: 'investCapacity', target, amount: 2 }])
        } catch {
          // unaffordable this quarter
        }
      }
    }
    s = step(s)
    const stance = monetaryStance(observe(s))
    if (stance)
      out.push({
        tick: t,
        stance,
        truth: trueNeutral(s),
        trueExpectations: s.ledger.inflationExpectations,
        trueSpread: privateFundingSpread(s),
      })
  }
  return out
}

describe('the desk reads the fog, not the truth', () => {
  const built = survey('stance-built', 160, ['statistical'])
  const late = built.filter((r) => r.tick >= 80)

  it('is available from the first releases onward', () => {
    expect(built[0].tick).toBeLessThanOrEqual(2)
    expect(built.length).toBeGreaterThan(150)
  })

  it('differs from the truth in almost every quarter, on every input', () => {
    const exact = built.filter((r) => r.stance.neutral === r.truth).length
    expect(exact / built.length).toBeLessThan(0.02)
    const exactE = built.filter((r) => r.stance.expectations.value === r.trueExpectations).length
    expect(exactE / built.length).toBeLessThan(0.02)
  })

  it('tracks the truth closely enough to be worth reading, and better once the office is built', () => {
    const err = (rows: Sample[]) => rows.map((r) => Math.abs(r.stance.neutral - r.truth))
    // measured: p50 ≈ 0.2 pt and p90 ≈ 0.4 pt over a built late century;
    // the bounds are loose enough to survive a retune, tight enough that a
    // desk reading the wrong quarter's print or the wrong sign fails
    expect(quantile(err(built), 0.5)).toBeLessThan(0.005)
    expect(quantile(err(late), 0.9)).toBeLessThan(0.01)
    const passive = survey('stance-passive', 160, [])
    const passiveLate = passive.filter((r) => r.tick >= 80)
    expect(quantile(err(late), 0.9)).toBeLessThan(quantile(err(passiveLate), 0.9))
  })

  it('names the same side of neutral as the truth in most quarters', () => {
    const agree = built.filter((r) => r.stance.reading === sideOf(r.stance.posted - r.truth)).length
    expect(agree / built.length).toBeGreaterThan(0.85)
  })

  it('the funding spread is priced off the books to within a tenth of a point', () => {
    const err = built.map((r) => Math.abs(r.stance.funding.value - r.trueSpread))
    expect(quantile(err, 0.9)).toBeLessThan(0.001)
  })
})

describe('the range is the office’s own', () => {
  const built = survey('stance-range', 160, ['statistical'])

  it('covers the truth about as often as the confessed bands promise, when it claims fair confidence', () => {
    const fair = built.filter((r) => r.stance.confidence === 'fair')
    expect(fair.length).toBeGreaterThan(40)
    const covered = fair.filter((r) => r.truth >= r.stance.low && r.truth <= r.stance.high).length
    expect(covered / fair.length).toBeGreaterThan(0.85)
    for (const r of fair) {
      expect(r.stance.low).toBeLessThan(r.stance.neutral)
      expect(r.stance.high).toBeGreaterThan(r.stance.neutral)
    }
  })

  it('collapses to the point when the office confesses no band', () => {
    const passive = survey('stance-unbanded', 60, [])
    // the standard country opens below the band gate, so every print is bare
    expect(passive.every((r) => r.stance.confidence === 'low')).toBe(true)
    for (const r of passive) {
      expect(r.stance.low).toBe(r.stance.neutral)
      expect(r.stance.high).toBe(r.stance.neutral)
      expect(r.stance.expectations.bandedRun).toBe(0)
    }
  })

  it('reads the posting the way the study did: neutral opens near five percent and falls below the floor', () => {
    // investigation 0011: expected inflation opens at 3% over a 2% anchor,
    // and the fifth-year deflation puts the median neutral setting below zero
    const passive = survey('stance-floor', 24, [])
    const opening = passive.find((r) => r.tick === 2)!
    expect(opening.stance.neutral).toBeGreaterThan(0.035)
    expect(opening.stance.neutral).toBeLessThan(0.055)
    const squeeze = passive.filter((r) => r.tick >= 8 && r.tick < 24)
    expect(squeeze.some((r) => r.stance.belowFloor)).toBe(true)
    for (const r of squeeze.filter((r) => r.stance.belowFloor)) {
      expect(r.stance.high + NEAR_NEUTRAL_TOLERANCE).toBeLessThan(0)
      expect(r.stance.reading).toBe('above')
    }
  })
})

describe('the arithmetic', () => {
  // a calm quarter, where the whole range sits above the dial's floor and
  // both sides of it are reachable
  const pub = (() => {
    let state = init(standardCountry, 'stance-arith')
    for (let t = 0; t < 80; t++) {
      state = step(state)
      const stance = t >= 20 ? monetaryStance(observe(state)) : null
      if (stance && stance.low - NEAR_NEUTRAL_TOLERANCE > 0.005) break
    }
    return observe(state)
  })()
  const base = monetaryStance(pub)!

  it('asset purchases raise neutral at the engine’s gain, and nothing else moves', () => {
    const eased = monetaryStance({ ...pub, dials: { ...pub.dials, assetPurchaseRate: 0.1 } })!
    expect(eased.neutral - base.neutral).toBeCloseTo(eased.assetPurchases - base.assetPurchases, 12)
    expect(eased.assetPurchases).toBeCloseTo(0.02, 12)
    expect(eased.expectations).toEqual(base.expectations)
    expect(eased.funding).toEqual(base.funding)
  })

  it('the posted rate decides the side, with half a point of grace around the range', () => {
    const at = (policyRate: number) => monetaryStance({ ...pub, dials: { ...pub.dials, policyRate } })!.reading
    expect(base.low - NEAR_NEUTRAL_TOLERANCE).toBeGreaterThan(0)
    expect(at(base.high + NEAR_NEUTRAL_TOLERANCE + 1e-6)).toBe('above')
    expect(at(base.high + NEAR_NEUTRAL_TOLERANCE - 1e-6)).toBe('near')
    expect(at(base.low - NEAR_NEUTRAL_TOLERANCE + 1e-6)).toBe('near')
    expect(at(base.low - NEAR_NEUTRAL_TOLERANCE - 1e-6)).toBe('below')
  })

  it('a wider spread lowers neutral: the low end pairs low inflation with the high spread', () => {
    // synthesize a banded desk by hand so the pairing is checkable regardless
    // of what capacity the fixture opens at
    const inflation = pub.indicators.inflation!
    const banded: IndicatorSeries = {
      ...inflation,
      points: inflation.points.map((p) => ({ ...p, errorBand: 2 })),
    }
    const stance = monetaryStance({ ...pub, indicators: { ...pub.indicators, inflation: banded } })!
    expect(stance.confidence).toBe('fair')
    expect(stance.expectations.low).toBeCloseTo(stance.expectations.value - stance.expectations.band, 12)
    expect(stance.expectations.high).toBeCloseTo(stance.expectations.value + stance.expectations.band, 12)
    expect(stance.low).toBeCloseTo(
      NATURAL_REAL_RATE + stance.expectations.low - stance.funding.high + stance.assetPurchases,
      12,
    )
    expect(stance.high).toBeCloseTo(
      NATURAL_REAL_RATE + stance.expectations.high - stance.funding.low + stance.assetPurchases,
      12,
    )
  })

  it('the interval is cut to the rails the public’s rule can reach', () => {
    // Oranga's early deflation drives expectations onto the engine's floor;
    // the centre is clamped there by the rule itself, and an interval that
    // kept going below it would include a reading the public cannot hold and
    // a neutral rate the economy cannot be at.
    let state = init(createCountryParams('oranga', 'stance-floor-clamp'), 'stance-floor-clamp')
    let saturated: ReturnType<typeof monetaryStance> = null
    for (let t = 0; t < 24 && saturated === null; t++) {
      state = step(state)
      const p = observe(state)
      const inflation = p.indicators.inflation
      if (!inflation) continue
      const banded: IndicatorSeries = { ...inflation, points: inflation.points.map((x) => ({ ...x, errorBand: 2 })) }
      const stance = monetaryStance({ ...p, indicators: { ...p.indicators, inflation: banded } })
      if (stance && stance.expectations.value - stance.expectations.band < INFLATION_EXPECTATIONS_MIN) saturated = stance
    }
    expect(saturated).not.toBeNull()
    expect(saturated!.expectations.low).toBe(INFLATION_EXPECTATIONS_MIN)
    expect(saturated!.expectations.high).toBeGreaterThan(INFLATION_EXPECTATIONS_MIN)
    expect(saturated!.low).toBeCloseTo(
      NATURAL_REAL_RATE + INFLATION_EXPECTATIONS_MIN - saturated!.funding.high + saturated!.assetPurchases,
      12,
    )
    expect(saturated!.expectations.low).toBe(clampExpectations(saturated!.expectations.value - saturated!.expectations.band))
  })

  it('a print run too short behind an unpriced stretch is low confidence even with bands', () => {
    const inflation = pub.indicators.inflation!
    const latest = Math.max(...inflation.points.map((p) => p.forQtr))
    const recent: IndicatorSeries = {
      ...inflation,
      points: inflation.points.filter((p) => p.forQtr > latest - 3).map((p) => ({ ...p, errorBand: 2 })),
    }
    const stance = monetaryStance({ ...pub, indicators: { ...pub.indicators, inflation: recent } })!
    expect(stance.expectations.run).toBeLessThan(EXPECTATIONS_MEMORY_QTRS)
    expect(stance.confidence).toBe('low')
    expect(stance.low).toBe(stance.neutral)
  })

  it('crossing the band gate does not buy a range until the unbanded prints have aged out', () => {
    // The price index is funded far below the band gate, so when the office
    // crosses it the series is already continuous and only the LATEST print
    // carries a band. The earlier, unbanded prints still hold most of the
    // filter's weight and contributed nothing to the band, so a range built
    // on that one print would be narrower than anything the office said.
    const inflation = pub.indicators.inflation!
    const latest = Math.max(...inflation.points.map((p) => p.forQtr))
    expect(latest + 1).toBeGreaterThan(EXPECTATIONS_MEMORY_QTRS)
    const bandedFrom = (first: number): IndicatorSeries => ({
      ...inflation,
      points: inflation.points.map((p) => ({ ...p, errorBand: p.forQtr >= first ? 2 : 0 })),
    })
    const at = (first: number) =>
      monetaryStance({ ...pub, indicators: { ...pub.indicators, inflation: bandedFrom(first) } })!
    const justCrossed = at(latest)
    expect(justCrossed.expectations.bandedRun).toBe(1)
    expect(justCrossed.confidence).toBe('low')
    expect(justCrossed.low).toBe(justCrossed.neutral)
    const nearly = at(latest - EXPECTATIONS_MEMORY_QTRS + 2)
    expect(nearly.expectations.bandedRun).toBe(EXPECTATIONS_MEMORY_QTRS - 1)
    expect(nearly.confidence).toBe('low')
    const aged = at(latest - EXPECTATIONS_MEMORY_QTRS + 1)
    expect(aged.expectations.bandedRun).toBe(EXPECTATIONS_MEMORY_QTRS)
    expect(aged.confidence).toBe('fair')
    // …and the range it then stands behind is the steady-state one, not the
    // sliver a single banded print would have produced
    const always = at(0)
    expect(aged.expectations.band).toBeGreaterThan(0.9 * always.expectations.band)
  })

  it('counts only the prints the recurrence has consumed, so a fast office is not one quarter early', () => {
    // Under a one-quarter lag the newest print (for pub.tick − 1) is on the
    // desk, but the public — and so the recurrence — has only reacted to
    // inflation through pub.tick − 2. A run counted from the newest print
    // would grant "fair" with fifteen banded prints consumed and the unbanded
    // one before them still at an eighth of the weight.
    const fast = { ...standardCountry, capacities: { ...standardCountry.capacities, statistical: 0.9 } }
    let state = init(fast, 'stance-fast-lag')
    for (let t = 0; t < 40; t++) state = step(state)
    const pub = observe(state)
    const newest = Math.max(...pub.indicators.inflation!.points.map((p) => p.forQtr))
    expect(newest).toBe(pub.tick - 1)
    const stance = monetaryStance(pub)!
    expect(stance.expectations.throughQtr).toBe(pub.tick - 2)
    // banding from the sixteenth-newest print: sixteen on the desk, fifteen
    // consumed — low; one quarter later, sixteen consumed — fair
    const bandedFrom = (first: number) => ({
      ...pub,
      indicators: {
        ...pub.indicators,
        inflation: {
          ...pub.indicators.inflation!,
          points: pub.indicators.inflation!.points.map((p) => ({ ...p, errorBand: p.forQtr >= first ? 2 : 0 })),
        },
      },
    })
    const early = monetaryStance(bandedFrom(newest - EXPECTATIONS_MEMORY_QTRS + 1))!
    expect(early.expectations.bandedRun).toBe(EXPECTATIONS_MEMORY_QTRS - 1)
    expect(early.confidence).toBe('low')
    const consumed = monetaryStance(bandedFrom(newest - EXPECTATIONS_MEMORY_QTRS))!
    expect(consumed.expectations.bandedRun).toBe(EXPECTATIONS_MEMORY_QTRS)
    expect(consumed.confidence).toBe('fair')
  })

  it('at the posting the memory is the whole record, so a young desk can stand behind a range', () => {
    // the quarters before 1946 are the exact prior, not unbanded prints; a
    // fully banded record of any length is a clean memory
    let state = init(standardCountry, 'stance-young')
    for (let t = 0; t < 6; t++) state = step(state)
    const young = observe(state)
    const inflation = young.indicators.inflation!
    const banded: IndicatorSeries = { ...inflation, points: inflation.points.map((p) => ({ ...p, errorBand: 2 })) }
    const stance = monetaryStance({ ...young, indicators: { ...young.indicators, inflation: banded } })!
    expect(stance.expectations.throughQtr + 1).toBeLessThan(EXPECTATIONS_MEMORY_QTRS)
    expect(stance.expectations.bandedRun).toBe(stance.expectations.throughQtr + 1)
    expect(stance.confidence).toBe('fair')
  })
})

describe('every exact figure is read against its own quarter’s release', () => {
  const pub = (() => {
    let state = init(standardCountry, 'stance-own-quarter')
    for (let t = 0; t < 30; t++) state = step(state)
    return observe(state)
  })()
  const priced = latestOfficialNominalGdp(pub)!

  it('the auction is the priced quarter’s bond issue over its own level, not the newest auction', () => {
    // the treasury books an auction every quarter; the office prices output a
    // quarter or two behind. The desk waits for the level rather than divide
    // this quarter's issue by last quarter's output.
    const stance = monetaryStance(pub)!
    expect(stance.funding.auctionQtr).toBe(priced.forQtr)
    expect(priced.forQtr).toBeLessThan(pub.tick - 1)
    // the newest, unpriced auction moves nothing…
    const newest = monetaryStance({ ...pub, treasury: { ...pub.treasury, bondsIssued: pub.treasury.bondsIssued + 5 } })!
    expect(newest.funding).toEqual(stance.funding)
    // …and the priced quarter's own auction moves the flow term alone
    const books = pub.books.map((b) => (b.tick === priced.forQtr ? { ...b, bondsIssued: b.bondsIssued + priced.value * 0.02 } : b))
    const bigger = monetaryStance({ ...pub, books })!
    expect(bigger.funding.auction).toBeGreaterThan(stance.funding.auction)
    expect(bigger.funding.premium).toBeCloseTo(stance.funding.premium, 12)
  })

  it('printing in a quarter the office has not yet priced is deferred, not divided by an older level', () => {
    const unpriced = pub.tick - 1
    expect(officialNominalGdpByQuarter(pub).has(unpriced)).toBe(false)
    const printedNow = {
      ...pub,
      books: pub.books.map((b) => (b.tick === unpriced ? { ...b, deficitPrinting: b.deficitPrinting + priced.value * 0.05 } : b)),
    }
    expect(expectationsFromPrints(printedNow)!.value).toBe(expectationsFromPrints(pub)!.value)
    // once the office puts a level on that quarter, the same printing counts
    const level: StatPrint = { forQtr: unpriced, publishedAt: pub.tick, value: 0, revision: 0, errorBand: 0, levels: { real: priced.value, nominal: priced.value } }
    const withLevel = (p: PublishedState): PublishedState => ({
      ...p,
      indicators: { ...p.indicators, gdp_growth: { ...p.indicators.gdp_growth!, points: [...p.indicators.gdp_growth!.points, level] } },
    })
    expect(expectationsFromPrints(withLevel(printedNow))!.value).toBeGreaterThan(expectationsFromPrints(withLevel(pub))!.value)
  })
})

describe('when the desk has nothing to work from', () => {
  it('is null below the price index’s funding gate, never a stance at zero', () => {
    const unfunded = { ...standardCountry, capacities: { ...standardCountry.capacities, statistical: 0.02 } }
    let s = init(unfunded, 'stance-unfunded')
    for (let t = 0; t < 12; t++) s = step(s)
    const pub = observe(s)
    expect(pub.indicators.inflation).toBeUndefined()
    expect(monetaryStance(pub)).toBeNull()
  })

  it('is null before the first releases arrive', () => {
    expect(monetaryStance(observe(init(standardCountry, 'stance-posting')))).toBeNull()
  })

  it('under full instrumentation the survey exists but the band does not, so confidence stays low', () => {
    const unfunded = { ...standardCountry, capacities: { ...standardCountry.capacities, statistical: 0.02 } }
    let s = init(unfunded, 'stance-full', { fullInstrumentation: true })
    for (let t = 0; t < 12; t++) s = step(s)
    const stance = monetaryStance(observe(s))
    expect(stance).not.toBeNull()
    expect(stance!.confidence).toBe('low')
  })
})

describe('the recurrence is the public’s own', () => {
  /** the office's prints replaced by the exact worksheet, released without lag */
  function exactDesk(s: TrueState): PublishedState {
    const pub = observe(s)
    const inflation: StatPrint[] = s.stats.record.map((r, q) => ({
      forQtr: q,
      publishedAt: q + 1,
      value: r.inflationQ * 4 * 100,
      revision: 0,
      errorBand: 0,
    }))
    const gdp: StatPrint[] = s.stats.record.map((r, q) => ({
      forQtr: q,
      publishedAt: q + 1,
      value: 0,
      revision: 0,
      errorBand: 0,
      levels: { real: r.realGdp, nominal: r.nominalGdp },
    }))
    return {
      ...pub,
      indicators: {
        ...pub.indicators,
        inflation: { id: 'inflation', label: '', unit: '', points: inflation },
        gdp_growth: { id: 'gdp_growth', label: '', unit: '', points: gdp },
      },
    }
  }

  it('fed exact figures, reproduces the engine’s expectations to the last digit', () => {
    let s = init(standardCountry, 'stance-exact')
    for (let t = 0; t < 60; t++) {
      s = step(s)
      const desk = expectationsFromPrints(exactDesk(s))
      // after one tick the first print is on the desk but the public has
      // not yet reacted to it, so there is nothing to estimate from
      if (t === 0) {
        expect(desk).toBeNull()
        continue
      }
      expect(desk!.throughQtr).toBe(s.meta.tick - 2)
      expect(desk!.value).toBeCloseTo(s.ledger.inflationExpectations, 12)
    }
  })

  it('…including the push from the printing press', () => {
    // a deficit the bond market cannot absorb is monetized; the treasury
    // knows what it printed and the desk must feed it through at the gain
    let s = init(standardCountry, 'stance-printing', { unlimitedCapital: true })
    s = applyActions(s, [
      { kind: 'setDial', path: 'spending.transfers', value: s.gov.dials.spending.transfers * 6 },
    ])
    let printed = 0
    for (let t = 0; t < 40; t++) {
      s = step(s)
      printed += s.flows.printedThisQtr
      if (t === 0) continue
      expect(expectationsFromPrints(exactDesk(s))!.value).toBeCloseTo(s.ledger.inflationExpectations, 12)
    }
    expect(printed).toBeGreaterThan(0)
  })
})
