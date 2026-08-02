/**
 * Step 3 — fiscal. Tax collection is capacity-gated: the state taxes what it
 * can see, not true GDP. Spending executes with leakage. Deficits the bond
 * market won't absorb are monetized — the printing press is not a button the
 * player pushes, it's what happens when the arithmetic fails.
 */

import {
  BOND_MARKET_DEPTH,
  CAPACITY_DECAY_BY_ID,
  DEBT_CEILING,
  RISK_PREMIUM_SLOPE,
  taxEfficiency,
} from '../constants'
import { clamp, sumRecord } from '../math'
import {
  CAPACITY_IDS,
  SECTOR_IDS,
  type CapacityBuild,
  type OutlaySplit,
  type RevenueSplit,
  type TrueState,
} from '../state/schema'
import type { PipelineStep } from './pipeline'

export const fiscal: PipelineStep = {
  name: 'fiscal',
  run(state) {
    const { gov, flows, market, io } = state
    const eff = taxEfficiency(gov.capacity.tax)
    const tariffEff = 0.5 + 0.5 * gov.capacity.tax // customs posts are easy to man
    const fuelEff = 0.7 + 0.3 * gov.capacity.tax // excise at the depot, likewise

    // --- revenue ---
    const wageBase = state.sectors.reduce((s, sec) => s + market.wages[sec.id] * sec.employment, 0)
    const profitBase = SECTOR_IDS.reduce((s, sid) => s + Math.max(0, flows.profits[sid]), 0)
    // fuel excise: taxed energy purchases = intermediate use + household use
    let energyUse = flows.householdDemand.energy
    const eIdx = SECTOR_IDS.indexOf('energy')
    for (let j = 0; j < SECTOR_IDS.length; j++) {
      energyUse += io.coeff[eIdx][j] * state.sectors[j].output
    }
    const revenueBySource: RevenueSplit = {
      income: wageBase * gov.dials.taxRates.income * eff,
      corporate: profitBase * gov.dials.taxRates.corporate * eff,
      tariff: flows.tariffBase * gov.dials.taxRates.tariff * tariffEff,
      fuel: market.prices.energy * energyUse * gov.dials.taxRates.fuel * fuelEff,
    }
    const revenue = sumRecord(revenueBySource)

    // --- outlays ---
    const debtToGdp = gov.debt / Math.max(4 * flows.nominalGdp, 1e-9)
    const riskPremium = Math.max(0, debtToGdp - 0.5) * RISK_PREMIUM_SLOPE
    const outlaysByProgramme: OutlaySplit = {
      transfers: gov.dials.spending.transfers,
      procurement: gov.dials.spending.procurement,
      investment: gov.dials.spending.investment,
      subsidies: sumRecord(gov.dials.subsidies),
      capacity: gov.pipeline.reduce((s, b) => s + b.moneyPerQtr, 0),
      interest: (gov.debt * (gov.dials.policyRate + riskPremium)) / 4,
    }
    const interest = outlaysByProgramme.interest
    const outlays = sumRecord(outlaysByProgramme)

    const balance = revenue - outlays

    // --- financing: bonds first, the press when markets close ---
    const deficit = Math.max(0, -balance)
    const bondCapacity = debtToGdp > DEBT_CEILING ? 0 : BOND_MARKET_DEPTH * 4 * flows.nominalGdp * 0.25
    const printedThisQtr = Math.max(0, deficit - bondCapacity)
    const borrowed = deficit - printedThisQtr
    const repaid = Math.min(Math.max(0, balance), gov.debt)
    const debt = Math.max(0, gov.debt + borrowed - repaid)

    // --- Layer-2 capacity: deliveries arrive, stocks decay ---
    const capacity = { ...gov.capacity }
    const pipeline: CapacityBuild[] = []
    for (const b of gov.pipeline) {
      capacity[b.target] = capacity[b.target] + b.perQtr
      if (b.remaining > 1) pipeline.push({ ...b, remaining: b.remaining - 1 })
    }
    for (const cid of CAPACITY_IDS) {
      capacity[cid] = clamp(capacity[cid] * (1 - CAPACITY_DECAY_BY_ID[cid]), 0, 1)
    }

    return {
      ...state,
      gov: {
        ...gov,
        capacity,
        pipeline,
        budget: { revenue, outlays, balance },
        debt,
        printed: gov.printed + printedThisQtr,
      },
      ledger: { ...state.ledger, debtToGdp },
      // coupons are bondholder income; redemptions go back into their
      // savings — a surplus is neither money destroyed nor a spending spree
      flows: {
        ...flows,
        revenueBySource,
        outlaysByProgramme,
        printedThisQtr,
        debtInterest: interest,
        debtPrincipal: repaid,
      },
    }
  },
}

/** exported for the observation layer / UI treasury view */
export function fiscalSnapshot(state: TrueState) {
  return { ...state.gov.budget, debt: state.gov.debt, printed: state.gov.printed }
}
