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
  FIN_FAVOR_DEPTH,
  FIN_FAVOR_PREMIUM,
  LAND_FAVOR_TAX,
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
} from '../state/schema'
import type { PipelineStep } from './pipeline'
import { effectiveBlocPower } from './derive'

export const fiscal: PipelineStep = {
  name: 'fiscal',
  run(state) {
    const { gov, flows, market, io } = state
    // §4.3 the veto players reach the budget through two channels a treasury
    // would recognize: an aggrieved landed interest whose harvest stops being
    // reported, and a money interest that stops turning up to the auction
    const landAnger =
      Math.max(0, -state.institutions.blocs.landowners.favor) *
      effectiveBlocPower(state, 'landowners')
    const moneyAnger =
      Math.max(0, -state.institutions.blocs.financiers.favor) *
      effectiveBlocPower(state, 'financiers')
    const eff = taxEfficiency(gov.capacity.tax) * (1 - LAND_FAVOR_TAX * landAnger)
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
    // a capital strike is not a scripted penalty: it is a yield, and it shows
    // up in the itemised books as a fatter interest line
    const riskPremium =
      Math.max(0, debtToGdp - 0.5) * RISK_PREMIUM_SLOPE + FIN_FAVOR_PREMIUM * moneyAnger
    const outlaysByProgramme: OutlaySplit = {
      transfers: gov.dials.spending.transfers,
      procurement: gov.dials.spending.procurement,
      investment: gov.dials.spending.investment,
      research: gov.dials.spending.research,
      subsidies: sumRecord(gov.dials.subsidies),
      capacity: gov.pipeline.reduce((s, b) => s + b.moneyPerQtr, 0),
      interest: (gov.debt * (gov.dials.policyRate + riskPremium)) / 4,
    }
    const interest = outlaysByProgramme.interest
    const outlays = sumRecord(outlaysByProgramme)

    const balance = revenue - outlays

    // --- financing: bonds first, the press when markets close ---
    const deficit = Math.max(0, -balance)
    const bondCapacity =
      debtToGdp > DEBT_CEILING
        ? 0
        : BOND_MARKET_DEPTH * 4 * flows.nominalGdp * 0.25 * (1 - FIN_FAVOR_DEPTH * moneyAnger)
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
