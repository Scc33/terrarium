import { describe, expect, it } from 'vitest'
import { standardCountry } from '@terrarium/fixtures'
import { observe } from '@terrarium/observation'
import {
  applyActions, averageCoupon, benchmarkYieldAt, bondPrice, couponBill,
  createSave, debtMaturityShares, effectivePurchaseRate, expectedPolicyRateAt,
  initialBonds, init, issueBonds, privateLongRealRate, privateRealRate,
  quoteYieldCurve, replay, rngFor, settleDebt, step, termPremiumAt, validate,
  yieldCurveOf, YIELD_IDS,
} from '@terrarium/engine'
import { finance } from '../../packages/engine/src/pipeline/finance'
import { fiscal } from '../../packages/engine/src/pipeline/fiscal'
import { DEBT_CEILING } from '../../packages/engine/src/constants'

const curve = yieldCurveOf(0, 0.04, 0.04, 0, 0)

describe('dealer expectations and duration pricing', () => {
  it('has a rising normal curve, an inversion after a hike, and a steepening after a cut', () => {
    expect(curve.yields.ten_year).toBeGreaterThan(curve.yields.three_month)
    const hike = yieldCurveOf(1, 0.08, 0.04, 0, 0)
    const cut = yieldCurveOf(1, 0.005, 0.04, 0, 0)
    expect(hike.yields.ten_year).toBeLessThan(hike.yields.three_month)
    expect(cut.yields.ten_year - cut.yields.three_month).toBeGreaterThan(curve.yields.ten_year - curve.yields.three_month)
    expect(expectedPolicyRateAt(0.08, 0.04, 0)).toBe(0.08)
    expect(expectedPolicyRateAt(0.04, 0.04, 40)).toBe(0.04)
    expect(termPremiumAt(40)).toBeLessThan(0.008)
    expect(benchmarkYieldAt(0, 0, 0.2, 40)).toBe(0)
  })

  it('learns only observed policy and quotes the same prices with different hidden GDP and expectations', () => {
    let state = init(standardCountry, 'quote-fog', 'god')
    for (let q = 0; q < 12; q++) state = step(state)
    state = applyActions(state, [{ kind: 'setDial', path: 'policyRate', value: 0.08 }])
    const quote = quoteYieldCurve(state)
    expect(quote.policyAnchor).toBeGreaterThan(0.04)
    expect(quote.policyAnchor).toBeLessThan(0.08)
    const hidden = { ...state, flows: { ...state.flows, nominalGdp: state.flows.nominalGdp * 3 },
      ledger: { ...state.ledger, inflationExpectations: 0.2, consumerInflationExpectations: -0.02 } }
    expect(quoteYieldCurve(hidden)).toEqual(quote)
    for (const id of YIELD_IDS) expect(quote.yields[id] - quote.benchmark[id]).toBeCloseTo(quote.sovereignPremium, 12)
    const empty = init(standardCountry, 'no-release')
    expect(quoteYieldCurve(empty).sovereignPremium).toBe(empty.finance.yieldCurve.sovereignPremium)
  })
})

describe('fixed contracts and cash settlement', () => {
  it('ladders inherited debt without changing its opening coupon bill', () => {
    const lots = initialBonds(100)
    expect(lots.reduce((sum, lot) => sum + lot.principal, 0)).toBeCloseTo(100, 12)
    expect(couponBill(lots)).toBeCloseTo(1, 12)
    expect(averageCoupon(lots)).toBeCloseTo(0.04, 12)
    expect(averageCoupon([])).toBeNull()
    expect(new Set(lots.map(lot => lot.maturesAt)).size).toBe(40)
  })

  it('quotes each new maturity while an order leaves old contracts untouched', () => {
    const state = init(standardCountry, 'maturity-order', { unlimitedCapital: true, protectedTenure: true })
    const changed = applyActions(state, [{ kind: 'setDial', path: 'debtMaturity', value: 1 },
      { kind: 'setDial', path: 'policyRate', value: 0.08 }])
    expect(changed.gov.bonds).toEqual(state.gov.bonds)
    expect(couponBill(changed.gov.bonds)).toBe(couponBill(state.gov.bonds))
    expect(issueBonds(20, 0, 2, curve)).toEqual([{ principal: 20, coupon: curve.yields.one_year, issuedAt: 2, maturesAt: 6 }])
    expect(issueBonds(20, 1, 2, curve)).toEqual([{ principal: 20, coupon: curve.yields.ten_year, issuedAt: 2, maturesAt: 42 }])
    expect(issueBonds(0, 0.5, 2, curve)).toEqual([])
    for (const mix of [0, 0.2, 0.5, 0.8, 1]) {
      expect(Object.values(debtMaturityShares(mix)).reduce((sum, share) => sum + share, 0)).toBeCloseTo(1, 12)
      expect(issueBonds(20, mix, 2, curve).reduce((sum, lot) => sum + lot.principal, 0)).toBeCloseTo(20, 12)
    }
    expect(fiscal.run(changed, rngFor('maturity-order', 'fiscal', 0)).flows.debtInterest).toBeCloseTo(state.gov.debt * 0.04 / 4, 12)
  })

  it('matches rollover without a savings windfall and prints only failed refinancing', () => {
    const lot = { principal: 10, coupon: 0.04, issuedAt: -4, maturesAt: 0 }
    expect(settleDebt([lot], 0, true, 0, curve)).toMatchObject({ maturing: 10, refinanced: 10, cashRepaid: 0, rolloverPrinting: 0 })
    expect(settleDebt([lot], 3, true, 0, curve)).toMatchObject({ refinanced: 7, cashRepaid: 3, residualSurplus: 0 })
    expect(settleDebt([lot], 3, false, 0, curve)).toMatchObject({ refinanced: 0, cashRepaid: 10, rolloverPrinting: 7 })
    expect(bondPrice(lot, curve, 0)).toBe(10)
  })

  it('settles failed rollover through the existing press and closes the actual fiscal book', () => {
    const state = init(standardCountry, 'closed-rollover')
    const principal = 4 * state.flows.nominalGdp * (DEBT_CEILING + 1)
    state.gov = { ...state.gov, debt: principal,
      bonds: [{ principal, coupon: 0.04, issuedAt: -4, maturesAt: 0 }],
      dials: { ...state.gov.dials, taxRates: { income: 0, corporate: 0, tariff: 0, fuel: 0 },
        spending: { transfers: 0, procurement: 0, investment: 0, research: 0 } } }
    const settled = fiscal.run(state, rngFor('closed-rollover', 'fiscal', 0))
    expect(settled.gov.debt).toBe(0)
    expect(settled.flows.bondsRefinanced).toBe(0)
    expect(settled.flows.debtPrincipal).toBe(principal)
    expect(settled.flows.printedThisQtr).toBeCloseTo(principal + principal * 0.04 / 4, 12)
    expect(settled.gov.budget.balance).toBeCloseTo(settled.flows.debtPrincipal -
      settled.flows.newBondBorrowing - settled.flows.printedThisQtr + settled.flows.fundFlow +
      settled.flows.fiscalRebate, 12)
    validate(settled)
  })

  it('buys back at discounted cash-flow prices and reconciles cash against face principal', () => {
    const lot = { principal: 100, coupon: 0.04, issuedAt: -1, maturesAt: 20 }
    const high = yieldCurveOf(0, 0.1, 0.1, 0, 0)
    const low = yieldCurveOf(0, 0.005, 0.005, 0, 0)
    expect(bondPrice(lot, high, 0)).toBeLessThan(100)
    expect(bondPrice(lot, low, 0)).toBeGreaterThan(100)
    const bought = settleDebt([lot], 10, true, 0, high)
    expect(bought.cashRepaid).toBe(10)
    expect(bought.faceRetired).toBeGreaterThan(10)
    expect(bought.cashRepaid - bought.faceRetired).toBe(bought.buybackAdjustment)
    const cleared = settleDebt([lot], 200, true, 0, low)
    expect(cleared.lots).toEqual([])
    expect(cleared.cashRepaid + cleared.residualSurplus).toBe(200)
    expect(bondPrice({ ...lot, coupon: 0 }, yieldCurveOf(0, 0, 0, 0.2, 0), 0)).toBe(100)
  })
})

describe('QE duration and published books', () => {
  it('eases long costs more than short credit and fades after stopping, with complete principal runoff', () => {
    let state = init(standardCountry, 'qe-runoff', 'god')
    for (let q = 0; q < 12; q++) state = step(state)
    state = applyActions(state, [{ kind: 'setDial', path: 'assetPurchaseRate', value: 0.1 }])
    // Both arms inherit the same lender response to the order, isolating the
    // duration transmission rather than mixing it with the capital strike.
    const ordinary = finance.run({ ...state, gov: { ...state.gov,
      dials: { ...state.gov.dials, assetPurchaseRate: 0 } } }, rngFor('qe-runoff', 'finance', state.meta.tick))
    const bought = finance.run(state, rngFor('qe-runoff', 'finance', state.meta.tick))
    const shortRelief = privateRealRate(ordinary) - privateRealRate(bought)
    const longRelief = privateLongRealRate(ordinary) - privateLongRealRate(bought)
    expect(shortRelief).toBeGreaterThan(0)
    expect(longRelief).toBeGreaterThan(shortRelief)
    let stopped = { ...bought, gov: { ...bought.gov, dials: { ...bought.gov.dials, assetPurchaseRate: 0 } } }
    const remainingEffect = effectivePurchaseRate(stopped)
    expect(remainingEffect).toBeGreaterThan(0)
    const principal = stopped.finance.centralBankAssets
    let runoff = 0
    for (let q = 0; q <= 20; q++) {
      stopped = step(stopped)
      validate(stopped)
      runoff += stopped.flows.assetRunoff
    }
    expect(stopped.finance.centralBankAssets).toBeCloseTo(0, 12)
    expect(stopped.finance.durationHoldings).toBe(0)
    expect(runoff).toBeCloseTo(principal, 12)
    expect(effectivePurchaseRate(stopped)).toBe(0)
  })

  it('replays maturity choices deterministically and publishes detached contract and quote histories', () => {
    const save = createSave(standardCountry, 'bond-save', [
      { tick: 4, actions: [{ kind: 'setDial', path: 'debtMaturity', value: 1 }] },
      { tick: 8, actions: [{ kind: 'setDial', path: 'policyRate', value: 0.08 }] },
    ], 60, { fullInstrumentation: true, unlimitedCapital: true, protectedTenure: true })
    const state = replay(save)
    expect(replay(save)).toEqual(state)
    validate(state)
    const pub = observe(state)
    expect(pub.yieldHistory).toHaveLength(60)
    pub.yieldCurve.yields.ten_year = -1
    pub.yieldHistory[0].benchmark.ten_year = -1
    expect(state.finance.yieldCurve.yields.ten_year).toBeGreaterThanOrEqual(0)
    expect(state.stats.record[0].yieldCurve.benchmark.ten_year).toBeGreaterThanOrEqual(0)
    if (pub.treasury.bonds.length) {
      pub.treasury.bonds[0].principal = -1
      expect(state.gov.bonds[0].principal).toBeGreaterThan(0)
    }
  })
})
