import { describe, expect, it } from 'vitest'
import { LONG_RUN_MIN_SPAN_QTRS, longRunReading, longRunTrail } from '@terrarium/observation'

const at = (forQtr: number, value: number) => ({ forQtr, value })

describe('longRunTrail', () => {
  it('averages the latest revision of each quarter, once', () => {
    // publication order: q0's revision arrives after q1's first print
    const points = [at(0, 1), at(1, 3), at(0, 5)]
    expect(longRunReading(points, 'mean', 0, 9)).toEqual({ value: 4, from: 0, to: 1, quarters: 2 })
  })

  it('reads only the window it is given', () => {
    const points = [at(0, 100), at(1, 2), at(2, 4), at(3, 100)]
    expect(longRunReading(points, 'mean', 1, 2)!.value).toBe(3)
    expect(longRunReading(points, 'mean', 10, 12)).toBeNull()
  })

  it('chains annualized growth prints instead of averaging them', () => {
    // 21% a quarter annualized then a flat quarter: the level rose 10% over
    // two quarters, which is 21% a year — not the 10.5% a plain mean claims
    const quarterly = 100 * (Math.pow(1.1, 4) - 1)
    expect(longRunReading([at(0, quarterly), at(1, 0)], 'compound', 0, 1)!.value).toBeCloseTo(21, 9)
    expect(longRunReading([at(0, 4), at(1, 4)], 'compound', 0, 1)!.value).toBeCloseTo(4, 9)
  })

  it('survives a print that would annualize a level to nothing', () => {
    expect(Number.isFinite(longRunReading([at(0, -100), at(1, 3)], 'compound', 0, 1)!.value)).toBe(true)
  })

  it('annualizes a level, but only once a year separates the endpoints', () => {
    const doubling = Array.from({ length: 9 }, (_, q) => at(q, Math.pow(2, q / 8)))
    const trail = longRunTrail(doubling, 'growth', 0, 8)
    expect(trail[0].to).toBe(LONG_RUN_MIN_SPAN_QTRS)
    expect(trail[trail.length - 1].value).toBeCloseTo(100 * (Math.SQRT2 - 1), 9)
    expect(longRunTrail(doubling, 'growth', 0, LONG_RUN_MIN_SPAN_QTRS - 1)).toEqual([])
  })

  it('skips a quarter the office never measured rather than interpolating it', () => {
    const trail = longRunTrail([at(0, 2), at(5, 6)], 'mean', 0, 9)
    expect(trail.map((r) => r.to)).toEqual([0, 5])
    expect(trail[1]).toEqual({ value: 4, from: 0, to: 5, quarters: 2 })
  })
})
