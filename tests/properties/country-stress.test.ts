import { describe, expect, it } from 'vitest'
import { COUNTRY_CATALOG } from '@terrarium/engine'
import { randomPolicy } from '../../packages/runner/src/batch'
import { runBatch } from '../../packages/runner/src/batch'
import { runOne } from '../../packages/runner/src/run'

describe('the full country matrix', () => {
  it('distributes an all-country batch evenly and reproducibly', () => {
    const first = runBatch({ runs: COUNTRY_CATALOG.length * 2, ticks: 8, country: 'all', policy: 'passive' })
    const second = runBatch({ runs: COUNTRY_CATALOG.length * 2, ticks: 8, country: 'all', policy: 'passive' })
    expect(first.runs.map((run) => run.countryId)).toEqual([
      ...COUNTRY_CATALOG.map((country) => country.id),
      ...COUNTRY_CATALOG.map((country) => country.id),
    ])
    expect(first.runs.map((run) => run.stateHash)).toEqual(second.runs.map((run) => run.stateHash))
  })

  it('survives passive and random government across every scenario recipe', () => {
    for (const country of COUNTRY_CATALOG) {
      for (let i = 0; i < 5; i++) {
        for (const policy of [undefined, randomPolicy]) {
          const run = runOne({
            country: country.id,
            seed: `country-matrix-${country.id}-${i}`,
            ticks: 120,
            policy,
          })
          expect(run.nanCount, `${country.id} seed ${i} produced NaN`).toBe(0)
          expect(run.priceExplosions, `${country.id} seed ${i} exploded`).toBe(0)
        }
      }
    }
  })
})
