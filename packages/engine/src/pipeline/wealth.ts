/** Complete balance sheets within the modeled asset perimeter (ADR-0051).
 * Financial claims cancel against named liabilities. Productive capital is
 * counted once in national wealth, irrespective of how it is financed. */
import { PROFIT_SHARE } from '../constants'
import { COHORT_IDS, type TrueState } from '../state/schema'
import { HOUSEHOLD_WEALTH_COMPONENT_IDS, type HouseholdWealth, type WealthRecord } from '../state/wealth'
import { bondPrice } from './bonds'
import { holdersOf } from './bondOwnership'

export function householdNetWorth(row: Omit<HouseholdWealth, 'netWorth'>): number {
  return row.deposits + row.bonds + row.productiveAssets + row.bankEquity - row.businessLoans - row.overdrafts
}

export function wealthAccounts(state: TrueState): WealthRecord {
  const capital = state.sectors.reduce((sum, sector) => sum + sector.capital, 0)
  const capitalPrice = (state.market.prices.manuf + state.market.prices.services) / 2
  const valuation = capitalPrice * state.finance.assetPrice
  const productiveCapital = capital * valuation
  const publicCapital = state.gov.publicCapital * valuation
  const foreignCapital = state.external.foreignOwnedCapital * valuation
  const privateCapital = productiveCapital - publicCapital - foreignCapital
  const bonds = Object.fromEntries(COHORT_IDS.map(id => [id, 0])) as Record<(typeof COHORT_IDS)[number], number>
  let governmentBonds = 0
  let foreignBonds = 0
  for (const lot of state.gov.bonds) {
    // After step(), meta.tick names the next quarter; the quote still names
    // the completed one. Do not advance a security's price before its coupon.
    const pricePerFace = bondPrice(lot, state.finance.yieldCurve, state.finance.yieldCurve.tick) / lot.principal
    const holders = holdersOf(lot)
    governmentBonds += lot.principal * pricePerFace
    foreignBonds += holders.foreign * pricePerFace
    for (const id of COHORT_IDS) bonds[id] += holders[id] * pricePerFace
  }
  const households = {} as WealthRecord['households']
  for (const cohort of state.cohorts) {
    const share = PROFIT_SHARE[cohort.id]
    const row = {
      deposits: cohort.savings, bonds: bonds[cohort.id],
      productiveAssets: privateCapital * share,
      bankEquity: state.finance.bankCapital * share,
      businessLoans: state.finance.creditOutstanding * share,
      overdrafts: cohort.overdraft,
    }
    households[cohort.id] = { ...row, netWorth: householdNetWorth(row) }
  }
  const household = { netWorth: 0 } as HouseholdWealth
  for (const id of HOUSEHOLD_WEALTH_COMPONENT_IDS) {
    household[id] = COHORT_IDS.reduce((sum, cohort) => sum + households[cohort][id], 0)
  }
  household.netWorth = householdNetWorth(household)
  // Banks' settlement balances are assets when positive and monetary-authority
  // borrowing when negative. QE claims are liabilities of these intermediaries.
  const bankSettlement = household.deposits + state.finance.bankCapital + state.finance.centralBankAssets -
    state.finance.creditOutstanding - household.overdrafts - state.external.bondSettlement
  const centralBankNetWorth = state.finance.centralBankAssets + state.external.reserves - bankSettlement
  const publicNetWorth = publicCapital + state.gov.fund + centralBankNetWorth - governmentBonds
  const netForeignAssets = state.gov.fund + state.external.reserves + state.external.bondSettlement - foreignBonds - foreignCapital
  return { households, household, publicNetWorth, nationalNetWorth: household.netWorth + publicNetWorth,
    productiveCapital, publicCapital, foreignCapital, bankSettlement, centralBankNetWorth,
    foreignBonds, netForeignAssets }
}
