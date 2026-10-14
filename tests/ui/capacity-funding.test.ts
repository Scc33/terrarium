import { describe, expect, it } from 'vitest'
import { applyAction, init, politicalCostOfAction, step } from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'
import { capacityFunding } from '../../packages/ui/src/capacityFunding'

describe('ministry bids account for commitments', () => {
  it('keeps the ordinary bid and reports its cash bill separately from PC', () => {
    const pub = observe(init(standardCountry, 'capacity-quote'))
    const quote = capacityFunding({ ...pub, treasury: { ...pub.treasury, revenue: 10 } }, 'tax')
    expect(quote.amount).toBe(8)
    expect(quote.moneyPerQtr).toBe(1)
    expect(quote.programmes).toBe(0)
  })

  it('caps a large bid at remaining room, including every stacked programme', () => {
    let state = init({ ...standardCountry, capacities: { ...standardCountry.capacities, tax: 0.8 } }, 'capacity-room')
    state = applyAction(state, { kind: 'investCapacity', target: 'tax', amount: 2 })
    state = applyAction(state, { kind: 'investCapacity', target: 'tax', amount: 1 })
    const pub = observe(state)
    const quote = capacityFunding({ ...pub, treasury: { ...pub.treasury, revenue: 100 } }, 'tax')
    expect(quote.amount).toBeCloseTo(9)
    expect(quote.programmes).toBe(2)
    expect(quote.activeMoneyPerQtr).toBeCloseTo(3 / 8)
    expect(quote.moneyRemaining).toBeCloseTo(3)
    // It is an actionable order, rather than a cosmetically smaller price.
    expect(politicalCostOfAction(state, { kind: 'investCapacity', target: 'tax', amount: quote.amount })).toBe(2)
    state = applyAction(state, { kind: 'investCapacity', target: 'tax', amount: quote.amount })
    const funded = capacityFunding(observe(state), 'tax')
    expect(funded.full).toBe(true)
    expect(funded.amount).toBe(0)
  })

  it('stops offering FUND when deliveries in flight already meet the engine gate', () => {
    const state = applyAction(
      init({ ...standardCountry, capacities: { ...standardCountry.capacities, tax: 0.94 } }, 'capacity-funded'),
      { kind: 'investCapacity', target: 'tax', amount: 1 },
    )
    expect(observe(state).capacity.tax).toBeLessThan(0.95)
    expect(capacityFunding(observe(state), 'tax').full).toBe(true)
    expect(() => politicalCostOfAction(state, { kind: 'investCapacity', target: 'tax', amount: 1 })).toThrow(/full strength/)
  })

  it('keeps programmes on different ministries separate and retires paid bills', () => {
    let state = init(standardCountry, 'capacity-bills')
    state = applyAction(state, { kind: 'investCapacity', target: 'tax', amount: 2 })
    state = applyAction(state, { kind: 'investCapacity', target: 'statistical', amount: 1 })
    state = step(state)
    const quote = capacityFunding(observe(state), 'tax')
    expect(quote.programmes).toBe(1)
    expect(quote.remaining).toBe(7)
    expect(quote.activeMoneyPerQtr).toBe(0.25)
    expect(quote.moneyRemaining).toBe(1.75)
    for (let tick = 1; tick < 8; tick++) state = step(state)
    const finished = capacityFunding(observe(state), 'tax')
    expect(finished.activeMoneyPerQtr).toBe(0)
    expect(finished.moneyRemaining).toBe(0)
    expect(finished.programmes).toBe(0)
  })
})
