/**
 * The feasibility study runs in the browser, so its metric definitions are
 * copied out of `packages/runner` rather than imported — `packages/ui` must not
 * depend on a node CLI package. Copies drift silently, so the load-bearing test
 * here is the agreement one: the same country, the same seed, the same quarter
 * count, run through both implementations, must produce the same numbers.
 *
 * If that test fails, one of the two definitions moved and the study has
 * quietly stopped being comparable with the published country matrix.
 */

import { describe, expect, it } from 'vitest'
import { createCountryDocument, createCountryParams, countryFromDocument } from '@terrarium/engine'
import { runOne } from '../../packages/runner/src/run'
import { cagr, meanAnnualInflation, meanUnemployment } from '../../packages/runner/src/metrics'
import {
  TRIAL_REFERENCE,
  TRIAL_SEEDS,
  runTrial,
  trialSeed,
} from '../../packages/ui/src/worker/trial'

const meridia = createCountryParams('meridia', 'unused')

describe('the study agrees with the batch runner', () => {
  it('computes growth, inflation and unemployment identically', () => {
    const seeds = 3
    const ticks = 120
    const report = runTrial(meridia, { seeds, ticks, baseSeed: 'agree' })

    // recompute the same three seeds through the runner and compare medians
    const runs = Array.from({ length: seeds }, (_, i) =>
      runOne({ seed: trialSeed('agree', i), ticks, params: meridia }),
    )
    const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

    expect(report.candidate.growth.p50).toBeCloseTo(median(runs.map(cagr)), 9)
    expect(report.candidate.inflation.p50).toBeCloseTo(median(runs.map(meanAnnualInflation)), 9)
    expect(report.candidate.unemployment.p50).toBeCloseTo(median(runs.map(meanUnemployment)), 9)
  })

  it('agrees on deposition, which is the difficulty signal', () => {
    const seeds = 4
    const ticks = 200
    const report = runTrial(createCountryParams('veltravia', 'unused'), {
      seeds,
      ticks,
      baseSeed: 'fall',
    })
    const runs = Array.from({ length: seeds }, (_, i) =>
      runOne({ seed: trialSeed('fall', i), ticks, params: createCountryParams('veltravia', 'x') }),
    )
    const fell = runs.filter((r) => r.deposedAt !== null).length
    expect(report.candidate.deposedShare).toBeCloseTo(fell / seeds, 12)
  })

  it('uses the batch runner’s own failure definitions', () => {
    // a legal-but-hostile vector: the tripwire is prices past 50× or under 1/50×
    const report = runTrial(meridia, { seeds: 2, ticks: 60, baseSeed: 'clean' })
    const runs = Array.from({ length: 2 }, (_, i) =>
      runOne({ seed: trialSeed('clean', i), ticks: 60, params: meridia }),
    )
    const broken = runs.filter((r) => r.nanCount > 0 || r.priceExplosions > 0).length
    expect(report.candidate.brokenRuns).toBe(broken)
  })
})

describe('the study as an instrument', () => {
  it('is reproducible from its own inputs', () => {
    const opts = { seeds: 2, ticks: 80, baseSeed: 'same' }
    const a = runTrial(meridia, opts)
    const b = runTrial(meridia, opts)
    expect(a.candidate).toEqual(b.candidate)
    expect(a.reference).toEqual(b.reference)
  })

  it('reads a candidate against the reference on identical seeds', () => {
    const report = runTrial(meridia, { seeds: 2, ticks: 80, baseSeed: 'ref' })
    // Meridia studied against Meridia is the degenerate case, and it must be
    // exact — anything else means the two legs are not running the same trial
    expect(report.reference.country).toBe(createCountryParams(TRIAL_REFERENCE, 'x').name)
    expect(report.candidate.growth).toEqual(report.reference.growth)
    expect(report.candidate.unemployment).toEqual(report.reference.unemployment)
  })

  it('separates a materially different country from the reference', () => {
    const costona = createCountryParams('costona', 'unused')
    const report = runTrial(costona, { seeds: 3, ticks: 200, baseSeed: 'apart' })
    expect(report.candidate.country).toBe('Costona')
    // Migration is now a pressure valve on Costona's rural labour reserve, so
    // unemployment alone no longer owns the distinction. The study must still
    // expose the materially different output path rather than silently reading
    // the two recipes as alike.
    expect(report.reference.growth.p50 - report.candidate.growth.p50).toBeGreaterThan(0.5)
  })

  it('reports a band, not a single century', () => {
    const report = runTrial(meridia, { seeds: 5, ticks: 200, baseSeed: 'band' })
    const { p25, p50, p75 } = report.candidate.growth
    expect(p25).toBeLessThanOrEqual(p50)
    expect(p50).toBeLessThanOrEqual(p75)
    expect(p75).toBeGreaterThan(p25) // seeds genuinely disagree about a century
  })

  it('studies a document the way the worker will', () => {
    const doc = createCountryDocument({ ...meridia, name: 'Halvern' }, 'balanced')
    const report = runTrial(countryFromDocument(doc), { seeds: 2, ticks: 80, baseSeed: 'doc' })
    expect(report.candidate.country).toBe('Halvern')
    expect(report.candidate.brokenRuns).toBe(0)
  })

  it('reports progress once per century so a wait can explain itself', () => {
    const seen: number[] = []
    const report = runTrial(meridia, {
      seeds: 2,
      ticks: 40,
      baseSeed: 'progress',
      onProgress: (p) => seen.push(p.done),
    })
    expect(seen).toEqual([1, 2, 3, 4])
    expect(report.candidate.seeds).toBe(2)
  })

  it('stays inside the budget a two-second study implies', () => {
    const started = performance.now()
    runTrial(meridia, { baseSeed: 'budget' })
    const elapsed = performance.now() - started
    // generous: CI machines are slower than a laptop, and this is a guard
    // against an accidental order-of-magnitude regression, not a benchmark
    expect(elapsed).toBeLessThan(20_000)
    expect(TRIAL_SEEDS).toBeLessThanOrEqual(12)
  })
})
