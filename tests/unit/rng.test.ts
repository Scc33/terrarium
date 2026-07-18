import { describe, expect, it } from 'vitest'
import { rngFor } from '@terrarium/engine'

describe('rng substreams', () => {
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
