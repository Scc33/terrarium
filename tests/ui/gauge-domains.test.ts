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
  gaugeDomain,
  niceBounds,
  readNeedle,
} from '../../packages/ui/src/domains'
import { eachQuarter, SURVEY_SEEDS, SURVEY_TICKS } from './harness'

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
  it('no instrument spends more than 2% of its published life pegged', () => {
    const total = new Map<IndicatorId, number>()
    const pegged = new Map<IndicatorId, number>()

    for (const country of COUNTRY_CATALOG) {
      for (const seed of SURVEY_SEEDS) {
        eachQuarter(`${seed}-${country.id}`, SURVEY_TICKS, (pub, tick) => {
          for (const id of INDICATOR_IDS) {
            const series = pub.indicators[id]
            if (!series) continue
            // only judge the print the player is looking at this quarter
            const latest = series.points.filter((p) => p.publishedAt === tick)
            if (latest.length === 0) continue
            const domain = gaugeDomain(id, series.points.map((p) => p.value))
            for (const p of latest) {
              total.set(id, (total.get(id) ?? 0) + 1)
              if (readNeedle(domain, p.value).pegged) pegged.set(id, (pegged.get(id) ?? 0) + 1)
            }
          }
        }, country.id)
      }
    }

    expect(total.size, 'the surveyed century published nothing').toBeGreaterThan(10)
    const offenders: string[] = []
    for (const [id, n] of total) {
      const rate = (pegged.get(id) ?? 0) / n
      if (rate > 0.02) offenders.push(`${id} pegged ${(rate * 100).toFixed(1)}% of ${n} prints`)
    }
    expect(offenders, 'a dial face no longer fits its indicator — retune INDICATOR_FACE').toEqual([])
  })
})
