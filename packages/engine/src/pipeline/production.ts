/**
 * Step 1 — production. Builds this tick's demand from last tick's incomes
 * and prices, solves the Leontief system for required gross output, and
 * produces up to capacity. Excess demand is recorded for the price step;
 * nothing here is a hand-authored effect arrow — a fuel tax reaches bread
 * via the I/O table, not via a rule.
 */

import {
  adminEffectiveness,
  CONF_INV_GAIN,
  CONF_MPC_GAIN,
  CONF_NEUTRAL,
  DEPRECIATION_Q,
  IMPORT_BASE_SHARE,
  EXPORT_BASE_SHARE,
  INVESTMENT_FACTOR_MAX,
  INVESTMENT_RATE_SENSITIVITY,
  INVESTMENT_SLACK_GAIN,
  MPC,
  NATURAL_REAL_RATE,
  NATURAL_UNEMPLOYMENT,
  SAVINGS_DRAWDOWN,
  taxEfficiency,
  TFP_DRIFT_Q,
  TRADE_ELASTICITY,
} from '../constants'
import { clamp, leontiefGross, sectorRecord } from '../math'
import { SECTOR_IDS, type CohortId } from '../state/schema'
import type { PipelineStep } from './pipeline'
import { cohortCpi, effectivePrice, potentialOutput } from './derive'

export const production: PipelineStep = {
  name: 'production',
  run(state, rng) {
    const { io, market, gov, external } = state

    // exogenous technology drip (the frontier, M1 minimal)
    const sectors = state.sectors.map((s) => ({
      ...s,
      tfp: s.tfp * (1 + TFP_DRIFT_Q + rng.normal(0, 0.001)),
    }))
    const qPot = sectors.map(potentialOutput)

    // --- household demand from last tick's net incomes ---
    const incomeTaxEff = gov.dials.taxRates.income * taxEfficiency(gov.capacity.tax)
    const cohortSpend = {} as Record<CohortId, number>
    const householdDemand = sectorRecord(() => 0)
    for (const c of state.cohorts) {
      const disposable =
        c.wageIncome * (1 - incomeTaxEff) + c.profitIncome + c.transferIncome
      // permanent-income smoothing: households spend to their habitual
      // standard of living (the same EMA approval judges against), dipping
      // into savings through bad quarters — this is the great damper of the
      // postwar consumption cycle
      const habitual = c.lastRealIncome * cohortCpi(state, c.id)
      const smoothed = 0.45 * disposable + 0.55 * habitual
      const spirits = 1 + CONF_MPC_GAIN * (state.ledger.confidence.consumer - CONF_NEUTRAL)
      const budget = Math.max(0, MPC[c.id] * smoothed * spirits + SAVINGS_DRAWDOWN * c.savings)
      cohortSpend[c.id] = budget
      for (const sid of SECTOR_IDS) {
        householdDemand[sid] += (budget * c.consumptionWeights[sid]) / effectivePrice(state, sid)
      }
    }

    // --- government demand ---
    const adminEff = adminEffectiveness(gov.capacity.administrative)
    const procurementReal = sectorRecord((sid) => {
      const share = sid === 'manuf' ? 0.4 : sid === 'services' ? 0.6 : 0
      return (gov.dials.spending.procurement * adminEff * share) / market.prices[sid]
    })

    // --- investment demand (private responds to the real rate) ---
    const realRate = gov.dials.policyRate - state.ledger.inflationExpectations
    const avgUtil =
      sectors.reduce((s, x) => s + x.capacityUtilization, 0) / sectors.length
    const replacement = sectors.reduce((s, x) => s + DEPRECIATION_Q * x.capital, 0)
    const invFactor = clamp(
      1 +
        INVESTMENT_RATE_SENSITIVITY * (NATURAL_REAL_RATE - realRate) +
        0.5 * (avgUtil - 0.85) +
        CONF_INV_GAIN * (state.ledger.confidence.business - CONF_NEUTRAL) +
        // surplus labor is an investment opportunity, not just a tragedy
        INVESTMENT_SLACK_GAIN * Math.max(0, state.flows.unemployment - NATURAL_UNEMPLOYMENT),
      0.5,
      INVESTMENT_FACTOR_MAX,
    )
    const privateInvReal = replacement * invFactor
    const govInvReal =
      (gov.dials.spending.investment * adminEff) /
      ((market.prices.manuf + market.prices.services) / 2)
    const investmentReal = privateInvReal + govInvReal
    const invDemand = sectorRecord((sid) =>
      sid === 'manuf' ? 0.6 * investmentReal : sid === 'services' ? 0.4 * investmentReal : 0,
    )

    // --- trade demand at relative prices ---
    const fx = external.exchangeRate
    const tariff = gov.dials.taxRates.tariff
    const exportsReal = sectorRecord((sid, i) => {
      const worldP = external.worldPrices[sid] * fx
      const ratio = worldP / market.prices[sid]
      return Math.min(
        EXPORT_BASE_SHARE[sid] * qPot[i] * state.params.openness * Math.pow(ratio, TRADE_ELASTICITY),
        0.5 * qPot[i],
      )
    })
    const importsReal = sectorRecord((sid, i) => {
      const worldP = external.worldPrices[sid] * fx * (1 + tariff)
      const ratio = market.prices[sid] / worldP
      return IMPORT_BASE_SHARE[sid] * qPot[i] * state.params.openness * Math.pow(ratio, TRADE_ELASTICITY)
    })

    // --- final demand and the Leontief solve ---
    const finalDemand = sectorRecord(
      (sid) =>
        Math.max(
          0,
          householdDemand[sid] +
            procurementReal[sid] +
            invDemand[sid] +
            exportsReal[sid] -
            importsReal[sid],
        ),
    )
    const grossDemandArr = leontiefGross(
      io.coeff,
      SECTOR_IDS.map((sid) => finalDemand[sid]),
    )
    const grossDemand = sectorRecord((_, i) => grossDemandArr[i])

    const output = sectorRecord((_, i) => Math.min(grossDemandArr[i], qPot[i]))
    const satisfied = sectorRecord((sid) =>
      grossDemand[sid] > 1e-9 ? output[sid] / grossDemand[sid] : 1,
    )
    const excessDemand = sectorRecord((sid, i) => grossDemand[sid] - qPot[i])

    // --- profits at current prices (subsidies arrive post-leakage) ---
    const subsidyDelivered = sectorRecord((sid) => (gov.dials.subsidies[sid] ?? 0) * adminEff)
    const profits = sectorRecord((sid, j) => {
      let interCost = 0
      for (let i = 0; i < SECTOR_IDS.length; i++) {
        interCost += effectivePrice(state, SECTOR_IDS[i]) * io.coeff[i][j] * output[sid]
      }
      const wageBill = market.wages[sid] * sectors[j].employment
      return market.prices[sid] * output[sid] - interCost - wageBill + subsidyDelivered[sid]
    })

    // GDP: value added, real at base prices / nominal at current
    let realGdp = 0
    let nominalGdp = 0
    for (let j = 0; j < SECTOR_IDS.length; j++) {
      const sid = SECTOR_IDS[j]
      let colReal = 0
      let colNominal = 0
      for (let i = 0; i < SECTOR_IDS.length; i++) {
        colReal += io.coeff[i][j]
        colNominal += io.coeff[i][j] * effectivePrice(state, SECTOR_IDS[i])
      }
      realGdp += output[sid] * (1 - colReal)
      nominalGdp += output[sid] * (market.prices[sid] - colNominal)
    }
    nominalGdp = Math.max(nominalGdp, 0.05 * realGdp)

    return {
      ...state,
      sectors: sectors.map((s, i) => ({
        ...s,
        output: output[s.id],
        capacityUtilization: clamp(output[s.id] / Math.max(qPot[i], 1e-9), 0, 1),
      })),
      market: { ...market, excessDemand },
      flows: {
        // carry last tick's realized indicators forward so monetary/politics
        // can read "the most recent print" before this tick's are computed
        ...state.flows,
        finalDemand,
        grossDemand,
        satisfied,
        exportsReal,
        importsReal,
        profits,
        householdDemand,
        cohortSpend,
        investmentReal,
        subsidyDelivered,
        nominalGdp,
        realGdp,
      },
    }
  },
}
