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
  APPROVAL_GROWTH_CAP,
  APPROVAL_GROWTH_GAIN,
  APPROVAL_INFLATION_GAIN,
  APPROVAL_INFLATION_REFERENCE,
  APPROVAL_JOBLESS_GAIN,
  APPROVAL_JOBLESS_REFERENCE,
  APPROVAL_SHORTAGE_GAIN,
  APPROVAL_TARGET_BASE,
  BOND_HOLDING,
  CONF_ADAPT,
  CONF_BUSINESS_PROFIT_GAIN,
  CONF_BUSINESS_PROFIT_REFERENCE,
  CONF_BUSINESS_UTILIZATION_GAIN,
  CONF_CONSUMER_TREND_GAIN,
  CONF_CONSUMER_UNEMPLOYMENT_GAIN,
  CONF_NEUTRAL,
  HABITUAL_INCOME_EMA_GAIN,
  HABITUAL_INCOME_EMA_PERSISTENCE,
  LOSS_AVERSION,
  NATURAL_UNEMPLOYMENT,
  NORMAL_UTILIZATION,
  PROFIT_SHARE,
  taxEfficiency,
  TRANSFER_SHARE,
  WELFARE_DISCOUNT_Q,
} from '../constants'
import { clamp } from '../math'
import { END_OF_HISTORY_TICK, SECTOR_IDS, type Cohort } from '../state/schema'
import type { PipelineStep } from './pipeline'
import {
  cohortCpi,
  effectiveConsumptionWeights,
  laborForce,
  meanLogConsumption,
  staffing,
} from './derive'

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
    }, 0) - flows.foreignProfitRemittances
    const transfersDelivered = gov.dials.spending.transfers * adminEff
    const lf = laborForce(state)

    // The surplus rebate is split by the income tax each cohort paid (ADR-0037),
    // and since the rate is uniform that is each cohort's share of the wage
    // bill. Taken off the SECTORS rather than summed from the cohorts below,
    // because it is the same quantity `fiscal` taxed — and `allocateStaffing`
    // closes each sector's wage bill exactly, so the two agree to float dust.
    // Retirees pay no income tax and so receive no rebate: this is a refund,
    // not a dividend, and a transfer is the lever that reaches them.
    const wageBill = state.sectors.reduce((s, sec) => s + market.wages[sec.id] * sec.employment, 0)

    // Who is actually in each sector's jobs. `LABOR_SOURCE` is what firms
    // WANT; this is what the country could supply (ADR-0035), so a cohort can
    // no longer be paid for more jobs than it has people, and the workers a
    // sector could not find in its preferred class are drawn from the next
    // rung instead — at that sector's wage, which is the whole cost of being
    // underemployed.
    const posts = staffing(state)

    const newCohorts: Cohort[] = state.cohorts.map((c) => {
      // wages from current staffing of each sector
      const employedIn: Cohort['employedIn'] = {}
      let grossWage = 0
      let employed = 0
      for (const s of state.sectors) {
        const workers = posts[s.id][c.id] ?? 0
        if (workers > 0) {
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
      // Not scaled by `adminEff`: the tax office refunds against wages it has
      // already assessed, so unlike a programme there is nothing here to
      // deliver and nothing to leak. The guard cannot silently eat a rebate —
      // `fiscal` books zero unless it collected income tax, which it cannot do
      // without a wage bill — and the split summing to what was booked is
      // asserted in `tests/properties/treasury-conservation.test.ts`.
      //
      // The weights are this quarter's payroll, which is not the one `fiscal`
      // taxed: `labor` moves employment and wages between the two steps. That
      // is deliberate. `wageIncome` below is the same post-`labor` payroll, and
      // `production` nets the income tax off THAT when it builds the spending
      // budget — so splitting the refund this way makes it proportional to the
      // tax each household is booked as paying. Weighting by fiscal's own
      // pre-`labor` base would match the treasury's receipt and mismatch every
      // household account that has to live with it.
      const rebateIncome = wageBill > 1e-9 ? (flows.fiscalRebate * grossWage) / wageBill : 0
      const income =
        grossWage * (1 - incomeTaxEff) + profitIncome + transferIncome + rebateIncome

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
      const lfc = lf[c.id]
      const jobless = lfc > 1e-9 ? clamp(1 - employed / lfc, 0, 1) : 0
      // queues are felt in proportion to what this household actually buys
      const weights = effectiveConsumptionWeights(state, c.id)
      let shortage = 0
      for (const sid of SECTOR_IDS) {
        shortage += weights[sid] * (1 - flows.satisfied[sid])
      }

      const target = logistic(
        APPROVAL_TARGET_BASE +
          APPROVAL_GROWTH_GAIN * clamp(adjGrowth, -APPROVAL_GROWTH_CAP, APPROVAL_GROWTH_CAP) -
          APPROVAL_INFLATION_GAIN * Math.max(0, basketInflAnnual - APPROVAL_INFLATION_REFERENCE) -
          APPROVAL_JOBLESS_GAIN * (jobless - APPROVAL_JOBLESS_REFERENCE) -
          APPROVAL_SHORTAGE_GAIN * shortage,
      )
      const approval = clamp(c.approval + APPROVAL_DRIFT * (target - c.approval), 0, 1)

      return {
        ...c,
        employedIn,
        wageIncome,
        profitIncome,
        transferIncome,
        rebateIncome,
        savings,
        approval,
        // EMA: the standard of living people measure themselves against
        lastRealIncome:
          HABITUAL_INCOME_EMA_PERSISTENCE * c.lastRealIncome +
          HABITUAL_INCOME_EMA_GAIN * realIncome,
        // the same smoothing, PER HEAD, for the Engel shift (ADR-0030). Kept
        // separate rather than derived from the line above, because dividing a
        // lagging aggregate by a current headcount makes a shrinking cohort
        // look richer than it is.
        engelIncome:
          HABITUAL_INCOME_EMA_PERSISTENCE * c.engelIncome +
          HABITUAL_INCOME_EMA_GAIN * (realIncome / Math.max(c.size, 1e-9)),
        lastCpi: cpi,
      }
    })

    // --- animal spirits adapt to conditions everyone can feel ---
    // consumers: income trend vs habit + how many neighbors are out of work;
    // this stays OPEN unemployment. Underemployment already lands through the
    // sector wage in `trend`; adding it here would count the same loss twice
    // (ADR-0036).
    // firms: how full the order books are + whether margins are holding
    let incomeNow = 0
    let incomeHabit = 0
    for (const [i, c] of newCohorts.entries()) {
      incomeNow += c.lastRealIncome
      incomeHabit += state.cohorts[i].lastRealIncome
    }
    const trend = incomeHabit > 1e-9 ? incomeNow / incomeHabit - 1 : 0
    const consumerTarget = clamp(
      CONF_NEUTRAL +
        CONF_CONSUMER_TREND_GAIN * trend -
        CONF_CONSUMER_UNEMPLOYMENT_GAIN * (flows.unemployment - NATURAL_UNEMPLOYMENT),
      0,
      1,
    )
    const avgUtil =
      state.sectors.reduce((s, x) => s + x.capacityUtilization, 0) / state.sectors.length
    const profitRate =
      SECTOR_IDS.reduce((s, sid) => s + flows.profits[sid], 0) / Math.max(flows.nominalGdp, 1e-9)
    const businessTarget = clamp(
      CONF_NEUTRAL +
        CONF_BUSINESS_UTILIZATION_GAIN * (avgUtil - NORMAL_UTILIZATION) +
        CONF_BUSINESS_PROFIT_GAIN * (profitRate - CONF_BUSINESS_PROFIT_REFERENCE),
      0,
      1,
    )
    const conf = state.ledger.confidence
    const confidence = {
      consumer: conf.consumer + CONF_ADAPT * (consumerTarget - conf.consumer),
      business: conf.business + CONF_ADAPT * (businessTarget - conf.business),
    }

    // Migration always compares with the country's inherited 1946 welfare.
    // The report-card baseline may open decades later with the appointment;
    // sharing that field would make the caretaker's population history depend
    // on who eventually receives the posting.
    const migrationBaselineWelfare =
      state.demography.migrationBaselineWelfare ?? meanLogConsumption(state)

    // --- prosperity: what it was actually like to live here this
    // quarter. Log consumption per head, population-weighted: diminishing
    // returns mean a unit of bread to the poor scores more than a unit of
    // services to the rich, and no terminal-GDP sprint can buy back a
    // hungry decade once it has been discounted in. The ledger closes with
    // the tenure — quarters after deposition (or after 2050) are somebody
    // else's record, so the verdict must not drift if the sim keeps running.
    let score = state.score
    if (
      state.politics.deposedAt === null &&
      // quarters before the appointment are the caretaker's (ADR-0021), so the
      // ledger opens when the player does — which is also what makes
      // `baselineWelfare` the standard of living they actually inherited
      state.meta.tick >= state.meta.appointedAt &&
      state.meta.tick < END_OF_HISTORY_TICK
    ) {
      const welfareQ = meanLogConsumption(state)
      const beta = Math.pow(WELFARE_DISCOUNT_Q, state.meta.tick - state.meta.appointedAt)
      score = {
        ...state.score,
        discountedWelfare: state.score.discountedWelfare + beta * welfareQ,
        discountWeight: state.score.discountWeight + beta,
        baselineWelfare: state.score.baselineWelfare ?? welfareQ,
      }
    }

    return {
      ...state,
      demography: { ...state.demography, migrationBaselineWelfare },
      cohorts: newCohorts,
      ledger: { ...state.ledger, confidence },
      score,
    }
  },
}
