import { describe, expect, it } from 'vitest'

/**
 * Executable record of the paired sensitivities behind investigation 0006.
 *
 * Measured at ec63e9c with ten identical seeds per column through 2050. The
 * openness comparison changed only MERIDIA_PARAMS.openness. The age comparison
 * replaced Meridia's within-band 1946 pyramid with Costona's younger shape,
 * rescaled separately below and above retirement so opening population and
 * cohort totals stayed fixed. These are characterization experiments, not
 * proposed country defaults or an engine retune.
 */
const OPENNESS = {
  passive: {
    low: { futureGrowthP01: -3.0074, downsideGrowthP50: -2.1608, exportShare: 8.7121 },
    high: { futureGrowthP01: -5.1613, downsideGrowthP50: -4.2931, exportShare: 18.0179 },
  },
  developmental: {
    low: { futureGrowthP01: -4.4541, downsideGrowthP50: -3.5558, exportShare: 17.1927 },
    high: { futureGrowthP01: -7.7119, downsideGrowthP50: -6.0590, exportShare: 26.0407 },
  },
} as const

const OPENING_AGE_SHAPE = {
  passive: { standardFutureGrowthP01: -5.3907, youngerFutureGrowthP01: -5.3445 },
  developmental: { standardFutureGrowthP01: -5.7207, youngerFutureGrowthP01: -5.7354 },
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
