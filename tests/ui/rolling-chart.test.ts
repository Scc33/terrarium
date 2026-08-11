import { describe, expect, it } from 'vitest'
import { rollingAverage, type ShapedPoint } from '../../packages/ui/src/components/series'

function point(forQtr: number, value: number): ShapedPoint {
  return {
    forQtr,
    value,
    firstPrint: value - 1,
    errorBand: 2,
    firstBand: 4,
    revision: 2,
    lag: 1,
    revisionDelta: 1,
    visiblyRevised: false,
  }
}

describe('rollingAverage', () => {
  const points = [0, 1, 2, 3, 4].map((qtr) => point(qtr, (qtr + 1) * 4))

  it('maps 3, 6 and 12 months to one, two and four quarterly prints', () => {
    expect(rollingAverage(points, 3).map((p) => p.value)).toEqual([4, 8, 12, 16, 20])
    expect(rollingAverage(points, 6).map((p) => p.value)).toEqual([6, 10, 14, 18])
    expect(rollingAverage(points, 12).map((p) => p.value)).toEqual([10, 14])
  })

  it('does not smooth across a gap in the published record', () => {
    const withGap = [point(0, 1), point(1, 2), point(3, 4), point(4, 5), point(5, 6), point(6, 7)]

    expect(rollingAverage(withGap, 12).map((p) => p.forQtr)).toEqual([6])
  })

  it('averages releases and their confessed bands without mutating the inputs', () => {
    const input = [point(0, 4), { ...point(1, 8), errorBand: 4, firstBand: 6, revision: 1 }]
    const before = structuredClone(input)

    expect(rollingAverage(input, 6)).toEqual([
      expect.objectContaining({
        forQtr: 1,
        value: 6,
        firstPrint: 5,
        errorBand: 3,
        firstBand: 5,
        revision: 1,
        revisionDelta: 1,
      }),
    ])
    expect(input).toEqual(before)
  })
})
