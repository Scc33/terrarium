import { describe, expect, it } from 'vitest'
import { COUNTRY_FUZZ_PROFILES, runCountryFuzzCase, sampleCountry } from '../../packages/runner/src/country-fuzz'

describe('the fixed country fuzz corpus', () => {
  it('preserves standing invariants across sampling profiles and policies', () => {
    for (const profile of COUNTRY_FUZZ_PROFILES) {
      for (let index = 0; index < 4; index++) {
        const sample = sampleCountry(profile, index, 'ci-country-fuzz')
        for (const policy of ['passive', 'random'] as const) {
          const outcome = runCountryFuzzCase(sample, { ticks: 80, policy })
          expect(outcome.failure, `${profile} ${index} ${policy}`).toBeNull()
          expect(outcome.summary!.nanCount).toBe(0)
          if (profile === 'recipe') expect(outcome.summary!.priceExplosions).toBe(0)
        }
      }
    }
  })

  it('repeats a checked run exactly from the same case', () => {
    const sample = sampleCountry('edges', 9, 'repeat-fuzz')
    const first = runCountryFuzzCase(sample, { ticks: 60, policy: 'random' })
    const second = runCountryFuzzCase(sample, { ticks: 60, policy: 'random' })
    expect(second.summary).toEqual(first.summary)
    expect(second.findings).toEqual(first.findings)
    expect(second.failure).toEqual(first.failure)
  })
})
