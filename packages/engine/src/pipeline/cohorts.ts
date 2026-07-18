/**
 * Step 7 — cohorts. Incomes land, savings absorb the difference, and
 * approval drifts toward *experienced* conditions: real income growth
 * (loss-averse), own-basket inflation, joblessness, and queues for goods
 * that never arrived. Whatever the statistics office printed, the bread
 * line is the bread line.
 */

import {
  adminEffectiveness,
  APPROVAL_DRIFT,
  BOND_HOLDING,
  LABOR_SOURCE,
  LOSS_AVERSION,
  PARTICIPATION,
  PROFIT_SHARE,
  taxEfficiency,
  TRANSFER_SHARE,
} from '../constants'
import { clamp } from '../math'
import { SECTOR_IDS, type Cohort } from '../state/schema'
import type { PipelineStep } from './pipeline'
import { cohortCpi } from './derive'

const logistic = (x: number) => 1 / (1 + Math.exp(-x))

export const cohorts: PipelineStep = {
  name: 'cohorts',
  run(state) {
    const { gov, market, flows } = state
    const incomeTaxEff = gov.dials.taxRates.income * taxEfficiency(gov.capacity.tax)
    const corpTaxEff = gov.dials.taxRates.corporate * taxEfficiency(gov.capacity.tax)
    const adminEff = adminEffectiveness(gov.capacity.administrative)

    const totalProfitsNet = SECTOR_IDS.reduce((s, sid) => {
      const gross = flows.profits[sid]
      return s + (gross > 0 ? gross * (1 - corpTaxEff) : gross)
    }, 0)
    const transfersDelivered = gov.dials.spending.transfers * adminEff

    const newCohorts: Cohort[] = state.cohorts.map((c) => {
      // wages from current staffing of each sector
      const employedIn: Cohort['employedIn'] = {}
      let grossWage = 0
      let employed = 0
      for (const s of state.sectors) {
        const share = LABOR_SOURCE[s.id][c.id] ?? 0
        if (share > 0) {
          const workers = s.employment * share
          employedIn[s.id] = workers
          employed += workers
          grossWage += workers * market.wages[s.id]
        }
      }
      // wageIncome is stored gross; production nets out income tax when it
      // builds spending budgets, so tax lands exactly once
      const wageIncome = grossWage
      const profitIncome =
        totalProfitsNet * PROFIT_SHARE[c.id] + flows.debtInterest * BOND_HOLDING[c.id]
      const transferIncome = transfersDelivered * TRANSFER_SHARE[c.id]
      const income = grossWage * (1 - incomeTaxEff) + profitIncome + transferIncome

      const savings = Math.max(
        0,
        c.savings + income - flows.cohortSpend[c.id] + flows.debtPrincipal * BOND_HOLDING[c.id],
      )

      // --- experienced conditions ---
      const cpi = cohortCpi(state, c.id)
      const realIncome = income / cpi
      // judged against a smoothed memory of living standards, not last
      // quarter's pay packet — people notice trends, not ticks
      const growth = c.lastRealIncome > 1e-9 ? realIncome / c.lastRealIncome - 1 : 0
      const adjGrowth = growth < 0 ? growth * LOSS_AVERSION : growth
      const basketInflAnnual = c.lastCpi > 1e-9 ? (cpi / c.lastCpi - 1) * 4 : 0
      const lfc = c.size * PARTICIPATION[c.id]
      const jobless = lfc > 1e-9 ? clamp(1 - employed / lfc, 0, 1) : 0
      let shortage = 0
      for (const sid of SECTOR_IDS) {
        shortage += c.consumptionWeights[sid] * (1 - flows.satisfied[sid])
      }

      const target = logistic(
        0.3 +
          15 * clamp(adjGrowth, -0.15, 0.15) -
          8 * Math.max(0, basketInflAnnual - 0.04) -
          3 * (jobless - 0.07) -
          5 * shortage,
      )
      const approval = clamp(c.approval + APPROVAL_DRIFT * (target - c.approval), 0, 1)

      return {
        ...c,
        employedIn,
        wageIncome,
        profitIncome,
        transferIncome,
        savings,
        approval,
        // EMA: the standard of living people measure themselves against
        lastRealIncome: 0.75 * c.lastRealIncome + 0.25 * realIncome,
        lastCpi: cpi,
      }
    })

    return { ...state, cohorts: newCohorts }
  },
}
