/** Shared derived quantities used by several steps. Pure reads, no mutation. */

import { CAPITAL_ELASTICITY, LABOR_ELASTICITY, PARTICIPATION } from '../constants'
import { COHORT_IDS, SECTOR_IDS, type CohortId, type Sector, type SectorId, type TrueState } from '../state/schema'

export function potentialOutput(s: Sector): number {
  return s.tfp * Math.pow(Math.max(s.capital, 1e-9), CAPITAL_ELASTICITY) * Math.pow(Math.max(s.employment, 1e-9), LABOR_ELASTICITY)
}

/** Labor needed to produce q given current tfp and capital. */
export function laborForOutput(s: Sector, q: number): number {
  const base = s.tfp * Math.pow(Math.max(s.capital, 1e-9), CAPITAL_ELASTICITY)
  return Math.pow(Math.max(q, 0) / base, 1 / LABOR_ELASTICITY)
}

/** Price a buyer actually faces: fuel excise lands on energy purchases. */
export function effectivePrice(state: TrueState, id: SectorId): number {
  const p = state.market.prices[id]
  return id === 'energy' ? p * (1 + state.gov.dials.taxRates.fuel) : p
}

export function laborForce(state: TrueState): Record<CohortId, number> {
  const out = {} as Record<CohortId, number>
  for (const c of state.cohorts) out[c.id] = c.size * PARTICIPATION[c.id]
  return out
}

export function totalLaborForce(state: TrueState): number {
  return COHORT_IDS.reduce((s, id) => s + (laborForce(state)[id] ?? 0), 0)
}

/** Enfranchisement-weighted approval — the electorate as the ballot box
 * (and an honest pollster) would count it. */
export function approvalIndex(state: TrueState): number {
  let weightSum = 0
  let weightedApproval = 0
  for (const c of state.cohorts) {
    const w = c.enfranchisement * c.size
    weightSum += w
    weightedApproval += w * c.approval
  }
  return weightSum > 0 ? weightedApproval / weightSum : 0.5
}

/** Income Gini across cohorts (grouped lower bound: within-cohort equality).
 * Income = wages + transfers + profits, per capita — what a household income
 * survey would tabulate, transfers included, so redistribution moves it. */
export function giniIndex(state: TrueState): number {
  const groups = state.cohorts
    .filter((c) => c.size > 1e-9)
    .map((c) => ({ pop: c.size, income: c.wageIncome + c.transferIncome + c.profitIncome }))
    .sort((a, b) => a.income / a.pop - b.income / b.pop)
  const popTotal = groups.reduce((s, g) => s + g.pop, 0)
  const incTotal = groups.reduce((s, g) => s + Math.max(g.income, 0), 0)
  if (popTotal <= 1e-9 || incTotal <= 1e-9) return 0
  let cumShare = 0
  let areaTwice = 0 // Σ fᵢ·(Sᵢ₋₁ + Sᵢ) — twice the area under the Lorenz curve
  for (const g of groups) {
    const f = g.pop / popTotal
    const prev = cumShare
    cumShare += Math.max(g.income, 0) / incTotal
    areaTwice += f * (prev + cumShare)
  }
  return Math.max(0, 1 - areaTwice)
}

/** Household own-basket price level for a cohort (base = 1). */
export function cohortCpi(state: TrueState, cohortId: CohortId): number {
  const c = state.cohorts.find((x) => x.id === cohortId)!
  let cpi = 0
  for (const sid of SECTOR_IDS) cpi += c.consumptionWeights[sid] * effectivePrice(state, sid)
  return cpi
}
