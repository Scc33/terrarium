/**
 * Foreign direct investment is productive capital with an external owner,
 * not a free openness modifier. These properties pin issue #40's scale claim
 * and both sides of the accounting identity: investment arrives now; part of
 * the profits and reserves leave later.
 */

import { describe, expect, it } from 'vitest'
import {
  createCountryParams,
  fdiStructuralAttraction,
  init,
  rngFor,
  step,
  TICK_ORDER,
  type TrueState,
} from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'

function runStep(name: string, state: TrueState): TrueState {
  const pipelineStep = TICK_ORDER.find((candidate) => candidate.name === name)!
  return pipelineStep.run(
    state,
    rngFor(state.meta.seed, pipelineStep.name, state.meta.tick),
  )
}

function play(country: 'meridia' | 'costona' | 'oranga', ticks = 20): TrueState {
  let state = init(createCountryParams(country, 'fdi-country'), 'fdi-country')
  for (let tick = 0; tick < ticks; tick++) state = step(state)
  return state
}

function inflowShare(state: TrueState): number {
  return state.flows.foreignDirectInvestmentValue / state.flows.nominalGdp
}

describe('foreign direct investment terrain', () => {
  it('makes FDI more important to small economies without making absolute flows scale backwards', () => {
    const smallFactor = fdiStructuralAttraction(10, 0.35, 1)
    const largeFactor = fdiStructuralAttraction(100, 0.35, 1)

    expect(smallFactor).toBeGreaterThan(largeFactor)
    // A ten-times larger otherwise-identical economy still attracts more
    // money in absolute terms; only FDI/GDP falls with scale.
    expect(500 * largeFactor).toBeGreaterThan(50 * smallFactor)
  })

  it('makes the same open market more attractive while it still has a development gap', () => {
    const developing = fdiStructuralAttraction(27.5, 0.2, 1)
    const developed = fdiStructuralAttraction(27.5, 0.8, 1)
    expect(developing).toBeGreaterThan(developed)
  })

  it('makes the small open harbor rely on FDI more than the baseline or agrarian giant', () => {
    const oranga = play('oranga')
    const meridia = play('meridia')
    const costona = play('costona')

    expect(inflowShare(oranga)).toBeGreaterThan(inflowShare(meridia) * 1.5)
    expect(inflowShare(meridia)).toBeGreaterThan(inflowShare(costona))
  })

  it('does not turn a change in output composition into a larger technology gap', () => {
    let base = init(standardCountry, 'fdi-composition')
    for (let tick = 0; tick < 12; tick++) base = step(base)

    const servicesHeavy = {
      ...base,
      sectors: base.sectors.map((sector) => ({
        ...sector,
        output: sector.id === 'services' ? sector.output * 20 : sector.output * 0.1,
      })),
    }
    const ordinaryFlow = runStep('foreignInvestment', base)
    const servicesHeavyFlow = runStep('foreignInvestment', servicesHeavy)
    expect(inflowShare(servicesHeavyFlow)).toBeCloseTo(inflowShare(ordinaryFlow), 12)
  })

  it('rewards trade access, administration and after-tax returns', () => {
    let base = init(standardCountry, 'fdi-policy')
    for (let tick = 0; tick < 12; tick++) base = step(base)

    const closed = runStep('foreignInvestment', {
      ...base,
      params: { ...base.params, openness: 0.35 },
    })
    const open = runStep('foreignInvestment', {
      ...base,
      params: { ...base.params, openness: 1.6 },
    })
    expect(inflowShare(open)).toBeGreaterThan(inflowShare(closed) * 2)

    const weakState = runStep('foreignInvestment', {
      ...base,
      gov: {
        ...base.gov,
        capacity: { ...base.gov.capacity, administrative: 0.05, tax: 1 },
        dials: {
          ...base.gov.dials,
          taxRates: { ...base.gov.dials.taxRates, corporate: 0.8 },
        },
      },
    })
    const capableState = runStep('foreignInvestment', {
      ...base,
      gov: {
        ...base.gov,
        capacity: { ...base.gov.capacity, administrative: 0.9, tax: 1 },
        dials: {
          ...base.gov.dials,
          taxRates: { ...base.gov.dials.taxRates, corporate: 0.05 },
        },
      },
    })
    expect(inflowShare(capableState)).toBeGreaterThan(inflowShare(weakState) * 1.5)
  })

  it('shelves most new projects in a domestic banking crisis without liquidating the stock', () => {
    let calm = init(standardCountry, 'fdi-crisis')
    for (let tick = 0; tick < 12; tick++) calm = step(calm)
    calm = { ...calm, finance: { ...calm.finance, crisisQtrsLeft: 0 } }
    const crisis = {
      ...calm,
      finance: { ...calm.finance, crisisQtrsLeft: 4, crisisSeverity: 0.8 },
    }

    const calmFlow = runStep('foreignInvestment', calm)
    const crisisFlow = runStep('foreignInvestment', crisis)
    expect(inflowShare(crisisFlow)).toBeCloseTo(inflowShare(calmFlow) * 0.3, 10)
    expect(crisisFlow.external.foreignOwnedCapital).toBe(calm.external.foreignOwnedCapital)
  })

  it('does not feed direct-investment demand into an extreme price spiral', () => {
    let calm = init(standardCountry, 'fdi-inflation')
    for (let tick = 0; tick < 12; tick++) calm = step(calm)
    const unstable = {
      ...calm,
      flows: { ...calm.flows, inflationQ: 0.15 },
    }

    const calmFlow = runStep('foreignInvestment', calm)
    const unstableFlow = runStep('foreignInvestment', unstable)
    expect(inflowShare(unstableFlow)).toBeLessThan(inflowShare(calmFlow) * 0.2)
  })
})

describe('foreign direct investment accounting', () => {
  let base = init(standardCountry, 'fdi-books')
  for (let tick = 0; tick < 12; tick++) base = step(base)

  it('enters the ordinary investment order book', () => {
    const noFdi = runStep('production', {
      ...base,
      flows: {
        ...base.flows,
        foreignDirectInvestmentReal: 0,
        foreignDirectInvestmentValue: 0,
      },
    })
    const withFdi = runStep('production', {
      ...base,
      flows: {
        ...base.flows,
        foreignDirectInvestmentReal: 2,
        foreignDirectInvestmentValue: 2,
      },
    })
    expect(withFdi.flows.investmentReal - noFdi.flows.investmentReal).toBeCloseTo(2, 10)
    expect(withFdi.flows.importsReal.manuf - noFdi.flows.importsReal.manuf).toBeCloseTo(0.7, 10)
  })

  it('settles inflows and remitted profits through the external account', () => {
    const emptyTrade = {
      ...base,
      flows: {
        ...base.flows,
        exportsReal: Object.fromEntries(Object.keys(base.flows.exportsReal).map((id) => [id, 0])) as TrueState['flows']['exportsReal'],
        importsReal: Object.fromEntries(Object.keys(base.flows.importsReal).map((id) => [id, 0])) as TrueState['flows']['importsReal'],
        foreignDirectInvestmentValue: 2,
        foreignProfitRemittances: 0.5,
      },
    }
    const settled = runStep('trade', emptyTrade)
    // Booked in the balance of payments, which is where the accounting claim
    // lives: an inflow arrives and a remittance leaves, and neither vanishes.
    // It used to be asserted against RESERVES, and that stopped being the same
    // statement at schema 42 (ADR-0034): reserves now move only by what the
    // central bank transacts, and the rest of the balance clears at a price.
    // Whether the bank buys this particular 1.5 is a question about the dial,
    // not about foreign investment.
    expect(settled.flows.currentAccount).toBeCloseTo(1.5, 10)
  })

  it('adds new FDI to the foreign-owned capital stock after depreciation', () => {
    const input = {
      ...base,
      flows: { ...base.flows, foreignDirectInvestmentReal: 2 },
    }
    const accumulated = runStep('labor', input)
    expect(accumulated.external.foreignOwnedCapital).toBeCloseTo(
      base.external.foreignOwnedCapital * 0.985 + 2,
      10,
    )
  })

  it('does not distribute remitted earnings to domestic households', () => {
    const domestic = runStep('cohorts', {
      ...base,
      flows: { ...base.flows, foreignProfitRemittances: 0 },
    })
    const foreignOwned = runStep('cohorts', {
      ...base,
      flows: { ...base.flows, foreignProfitRemittances: 2 },
    })
    const domesticProfits = domestic.cohorts.reduce((sum, cohort) => sum + cohort.profitIncome, 0)
    const foreignOwnedProfits = foreignOwned.cohorts.reduce(
      (sum, cohort) => sum + cohort.profitIncome,
      0,
    )
    expect(domesticProfits - foreignOwnedProfits).toBeCloseTo(2, 10)
  })

  it('runs between domestic finance and production in the versioned pipeline', () => {
    const names = TICK_ORDER.map((pipelineStep) => pipelineStep.name)
    expect(names.indexOf('foreignInvestment')).toBe(names.indexOf('finance') + 1)
    expect(names.indexOf('production')).toBe(names.indexOf('foreignInvestment') + 1)
  })
})
