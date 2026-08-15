/**
 * Time-series plot geometry.
 *
 * The bug these exist to prevent: the wall's terminal chart borrowed the
 * dial's fixed face for its y-axis and CLAMPED the trace into it, so any
 * value outside the face drew as a flat line along the rail. Over a surveyed
 * century that is not a rare event — `price_fuel` reaches 152 against a 130
 * face, `gdp_growth` spans −33 to +54 against ±15 — so the chart failed
 * silently at exactly the moments worth looking at.
 *
 * The first three describes hold the axis policy that replaced it, and they
 * matter in both directions: the frame must EXTEND to fit the data (or the
 * clamp is back), and it must NOT shrink inside the face (or the trace's
 * height stops being comparable with the dial beside it, which is the thing
 * ADR-0006 exists to protect).
 */

import { describe, expect, it } from 'vitest'
import { INDICATOR_FACE } from '../../packages/ui/src/domains'
import {
  nearestPoint,
  niceTicks,
  tickStep,
  timePlot,
  yAxis,
  type PlotPoint,
} from '../../packages/ui/src/plot'

const BOX = { w: 300, h: 150, padL: 30, padR: 10, padT: 10, padB: 15 }
const at = (tick: number, value: number): PlotPoint => ({ tick, value })

describe('the axis frames a face without obeying it', () => {
  const face = { lo: 40, hi: 130 }

  it('is exactly the face while the data stays inside it', () => {
    const y = yAxis([55, 90, 128, 41], { face })
    expect(y.lo).toBe(40)
    expect(y.hi).toBe(130)
    expect(y.faceLo).toBeNull()
    expect(y.faceHi).toBeNull()
  })

  it('extends past the face rather than clamping to it', () => {
    // the measured price_fuel excursion: a 130 face, a 152.1 print
    const y = yAxis([60, 95, 152.1], { face })
    expect(y.hi).toBeGreaterThanOrEqual(152.1)
    expect(y.lo).toBe(40)
  })

  it('reports the rail it crossed so the painter can rule it', () => {
    expect(yAxis([60, 152.1], { face }).faceHi).toBe(130)
    expect(yAxis([60, 152.1], { face }).faceLo).toBeNull()
    expect(yAxis([12, 60], { face }).faceLo).toBe(40)
    expect(yAxis([12, 60], { face }).faceHi).toBeNull()

    // an economy that left the dial in both directions says so twice
    const both = yAxis([12, 152.1], { face })
    expect(both.faceLo).toBe(40)
    expect(both.faceHi).toBe(130)
  })

  it('never shrinks inside the face, however quiet the century', () => {
    // a flat, boring series must still be drawn against the whole face —
    // auto-scaling a calm decade is how a needle's height stops meaning
    // anything between two quarters
    const y = yAxis([88, 88.1, 87.9], { face })
    expect(y.lo).toBe(40)
    expect(y.hi).toBe(130)
  })

  it('rounds an extended rail onto the gridline step, not the raw extremum', () => {
    const y = yAxis([60, 152.1], { face })
    expect(y.ticks).toContain(y.hi)
    expect(Number.isInteger(y.hi * 10)).toBe(true)
  })
})

describe('every real dial face survives its own measured century', () => {
  /**
   * The measured p01–max of each indicator over 12 seeds × 6 countries, from
   * `pnpm ranges`. Held here as the excursions the chart has to be able to
   * draw: if a retune widens one of these and the axis policy regresses to
   * clamping, this fails by name rather than in a player's hands.
   */
  const MEASURED_EXTREMES: Partial<Record<keyof typeof INDICATOR_FACE, [number, number]>> = {
    price_fuel: [38.6, 152.1],
    price_food: [45.1, 189.2],
    gdp_growth: [-33.3, 53.7],
    inflation: [-18.5, 41.9],
    unrest: [-12.5, 75.9],
    asset_prices: [58.5, 158.2],
    gdp_per_capita: [5.0, 156.8],
    consumption_per_capita: [3.5, 122.9],
  }

  it('draws the whole excursion, and marks where the dial ended', () => {
    for (const [id, [min, max]] of Object.entries(MEASURED_EXTREMES)) {
      const face = INDICATOR_FACE[id as keyof typeof INDICATOR_FACE]
      if (face === 'ratchet') continue
      const y = yAxis([min, max], { face })

      expect(y.lo, `${id} clipped its measured minimum`).toBeLessThanOrEqual(min)
      expect(y.hi, `${id} clipped its measured maximum`).toBeGreaterThanOrEqual(max)
      // and the face is still the reference: one of the rails must be ruled,
      // because every one of these indicators does leave its dial
      expect(
        y.faceLo !== null || y.faceHi !== null,
        `${id} left its face but no dial limit was reported`,
      ).toBe(true)
    }
  })
})

describe('the axis without a face', () => {
  it('is the data, padded outward', () => {
    const y = yAxis([10, 20], { pad: 0.1 })
    expect(y.lo).toBeCloseTo(9)
    expect(y.hi).toBeCloseTo(21)
  })

  it('contains the values it was told to include', () => {
    // an index chart must show 100 even when the whole series sits below it
    expect(yAxis([70, 80], { include: [100] }).hi).toBeGreaterThanOrEqual(100)
    // a rate chart must show zero even in a century that never went negative
    expect(yAxis([4, 9], { include: [0] }).lo).toBeLessThanOrEqual(0)
  })

  it('gives a flat series a box with height rather than a divide by zero', () => {
    const y = yAxis([7, 7, 7])
    expect(y.hi).toBeGreaterThan(y.lo)
  })

  it('survives an empty series and non-finite readings', () => {
    expect(yAxis([]).hi).toBeGreaterThan(yAxis([]).lo)
    const y = yAxis([NaN, Infinity, 5, 9])
    expect(Number.isFinite(y.lo) && Number.isFinite(y.hi)).toBe(true)
  })
})

describe('gridlines are readable numbers', () => {
  it('steps by 1, 2 or 5 times a power of ten', () => {
    for (const span of [0.4, 3, 7, 24, 90, 340, 1200, 47000]) {
      const step = tickStep(span)
      const mantissa = step / Math.pow(10, Math.floor(Math.log10(step)))
      expect([1, 2, 5, 10]).toContain(Math.round(mantissa))
    }
  })

  it('lands inside the range, ascending, without float dust', () => {
    for (const [lo, hi] of [[-15, 15], [0, 1], [40, 152], [-0.3, 0.3], [86, 890]] as const) {
      const ticks = niceTicks(lo, hi)
      expect(ticks.length).toBeGreaterThan(1)
      for (const t of ticks) {
        expect(t).toBeGreaterThanOrEqual(lo)
        expect(t).toBeLessThanOrEqual(hi)
        // the accumulation bug: `v += step` 400 times prints 99.99999999999999
        expect(String(t).length).toBeLessThan(9)
      }
      expect([...ticks].sort((a, b) => a - b)).toEqual(ticks)
    }
  })

  it('always labels at least two values on a drawable axis', () => {
    // one number up the side of a chart is no scale at all: the reader
    // cannot tell a rise of two points from a rise of twenty. This fired on
    // the expenditure accounts, whose shares live in a band (75–87) that a
    // readable step of 10 labels exactly once.
    for (const [lo, hi] of [
      [75.4, 86.6], // households, % of final expenditure
      [10.2, 15.9], // exports
      [3.1, 6.4], // capital formation
      [0.02, 0.09],
      [999, 1001],
    ] as const) {
      for (const target of [2, 3, 4]) {
        expect(niceTicks(lo, hi, target).length, `${lo}–${hi} @${target}`).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('prints zero as zero, never as minus zero', () => {
    expect(niceTicks(-10, 10).filter((t) => t === 0)).toEqual([0])
    expect(niceTicks(-10, 10).some((t) => Object.is(t, -0))).toBe(false)
  })

  it('survives a degenerate range', () => {
    expect(niceTicks(5, 5)).toEqual([5])
    expect(niceTicks(NaN, 3)).toHaveLength(1)
  })
})

describe('paths', () => {
  const rising = [at(0, 10), at(4, 20), at(8, 30)]

  it('maps the data corners onto the box corners', () => {
    const plot = timePlot([rising], BOX, { pad: 0 })
    expect(plot.sx(0)).toBeCloseTo(BOX.padL)
    expect(plot.sx(8)).toBeCloseTo(BOX.w - BOX.padR)
    expect(plot.sy(plot.y.hi)).toBeCloseTo(BOX.padT)
    expect(plot.sy(plot.y.lo)).toBeCloseTo(BOX.h - BOX.padB)
  })

  it('emits no NaN into any path', () => {
    // a wedge that emits NaN draws nothing, which in review is
    // indistinguishable from a quarter with no data in it
    const dirty = [at(0, 10), at(2, NaN), at(4, 20), at(6, Infinity), at(8, 30)]
    const plot = timePlot([dirty], BOX)
    for (const d of [
      plot.line(dirty),
      plot.area(dirty, 0),
      plot.ribbon(dirty.map((p) => ({ ...p, band: 2 }))),
      plot.wedge(dirty, rising),
    ]) {
      expect(d ?? '').not.toMatch(/NaN|Infinity|undefined/)
    }
  })

  it('refuses to draw a line through fewer than two points', () => {
    const plot = timePlot([rising], BOX)
    expect(plot.line([])).toBeNull()
    expect(plot.line([at(0, 1)])).toBeNull()
    expect(plot.area([at(0, 1)], 0)).toBeNull()
    expect(plot.ribbon([{ tick: 0, value: 1, band: 1 }])).toBeNull()
  })

  it('closes an area back to its baseline', () => {
    const plot = timePlot([rising], BOX, { include: [0] })
    const d = plot.area(rising, 0)!
    expect(d.endsWith('Z')).toBe(true)
    expect(d).toContain(plot.sy(0).toFixed(1))
  })

  it('encloses only the quarters two series share', () => {
    const plot = timePlot([rising], BOX)
    // deaths published for one quarter the birth register missed
    const under = [at(0, 5), at(4, 6), at(8, 7), at(12, 8)]
    const d = plot.wedge(rising, under)!
    expect(d).not.toContain(plot.sx(12).toFixed(1))
    expect(d.endsWith('Z')).toBe(true)
  })

  it('thins a century without moving its ends', () => {
    const century = Array.from({ length: 400 }, (_, i) => at(i, Math.sin(i / 8) * 10))
    const plot = timePlot([century], BOX)
    const d = plot.line(century)!
    const segments = d.split('L').length
    expect(segments).toBeLessThan(400)
    expect(d).toContain(`M${plot.sx(0).toFixed(1)}`)
    expect(d.endsWith(`${plot.sx(399).toFixed(1)},${plot.sy(century[399].value).toFixed(1)}`)).toBe(true)
  })

  it('shares an x axis when the caller pins one', () => {
    // the census draws the vital rates over the head count; the two publish
    // different quarters and must still line up
    const short = [at(20, 1), at(24, 2)]
    const plot = timePlot([short], BOX, {}, { x0: 0, x1: 400 })
    expect(plot.x0).toBe(0)
    expect(plot.x1).toBe(400)
    expect(plot.sx(20)).toBeGreaterThan(BOX.padL)
    expect(plot.sx(20)).toBeLessThan(BOX.w / 2)
  })
})

describe('nearestPoint', () => {
  const points = [at(0, 1), at(4, 2), at(8, 3)]

  it('finds the quarter under the cursor, including past both ends', () => {
    expect(nearestPoint(points, 3)?.tick).toBe(4)
    expect(nearestPoint(points, -99)?.tick).toBe(0)
    expect(nearestPoint(points, 99)?.tick).toBe(8)
  })

  it('returns null rather than a fabricated point', () => {
    expect(nearestPoint([], 3)).toBeNull()
  })
})
