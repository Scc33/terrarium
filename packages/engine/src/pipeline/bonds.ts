/** Fixed contracts, priced buybacks and net settlement. Rollover is not household income. */
import {
  DEBT_BALANCED_LONG_SHARE,
  DEBT_BALANCED_MEDIUM_SHARE,
  DEBT_BALANCED_SHORT_SHARE,
  DEBT_MATURITY_DEFAULT,
  POLICY_RATE_1946,
  YIELD_MATURITY_QTRS,
} from '../constants'
import type { BondLot, YieldCurve } from '../state/bonds'
import { benchmarkYieldAt } from './termStructure'

const DEBT_TERMS = ['one_year', 'five_year', 'ten_year'] as const

export function debtMaturityShares(maturity: number): Record<(typeof DEBT_TERMS)[number], number> {
  const shorter = maturity <= DEBT_MATURITY_DEFAULT
  const blend = shorter ? maturity / DEBT_MATURITY_DEFAULT :
    (1 - maturity) / (1 - DEBT_MATURITY_DEFAULT)
  return {
    one_year: DEBT_BALANCED_SHORT_SHARE * blend + (shorter ? 1 - blend : 0),
    five_year: DEBT_BALANCED_MEDIUM_SHARE * blend,
    ten_year: DEBT_BALANCED_LONG_SHARE * blend + (shorter ? 0 : 1 - blend),
  }
}

/** The inherited book is laddered, so no country is handed a maturity cliff.
 * All inherited coupons are the 4% commitment used to calibrate its budget. */
export function initialBonds(principal: number): BondLot[] {
  const shares = debtMaturityShares(DEBT_MATURITY_DEFAULT)
  const lots: BondLot[] = []
  let allocated = 0
  for (const term of DEBT_TERMS) {
    const quarters = YIELD_MATURITY_QTRS[term]
    for (let remaining = 1; remaining <= quarters; remaining++) {
      const amount = term === 'ten_year' && remaining === quarters ?
        principal - allocated : principal * shares[term] / quarters
      if (amount > 0) lots.push({ principal: amount, coupon: POLICY_RATE_1946,
        issuedAt: -quarters + remaining - 1, maturesAt: remaining - 1 })
      allocated += amount
    }
  }
  return lots
}

export function issueBonds(principal: number, maturity: number, tick: number, curve: YieldCurve): BondLot[] {
  if (principal <= 0) return []
  const shares = debtMaturityShares(maturity)
  const terms = DEBT_TERMS.filter(term => shares[term] > 0)
  let allocated = 0
  return terms.map((term, index) => {
    const amount = index === terms.length - 1 ? principal - allocated : principal * shares[term]
    allocated += amount
    return { principal: amount, coupon: curve.yields[term], issuedAt: tick,
      maturesAt: tick + YIELD_MATURITY_QTRS[term] }
  })
}

export function couponBill(lots: readonly BondLot[]): number {
  return lots.reduce((total, lot) => total + lot.principal * lot.coupon / 4, 0)
}

export function governmentYieldAt(curve: YieldCurve, quarters: number): number {
  return benchmarkYieldAt(curve.policyRate, curve.policyAnchor, curve.purchaseEquivalent, quarters) +
    curve.sovereignPremium
}

/** Price after this quarter's coupon has been paid; all future coupons and
 * face principal use the same quoted yield. No free early redemption at par. */
export function bondPrice(lot: BondLot, curve: YieldCurve, tick: number): number {
  const quarters = Math.max(0, lot.maturesAt - tick)
  if (quarters === 0) return lot.principal
  const rate = governmentYieldAt(curve, quarters) / 4
  const discount = Math.pow(1 + rate, -quarters)
  const annuity = rate === 0 ? quarters : -Math.expm1(-quarters * Math.log1p(rate)) / rate
  return lot.principal * (discount + lot.coupon / 4 * annuity)
}

export interface DebtSettlement {
  lots: BondLot[]
  maturing: number
  refinanced: number
  cashRepaid: number
  faceRetired: number
  buybackAdjustment: number
  residualSurplus: number
  rolloverPrinting: number
}

export function settleDebt(lots: readonly BondLot[], surplus: number, marketOpen: boolean, tick: number, curve: YieldCurve): DebtSettlement {
  const maturing = lots.filter(lot => lot.maturesAt <= tick).reduce((sum, lot) => sum + lot.principal, 0)
  const paidAtMaturity = Math.min(surplus, maturing)
  const refinanced = marketOpen ? maturing - paidAtMaturity : 0
  const rolloverPrinting = maturing - paidAtMaturity - refinanced
  let cash = surplus - paidAtMaturity
  let cashRepaid = maturing - refinanced
  let faceRetired = cashRepaid
  let buybackAdjustment = 0
  const remaining: BondLot[] = []
  for (const lot of lots.filter(lot => lot.maturesAt > tick).sort((a, b) => a.maturesAt - b.maturesAt || a.issuedAt - b.issuedAt)) {
    const price = bondPrice(lot, curve, tick)
    const spent = Math.min(cash, price)
    const face = spent === price ? lot.principal : lot.principal * spent / price
    cash -= spent
    cashRepaid += spent
    faceRetired += face
    buybackAdjustment += spent - face
    if (face < lot.principal) remaining.push({ ...lot, principal: lot.principal - face })
  }
  return { lots: remaining, maturing, refinanced, cashRepaid, faceRetired, buybackAdjustment,
    residualSurplus: cash, rolloverPrinting }
}

export function averageCoupon(lots: readonly BondLot[]): number | null {
  const principal = lots.reduce((sum, lot) => sum + lot.principal, 0)
  return principal > 0 ? 4 * couponBill(lots) / principal : null
}
