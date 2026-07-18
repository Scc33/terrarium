import { describe, expect, it } from 'vitest'
import { applyActions, init, IllegalActionError, step } from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'

const fresh = () => init(standardCountry, 'actions-test')

describe('applyActions', () => {
  it('sets a dial and charges political capital', () => {
    const s0 = fresh()
    const s1 = applyActions(s0, [{ kind: 'setDial', path: 'taxRates.fuel', value: 0.3 }])
    expect(s1.gov.dials.taxRates.fuel).toBe(0.3)
    expect(s1.politics.politicalCapital).toBeLessThan(s0.politics.politicalCapital)
  })

  it('rejects out-of-bounds dial values loudly', () => {
    expect(() =>
      applyActions(fresh(), [{ kind: 'setDial', path: 'taxRates.income', value: 0.95 }]),
    ).toThrow(IllegalActionError)
    expect(() =>
      applyActions(fresh(), [{ kind: 'setDial', path: 'policyRate', value: -0.01 }]),
    ).toThrow(IllegalActionError)
  })

  it('rejects actions the player cannot afford', () => {
    let s = fresh()
    // burn PC with a series of expensive swings until one fails
    expect(() => {
      for (let i = 0; i < 30; i++) {
        s = applyActions(s, [
          { kind: 'setDial', path: 'taxRates.income', value: i % 2 === 0 ? 0.6 : 0.1 },
        ])
      }
    }).toThrow(/political capital/)
  })

  it('queues capacity investment with lag and per-quarter outlays', () => {
    const s0 = fresh()
    const s1 = applyActions(s0, [{ kind: 'investCapacity', target: 'statistical', amount: 12 }])
    expect(s1.gov.pipeline).toHaveLength(1)
    expect(s1.gov.pipeline[0].remaining).toBe(8)
    // capacity arrives over time, not instantly
    expect(s1.gov.capacity.statistical).toBe(s0.gov.capacity.statistical)
    const s2 = step(s1)
    expect(s2.gov.capacity.statistical).toBeGreaterThan(s0.gov.capacity.statistical * 0.996)
  })

  it('refuses to fund a ministry already at full strength', () => {
    const s0 = fresh()
    const maxed = {
      ...s0,
      gov: { ...s0.gov, capacity: { ...s0.gov.capacity, statistical: 0.96 } },
    }
    expect(() =>
      applyActions(maxed, [{ kind: 'investCapacity', target: 'statistical', amount: 5 }]),
    ).toThrow(/full strength/)
    // in-flight programmes count toward the ceiling too
    const building = applyActions(fresh(), [
      { kind: 'investCapacity', target: 'statistical', amount: 12 },
    ])
    const nearMax = {
      ...building,
      gov: { ...building.gov, capacity: { ...building.gov.capacity, statistical: 0.9 } },
    }
    expect(() =>
      applyActions(nearMax, [{ kind: 'investCapacity', target: 'statistical', amount: 12 }]),
    ).toThrow(/full strength/)
  })

  it('refuses the dials after deposition', () => {
    const s0 = fresh()
    const deposed = { ...s0, politics: { ...s0.politics, inPower: false } }
    expect(() =>
      applyActions(deposed, [{ kind: 'setDial', path: 'taxRates.fuel', value: 0.1 }]),
    ).toThrow(/deposed/)
  })
})
