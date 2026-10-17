import { describe, expect, it } from 'vitest'
import { createCountryParams, createSave, init, replay, step, validate,
  wealthAccounts, HOUSEHOLD_WEALTH_COMPONENT_IDS, type TrueState } from '@terrarium/engine'
import { createHistoricalDataExport, observe } from '@terrarium/observation'
import { PROFIT_SHARE, taxEfficiency } from '../../packages/engine/src/constants'
import { bondPrice, issueBonds, settleDebt } from '../../packages/engine/src/pipeline/bonds'
import { holdersOf, settleBondOwnership } from '../../packages/engine/src/pipeline/bondOwnership'
import { wealthPrintsDue } from '../../packages/engine/src/pipeline/wealthSurvey'
import { lagFor } from '../../packages/engine/src/pipeline/measurement'

const opening = () => init(createCountryParams('meridia', 'wealth'), 'wealth', { protectedTenure: true, fullInstrumentation: true })
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

describe('modeled household net worth and its counterparties', () => {
  it('consolidates household, bank, public and foreign claims every quarter', () => {
    for (const country of ['meridia', 'costona', 'oranga', 'veltravia', 'kestrel', 'procedural'] as const) {
      let state = init(createCountryParams(country, country), country, { protectedTenure: true })
      for (let q = 0; q < 160; q++) {
        const before = state
        state = step(state)
        validate(state)
        const book = wealthAccounts(state)
        expect(book).toEqual(state.stats.record[state.stats.record.length - 1].wealth)
        expect(book.household.netWorth).toBeCloseTo(sum(Object.values(book.households).map(row => row.netWorth)), 8)
        expect(book.nationalNetWorth).toBeCloseTo(book.productiveCapital + book.netForeignAssets, 8)
        expect(sum(state.sectors.map(sector => sector.credit))).toBeCloseTo(state.finance.creditOutstanding, 8)
        // Independently account for every household cash movement; a floor
        // must never erase a loss and a loan write-off is not a cash repayment.
        for (const c of state.cohorts) {
          const old = before.cohorts.find(row => row.id === c.id)!
          const cashChange = c.savings - c.overdraft - old.savings + old.overdraft
          const income = c.wageIncome * (1 - state.gov.dials.taxRates.income * taxEfficiency(state.gov.capacity.tax)) + c.profitIncome + c.transferIncome + c.rebateIncome
          const expected = income - state.flows.cohortSpend[c.id] + state.flows.bondRedemptionsByHolder[c.id] - state.flows.bondPurchasesByHolder[c.id] +
            (state.flows.businessCreditFlow - state.flows.privateInvestmentFunding) * PROFIT_SHARE[c.id]
          expect(cashChange).toBeCloseTo(expected, 8)
          expect(c.savings * c.overdraft).toBe(0)
        }
      }
    }
  })

  it('a new bond swaps deposits for a claim, with no gift of net worth', () => {
    const state = opening()
    state.gov.bonds = []
    state.gov.debt = 0
    state.flows.cohortSpend = Object.fromEntries(state.cohorts.map(c => [c.id, 0])) as TrueState['flows']['cohortSpend']
    state.cohorts = state.cohorts.map(c => ({ ...c, savings: 1000, overdraft: 0 }))
    const before = wealthAccounts(state)
    const settlement = settleDebt([], 0, true, 0, state.finance.yieldCurve)
    const issued = issueBonds(20, state.gov.dials.debtMaturity, 0, state.finance.yieldCurve)
    const placed = settleBondOwnership(state, settlement, issued, 20)
    const after: TrueState = { ...state,
      cohorts: state.cohorts.map(c => ({ ...c, savings: c.savings - placed.purchases[c.id] })),
      gov: { ...state.gov, debt: 20, bonds: placed.bonds },
      external: { ...state.external, bondSettlement: placed.foreignSettlement },
    }
    const book = wealthAccounts(after)
    expect(book.household.netWorth).toBeCloseTo(before.household.netWorth, 8)
    expect(book.nationalNetWorth).toBeCloseTo(before.nationalNetWorth, 8)
    expect(sum(Object.values(placed.purchases))).toBeCloseTo(20, 10)
    expect(book.household.deposits).toBeLessThan(before.household.deposits)
  })

  it('places tiny, fully domestic subscriptions without negative residual holdings', () => {
    const state = opening()
    state.params = { ...state.params, openness: 0 }
    state.gov.bonds = []
    state.cohorts = state.cohorts.map(c => ({ ...c, savings: 1000 }))
    state.flows.cohortSpend = Object.fromEntries(state.cohorts.map(c => [c.id, 0])) as TrueState['flows']['cohortSpend']
    for (const amount of [1e-12, 0.0075, 0.1, 1, 17.3]) {
      const settlement = settleDebt([], 0, true, 0, state.finance.yieldCurve)
      const placed = settleBondOwnership(state, settlement, issueBonds(amount, 0.5, 0, state.finance.yieldCurve), amount)
      for (const holding of Object.values(placed.purchases)) expect(holding).toBeGreaterThanOrEqual(0)
      expect(sum(Object.values(placed.purchases))).toBeCloseTo(amount, 12)
    }
  })

  it('allocates coupons, maturity and discounted buybacks to the recorded holders', () => {
    const state = opening()
    state.gov.bonds = [{ principal: 10, coupon: 0.08, issuedAt: -4, maturesAt: 0,
      holders: { rural_workers: 10, urban_workers: 0, professionals: 0, business_owners: 0, retirees: 0, foreign: 0 } }]
    const settlement = settleDebt(state.gov.bonds, 10, true, 0, state.finance.yieldCurve)
    const placed = settleBondOwnership(state, settlement, [], 0)
    expect(placed.interest.rural_workers).toBeCloseTo(0.2)
    expect(placed.redeemed.rural_workers).toBeCloseTo(10)
    expect(placed.interest.business_owners).toBe(0)
    const lot = { ...state.gov.bonds[0], maturesAt: 40 }
    state.gov.bonds = [lot]
    const price = bondPrice(lot, state.finance.yieldCurve, 0)
    const buyback = settleDebt([lot], price / 2, true, 0, state.finance.yieldCurve)
    const bought = settleBondOwnership(state, buyback, [], 0)
    expect(bought.redeemed.rural_workers).toBeCloseTo(price / 2)
    expect(holdersOf(buyback.lots[0]).rural_workers).toBeCloseTo(5)
  })

  it('matched refinancing moves a claim without creating cash or income', () => {
    const state = opening()
    state.gov.bonds = state.gov.bonds.map(lot => ({ ...lot, maturesAt: 0 }))
    const settlement = settleDebt(state.gov.bonds, 0, true, 0, state.finance.yieldCurve)
    const issued = issueBonds(settlement.refinanced, state.gov.dials.debtMaturity, 0, state.finance.yieldCurve)
    const placed = settleBondOwnership(state, settlement, issued, 0)
    expect(sum(Object.values(placed.redeemed))).toBe(0)
    expect(sum(Object.values(placed.purchases))).toBe(0)
    expect(sum(placed.bonds.map(lot => lot.principal))).toBeCloseTo(state.gov.debt)
  })

  it('loan advances and matching deposits leave household net worth unchanged', () => {
    const state = opening()
    const before = wealthAccounts(state)
    const advanced = { ...state, cohorts: state.cohorts.map(c => ({ ...c, savings: c.savings + 10 * PROFIT_SHARE[c.id] })),
      finance: { ...state.finance, creditOutstanding: state.finance.creditOutstanding + 10 } }
    expect(wealthAccounts(advanced).household.netWorth).toBeCloseTo(before.household.netWorth, 8)
  })

  it('rejects unowned bonds, overallocated capital and erased liabilities', () => {
    const state = opening()
    state.gov.bonds[0].holders!.foreign = 10
    expect(() => validate(state)).toThrow('bond holders')
    const capital = opening()
    capital.gov.publicCapital = 1e9
    expect(() => validate(capital)).toThrow('ownership')
    const cash = opening()
    cash.cohorts[0].overdraft = 1
    expect(() => validate(cash)).toThrow('cash account')
  })
})

describe('the wealth survey respects the information boundary', () => {
  it('keeps public uncertainty when large opposing claims have zero net worth', () => {
    const row = structuredClone(step(opening()).stats.record[0])
    row.statCapacity = 1
    row.fund = 0
    row.centralBankAssets = 0
    row.reserves = 0
    row.wealth = { ...row.wealth, publicCapital: 1000, publicNetWorth: 0,
      bankSettlement: 0, foreignBonds: 0, household: { ...row.wealth.household, bonds: 1000 } }
    const print = wealthPrintsDue([row], lagFor(1), 'offsetting-public-claims', false)[0]
    expect(print.publicNetWorth).not.toBe(0)
    expect(print.publicErrorBand).toBeGreaterThan(0)
    const householdBand = print.errorBand * sum(HOUSEHOLD_WEALTH_COMPONENT_IDS.map(id => print.household[id]))
    expect(print.nationalErrorBand).toBeCloseTo(print.publicErrorBand + householdBand, 10)
  })

  it('has a historical funding gate, lag, revisions and reconciled printed net worth', () => {
    let state = opening()
    for (let q = 0; q < 12; q++) state = step(state)
    const pub = observe(state)
    expect(pub.wealth.length).toBeGreaterThan(0)
    for (const print of pub.wealth) {
      expect(print.publishedAt).toBeGreaterThan(print.forQtr)
      const h = print.household
      expect(h.netWorth).toBeCloseTo(h.deposits + h.bonds + h.productiveAssets + h.bankEquity - h.businessLoans - h.overdrafts, 10)
      expect(print.nationalNetWorth).toBeCloseTo(h.netWorth + print.publicNetWorth, 10)
    }
    expect(pub.wealth.some(print => print.revision > 0)).toBe(true)
    expect(pub.wealth[0].household.netWorth).not.toBe(state.stats.record[0].wealth.household.netWorth)
    expect(pub.treasury.bonds.every(lot => !('holders' in lot))).toBe(true)
    const save = createSave(state.params, 'wealth', [], state.meta.tick, state.meta.rules)
    expect(createHistoricalDataExport(pub, save).records.wealthReleases).toEqual(pub.wealth)
    expect(replay(save)).toEqual(state)
    const dark = init(state.params, 'dark')
    const after = step(step(dark))
    expect(observe(after).wealth).toEqual([])
    const commissioned = { ...after, gov: { ...after.gov, capacity: { ...after.gov.capacity, statistical: 1 } } }
    expect(step(commissioned).stats.wealth.every(print => print.forQtr >= 2)).toBe(true)
    for (const id of HOUSEHOLD_WEALTH_COMPONENT_IDS) expect(Number.isFinite(pub.wealth[0].household[id])).toBe(true)
  })
})
