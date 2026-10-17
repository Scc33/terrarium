/** Holder-level settlement: a purchase swaps deposits for a security;
 * redemption reverses it, coupons are income, and rollover is neither. */
import { BOND_HOLDING, domesticBondFundingShare } from '../constants'
import { COHORT_IDS, type TrueState } from '../state/schema'
import type { BondLot } from '../state/bonds'
import type { BondHoldings } from '../state/wealth'
import { bondPrice, type DebtSettlement } from './bonds'

export const emptyHoldings = (): BondHoldings => ({
  rural_workers: 0, urban_workers: 0, professionals: 0, business_owners: 0, retirees: 0, foreign: 0,
})

export function initialHolders(principal: number, domestic = 1): BondHoldings {
  const out = emptyHoldings()
  for (const id of COHORT_IDS) out[id] = principal * domestic * BOND_HOLDING[id]
  out.foreign = principal * (1 - domestic)
  return out
}

/** Legacy hand-authored diagnostic lots carry the old all-domestic split.
 * Every lot created by init/fiscal has its actual subscribed holdings. */
export const holdersOf = (lot: BondLot): BondHoldings => lot.holders ?? initialHolders(lot.principal)
const keyOf = (lot: BondLot) => `${lot.issuedAt}:${lot.maturesAt}:${lot.coupon}`

export function settleBondOwnership(state: TrueState, settlement: DebtSettlement, issued: BondLot[], borrowed: number) {
  const interest = emptyHoldings()
  const redeemed = emptyHoldings()
  const rolled = emptyHoldings()
  const purchases = emptyHoldings()
  const surviving = new Map(settlement.lots.map(lot => [keyOf(lot), lot.principal]))
  for (const lot of state.gov.bonds) {
    const holders = holdersOf(lot)
    const matured = lot.maturesAt <= state.meta.tick
    const rollingFraction = matured && settlement.maturing > 0 ? settlement.refinanced / settlement.maturing : 0
    const retiredFraction = matured ? 1 - rollingFraction : 1 - (surviving.get(keyOf(lot)) ?? 0) / lot.principal
    const cashPerFace = matured ? 1 : bondPrice(lot, state.finance.yieldCurve, state.meta.tick) / lot.principal
    for (const id of Object.keys(holders) as Array<keyof BondHoldings>) {
      interest[id] += holders[id] * lot.coupon / 4
      redeemed[id] += holders[id] * retiredFraction * cashPerFace
      rolled[id] += holders[id] * rollingFraction
    }
  }
  const desiredDomestic = borrowed * domesticBondFundingShare(state.params.openness)
  let unplaced = borrowed
  for (const cohort of state.cohorts) {
    // Buying paper cannot spend deposits already committed to consumption.
    const available = Math.max(0, cohort.savings - state.flows.cohortSpend[cohort.id])
    purchases[cohort.id] = Math.min(unplaced, available, desiredDomestic * BOND_HOLDING[cohort.id])
    unplaced -= purchases[cohort.id]
  }
  purchases.foreign = unplaced
  const totalIssued = borrowed + settlement.refinanced
  const bonds = issued.map(lot => {
    const holders = emptyHoldings()
    for (const id of Object.keys(holders) as Array<keyof BondHoldings>) {
      holders[id] = totalIssued > 0 ? (purchases[id] + rolled[id]) * lot.principal / totalIssued : 0
    }
    return { ...lot, holders }
  })
  return { bonds, interest, redeemed, purchases,
    foreignSettlement: purchases.foreign - redeemed.foreign - interest.foreign }
}
