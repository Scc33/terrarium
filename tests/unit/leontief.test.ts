import { describe, expect, it } from 'vitest'
import { leontiefGross, solveLinear } from '../../packages/engine/src/math'

describe('solveLinear', () => {
  it('solves a known 2×2 system', () => {
    const x = solveLinear(
      [
        [2, 1],
        [1, 3],
      ],
      [5, 10],
    )
    expect(x[0]).toBeCloseTo(1, 10)
    expect(x[1]).toBeCloseTo(3, 10)
  })

  it('throws on a singular matrix', () => {
    expect(() =>
      solveLinear(
        [
          [1, 2],
          [2, 4],
        ],
        [1, 2],
      ),
    ).toThrow(/singular/)
  })
})

describe('leontiefGross', () => {
  it('reproduces gross output from final demand: x = (I−A)⁻¹f', () => {
    const A = [
      [0.1, 0.2],
      [0.3, 0.05],
    ]
    const f = [10, 20]
    const x = leontiefGross(A, f)
    // check (I−A)x = f
    expect(x[0] - (0.1 * x[0] + 0.2 * x[1])).toBeCloseTo(10, 8)
    expect(x[1] - (0.3 * x[0] + 0.05 * x[1])).toBeCloseTo(20, 8)
    // gross exceeds final demand — intermediates are real
    expect(x[0]).toBeGreaterThan(10)
    expect(x[1]).toBeGreaterThan(20)
  })

  it('clamps negative solutions to zero', () => {
    const x = leontiefGross(
      [
        [0, 0],
        [0, 0],
      ],
      [-5, 3],
    )
    expect(x[0]).toBe(0)
    expect(x[1]).toBe(3)
  })
})
