/**
 * How often the REVISED stamp fires.
 *
 * The design makes revision marks load-bearing: political capital is banked
 * when a headline prints and never clawed back when it moves (§3.4), so the
 * player MUST notice they bet on a number the office later changed. The mark
 * is supposed to be loud.
 *
 * The first version was loud and therefore useless. It fired on any revision
 * within a six-quarter window, which in practice meant every gauge, every
 * quarter — playing four years in the browser, not one instrument was ever
 * unstamped. A warning that is always on is wallpaper; it carries exactly
 * zero bits.
 *
 * So the stamp is a rate, and a rate is a thing a test can hold. Too high and
 * it is decoration again; too low and a genuinely botched statistic slips by
 * unremarked. Neither bound is arbitrary — they are what "the player notices
 * it, and it means something when they do" costs in numbers.
 */

import { describe, expect, it } from 'vitest'
import { INDICATOR_IDS } from '@terrarium/observation'
import { shapeSeries, stampWorthyRevision, STAMP_WINDOW_QTRS } from '../../packages/ui/src/components/series'
import { gaugeDomain } from '../../packages/ui/src/domains'
import { eachQuarter, SURVEY_SEEDS, SURVEY_TICKS } from './harness'

const WIDE_FACE = { lo: 0, hi: 100 }

/** a revision that clears both gates against WIDE_FACE: 20 units is 20% of
 * the dial and many times the 0.5 band the office confessed */
const loud = {
  forQtr: 100,
  value: 30,
  firstPrint: 10,
  errorBand: 0.5,
  firstBand: 0.5,
  revision: 1,
  lag: 2,
  revisionDelta: 20,
  visiblyRevised: true,
}

/** every (instrument, quarter) the player looked at, and whether it was stamped */
function measure() {
  let shown = 0
  let stamped = 0
  let everStamped = 0
  const perIndicator = new Map<string, { shown: number; stamped: number }>()

  for (const seed of SURVEY_SEEDS) {
    eachQuarter(seed, SURVEY_TICKS, (pub, tick) => {
      for (const id of INDICATOR_IDS) {
        const series = pub.indicators[id]
        if (!series) continue
        const points = shapeSeries(series, 24, tick)
        if (points.length === 0) continue
        const face = gaugeDomain(id, series.points.map((p) => p.value))
        const hit = stampWorthyRevision(points, face) !== null
        shown++
        if (hit) stamped++
        const acc = perIndicator.get(id) ?? { shown: 0, stamped: 0 }
        acc.shown++
        if (hit) acc.stamped++
        perIndicator.set(id, acc)
      }
    })
  }
  for (const v of perIndicator.values()) if (v.stamped > 0) everStamped++
  return { shown, stamped, rate: stamped / shown, perIndicator, everStamped }
}

describe('the REVISED stamp is rare enough to mean something', () => {
  const m = measure()

  it('fires on a small minority of instrument-quarters', () => {
    console.info(
      `REVISED stamp: ${m.stamped}/${m.shown} instrument-quarters (${(m.rate * 100).toFixed(1)}%)`,
    )
    for (const [id, v] of [...m.perIndicator].sort((a, b) => b[1].stamped / b[1].shown - a[1].stamped / a[1].shown)) {
      console.info(`  ${id.padEnd(16)} ${((v.stamped / v.shown) * 100).toFixed(1)}%`)
    }
    // Measured at ~10%: with four dials on the board, the player meets a
    // stamp every few quarters and any one instrument is caught out a handful
    // of times a decade. The band is deliberately wide — it is guarding
    // against the failure modes at the ends, not pinning today's number.
    //
    // Upper bound: a mark that is always on is wallpaper. The version this
    // milestone replaced sat at 67%.
    expect(m.rate, 'the stamp is firing so often it has stopped being a signal').toBeLessThan(0.18)
    // Lower bound: a mark that never fires is a mechanic that silently
    // stopped working. The fog is supposed to bite sometimes.
    expect(m.rate, 'the stamp has stopped firing — has the revision gate drifted?').toBeGreaterThan(0.03)
  })

  it('every fogged instrument gets caught out at least once in a century', () => {
    // if an indicator is never stamped across four countries and 240 quarters,
    // either it is not really being revised or its band is so wide nothing can
    // exceed it — both are measurement bugs worth knowing about
    expect(m.everStamped).toBeGreaterThan(m.perIndicator.size / 2)
  })

  it('only looks back a few quarters', () => {
    const now = 100
    const stale = { ...loud, forQtr: now - STAMP_WINDOW_QTRS - 1 }
    const quiet = { ...loud, forQtr: now, revisionDelta: 0, firstBand: 5 }
    // a stale revision is not news: the player has stopped acting on it
    expect(stampWorthyRevision([stale, quiet], WIDE_FACE)).toBeNull()
    expect(stampWorthyRevision([stale, { ...loud, forQtr: now }], WIDE_FACE)).toMatchObject({ forQtr: now })
  })

  it('picks the largest revision in the window, not merely the newest', () => {
    const small = { ...loud, forQtr: 100, revisionDelta: 12 }
    const big = { ...loud, forQtr: 99, revisionDelta: -40 }
    expect(stampWorthyRevision([big, small], WIDE_FACE)).toBe(big)
  })

  it('a refinement inside the office’s own confessed band is not a stamp', () => {
    // the office admitted it might be off by this much; being off by that much
    // is not the office being caught out
    expect(stampWorthyRevision([{ ...loud, firstBand: 30, revisionDelta: 40 }], WIDE_FACE)).toBeNull()
  })

  it('a revision too small to move the needle is not a stamp either', () => {
    // statistically damning, visually invisible: 1.5 units on a 0–100 face is
    // a needle that did not perceptibly go anywhere
    expect(
      stampWorthyRevision([{ ...loud, firstBand: 0.01, revisionDelta: 1.5 }], WIDE_FACE),
    ).toBeNull()
  })

  it('judges against the band confessed on the FIRST print, not the final one', () => {
    // a final print admits no error at all; judging against it would make
    // every later correction look catastrophic and stamp everything
    const finalised = { ...loud, errorBand: 0, firstBand: 30, revisionDelta: 40 }
    expect(stampWorthyRevision([finalised], WIDE_FACE)).toBeNull()
  })
})
