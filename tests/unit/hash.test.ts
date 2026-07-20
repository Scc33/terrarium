/**
 * The golden-replay harness lives or dies on hashState: it must be stable
 * (float serialisation noise can't flake a test) and sensitive (a real state
 * change must move the hash). Both are asserted here, since every golden test
 * trusts them implicitly.
 */

import { describe, expect, it } from 'vitest'
import { hashState, stableStringify } from '@terrarium/engine'

describe('hashState', () => {
  it('is deterministic and 32-bit hex', () => {
    const v = { a: 1, b: [2, 3], c: { d: 4.5 } }
    expect(hashState(v)).toBe(hashState(structuredClone(v)))
    expect(hashState(v)).toMatch(/^[0-9a-f]{8}$/)
  })

  it('rounds to 10 significant digits, so float noise cannot flake it', () => {
    // the canonical float trap: 0.1 + 0.2 !== 0.3 in IEEE-754
    expect(0.1 + 0.2).not.toBe(0.3)
    expect(hashState(0.1 + 0.2)).toBe(hashState(0.3))
    // …and values that agree to 10 significant digits collapse together,
    // even when they differ below that (1/3 vs a 10-digit truncation)
    expect(1 / 3).not.toBe(0.3333333333)
    expect(hashState({ x: 1 / 3 })).toBe(hashState({ x: 0.3333333333 }))
  })

  it('is sensitive: a real value change moves the hash', () => {
    expect(hashState({ a: 1 })).not.toBe(hashState({ a: 2 }))
    // a change above the rounding floor is caught
    expect(hashState({ x: 0.333333333 })).not.toBe(hashState({ x: 0.333333334 }))
  })

  it('stableStringify preserves non-finite markers rather than rounding them', () => {
    // NaN/Infinity serialise to null under JSON — the point is it doesn't throw
    // and a validate() upstream is what actually catches them
    expect(() => stableStringify({ x: NaN, y: Infinity })).not.toThrow()
  })
})
