import { describe, expect, it } from 'vitest'

/**
 * Executable record of the rejected four-quarter drought-recovery experiment.
 *
 * Candidate 815a0aa geometrically restored agricultural TFP over four quarters
 * instead of one. Both columns are the same fixed 5-seed × 6-country cohort,
 * measured through 2050. Keeping the failed acceptance comparison here stops a
 * future agent from repeating the intuitively attractive retune without first
 * explaining why its price/wage path should differ. See investigation 0005.
 */
const MEASURED = {
  passive: {
    baseline: {
      futureDroughtTroughP05: -8.7795,
      futureDroughtReboundP95: 9.8728,
      futureQuietInflationP01: -7.89,
      futureQuietGrowthP01: -5.4988,
      survivors: 22,
    },
    gradual: {
      futureDroughtTroughP05: -10.4924,
      futureDroughtReboundP95: 12.7491,
      futureQuietInflationP01: -8.6037,
      futureQuietGrowthP01: -5.9142,
      survivors: 22,
    },
  },
  developmental: {
    baseline: {
      futureDroughtPeakP95: 15.9364,
      futureDroughtTroughP05: -6.3796,
      futureDroughtReboundP95: 12.5487,
      survivors: 17,
    },
    gradual: {
      futureDroughtPeakP95: 13.5097,
      futureDroughtTroughP05: -7.7298,
      futureDroughtReboundP95: 10.7816,
      survivors: 14,
    },
  },
} as const

describe('the rejected gradual drought-recovery experiment', () => {
  it('records the passive acceptance failures that caused the revert', () => {
    const { baseline, gradual } = MEASURED.passive
    expect(gradual.futureDroughtTroughP05).toBeLessThan(baseline.futureDroughtTroughP05)
    expect(gradual.futureDroughtReboundP95).toBeGreaterThan(baseline.futureDroughtReboundP95)
    expect(gradual.futureQuietInflationP01).toBeLessThan(baseline.futureQuietInflationP01)
    expect(gradual.futureQuietGrowthP01).toBeLessThan(baseline.futureQuietGrowthP01)
  })

  it('records why the developmental improvement was not enough to ship', () => {
    const { baseline, gradual } = MEASURED.developmental
    expect(gradual.futureDroughtPeakP95).toBeLessThan(baseline.futureDroughtPeakP95)
    expect(gradual.futureDroughtReboundP95).toBeLessThan(baseline.futureDroughtReboundP95)
    expect(gradual.futureDroughtTroughP05).toBeLessThan(baseline.futureDroughtTroughP05)
    expect(gradual.survivors).toBeLessThan(baseline.survivors)
  })
})
