import { describe, expect, it } from 'vitest'
import { createSave, hashState, init, replay, step, validate } from '@terrarium/engine'
import { fuelTaxAtQ8, standardCountry } from '@terrarium/fixtures'
import { runOne } from '../../packages/runner/src/run'
import { randomPolicy } from '../../packages/runner/src/batch'

const SEEDS = Array.from({ length: 25 }, (_, i) => `det-${i}`)

describe('replay determinism', () => {
  it('same seed + same actions ⇒ identical state hash (25 seeds)', () => {
    for (const seed of SEEDS) {
      const a = runOne({ seed, ticks: 60, policy: randomPolicy })
      const b = runOne({ seed, ticks: 60, policy: randomPolicy })
      expect(b.stateHash).toBe(a.stateHash)
    }
  })

  it('replay(save) reproduces the same state every time', () => {
    const save = createSave(standardCountry, 'replay-live', fuelTaxAtQ8)
    const replayed = replay(save, 40)
    const fresh = replay(save, 40)
    expect(replayed.meta.tick).toBe(40)
    expect(replayed.gov.dials.taxRates.fuel).toBe(0.5)
    expect(hashState(replayed)).toBe(hashState(fresh))
  })
})

describe('standing invariants (across seeds and random policy)', () => {
  it('no NaN, prices bounded, capacities in [0,1], savings ≥ 0', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      let s = init(standardCountry, seed)
      for (let t = 0; t < 80; t++) {
        s = step(s)
        validate(s) // throws with a pointed message on violation
      }
    }
  })

  it('budget identity: Δdebt + printing covers the deficit each quarter', () => {
    let s = init(standardCountry, 'budget-id')
    for (let t = 0; t < 60; t++) {
      const debtBefore = s.gov.debt
      s = step(s)
      const { balance } = s.gov.budget
      const dDebt = s.gov.debt - debtBefore
      if (balance < 0) {
        expect(dDebt + s.flows.printedThisQtr).toBeCloseTo(-balance, 6)
      } else {
        expect(debtBefore - s.gov.debt).toBeCloseTo(Math.min(balance, debtBefore), 6)
      }
    }
  })
})
