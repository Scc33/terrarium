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

/** Household own-basket price level for a cohort (base = 1). */
export function cohortCpi(state: TrueState, cohortId: CohortId): number {
  const c = state.cohorts.find((x) => x.id === cohortId)!
  let cpi = 0
  for (const sid of SECTOR_IDS) cpi += c.consumptionWeights[sid] * effectivePrice(state, sid)
  return cpi
}
