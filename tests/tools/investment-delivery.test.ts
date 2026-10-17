import { describe, expect, it } from 'vitest'
import { createCountryParams, init, SECTOR_IDS, type TrueState } from '../../packages/engine/src/index'
import { sectorRecord } from '../../packages/engine/src/math'
import {
  createTally, deliveryWorksheet, describeTally, outageProbe, tallyQuarter,
} from '../../tools/measure-investment-delivery'

function goods(manuf: number, services: number): TrueState {
  const initial = init(createCountryParams('meridia', 'delivery-fixture'), 'delivery-fixture')
  return {
    ...initial,
    io: { ...initial.io, coeff: SECTOR_IDS.map(() => SECTOR_IDS.map(() => 0)) },
    sectors: initial.sectors.map((sector) => ({ ...sector,
      output: sector.id === 'manuf' ? manuf : sector.id === 'services' ? services : 0,
    })),
    flows: { ...initial.flows, investmentReal: 100,
      importsReal: sectorRecord(() => 0), grossDemand: sectorRecord(() => 0) },
  }
}

function manufacturingInput(state: TrueState, coefficient: number): TrueState {
  return { ...state, io: { ...state.io, coeff: state.io.coeff.map((row, i) => row.map((value, j) =>
    SECTOR_IDS[i] === 'manuf' && SECTOR_IDS[j] === 'services' ? coefficient : value,
  )) } }
}

describe('necessary goods constraints, without inventing deliveries', () => {
  it('balances a feasible input-output network in the correct matrix direction', () => {
    // Services use 20 manufacturing inputs, leaving exactly the 60/40 bundle.
    const row = deliveryWorksheet(manufacturingInput(goods(80, 40), 0.5))
    expect(row.intermediateUse.manuf).toBe(20)
    expect(row.intermediateUse.services).toBe(0)
    expect(row.afterInputs.manuf).toBe(60)
    expect(row.hasInputDeficit).toBe(false)
    expect(row.investmentEnvelope).toBe(100)
  })

  it('detects impossible intermediate use after independently capping a supplier', () => {
    const row = deliveryWorksheet(manufacturingInput(goods(10, 100), 0.5))
    expect(row.inputDeficit.manuf).toBe(40)
    expect(row.hasInputDeficit).toBe(true)
    expect(row.investmentEnvelope).toBe(0)
  })

  it('lets imports repair the input deficit before counting investment goods', () => {
    const state = manufacturingInput(goods(10, 100), 0.5)
    const imported = (manuf: number) => deliveryWorksheet({ ...state, flows: {
      ...state.flows, importsReal: { ...state.flows.importsReal, manuf },
    } })
    expect(imported(40).hasInputDeficit).toBe(false)
    expect(imported(40).investmentEnvelope).toBe(0)
    expect(imported(100).investmentEnvelope).toBe(100)
  })

  it('includes imported FDI machinery once, without rationing it by domestic capacity', () => {
    const state = goods(25, 40)
    const row = deliveryWorksheet({ ...state, flows: { ...state.flows,
      foreignDirectInvestmentReal: 100,
      importsReal: { ...state.flows.importsReal, manuf: 35 },
      grossDemand: { ...state.flows.grossDemand, manuf: 50 },
    } })
    expect(row.capacityConstrained).toBe(true)
    expect(row.investmentEnvelope).toBe(100)
    expect(row.investmentOutsideEnvelope).toBe(0)
  })

  it('requires both parts of the bundle, even if their weighted satisfaction looks high', () => {
    const row = deliveryWorksheet(goods(60, 20))
    expect(row.investmentEnvelope).toBe(50)
    expect(row.investmentOutsideEnvelope).toBe(50)
  })

  it('does not mistake a generous capital-goods envelope for whole-economy feasibility', () => {
    const state = goods(60, 40)
    const broken = { ...state, io: { ...state.io, coeff: state.io.coeff.map((row, i) => row.map((value, j) =>
      SECTOR_IDS[i] === 'agri' && SECTOR_IDS[j] === 'manuf' ? 1 : value,
    )) } }
    const row = deliveryWorksheet(broken)
    expect(row.hasInputDeficit).toBe(true)
    expect(row.inputDeficit.agri).toBe(60)
    expect(row.investmentEnvelope).toBe(100)
  })

  it('ignores roundoff in event counts and reports an empty conditional sample as null', () => {
    expect(describeTally(createTally()).inputDeficitQuarterPct).toBeNull()
    const tally = createTally()
    tallyQuarter(tally, goods(60, 40 - 1e-12))
    expect(tally.investmentOutsideEnvelopeQuarters).toBe(0)
    expect(tally.inputDeficitQuarters).toBe(0)
  })

  it('isolates a real engine capacity outage while auditing what joins capital', () => {
    const state = init(createCountryParams('meridia', 'delivery-outage'), 'delivery-outage')
    const probe = outageProbe(state)
    expect(probe.orderedInvestment).toBeGreaterThan(0)
    expect(probe.outage.investmentEnvelope).toBeLessThan(probe.baseline.investmentEnvelope)
    expect(probe.capitalAdditionBeforeFloors).toBeCloseTo(probe.orderedInvestment, 9)
  })
})
