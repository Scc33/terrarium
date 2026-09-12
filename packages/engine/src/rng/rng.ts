/**
 * RNG discipline (§6 of the architecture doc):
 * one root seed; every consumer derives a named substream keyed by
 * (seed, label, tick). A step's draws are isolated — adding a draw in one
 * step never shifts another step's sequence.
 *
 * xmur3 string hash seeds an sfc32 generator. Both are tiny, fast, and
 * deterministic across platforms (all 32-bit integer math).
 */

import { NORMAL_UNIFORM_BITS, NORMAL_UNIFORM_DRAWS, NORMAL_UNIFORM_SCALE } from '../constants'

export type Seed = string

export interface Rng {
  /** uniform in [0, 1) */
  next(): number
  /** uniform in [lo, hi) */
  range(lo: number, hi: number): number
  /** standard-normal approximation from six packed uniform components */
  normal(mean?: number, sd?: number): number
}

function xmur3Seeds(str: string): [number, number, number, number] {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  const seeds: [number, number, number, number] = [0, 0, 0, 0]
  for (let i = 0; i < seeds.length; i++) {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    seeds[i] = h >>> 0
  }
  return seeds
}

/** One prototype serves every substream. Keeping the PRNG words on an object
 * avoids manufacturing five closures (and their runtime name metadata) for
 * every pipeline step and statistical print. A century creates tens of
 * thousands of these short-lived substreams, so the object shape matters. */
class Sfc32Rng implements Rng {
  constructor(
    private a: number,
    private b: number,
    private c: number,
    private d: number,
  ) {}

  private nextWord(): number {
    this.a >>>= 0
    this.b >>>= 0
    this.c >>>= 0
    this.d >>>= 0
    const t = (this.a + this.b) | 0
    this.a = this.b ^ (this.b >>> 9)
    this.b = (this.c + (this.c << 3)) | 0
    this.c = (this.c << 21) | (this.c >>> 11)
    this.d = (this.d + 1) | 0
    const out = (t + this.d) | 0
    this.c = (this.c + out) | 0
    return out >>> 0
  }

  next(): number {
    return this.nextWord() / 4294967296
  }

  range(lo: number, hi: number): number {
    return lo + (hi - lo) * this.next()
  }

  normal(mean = 0, sd = 1): number {
    const chunksPerWord = NORMAL_UNIFORM_DRAWS / 2
    const unusedBits = 32 - NORMAL_UNIFORM_BITS * chunksPerWord
    const mask = (1 << NORMAL_UNIFORM_BITS) - 1
    // Keep the high thirty bits of each word, split into three exact uniforms.
    const a = this.nextWord() >>> unusedBits
    const b = this.nextWord() >>> unusedBits
    const sum =
      (a & mask) +
      ((a >>> NORMAL_UNIFORM_BITS) & mask) +
      ((a >>> (NORMAL_UNIFORM_BITS * 2)) & mask) +
      (b & mask) +
      ((b >>> NORMAL_UNIFORM_BITS) & mask) +
      ((b >>> (NORMAL_UNIFORM_BITS * 2)) & mask)
    const midpoint = NORMAL_UNIFORM_DRAWS / 2
    const centred = (sum + midpoint) / (1 << NORMAL_UNIFORM_BITS) - midpoint
    return mean + sd * centred * NORMAL_UNIFORM_SCALE
  }
}

/** Derive the named substream for a pipeline step (or 'init', 'obs:gdp', …). */
export function rngFor(seed: Seed, label: string, tick: number): Rng {
  const [a, b, c, d] = xmur3Seeds(`${seed}\0${label}\0${tick}`)
  const rng = new Sfc32Rng(a, b, c, d)
  // burn a few values: sfc32 needs warm-up from correlated seeds
  for (let i = 0; i < 6; i++) rng.next()
  return rng
}
