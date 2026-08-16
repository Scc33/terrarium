import { describe, expect, it } from 'vitest'
import { rngFor } from '@terrarium/engine'

describe('rng substreams', () => {
  it('keeps the established stream byte-for-byte', () => {
    const uniform = rngFor('fixture-seed', 'fixture-label', 42)
    expect(Array.from({ length: 6 }, () => uniform.next())).toEqual([
      0.03975929971784353,
      0.5775197404436767,
      0.013310370035469532,
      0.36090975860133767,
      0.9302876319270581,
      0.28282143571414053,
    ])

    const normal = rngFor('fixture-seed', 'fixture-normal', 42)
    expect(Array.from({ length: 4 }, () => normal.normal())).toEqual([
      -0.495965781938985,
      -2.1056046534312096,
      -1.7763713090540143,
      0.277673751138802,
    ])
  })

  it('is deterministic for the same (seed, label, tick)', () => {
    const a = rngFor('s1', 'production', 5)
    const b = rngFor('s1', 'production', 5)
    for (let i = 0; i < 20; i++) expect(a.next()).toBe(b.next())
  })

  it('isolates substreams: different labels and ticks diverge', () => {
    const a = rngFor('s1', 'production', 5)
    const b = rngFor('s1', 'prices', 5)
    const c = rngFor('s1', 'production', 6)
    const av = Array.from({ length: 8 }, () => a.next())
    const bv = Array.from({ length: 8 }, () => b.next())
    const cv = Array.from({ length: 8 }, () => c.next())
    expect(av).not.toEqual(bv)
    expect(av).not.toEqual(cv)
  })

  it('produces roughly uniform values in [0,1)', () => {
    const rng = rngFor('s2', 'uniform', 0)
    let sum = 0
    for (let i = 0; i < 10_000; i++) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
      sum += v
    }
    expect(sum / 10_000).toBeGreaterThan(0.48)
    expect(sum / 10_000).toBeLessThan(0.52)
  })

  it('normal() has sane mean and spread', () => {
    const rng = rngFor('s3', 'normal', 0)
    const n = 10_000
    let sum = 0
    let sumSq = 0
    for (let i = 0; i < n; i++) {
      const v = rng.normal(0, 1)
      sum += v
      sumSq += v * v
    }
    const mean = sum / n
    const sd = Math.sqrt(sumSq / n - mean * mean)
    expect(Math.abs(mean)).toBeLessThan(0.05)
    expect(sd).toBeGreaterThan(0.95)
    expect(sd).toBeLessThan(1.05)
  })
})
