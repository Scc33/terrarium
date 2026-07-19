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
  CONF_ADAPT,
  CONF_NEUTRAL,
  LABOR_SOURCE,
  LOSS_AVERSION,
  PARTICIPATION,
  PROFIT_SHARE,
  taxEfficiency,
  TRANSFER_SHARE,
  WELFARE_DISCOUNT_Q,
} from '../constants'
import { clamp } from '../math'
import { END_OF_HISTORY_TICK, SECTOR_IDS, type Cohort } from '../state/schema'
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

    // --- animal spirits adapt to conditions everyone can feel ---
    // consumers: income trend vs habit + how many neighbors are out of work;
    // firms: how full the order books are + whether margins are holding
    let incomeNow = 0
    let incomeHabit = 0
    for (const [i, c] of newCohorts.entries()) {
      incomeNow += c.lastRealIncome
      incomeHabit += state.cohorts[i].lastRealIncome
    }
    const trend = incomeHabit > 1e-9 ? incomeNow / incomeHabit - 1 : 0
    const consumerTarget = clamp(
      CONF_NEUTRAL + 6 * trend - 1.5 * (flows.unemployment - 0.075),
      0,
      1,
    )
    const avgUtil =
      state.sectors.reduce((s, x) => s + x.capacityUtilization, 0) / state.sectors.length
    const profitRate =
      SECTOR_IDS.reduce((s, sid) => s + flows.profits[sid], 0) / Math.max(flows.nominalGdp, 1e-9)
    const businessTarget = clamp(
      CONF_NEUTRAL + 1.5 * (avgUtil - 0.85) + 1.5 * (profitRate - 0.35),
      0,
      1,
    )
    const conf = state.ledger.confidence
    const confidence = {
      consumer: conf.consumer + CONF_ADAPT * (consumerTarget - conf.consumer),
      business: conf.business + CONF_ADAPT * (businessTarget - conf.business),
    }

    // --- §3.3 prosperity: what it was actually like to live here this
    // quarter. Log consumption per head, population-weighted: diminishing
    // returns mean a unit of bread to the poor scores more than a unit of
    // services to the rich, and no terminal-GDP sprint can buy back a
    // hungry decade once it has been discounted in. The ledger closes with
    // the tenure — quarters after deposition (or after 2050) are somebody
    // else's record, so the verdict must not drift if the sim keeps running.
    let score = state.score
    if (state.politics.deposedAt === null && state.meta.tick < END_OF_HISTORY_TICK) {
      let logSum = 0
      let popSum = 0
      for (const c of newCohorts) {
        const cpc = flows.cohortSpend[c.id] / cohortCpi(state, c.id) / Math.max(c.size, 1e-9)
        logSum += c.size * Math.log(Math.max(cpc, 0.01))
        popSum += c.size
      }
      const welfareQ = popSum > 1e-9 ? logSum / popSum : 0
      const beta = Math.pow(WELFARE_DISCOUNT_Q, state.meta.tick)
      score = {
        discountedWelfare: state.score.discountedWelfare + beta * welfareQ,
        discountWeight: state.score.discountWeight + beta,
        baselineWelfare: state.score.baselineWelfare ?? welfareQ,
      }
    }

    return { ...state, cohorts: newCohorts, ledger: { ...state.ledger, confidence }, score }
  },
}
