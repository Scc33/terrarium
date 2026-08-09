import { describe, expect, it } from 'vitest'
import { applyActions, init, step, validate } from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'
import { officialNominalGdp } from '../../packages/engine/src/state/spending'

describe('rule-based spending under a live economy', () => {
  it('stays finite and resolves GDP shares from the official series across seeds', () => {
    for (let seed = 0; seed < 12; seed++) {
      let state = init(standardCountry, `rules-live-${seed}`)
      for (let tick = 0; tick < 4; tick++) state = step(state)
      state = {
        ...state,
        politics: { ...state.politics, politicalCapital: 1_000 },
      }
      state = applyActions(state, [
        {
          kind: 'setSpendingRule',
          programme: 'transfers',
          mode: 'indexed',
          value: state.gov.dials.spending.transfers,
        },
        { kind: 'setSpendingRule', programme: 'procurement', mode: 'gdpShare', value: 0.03 },
        { kind: 'setSpendingRule', programme: 'investment', mode: 'gdpShare', value: 0.02 },
      ])

      for (let tick = 0; tick < 160; tick++) {
        state = step(state)
        validate(state)
        const official = officialNominalGdp(state)
        expect(official).not.toBeNull()
        expect(state.gov.dials.spending.procurement).toBeCloseTo(official! * 0.03, 9)
        expect(state.gov.dials.spending.investment).toBeCloseTo(official! * 0.02, 9)
        for (const amount of Object.values(state.gov.dials.spending)) {
          expect(Number.isFinite(amount)).toBe(true)
          expect(amount).toBeGreaterThanOrEqual(0)
        }
        expect(Math.max(...Object.values(state.market.prices))).toBeLessThan(50)
      }
    }
  })
})
