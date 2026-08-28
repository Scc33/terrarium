import { describe, expect, it } from 'vitest'
import {
  AGE_BANDS,
  init,
  lifeExpectancyAtBirth,
  periodLifeExpectancy,
} from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'

describe('period life expectancy', () => {
  it('turns the standard 1946 age hazards into a stable baseline', () => {
    const state = init(standardCountry, 'life-table-baseline')
    expect(state.demography.mortalityIndex).toBe(1)
    expect(lifeExpectancyAtBirth(state)).toBeCloseTo(48.872, 3)
  })

  it('rises when mortality falls at any age', () => {
    const schedule = Array.from({ length: AGE_BANDS }, (_, band) =>
      band === AGE_BANDS - 1 ? 0.2 : 0.01,
    )
    const baseline = periodLifeExpectancy(schedule)

    for (let band = 0; band < AGE_BANDS; band++) {
      const safer = [...schedule]
      safer[band] *= 0.5
      expect(periodLifeExpectancy(safer), `age band ${band}`).toBeGreaterThan(baseline)
    }
  })

  it('treats 80+ as an open interval and rejects incomplete life tables', () => {
    const schedule = Array.from({ length: AGE_BANDS }, (_, band) =>
      band === AGE_BANDS - 1 ? 0.2 : 0,
    )
    expect(periodLifeExpectancy(schedule)).toBeCloseTo(85, 10)
    expect(() => periodLifeExpectancy(schedule.slice(0, -1))).toThrow(/17 age bands/)
    expect(() => periodLifeExpectancy([...schedule.slice(0, -1), 0])).toThrow(/open-ended/)
  })
})
