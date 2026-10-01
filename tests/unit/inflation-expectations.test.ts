import { describe, expect, it } from 'vitest'
import { init, privateRealRate, rngFor, type TrueState } from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'
import { INFLATION_EXPECTATIONS_MAX, INFLATION_EXPECTATIONS_MIN } from '../../packages/engine/src/constants'
import { labor } from '../../packages/engine/src/pipeline/labor'
import { monetary } from '../../packages/engine/src/pipeline/monetary'
import { prices } from '../../packages/engine/src/pipeline/prices'

const fresh = () => init(standardCountry, 'inflation-expectations-test')
const experienced = (s: TrueState, annual: number): TrueState => ({
  ...s, flows: { ...s.flows, inflationQ: annual / 4, printedThisQtr: 0 },
})
const expected = (s: TrueState, annual: number): TrueState => ({
  ...s, ledger: { ...s.ledger, consumerInflationExpectations: annual },
})
const update = (s: TrueState) => monetary.run(s, rngFor(s.meta.seed, 'monetary', s.meta.tick))
const bargain = (s: TrueState) => labor.run(s, rngFor(s.meta.seed, 'labor', s.meta.tick))

describe('experienced inflation and the wage bargain', () => {
  it('learns slowly from a one-quarter spike, but follows persistent inflation', () => {
    const s = expected(fresh(), 0)
    const pulse = update(experienced(s, 0.2))
    expect(pulse.ledger.consumerInflationExpectations).toBeGreaterThan(0)
    expect(pulse.ledger.consumerInflationExpectations).toBeLessThan(0.03)
    let transient = pulse
    let persistent = pulse
    for (let quarter = 0; quarter < 12; quarter++) {
      transient = update(experienced(transient, 0))
      persistent = update(experienced(persistent, 0.2))
    }
    expect(transient.ledger.consumerInflationExpectations).toBeLessThan(0.01)
    expect(persistent.ledger.consumerInflationExpectations).toBeGreaterThan(0.15)
    expect(persistent.ledger.consumerInflationExpectations).toBeLessThan(0.2)
  })

  it('money financing retains its nominal pressure without immediately indexing household bargains', () => {
    const s = experienced(fresh(), 0)
    const financed = { ...s, flows: { ...s.flows, printedThisQtr: s.flows.nominalGdp * 0.1 } }
    expect(update(financed).ledger.inflationExpectations).toBeGreaterThan(update(s).ledger.inflationExpectations)
    expect(update(financed).ledger.consumerInflationExpectations).toBe(update(s).ledger.consumerInflationExpectations)
    expect(bargain(update(financed)).market.wages).toEqual(bargain(update(s)).market.wages)
  })

  it('keeps sustained extreme inflation and deflation within the expectation rails', () => {
    expect(update(experienced(expected(fresh(), INFLATION_EXPECTATIONS_MAX), 100)).ledger.consumerInflationExpectations)
      .toBe(INFLATION_EXPECTATIONS_MAX)
    expect(update(experienced(expected(fresh(), INFLATION_EXPECTATIONS_MIN), -100)).ledger.consumerInflationExpectations)
      .toBe(INFLATION_EXPECTATIONS_MIN)
  })

  it('a new spot-price spike does not immediately index wages', () => {
    const s = expected(fresh(), 0.03)
    const low = bargain(experienced(s, -0.1))
    const high = bargain(experienced(s, 0.2))
    expect(high.market.wages).toEqual(low.market.wages)
    expect(high.flows.inflationQ).toBe(0.05)
    expect(high.ledger).toEqual(s.ledger)
  })

  it('higher household expectations reach wages and subsequent costs without repricing finance directly', () => {
    const s = fresh()
    const before = structuredClone(s)
    const low = expected(s, 0.02)
    const high = expected(s, 0.08)
    const lowBargain = bargain(low)
    const highBargain = bargain(high)
    const lowWages = lowBargain.market.wages
    const highWages = highBargain.market.wages
    const lowPrices = prices.run(lowBargain, rngFor(s.meta.seed, 'prices', 0)).market.prices
    const highPrices = prices.run(highBargain, rngFor(s.meta.seed, 'prices', 0)).market.prices
    for (const sector of s.sectors) {
      expect(highWages[sector.id]).toBeGreaterThan(lowWages[sector.id])
      expect(highWages[sector.id] / lowWages[sector.id]).toBeLessThan(1.02)
      expect(highPrices[sector.id]).toBeGreaterThan(lowPrices[sector.id])
    }
    expect(privateRealRate(high)).toBe(privateRealRate(low))
    expect(s).toEqual(before)
  })

  it('learns the same household experience regardless of survey funding', () => {
    const s = experienced(fresh(), 0.1)
    const unfunded = { ...s, gov: { ...s.gov, capacity: { ...s.gov.capacity, statistical: 0 } } }
    const funded = { ...s, gov: { ...s.gov, capacity: { ...s.gov.capacity, statistical: 1 } } }
    expect(update(unfunded).ledger.consumerInflationExpectations)
      .toBe(update(funded).ledger.consumerInflationExpectations)
  })
})
