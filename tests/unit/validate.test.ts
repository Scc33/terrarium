/**
 * validate() is the engine's smoke alarm — determinism.test.ts runs it across
 * random centuries, trusting it to throw on a broken state. So the alarm
 * itself must be tested: here we doctor a good state into each failure mode
 * and assert it actually trips.
 */

import { describe, expect, it } from 'vitest'
import { init, InvariantError, validate, type TrueState } from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'

const good = () => init(standardCountry, 'validate-base')

/** apply a mutation to a deep clone so each case starts from a valid state */
function broken(mutate: (s: TrueState) => void): TrueState {
  const s = structuredClone(good())
  mutate(s)
  return s
}

describe('validate()', () => {
  it('passes a freshly initialised state', () => {
    expect(() => validate(good())).not.toThrow()
  })

  const cases: Array<[string, (s: TrueState) => void]> = [
    ['a NaN price', (s) => (s.market.prices.agri = NaN)],
    ['a non-positive price', (s) => (s.market.prices.manuf = 0)],
    ['negative capital', (s) => (s.sectors[0].capital = -1)],
    ['negative sector credit', (s) => (s.sectors[0].credit = -5)],
    ['a non-positive asset price', (s) => (s.finance.assetPrice = 0)],
    ['negative bank capital', (s) => (s.finance.bankCapital = -1)],
    ['negative savings', (s) => (s.cohorts[0].savings = -1)],
    ['approval outside [0,1]', (s) => (s.cohorts[0].approval = 1.5)],
    ['capacity outside [0,1]', (s) => (s.gov.capacity.tax = 2)],
    ['negative debt', (s) => (s.gov.debt = -10)],
    ['consumption weights that do not sum to 1', (s) => (s.cohorts[0].consumptionWeights.agri += 0.2)],
    ['a negative sovereign fund', (s) => (s.gov.fund = -1)],
    // The pair is one net position (ADR-0036). A state holding both is not a
    // state `fiscal` can produce, which is exactly why the alarm has to be able
    // to see it: it is what a hand-edited save or a future financing branch
    // that forgot its ordering would look like.
    ['a fund and a debt at once', (s) => (s.gov.fund = 10)],
    ['a surplus payout above 1', (s) => (s.gov.dials.surplusPayout = 1.5)],
    ['a negative surplus payout', (s) => (s.gov.dials.surplusPayout = -0.1)],
  ]

  for (const [name, mutate] of cases) {
    it(`throws InvariantError on ${name}`, () => {
      expect(() => validate(broken(mutate))).toThrow(InvariantError)
    })
  }
})
