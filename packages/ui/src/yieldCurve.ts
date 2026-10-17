/** Dealer quotes and debt contracts are public prices and exact books. This
 * view never estimates hidden GDP, inflation expectations or bank positions. */
import { YIELD_IDS } from '@terrarium/engine'
import type { PublishedState, YieldId } from '@terrarium/observation'

export const YIELD_LABELS: Record<YieldId, string> = {
  three_month: '3 MONTHS', one_year: '1 YEAR', five_year: '5 YEARS', ten_year: '10 YEARS',
}

export function readYieldCurve(pub: PublishedState) {
  const current = pub.yieldCurve
  const previous = pub.yieldHistory.filter(row => row.tick < current.tick).at(-1)
  const points = (curve: typeof current) => YIELD_IDS.map((id, tick) => ({ tick, value: 100 * curve.yields[id] }))
  return {
    current: points(current), previous: previous ? points(previous) : [],
    quotes: YIELD_IDS.map(id => ({ id, label: YIELD_LABELS[id], value: current.yields[id],
      change: previous ? current.yields[id] - previous.yields[id] : null })),
    slope: current.yields.ten_year - current.yields.three_month,
    anchor: current.policyAnchor,
    risk: current.sovereignPremium,
  }
}

export function readDebtSchedule(pub: PublishedState) {
  const buckets = [
    { label: 'NEXT QUARTER', principal: 0 }, { label: 'FOLLOWING 3 QUARTERS', principal: 0 },
    { label: 'YEARS 2–5', principal: 0 }, { label: 'AFTER YEAR 5', principal: 0 },
  ]
  let annualCoupons = 0
  let principal = 0
  for (const lot of pub.treasury.bonds) {
    const remaining = lot.maturesAt - pub.tick
    const bucket = remaining <= 0 ? 0 : remaining < 4 ? 1 : remaining < 20 ? 2 : 3
    buckets[bucket].principal += lot.principal
    principal += lot.principal
    annualCoupons += lot.principal * lot.coupon
  }
  return { buckets, coupon: principal > 0 ? annualCoupons / principal : null }
}
