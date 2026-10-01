/**
 * The dial faces.
 *
 * The bug these exist to prevent: gauge bounds used to be derived from the
 * trailing 24 prints, so the face was redrawn under its own needle every
 * quarter. Approval at 55 sat mid-dial one quarter and left-of-centre the
 * next because the window rolled, which makes needle position meaningless
 * across time and quietly destroys the only skill the game asks for.
 *
 * The fix is a fixed face per indicator, and these tests hold both halves of
 * that bargain: the face must never move (the stability property), and it
 * must actually fit the economy the engine produces (the coverage property).
 * The second one is the interesting one — it ties a UI constant to engine
 * behaviour, so retuning the economy until an instrument spends its life
 * pegged against the stop fails here rather than in a player's hands.
 */

import { describe, expect, it } from 'vitest'
import { COUNTRY_CATALOG } from '@terrarium/engine'
import { INDICATOR_IDS, type IndicatorId } from '@terrarium/observation'
import {
  FACE_MARK,
  INDICATOR_FACE,
  faceScale,
  gaugeDomain,
  niceBounds,
  readNeedle,
} from '../../packages/ui/src/domains'
import { eachQuarter, SURVEY_ARM_IDS, SURVEY_SEEDS, SURVEY_TICKS } from './harness'

describe('every indicator has a face', () => {
  it('covers INDICATOR_IDS exactly', () => {
    // TypeScript already enforces this via Record<IndicatorId, …>; asserting
    // it at runtime too means a cast or a loosened type can't slip past
    expect(Object.keys(INDICATOR_FACE).sort()).toEqual([...INDICATOR_IDS].sort())
  })

  it('fixed faces are non-empty and ordered', () => {
    for (const id of INDICATOR_IDS) {
      const face = INDICATOR_FACE[id]
      if (face === 'ratchet') continue
      expect(face.hi, id).toBeGreaterThan(face.lo)
    }
  })

  it('face marks land inside their own face', () => {
    for (const [id, mark] of Object.entries(FACE_MARK)) {
      const face = INDICATOR_FACE[id as IndicatorId]
      if (face === 'ratchet' || !mark) continue
      // a mark outside the dial is a line the player can never see
      expect(mark.at, id).toBeGreaterThanOrEqual(face.lo)
      expect(mark.at, id).toBeLessThanOrEqual(face.hi)
    }
  })
})

describe('the scale printed on a face', () => {
  it('prints both rails and the midpoint without float noise', () => {
    expect(faceScale({ lo: 50, hi: 85 })).toEqual({ lo: '50', mid: '67.5', hi: '85' })
    expect(faceScale({ lo: 0, hi: 1 })).toEqual({ lo: '0', mid: '0.5', hi: '1' })
    expect(faceScale({ lo: -0.1, hi: 0.2 })).toEqual({ lo: '-0.1', mid: '0.05', hi: '0.2' })
  })

  it('every fixed face prints figures short enough for the corners of a dial', () => {
    // the rail labels sit beside the hub at 9 units in a 200-unit face; five
    // characters is what fits without running into the unit printed between
    for (const id of INDICATOR_IDS) {
      const face = INDICATOR_FACE[id]
      if (face === 'ratchet') continue
      for (const figure of Object.values(faceScale(face))) expect(figure.length, id).toBeLessThanOrEqual(5)
    }
  })
})

describe('the face does not move under the needle', () => {
  it('a fixed face is identical however much history has accumulated', () => {
    for (const id of INDICATOR_IDS) {
      if (INDICATOR_FACE[id] === 'ratchet') continue
      const short = gaugeDomain(id, [1, 2, 3])
      const long = gaugeDomain(id, Array.from({ length: 500 }, (_, i) => Math.sin(i) * 40))
      const empty = gaugeDomain(id, [])
      expect(long, id).toEqual(short)
      expect(empty, id).toEqual(short)
    }
  })

  it('a ratcheting face only ever grows', () => {
    // capital stock runs 175 → 900 over a century; no fixed face is honest,
    // so it ratchets — and a ratchet that can shrink is just rescaling again
    const ratcheting = INDICATOR_IDS.filter((id) => INDICATOR_FACE[id] === 'ratchet')
    expect(ratcheting.length).toBeGreaterThan(0)

    for (const seed of SURVEY_SEEDS.slice(0, 2)) {
      const seen = new Map<IndicatorId, number[]>()
      let prev = new Map<IndicatorId, { lo: number; hi: number }>()
      eachQuarter(seed, SURVEY_TICKS, (pub) => {
        for (const id of ratcheting) {
          const series = pub.indicators[id]
          if (!series) continue
          const values = series.points.map((p) => p.value)
          seen.set(id, values)
          const now = gaugeDomain(id, values)
          const before = prev.get(id)
          if (before) {
            expect(now.lo, `${id} lo shrank`).toBeLessThanOrEqual(before.lo)
            expect(now.hi, `${id} hi shrank`).toBeGreaterThanOrEqual(before.hi)
          }
          prev = new Map(prev).set(id, now)
        }
      })
      expect(seen.size).toBeGreaterThan(0)
    }
  })

  it('niceBounds only ever expands, including where a range is still tiny', () => {
    // the original bug lived in the narrow-range branch, where widening
    // recentred on a moving midpoint — so walk a running min/max out from a
    // single point, which is precisely how a young series behaves
    let seed = 12345
    const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)

    for (let trial = 0; trial < 200; trial++) {
      const start = (rand() - 0.5) * 800
      let lo = start
      let hi = start
      let prev = niceBounds(lo, hi)
      expect(prev.hi, 'a face with no width').toBeGreaterThan(prev.lo)

      for (let i = 0; i < 60; i++) {
        const v = start + (rand() - 0.5) * Math.pow(10, rand() * 3)
        lo = Math.min(lo, v)
        hi = Math.max(hi, v)
        const next = niceBounds(lo, hi)
        expect(next.lo, `lo grew at trial ${trial} step ${i}`).toBeLessThanOrEqual(prev.lo)
        expect(next.hi, `hi shrank at trial ${trial} step ${i}`).toBeGreaterThanOrEqual(prev.hi)
        expect(next.hi).toBeGreaterThan(next.lo)
        prev = next
      }
    }
  })
})

describe('needles peg rather than run off', () => {
  it('clamps and reports which rail it hit', () => {
    const d = { lo: 0, hi: 10 }
    expect(readNeedle(d, 5)).toEqual({ frac: 0.5, pegged: null })
    expect(readNeedle(d, -3)).toEqual({ frac: 0, pegged: 'lo' })
    expect(readNeedle(d, 99)).toEqual({ frac: 1, pegged: 'hi' })
  })

  it('survives a degenerate face and a non-finite reading', () => {
    expect(readNeedle({ lo: 1, hi: 1 }, 1).frac).toBe(0.5)
    expect(readNeedle({ lo: 0, hi: 10 }, NaN).frac).toBe(0.5)
  })
})

describe('the faces fit the economy the engine actually produces', () => {
  /**
   * The honest test of a hand-picked bound. Pegging is a designed dramatic
   * event — an instrument slammed against its stop — so a little is correct
   * and a lot means the face is wrong. If a retune pushes an indicator's
   * normal life off its dial, this fails and names the indicator.
   */
  const NO_HISTORY: readonly number[] = []

  /** how much of one government's century a single dial may spend pegged */
  const ARM_PEG_LIMIT = 0.1

  /**
   * This test is expensive ON PURPOSE and cannot be made cheap by shrinking
   * it: `SURVEY_TICKS` is 400 because the per-capita accounts stay inside
   * their faces until after 2006, and it sweeps the whole catalogue because a
   * face that fits Meridia can peg on Costona. Profiled, `observe` is 83% of
   * the runtime — nothing here can trim it.
   *
   * Recorded because a review once "measured" this at 230s and concluded the
   * budget was 4% from the edge: that reading was taken while a batch run was
   * saturating the machine. Time this test on a quiet box or not at all —
   * under load it will say anything.
   */
  const SURVEY_TIMEOUT_MS = 240_000

  /**
   * It also sweeps POLICY (#190), and that is the half that was missing. The
   * faces were cut against one government — build the ministries, touch
   * nothing else — and so was this test, so the two agreed with each other and
   * with nobody who plays: a real game reached a living standard nearly four
   * times the capacity builder's and ran fifteen instruments off their dials,
   * `investment_share` for 98% of the century. No run of the suite could have
   * caught it.
   *
   * Every government in `SURVEY_ARM_IDS` plays every country, and seeds are
   * TRADED for governments rather than multiplied by them: one seed per
   * (country, government), rotated so each pairing draws a different one.
   * That is 30 centuries where the one-policy survey ran 24, at about the same
   * cost, and the faces it checks were measured on `pnpm ranges`' own seeds,
   * so this is an out-of-sample check rather than a re-reading of the sample.
   */
  it('no instrument spends more than 2% of its published life pegged', () => {
    const total = new Map<IndicatorId, number>()
    const pegged = new Map<IndicatorId, number>()
    const armTotal = new Map<string, number>()
    const armPegged = new Map<string, number>()
    const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1)

    COUNTRY_CATALOG.forEach((country, c) => {
      SURVEY_ARM_IDS.forEach((arm, a) => {
        const seed = SURVEY_SEEDS[(c + a) % SURVEY_SEEDS.length]
        eachQuarter(`${seed}-${country.id}`, SURVEY_TICKS, (pub, tick) => {
          for (const id of INDICATOR_IDS) {
            const series = pub.indicators[id]
            if (!series) continue
            // only judge the print the player is looking at this quarter
            const latest = series.points.filter((p) => p.publishedAt === tick)
            if (latest.length === 0) continue
            // Only a RATCHETING face reads the history — `gaugeDomain` ignores
            // `values` for a fixed one, and says so. Mapping the whole
            // published series every quarter for every instrument was
            // quadratic in SURVEY_TICKS and threw the result away for all but
            // three of them.
            const domain = gaugeDomain(
              id,
              INDICATOR_FACE[id] === 'ratchet' ? series.points.map((p) => p.value) : NO_HISTORY,
            )
            for (const p of latest) {
              const off = readNeedle(domain, p.value).pegged !== null
              bump(total, id)
              bump(armTotal, `${arm} ${id}`)
              if (off) {
                bump(pegged, id)
                bump(armPegged, `${arm} ${id}`)
              }
            }
          }
        }, country.id, arm)
      })
    })

    expect(total.size, 'the surveyed century published nothing').toBeGreaterThan(10)
    const offenders: string[] = []
    for (const [id, n] of total) {
      const rate = (pegged.get(id) ?? 0) / n
      if (rate > 0.02) offenders.push(`${id} pegged ${(rate * 100).toFixed(1)}% of ${n} prints`)
    }
    expect(offenders, 'a dial face no longer fits its indicator — retune INDICATOR_FACE').toEqual([])

    // The pooled figure alone can hide exactly the failure #190 was: one
    // government in five pinned to a rail all century still pools to a fifth
    // of that. So no single government may spend more than ARM_PEG_LIMIT of
    // its prints off any one dial either.
    const armOffenders: string[] = []
    for (const [key, n] of armTotal) {
      const rate = (armPegged.get(key) ?? 0) / n
      if (rate > ARM_PEG_LIMIT) armOffenders.push(`${key} pegged ${(rate * 100).toFixed(1)}% of ${n} prints`)
    }
    expect(armOffenders, 'a dial face fails one government — retune INDICATOR_FACE').toEqual([])
  }, SURVEY_TIMEOUT_MS)
})
