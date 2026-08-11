import { describe, expect, it } from 'vitest'

/**
 * Executable record of the paired sensitivities behind investigation 0006.
 *
 * Measured at ef83ea5 with ten identical seeds per column through 2050. The
 * openness comparison changed only MERIDIA_PARAMS.openness. The age comparison
 * replaced Meridia's within-band 1946 pyramid with Costona's younger shape,
 * rescaled separately below and above retirement so opening population and
 * cohort totals stayed fixed. These are characterization experiments, not
 * proposed country defaults or an engine retune.
 */
const OPENNESS = {
  passive: {
    low: { futureGrowthP01: -3.0086, downsideGrowthP50: -2.1639, exportShare: 8.7042 },
    high: { futureGrowthP01: -5.1611, downsideGrowthP50: -4.2943, exportShare: 18.0175 },
  },
  developmental: {
    low: { futureGrowthP01: -4.4565, downsideGrowthP50: -3.5596, exportShare: 17.1830 },
    high: { futureGrowthP01: -7.7130, downsideGrowthP50: -6.0596, exportShare: 26.0381 },
  },
} as const

const OPENING_AGE_SHAPE = {
  passive: { standardFutureGrowthP01: -5.3945, youngerFutureGrowthP01: -5.3490 },
  developmental: { standardFutureGrowthP01: -5.7229, youngerFutureGrowthP01: -5.7384 },
} as const

describe('quiet late-growth driver experiments', () => {
  it('records openness as a causal amplifier with all other country inputs paired', () => {
    for (const result of Object.values(OPENNESS)) {
      expect(result.high.futureGrowthP01).toBeLessThan(result.low.futureGrowthP01 - 1.5)
      expect(result.high.downsideGrowthP50).toBeLessThan(result.low.downsideGrowthP50 - 1.5)
      expect(result.high.exportShare).toBeGreaterThan(result.low.exportShare)
    }
  })

  it('records that a younger 1946 pyramid did not remove the late tail', () => {
    for (const result of Object.values(OPENING_AGE_SHAPE)) {
      expect(
        Math.abs(result.youngerFutureGrowthP01 - result.standardFutureGrowthP01),
      ).toBeLessThan(0.1)
    }
  })
})
